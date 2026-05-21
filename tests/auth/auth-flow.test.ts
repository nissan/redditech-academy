import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { resetAuthDbForTests, getDb } from "@/lib/db/client";
import { authMagicTokens } from "@/lib/db/schema";
import { createMagicLink, sanitizeRedirectPath, verifyMagicToken } from "@/lib/auth";
import { approveAccessRequest, grantTesterCodeAccess, requestCourseAccess, userHasCourseAccess } from "@/lib/course-access";
import { hashToken } from "@/lib/tokens";

beforeEach(async () => {
  process.env.AUTH_SECRET = "test-secret";
  process.env.DATABASE_URL = "file::memory:";
  process.env.APP_URL = "http://academy.test";
  delete process.env.GLOBAL_COURSE_ACCESS_EMAILS;
  delete process.env.DEMO_LOGIN_CODE;
  delete process.env.DEMO_USER_EMAIL;
  delete process.env.TESTER_LOGIN_CODE;
  delete process.env.TESTER_LOGIN_CODES;
  await resetAuthDbForTests();
});

describe("magic-link auth", () => {
  it("hashes raw tokens and verifies them once", async () => {
    const result = await createMagicLink("USER@Example.com", "http://academy.test/login");
    const token = new URL(result.magicLink).searchParams.get("token");
    expect(token).toBeTruthy();
    expect(result.email).toBe("user@example.com");

    const stored = await getDb().select().from(authMagicTokens).where(eq(authMagicTokens.tokenHash, hashToken(token!))).limit(1);
    expect(stored[0]?.tokenHash).toBe(hashToken(token!));
    expect(stored[0]?.tokenHash).not.toBe(token);

    const user = await verifyMagicToken(token!);
    expect(user?.email).toBe("user@example.com");
    await expect(verifyMagicToken(token!)).resolves.toBeNull();
  });


  it("only allows same-origin relative next paths", () => {
    expect(sanitizeRedirectPath("/courses/auth-training?tab=learn#start")).toBe("/courses/auth-training?tab=learn#start");
    expect(sanitizeRedirectPath("//evil.example/path")).toBe("/");
    expect(sanitizeRedirectPath("https://evil.example/path")).toBe("/");
    expect(sanitizeRedirectPath("login")).toBe("/");
  });

  it("preserves a safe next path in the emailed magic link", async () => {
    const result = await createMagicLink("next@example.com", "http://academy.test/login", "/courses/auth-training");
    const url = new URL(result.magicLink);
    expect(url.searchParams.get("next")).toBe("/courses/auth-training");
  });

  it("rejects expired magic tokens", async () => {
    const result = await createMagicLink("expired@example.com", "http://academy.test/login");
    const token = new URL(result.magicLink).searchParams.get("token")!;
    await getDb().update(authMagicTokens).set({ expiresAt: new Date(Date.now() - 1000) }).where(eq(authMagicTokens.tokenHash, hashToken(token)));
    await expect(verifyMagicToken(token)).resolves.toBeNull();
  });
});

describe("course access approvals", () => {
  it("allows global tester emails across courses", async () => {
    process.env.GLOBAL_COURSE_ACCESS_EMAILS = " anushasubedi49@gmail.com , other@example.com ";

    await expect(userHasCourseAccess("python-interview-prep", "AnushaSubedi49@gmail.com")).resolves.toBe(true);
    await expect(userHasCourseAccess("solana-academy", "anushasubedi49@gmail.com")).resolves.toBe(true);
    await expect(userHasCourseAccess("python-interview-prep", "learner@example.com")).resolves.toBe(false);
  });

  it("grants course-specific access from tester codes without a pre-known email", async () => {
    process.env.TESTER_LOGIN_CODES = "JAX-CODE:agentic-ai-systems-engineering,OTHER:python-interview-prep|solana-academy";

    expect(await grantTesterCodeAccess("JAX-CODE", "Jax@Example.com", "agentic-ai-systems-engineering")).toBe(true);
    expect(await userHasCourseAccess("agentic-ai-systems-engineering", "jax@example.com")).toBe(true);
    expect(await userHasCourseAccess("python-interview-prep", "jax@example.com")).toBe(false);
  });

  it("grants the shared demo user access across courses without persistent approvals", async () => {
    process.env.DEMO_LOGIN_CODE = "DEMO-1234";

    expect(await grantTesterCodeAccess("DEMO-1234", "demo@redditech.academy", "board-game-tutorial-academy")).toBe(true);
    expect(await userHasCourseAccess("board-game-tutorial-academy", "demo@redditech.academy")).toBe(true);
    expect(await userHasCourseAccess("solana-academy", "demo@redditech.academy")).toBe(true);
    expect(await grantTesterCodeAccess("DEMO-1234", "learner@example.com", "solana-academy")).toBe(false);
  });

  it("approves a request using a one-time approval link", async () => {
    const request = await requestCourseAccess({ courseSlug: "auth-training", email: "Learner@Example.com", reason: "pilot", requestUrl: "http://academy.test/request-access" });
    const token = new URL(request.approveLink).searchParams.get("token")!;

    expect(await userHasCourseAccess("auth-training", "learner@example.com")).toBe(false);
    await expect(approveAccessRequest(token)).resolves.toMatchObject({ email: "learner@example.com", courseSlug: "auth-training" });
    expect(await userHasCourseAccess("auth-training", "learner@example.com")).toBe(true);
    await expect(approveAccessRequest(token)).resolves.toBeNull();
  });
});
