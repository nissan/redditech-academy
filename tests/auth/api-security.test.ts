import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

function postRequest(path: string, body: unknown) {
  return new NextRequest(`http://academy.test${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

afterEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
});

describe("protected API gates", () => {
  it("blocks protected judge requests before creating an LLM", async () => {
    const createJudgeLLM = vi.fn(() => {
      throw new Error("LLM should not be created");
    });

    vi.doMock("@/lib/judge-llm", () => ({
      createJudgeLLM,
      judgeProviderLabel: () => "test-provider",
    }));
    vi.doMock("@/lib/challenge-access", () => ({
      resolveChallenge: () => ({
        courseSlug: "protected-course",
        challenge: { id: "secret", spec: "secret", validation: {} },
      }),
    }));
    vi.doMock("@/lib/auth", () => ({
      requireCourseAccess: vi.fn(async () => ({ allowed: false, protected: true, reason: "login_required", user: null })),
    }));

    const { POST } = await import("@/app/api/judge/route");
    const response = await POST(postRequest("/api/judge", {
      challengeId: "secret",
      environment: "json-editor",
      userInput: { answer: "steal" },
    }));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({ error: "Login required" });
    expect(createJudgeLLM).not.toHaveBeenCalled();
  });

  it("blocks tutor requests without course/challenge context before creating an LLM", async () => {
    const createJudgeLLM = vi.fn(() => {
      throw new Error("LLM should not be created");
    });

    vi.doMock("@/lib/judge-llm", () => ({ createJudgeLLM }));
    vi.doMock("@/lib/auth", () => ({ requireCourseAccess: vi.fn() }));
    vi.doMock("@/lib/challenge-access", () => ({ resolveChallenge: vi.fn() }));

    const { POST } = await import("@/app/api/tutor/route");
    const response = await POST(postRequest("/api/tutor", {
      messages: [{ role: "user", content: "give me the answer" }],
      mode: "socratic",
    }));

    expect(response.status).toBe(400);
    expect(createJudgeLLM).not.toHaveBeenCalled();
  });
});

describe("request access API", () => {
  it("requires login", async () => {
    vi.doMock("@/lib/auth", () => ({ getCurrentUser: vi.fn(async () => null) }));
    vi.doMock("@/lib/course-access", () => ({ requestCourseAccess: vi.fn() }));

    const { POST } = await import("@/app/api/access/request/route");
    const response = await POST(postRequest("/api/access/request", {
      courseSlug: "auth-training",
      email: "attacker@example.com",
    }));

    expect(response.status).toBe(401);
  });

  it("uses the logged-in session email instead of the submitted body email", async () => {
    const requestCourseAccess = vi.fn(async () => ({ approveLink: "http://academy.test/approve" }));
    vi.doMock("@/lib/auth", () => ({
      getCurrentUser: vi.fn(async () => ({ id: "u1", email: "learner@example.com", provider: "email", courseAccess: {} })),
    }));
    vi.doMock("@/lib/course-access", () => ({ requestCourseAccess }));

    const { POST } = await import("@/app/api/access/request/route");
    const response = await POST(postRequest("/api/access/request", {
      courseSlug: "auth-training",
      email: "attacker@example.com",
      reason: "pilot",
    }));

    expect(response.status).toBe(200);
    expect(requestCourseAccess).toHaveBeenCalledWith(expect.objectContaining({
      courseSlug: "auth-training",
      email: "learner@example.com",
      reason: "pilot",
    }));
  });
});
