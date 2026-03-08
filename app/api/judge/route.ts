import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import path from "path";
import fs from "fs";
import { execSync } from "child_process";

interface ChallengeSpec {
  id: string;
  spec: string;
  validation: unknown;
  eli_notes?: string;
  hints?: string[];
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

  const userMessage = `Challenge: ${challenge.spec}

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

    let result: JudgeResponse;
    try {
      result = JSON.parse(raw) as JudgeResponse;
    } catch {
      // If JSON parse fails, construct a fallback
      result = {
        pass: false,
        score: 0,
        feedback: raw || "Unable to evaluate — please try again.",
      };
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
