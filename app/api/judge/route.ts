import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import path from "path";
import fs from "fs";
import { execSync } from "child_process";

interface ChallengeStep {
  id: string;
  label: string;
}

interface ChallengePrefilled {
  steps?: ChallengeStep[];
  correctOrder?: string[];
  [key: string]: unknown;
}

interface ChallengeSpec {
  id: string;
  spec: string;
  validation: unknown;
  eli_notes?: string;
  hints?: string[];
  prefilled?: ChallengePrefilled;
}

interface JudgeRequest {
  challengeId: string;
  environment: string;
  userInput: Record<string, unknown>;
}

interface JudgeResponse {
  pass: boolean;
  score: number;
  feedback: string;
  hints?: string[];
}

function getAnthropicKey(): string {
  // Try env first
  if (process.env.ANTHROPIC_API_KEY) return process.env.ANTHROPIC_API_KEY;
  // Try 1Password
  try {
    return execSync('op read "op://OpenClaw/Anthropic API Key/notesPlain"', {
      timeout: 5000,
      encoding: "utf-8",
    }).trim();
  } catch {
    throw new Error("ANTHROPIC_API_KEY not set and 1Password not available");
  }
}

function loadChallenge(challengeId: string): ChallengeSpec | null {
  // Search all courses for this challenge
  const coursesDir = path.join(process.cwd(), "content", "courses");
  try {
    const courses = fs.readdirSync(coursesDir);
    for (const course of courses) {
      const challengePath = path.join(
        coursesDir,
        course,
        "challenges",
        `${challengeId}.json`
      );
      if (fs.existsSync(challengePath)) {
        return JSON.parse(fs.readFileSync(challengePath, "utf-8")) as ChallengeSpec;
      }
    }
  } catch {
    // ignore
  }
  return null;
}

/**
 * Strip markdown code fences that some LLM responses include despite instructions.
 * Handles ```json ... ``` and ``` ... ``` wrappers.
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
 * Compares submitted order (array of step IDs) against the correct order
 * from challenge.prefilled.correctOrder.
 *
 * Returns null if the challenge doesn't have a correctOrder to compare against.
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

  const correctLabels = correctOrder.map(toLabel).join("\n");
  const submittedLabels =
    submitted.length > 0
      ? submitted.map(toLabel).join("\n")
      : "(nothing submitted)";

  return { score, pass, correctLabels, submittedLabels };
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

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: JudgeRequest;
  try {
    body = (await req.json()) as JudgeRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { challengeId, environment, userInput } = body;

  if (!challengeId || !userInput) {
    return NextResponse.json(
      { error: "challengeId and userInput are required" },
      { status: 400 }
    );
  }

  const challenge = loadChallenge(challengeId);
  if (!challenge) {
    return NextResponse.json(
      { error: `Challenge '${challengeId}' not found` },
      { status: 404 }
    );
  }

  // ── Programmatic grading for sequence-completer challenges ──────────────
  // Avoids sending raw IDs to the LLM; scores position accuracy directly,
  // then calls Eli only for human-readable feedback.
  const seqGrade = gradeSequence(challenge, userInput);

  let apiKey: string;
  try {
    apiKey = getAnthropicKey();
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }

  const client = new Anthropic({ apiKey });

  // Build the user message — for sequence challenges use labels, not raw IDs
  const userMessage = seqGrade
    ? `Ordering challenge: "${challenge.spec}"

Correct order:
${seqGrade.correctLabels}

Trainee's submitted order:
${seqGrade.submittedLabels}

Score: ${Math.round(seqGrade.score * 100)}% (${seqGrade.pass ? "PASS" : "FAIL"})

${challenge.eli_notes ? `Judge notes:\n${challenge.eli_notes}\n\n` : ""}Give brief feedback as Eli. The score and pass/fail are already determined — do NOT change them. Reply with JSON only.`
    : `Challenge: ${challenge.spec}

Correct answer criteria:
${JSON.stringify(challenge.validation, null, 2)}

${challenge.eli_notes ? `Judge notes:\n${challenge.eli_notes}\n\n` : ""}Environment type: ${environment}
Trainee's submission:
${JSON.stringify(userInput, null, 2)}`;

  try {
    const message = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 300,
      temperature: 0.3,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    });

    const raw =
      message.content[0].type === "text" ? message.content[0].text : "";

    // Strip markdown fences — Haiku sometimes wraps JSON in ```json ... ``` despite instructions
    const cleaned = stripMarkdownFences(raw);

    let result: JudgeResponse;
    try {
      result = JSON.parse(cleaned) as JudgeResponse;
    } catch {
      // JSON parse still failed — use cleaned text as feedback but preserve
      // programmatic score for sequence challenges
      result = {
        pass: seqGrade?.pass ?? false,
        score: seqGrade?.score ?? 0,
        feedback: cleaned || "Unable to evaluate — please try again.",
      };
    }

    // For sequence challenges, enforce the programmatic score/pass (don't let
    // Eli override what the position-comparison already determined)
    if (seqGrade) {
      result.pass = seqGrade.pass;
      result.score = seqGrade.score;
    }

    // Attach hints if available
    if (!result.pass && challenge.hints?.length) {
      result.hints = challenge.hints;
    }

    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      {
        pass: false,
        score: 0,
        feedback: `Evaluation service error: ${msg}`,
      },
      { status: 500 }
    );
  }
}
