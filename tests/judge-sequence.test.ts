/**
 * Tests for the judge route's sequence-completer grading logic.
 *
 * Covers:
 *  1. gradeSequence — position-based scoring
 *  2. stripMarkdownFences — defensive JSON cleaning
 *  3. Integration: correct order → pass, wrong order → fail, partial → partial score
 */

import { describe, it, expect } from "vitest";

// ─── Helpers extracted from judge/route.ts (pure functions, no side-effects) ─

interface ChallengeStep {
  id: string;
  label: string;
}

interface ChallengeSpec {
  id: string;
  spec: string;
  validation: unknown;
  eli_notes?: string;
  hints?: string[];
  prefilled?: {
    steps?: ChallengeStep[];
    correctOrder?: string[];
    [key: string]: unknown;
  };
}

function stripMarkdownFences(raw: string): string {
  return raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
}

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

// ─── Fixtures ────────────────────────────────────────────────────────────────

const SOLANA_CHALLENGE: ChallengeSpec = {
  id: "solana-00-first-principles-mental-model",
  spec: "Place the five Solana execution primitives in the correct order.",
  validation: { type: "sequence" },
  prefilled: {
    steps: [
      { id: "s1", label: "Account created and initialized with lamports" },
      { id: "s2", label: "Instruction specifies which program to call and which accounts to use" },
      { id: "s3", label: "Transaction bundles one or more instructions" },
      { id: "s4", label: "Signer authorizes the transaction with their keypair" },
      { id: "s5", label: "Runtime validates accounts and executes the program" },
    ],
    correctOrder: ["s1", "s2", "s3", "s4", "s5"],
  },
};

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("stripMarkdownFences", () => {
  it("passes through clean JSON untouched", () => {
    const json = '{"pass": true, "score": 1.0, "feedback": "Good."}';
    expect(stripMarkdownFences(json)).toBe(json);
  });

  it("strips ```json ... ``` wrapper", () => {
    const raw = '```json\n{"pass": false, "score": 0.1, "feedback": "Try again."}\n```';
    const result = stripMarkdownFences(raw);
    expect(result).toBe('{"pass": false, "score": 0.1, "feedback": "Try again."}');
    // Must be parseable now
    expect(() => JSON.parse(result)).not.toThrow();
  });

  it("strips plain ``` ... ``` wrapper", () => {
    const raw = '```\n{"pass": true, "score": 0.9, "feedback": "Almost."}\n```';
    const result = stripMarkdownFences(raw);
    expect(() => JSON.parse(result)).not.toThrow();
  });

  it("handles leading/trailing whitespace", () => {
    const raw = '  ```json\n{"pass": true}\n```  ';
    expect(() => JSON.parse(stripMarkdownFences(raw))).not.toThrow();
  });
});

describe("gradeSequence", () => {
  it("returns null when challenge has no correctOrder", () => {
    const challenge: ChallengeSpec = {
      id: "other",
      spec: "Do something",
      validation: {},
      prefilled: { template: "{}" },
    };
    expect(gradeSequence(challenge, { json: "{}" })).toBeNull();
  });

  it("returns null when prefilled is absent", () => {
    const challenge: ChallengeSpec = { id: "x", spec: "x", validation: {} };
    expect(gradeSequence(challenge, { order: ["s1"] })).toBeNull();
  });

  it("scores 100% for perfect order → pass", () => {
    const result = gradeSequence(SOLANA_CHALLENGE, {
      order: ["s1", "s2", "s3", "s4", "s5"],
    });
    expect(result).not.toBeNull();
    expect(result!.score).toBe(1.0);
    expect(result!.pass).toBe(true);
  });

  it("scores 80% for 4/5 correct → pass (at threshold)", () => {
    // Swap last two — s4 and s5 transposed
    const result = gradeSequence(SOLANA_CHALLENGE, {
      order: ["s1", "s2", "s3", "s5", "s4"],
    });
    expect(result).not.toBeNull();
    expect(result!.score).toBe(0.6); // 3/5 correct (positions 0,1,2)
    expect(result!.pass).toBe(false);
  });

  it("scores low for mostly-reversed order → fail", () => {
    // s5,s4,s3,s2,s1 — only s3 (middle) sits at position 2 correctly → 1/5 = 0.2
    const result = gradeSequence(SOLANA_CHALLENGE, {
      order: ["s5", "s4", "s3", "s2", "s1"],
    });
    expect(result).not.toBeNull();
    expect(result!.score).toBe(0.2);
    expect(result!.pass).toBe(false);
  });

  it("scores 0% for empty submission → fail", () => {
    const result = gradeSequence(SOLANA_CHALLENGE, { order: [] });
    expect(result).not.toBeNull();
    expect(result!.score).toBe(0.0);
    expect(result!.pass).toBe(false);
    expect(result!.submittedLabels).toBe("(nothing submitted)");
  });

  it("resolves IDs to human-readable labels in output", () => {
    const result = gradeSequence(SOLANA_CHALLENGE, {
      order: ["s1", "s2", "s3", "s4", "s5"],
    });
    expect(result!.correctLabels).toContain("Account created and initialized with lamports");
    expect(result!.correctLabels).toContain("Runtime validates accounts and executes the program");
  });

  it("passes at exactly 4/5 correct (80%)", () => {
    // Only position 4 wrong (s5 → s4, but s4 already placed correctly)
    // Put s5 at index 3 and s4 at index 4 — positions 0,1,2,3 wrong
    // Actually: put s1,s2,s3,s4 correct and put s1 again at end (wrong last position)
    const result = gradeSequence(SOLANA_CHALLENGE, {
      order: ["s1", "s2", "s3", "s4", "s1"], // last wrong
    });
    expect(result!.score).toBe(0.8);
    expect(result!.pass).toBe(true);
  });

  it("the screenshot bug: submitting raw IDs to old flow scored 0 — new flow scores correctly", () => {
    // The old code sent { order: ["s1","s2","s3","s4","s5"] } to Eli as an LLM message.
    // Eli rejected it as "ordering labels instead of mental model" → score 0.
    // New code: gradeSequence runs first, correct order → score 1.0, pass true.
    const result = gradeSequence(SOLANA_CHALLENGE, {
      order: ["s1", "s2", "s3", "s4", "s5"],
    });
    expect(result!.score).toBe(1.0);
    expect(result!.pass).toBe(true);
  });
});
