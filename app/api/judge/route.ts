import { NextRequest, NextResponse } from "next/server";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { createJudgeLLM, judgeProviderLabel } from "@/lib/judge-llm";
import { requireCourseAccess } from "@/lib/auth";
import { resolveChallenge, type ChallengeSpec, type ChallengePrefilled, type ChallengeStep } from "@/lib/challenge-access";

interface JudgeRequest {
  challengeId: string;
  courseSlug?: string;
  environment: string;
  userInput: Record<string, unknown>;
  attemptNumber?: number; // 1-indexed, used for Socratic 3-strike rule
}

interface JudgeResponse {
  pass: boolean;
  score: number;
  feedback: string;
  hints?: string[];
  _provider?: string; // debug: which LLM answered
}

/**
 * Strip markdown code fences — some LLMs wrap JSON in ```json ... ``` despite instructions.
 */
function stripMarkdownFences(raw: string): string {
  return raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
}

/**
 * Grade a sequence-completer submission programmatically.
 * Returns null when the challenge has no correctOrder.
 */
function gradeSequence(
  challenge: ChallengeSpec,
  userInput: Record<string, unknown>
): { score: number; pass: boolean; correctLabels: string; submittedLabels: string } | null {
  const correctOrder = challenge.prefilled?.correctOrder;
  const steps = challenge.prefilled?.steps;
  if (!correctOrder || !Array.isArray(correctOrder)) return null;

  const submitted = Array.isArray(userInput.order)
    ? (userInput.order as string[])
    : [];

  const stepMap: Record<string, string> = {};
  if (steps) {
    for (const s of steps) stepMap[s.id] = s.label;
  }

  let correct = 0;
  for (let i = 0; i < correctOrder.length; i++) {
    if (submitted[i] === correctOrder[i]) correct++;
  }

  const score = parseFloat((correct / correctOrder.length).toFixed(2));
  const pass = score >= 0.8;

  const toLabel = (id: string, idx: number) =>
    `${idx + 1}. ${stepMap[id] ?? id}`;

  return {
    score,
    pass,
    correctLabels: correctOrder.map(toLabel).join("\n"),
    submittedLabels: submitted.length > 0 ? submitted.map(toLabel).join("\n") : "(nothing submitted)",
  };
}

const SYSTEM_PROMPT = `You are Eli Vasquez, Senior Principal at Keystone, judging a trainee's work.
Evaluate the submitted answer against the challenge spec below.
Be precise, fair, and specific. Never say "it's actually quite simple."
If wrong: explain exactly what's wrong, why it matters in a real system, and what to try.
If right: brief acknowledgment + narrative consequence (1 sentence, present tense).
Reference the Keystone world naturally. Keep feedback under 3 sentences.

Respond ONLY with valid JSON in this exact format:
{"pass": true/false, "score": 0.0-1.0, "feedback": "..."}

Do not include markdown code fences. Just the raw JSON object.`;

const SOCRATIC_SYSTEM_PROMPT = `You are Eli Vasquez, Senior Principal at Keystone.
You are coaching a trainee using the Socratic method with a strict 3-strike rule.

You will be told which attempt number this is (1, 2, or 3+).

Strike 1 (attempt=1): Never give the answer. Ask ONE probing question that identifies the gap in their thinking. Be encouraging but precise.
Strike 2 (attempt=2): Still no answer. Ask a more targeted question. A small hint is acceptable if they are close.
Strike 3+ (attempt>=3): Reveal the correct approach fully. Begin with "Three attempts — here's the pattern:" then explain clearly and concisely.

If the answer is CORRECT on any attempt: Give brief acknowledgment then ask one follow-up question to deepen understanding. Never just say "correct" and stop.

Never lecture. Never give multi-paragraph explanations unprompted. One question or one reveal — that is all.

Respond ONLY with valid JSON:
{"pass": true/false, "score": 0.0-1.0, "feedback": "..."}

No markdown fences. Raw JSON only.`;

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: JudgeRequest;
  try {
    body = (await req.json()) as JudgeRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { challengeId, courseSlug, environment, userInput, attemptNumber = 1 } = body;

  if (!challengeId || !userInput) {
    return NextResponse.json(
      { error: "challengeId and userInput are required" },
      { status: 400 }
    );
  }

  const resolved = resolveChallenge(challengeId, courseSlug);
  if (!resolved) {
    return NextResponse.json(
      { error: `Challenge '${challengeId}' not found` },
      { status: 404 }
    );
  }

  const access = await requireCourseAccess(resolved.courseSlug);
  if (!access.allowed) {
    return NextResponse.json(
      { error: access.reason === "login_required" ? "Login required" : "Access required" },
      { status: access.reason === "login_required" ? 401 : 403 }
    );
  }

  const challenge = resolved.challenge;

  // ── Programmatic grading for sequence-completer challenges ──────────────────
  const seqGrade = gradeSequence(challenge, userInput);

  // Sequence challenges must be fully deterministic and must not depend on an
  // LLM/provider key. This prevents the production bug where a correct drag
  // order was graded as 0 when the fallback LLM rejected the raw ID array or
  // the provider was unavailable.
  if (seqGrade) {
    const feedback = seqGrade.pass
      ? `Sequence confirmed at ${Math.round(seqGrade.score * 100)}%. Your ordering matches the execution model closely enough to proceed.`
      : `Sequence is ${Math.round(seqGrade.score * 100)}% correct. Compare your submitted order with the expected flow:\n\nExpected:\n${seqGrade.correctLabels}\n\nSubmitted:\n${seqGrade.submittedLabels}`;

    const result: JudgeResponse = {
      pass: seqGrade.pass,
      score: seqGrade.score,
      feedback,
      _provider: "deterministic-sequence-grader",
    };

    if (!result.pass && challenge.hints?.length) {
      result.hints = challenge.hints;
    }

    return NextResponse.json(result);
  }

  // Pick system prompt — Socratic mode for coaching challenges
  const systemPrompt = challenge.socratic_mode
    ? SOCRATIC_SYSTEM_PROMPT
    : SYSTEM_PROMPT;

  // Build the user message for non-sequence challenges. Sequence challenges
  // have already returned above.
  const userMessage = `Challenge: ${challenge.spec}

Correct answer criteria:
${JSON.stringify(challenge.validation, null, 2)}

${challenge.eli_notes ? `Judge notes:\n${challenge.eli_notes}\n\n` : ""}${challenge.socratic_mode ? `ATTEMPT NUMBER: ${attemptNumber}\n\n` : ""}Environment type: ${environment}
Trainee's submission:
${JSON.stringify(userInput, null, 2)}`;

  let raw = "";
  const provider = judgeProviderLabel();

  try {
    const llm = createJudgeLLM();
    const response = await llm.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage(userMessage),
    ]);

    raw = typeof response.content === "string"
      ? response.content
      : JSON.stringify(response.content);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { pass: false, score: 0, feedback: `Evaluation service error: ${msg}`, _provider: provider },
      { status: 500 }
    );
  }

  // Strip markdown fences (some models wrap JSON despite instructions)
  const cleaned = stripMarkdownFences(raw);

  let result: JudgeResponse;
  try {
    result = JSON.parse(cleaned) as JudgeResponse;
  } catch {
    result = {
      pass: false,
      score: 0,
      feedback: cleaned || "Unable to evaluate — please try again.",
    };
  }

  result._provider = provider;

  // Attach hints on failure
  if (!result.pass && challenge.hints?.length) {
    result.hints = challenge.hints;
  }

  return NextResponse.json(result);
}
