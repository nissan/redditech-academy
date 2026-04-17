/**
 * Judge API — Integration Tests (Dress Rehearsal)
 *
 * These tests hit the LIVE /api/judge endpoint over HTTP.
 * They are intentionally environment-agnostic: they work against:
 *   - Local dev server:     JUDGE_API_URL=http://localhost:3000
 *   - Docker compose:       JUDGE_API_URL=http://localhost:3001
 *   - Vercel preview:       JUDGE_API_URL=https://your-preview.vercel.app
 *
 * Run modes:
 *   # Mode 1 — local dev server + local Ollama (fastest, no Docker needed)
 *   JUDGE_PROVIDER=ollama pnpm dev &
 *   pnpm test:integration
 *
 *   # Mode 2 — full Docker dress rehearsal (closest to prod)
 *   docker compose -f docker-compose.local.yml up --build -d
 *   JUDGE_API_URL=http://localhost:3001 pnpm test:integration
 *
 * What these tests do NOT check:
 *   - Exact feedback text (LLM output is non-deterministic)
 *   - Specific score values for open-ended challenges (model-dependent)
 *
 * What they DO check:
 *   - Response shape (pass, score, feedback fields always present)
 *   - Score is a number in [0, 1]
 *   - Pass/fail is boolean
 *   - Sequence-completer: score is deterministic (position-comparison, not LLM)
 *   - HTTP error codes for bad requests
 *   - No raw JSON fences in feedback text
 */

import { describe, it, expect, beforeAll } from "vitest";

const BASE_URL = process.env.JUDGE_API_URL ?? "http://localhost:3000";
const JUDGE_URL = `${BASE_URL}/api/judge`;
const TIMEOUT_MS = 30_000; // LLM calls can be slow locally

// ─── Helpers ─────────────────────────────────────────────────────────────────

interface JudgeResponse {
  pass: boolean;
  score: number;
  feedback: string;
  hints?: string[];
  _provider?: string;
  error?: string;
}

async function callJudge(
  body: Record<string, unknown>,
  expectStatus = 200
): Promise<{ status: number; data: JudgeResponse }> {
  const res = await fetch(JUDGE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as JudgeResponse;
  expect(res.status).toBe(expectStatus);
  return { status: res.status, data };
}

function assertValidJudgeResponse(data: JudgeResponse) {
  expect(typeof data.pass).toBe("boolean");
  expect(typeof data.score).toBe("number");
  expect(data.score).toBeGreaterThanOrEqual(0);
  expect(data.score).toBeLessThanOrEqual(1);
  expect(typeof data.feedback).toBe("string");
  expect(data.feedback.length).toBeGreaterThan(0);
  // Should never contain raw markdown fences (judge route must strip these)
  expect(data.feedback).not.toMatch(/^```/);
  expect(data.feedback).not.toMatch(/```$/);
}

// ─── Server availability check ───────────────────────────────────────────────

beforeAll(async () => {
  // Probe /api/judge with a known-invalid body to confirm the app is up.
  // A 400 or 404 response means the server is running and routing correctly.
  try {
    const res = await fetch(JUDGE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ping: true }),
      signal: AbortSignal.timeout(8000),
    });
    // Any response from /api/judge means the app is up
    if (res.status === 0) throw new Error("no response");
    console.log(`[integration] App is up at ${BASE_URL} (probe status: ${res.status})`);
  } catch (err) {
    throw new Error(
      `Cannot reach academy app at ${BASE_URL}.\n` +
      `Start it with: JUDGE_PROVIDER=ollama pnpm dev\n` +
      `Or: docker compose -f docker-compose.local.yml up --build\n` +
      `Original error: ${err}`
    );
  }
}, 10_000);

// ─── Suite 1: Request validation ─────────────────────────────────────────────

