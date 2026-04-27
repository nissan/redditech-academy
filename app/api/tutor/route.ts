/**
 * /api/tutor — Socratic coding tutor for Python Interview Prep course
 *
 * Unlike /api/judge (one-shot evaluation), this is a conversational endpoint.
 * It maintains no server-side state — the full message history is sent by the client.
 *
 * Modes (set by the client via `mode` field):
 *   "socratic"   — Guide through the problem with questions, never give direct answers
 *   "syntax"     — Answer syntax/API questions directly and concisely
 *   "tutorial"   — Give a focused mini-tutorial on a concept (2-3 min read)
 *   "talkthrough"— Let the user think out loud; respond with targeted follow-up questions
 */

import { NextRequest, NextResponse } from "next/server";
import { HumanMessage, SystemMessage, AIMessage } from "@langchain/core/messages";
import { createJudgeLLM } from "@/lib/judge-llm";
import { requireCourseAccess } from "@/lib/auth";
import { resolveChallenge } from "@/lib/challenge-access";

export interface TutorMessage {
  role: "user" | "assistant";
  content: string;
}

export interface TutorRequest {
  messages: TutorMessage[];
  mode: "socratic" | "syntax" | "tutorial" | "talkthrough";
  context?: {
    challengeId?: string;
    courseSlug?: string;
    lessonTitle?: string;
    moduleTitle?: string;
    currentCode?: string;
    attemptNumber?: number;
  };
}

// ── System prompts per mode ──────────────────────────────────────────────────

const SOCRATIC_TUTOR = `You are Eli Vasquez, a senior Python engineer coaching a candidate through a technical interview problem.

RULES — read carefully:
- NEVER write complete solutions or hand over working code
- Ask ONE focused question per response that moves them forward
- If they're stuck, ask a question that breaks the problem into a smaller piece
- If their approach is wrong, ask "what would happen if you tried X?" rather than correcting directly
- After 3 back-and-forth exchanges on the same point, you may give a small concrete hint (one line of pseudocode or a function name)
- Keep responses short: 2-4 sentences max
- Use the Keystone world lightly — you're coaching, not narrating

You are helping them develop the skill to decompose problems, not to get this one answer right.`;

const SYNTAX_TUTOR = `You are a precise Python syntax assistant. The user is in a timed interview and needs fast, accurate answers.

RULES:
- Answer syntax and API questions directly and concisely
- Always show a minimal working example (3-5 lines max)
- If there are multiple valid approaches, show the most readable one first
- Do NOT add lengthy explanations — just the pattern and one sentence of context
- If the question is ambiguous, ask ONE clarifying question before answering
- Format code in markdown code blocks`;

const TUTORIAL_TUTOR = `You are a Python tutor writing a focused mini-tutorial. The user has a specific concept question during a coding session.

RULES:
- Write a self-contained explanation of exactly ONE concept
- Structure: concept → why it matters → minimal example → common mistake to avoid
- Keep it under 200 words total
- Use concrete, real data examples (not foo/bar)
- End with one sentence: "The thing to remember is: ___"
- Format code in markdown code blocks`;

const TALKTHROUGH_TUTOR = `You are Eli Vasquez, a senior engineer doing a collaborative problem walkthrough. The candidate is thinking out loud.

RULES:
- Listen and respond to what they said — don't jump ahead
- If they're on the right track, say "keep going — what's next?" or ask "and then?"
- If they skip a step, ask "wait — how do you get from X to Y?"
- If they contradict themselves, gently surface it: "you said X earlier — does that still hold?"
- Keep responses to 1-2 sentences
- The goal is to make them articulate their own reasoning, not to fill in their gaps
- Do NOT give code. Do NOT give the answer. Ask questions.`;

function getSystemPrompt(mode: TutorRequest["mode"]): string {
  switch (mode) {
    case "socratic":    return SOCRATIC_TUTOR;
    case "syntax":      return SYNTAX_TUTOR;
    case "tutorial":    return TUTORIAL_TUTOR;
    case "talkthrough": return TALKTHROUGH_TUTOR;
  }
}

// ── Handler ──────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: TutorRequest;
  try {
    body = (await req.json()) as TutorRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { messages, mode, context } = body;

  if (!messages?.length) {
    return NextResponse.json({ error: "messages array required" }, { status: 400 });
  }

  const resolvedCourseSlug = context?.courseSlug || (context?.challengeId ? resolveChallenge(context.challengeId)?.courseSlug : null);
  if (!resolvedCourseSlug) {
    return NextResponse.json({ error: "course context required" }, { status: 400 });
  }

  const access = await requireCourseAccess(resolvedCourseSlug);
  if (!access.allowed) {
    return NextResponse.json(
      { error: access.reason === "login_required" ? "Login required" : "Access required" },
      { status: access.reason === "login_required" ? 401 : 403 }
    );
  }

  // Build context preamble if provided
  let contextBlock = "";
  if (context) {
    const parts: string[] = [];
    if (context.courseSlug) parts.push(`Course: ${context.courseSlug}`);
    if (context.lessonTitle)  parts.push(`Lesson: ${context.lessonTitle}`);
    if (context.moduleTitle)  parts.push(`Module: ${context.moduleTitle}`);
    if (context.challengeId)  parts.push(`Challenge: ${context.challengeId}`);
    if (context.attemptNumber) parts.push(`Attempt: ${context.attemptNumber}`);
    if (context.currentCode)  parts.push(`Current code:\n\`\`\`python\n${context.currentCode}\n\`\`\``);
    if (parts.length) contextBlock = `[Session context]\n${parts.join("\n")}\n\n`;
  }

  const systemPrompt = getSystemPrompt(mode);

  // Convert message history to LangChain messages
  const history = messages.slice(0, -1).map((m) =>
    m.role === "user"
      ? new HumanMessage(m.content)
      : new AIMessage(m.content)
  );

  const lastMessage = messages[messages.length - 1];
  const userContent = contextBlock + lastMessage.content;

  try {
    const llm = createJudgeLLM();
    const response = await llm.invoke([
      new SystemMessage(systemPrompt),
      ...history,
      new HumanMessage(userContent),
    ]);

    const reply = typeof response.content === "string"
      ? response.content
      : JSON.stringify(response.content);

    return NextResponse.json({ reply, mode });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
