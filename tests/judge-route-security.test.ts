import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => {
  const invoke = vi.fn();
  return { invoke, createJudgeLLM: vi.fn(() => ({ invoke })) };
});

vi.mock("@/lib/judge-llm", () => ({
  createJudgeLLM: mocks.createJudgeLLM,
  judgeProviderLabel: () => "test/provider",
}));

import { POST } from "@/app/api/judge/route";

describe("judge dispatch security", () => {
  beforeEach(() => {
    mocks.invoke.mockReset();
    mocks.createJudgeLLM.mockClear();
  });

  it("does not let a forged environment route a structured SPICED challenge to an LLM", async () => {
    const request = new NextRequest("http://localhost/api/judge", {
      method: "POST",
      body: JSON.stringify({
        challengeId: "spiced-01-mission",
        environment: "essay",
        userInput: { json: "{}" },
      }),
      headers: { "content-type": "application/json" },
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body._provider).toBe("deterministic-structured-grader");
    expect(body.pass).toBe(false);
    expect(mocks.createJudgeLLM).not.toHaveBeenCalled();
    expect(mocks.invoke).not.toHaveBeenCalled();
  });
});