describe("POST /api/judge — request validation", () => {
  it("returns 400 for empty body", async () => {
    const res = await fetch(JUDGE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    expect(res.status).toBe(400);
  }, TIMEOUT_MS);

  it("returns 404 for unknown challengeId", async () => {
    await callJudge(
      { challengeId: "does-not-exist-xyz", environment: "json-editor", userInput: { x: 1 } },
      404
    );
  }, TIMEOUT_MS);

  it("returns 400 for missing userInput", async () => {
    await callJudge({ challengeId: "solana-00-first-principles-mental-model" }, 400);
  }, TIMEOUT_MS);
});

// ─── Suite 2: Sequence-completer — deterministic scoring ─────────────────────

describe("POST /api/judge — sequence-completer (deterministic)", () => {
  const CHALLENGE_ID = "solana-00-first-principles-mental-model";
  const CORRECT_ORDER = ["s1", "s2", "s3", "s4", "s5"];

  it("perfect order → pass=true, score=1.0, valid response shape", async () => {
    const { data } = await callJudge({
      challengeId: CHALLENGE_ID,
      environment: "sequence-completer",
      userInput: { order: CORRECT_ORDER },
    });
    assertValidJudgeResponse(data);
    expect(data.pass).toBe(true);
    expect(data.score).toBe(1.0);
    // Feedback should congratulate — but we don't assert exact text
    expect(data.feedback.length).toBeGreaterThan(10);
  }, TIMEOUT_MS);

  it("wrong order → pass=false, score < 1.0, feedback explains the error", async () => {
    const { data } = await callJudge({
      challengeId: CHALLENGE_ID,
      environment: "sequence-completer",
      userInput: { order: ["s3", "s1", "s2", "s5", "s4"] }, // 0/5 correct positions
    });
    assertValidJudgeResponse(data);
    expect(data.pass).toBe(false);
    expect(data.score).toBeLessThan(1.0);
  }, TIMEOUT_MS);

  it("4/5 correct → score=0.8, pass=true", async () => {
    const { data } = await callJudge({
      challengeId: CHALLENGE_ID,
      environment: "sequence-completer",
      userInput: { order: ["s1", "s2", "s3", "s4", "s1"] }, // last wrong
    });
    assertValidJudgeResponse(data);
    expect(data.score).toBe(0.8);
    expect(data.pass).toBe(true);
  }, TIMEOUT_MS);

  it("empty order → pass=false, score=0", async () => {
    const { data } = await callJudge({
      challengeId: CHALLENGE_ID,
      environment: "sequence-completer",
      userInput: { order: [] },
    });
    assertValidJudgeResponse(data);
    expect(data.pass).toBe(false);
    expect(data.score).toBe(0);
  }, TIMEOUT_MS);

  it("_provider field is present (debug: confirms which LLM responded)", async () => {
    const { data } = await callJudge({
      challengeId: CHALLENGE_ID,
      environment: "sequence-completer",
      userInput: { order: CORRECT_ORDER },
    });
    expect(data._provider).toBeTruthy();
    console.log(`[integration] Judge provider: ${data._provider}`);
  }, TIMEOUT_MS);
});

// ─── Suite 3: JSON-editor challenge — LLM evaluation (non-deterministic) ─────

describe("POST /api/judge — json-editor (LLM-evaluated)", () => {
  const CHALLENGE_ID = "solana-00-first-principles-signers";

  it("well-formed answer → valid response shape + no raw JSON in feedback", async () => {
    const { data } = await callJudge({
      challengeId: CHALLENGE_ID,
      environment: "json-editor",
      userInput: {
        json: JSON.stringify({
          submission: {
            summary: "Separate signer roles: users sign their own transactions, admins control program upgrades, rollback owner is the ops team keypair.",
            policy_mode: "split_roles",
            user_permissions: ["sign_own_tx", "read_account_state"],
            admin_permissions: ["upgrade_program", "emergency_pause"],
            rollback_owner: "ops-multisig",
          },
        }),
      },
    });
    assertValidJudgeResponse(data);
    // Shape is always valid regardless of LLM output
    expect(data.score).toBeGreaterThanOrEqual(0);
    expect(data.score).toBeLessThanOrEqual(1);
  }, TIMEOUT_MS);

  it("obviously wrong answer → pass=false (model should catch this)", async () => {
    const { data } = await callJudge({
      challengeId: CHALLENGE_ID,
      environment: "json-editor",
      userInput: {
        json: JSON.stringify({
          submission: {
            summary: "I don't know what signers are",
            policy_mode: "single_signer_for_all", // explicitly forbidden
            user_permissions: [],
            admin_permissions: [],
            rollback_owner: "",
          },
        }),
      },
    });
    assertValidJudgeResponse(data);
    // single_signer_for_all is in must_not_have — model should reject this
    expect(data.pass).toBe(false);
  }, TIMEOUT_MS);

  it("response always has feedback text (even if LLM is uncertain)", async () => {
    const { data } = await callJudge({
      challengeId: CHALLENGE_ID,
      environment: "json-editor",
      userInput: { json: "{}" },
    });
    expect(data.feedback).toBeTruthy();
    expect(data.feedback.length).toBeGreaterThan(5);
  }, TIMEOUT_MS);
});

// ─── Suite 4: Hints ───────────────────────────────────────────────────────────

describe("POST /api/judge — hints on failure", () => {
  it("failed response includes hints array when challenge has hints", async () => {
    const { data } = await callJudge({
      challengeId: "solana-00-first-principles-mental-model",
      environment: "sequence-completer",
      userInput: { order: ["s5", "s4", "s3", "s2", "s1"] }, // wrong
    });
    expect(data.pass).toBe(false);
    expect(Array.isArray(data.hints)).toBe(true);
    expect(data.hints!.length).toBeGreaterThan(0);
  }, TIMEOUT_MS);
});
