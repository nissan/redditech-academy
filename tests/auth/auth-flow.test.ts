import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { resetAuthDbForTests, getDb } from "@/lib/db/client";
import { authMagicTokens } from "@/lib/db/schema";
import { createMagicLink, sanitizeRedirectPath, verifyMagicToken } from "@/lib/auth";
import { approveAccessRequest, requestCourseAccess, userHasCourseAccess } from "@/lib/course-access";
import { hashToken } from "@/lib/tokens";

beforeEach(async () => {
  process.env.AUTH_SECRET = "test-secret";
  process.env.DATABASE_URL = "file::memory:";
  process.env.APP_URL = "http://academy.test";
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
  it("approves a request using a one-time approval link", async () => {
    const request = await requestCourseAccess({ courseSlug: "auth-training", email: "Learner@Example.com", reason: "pilot", requestUrl: "http://academy.test/request-access" });
    const token = new URL(request.approveLink).searchParams.get("token")!;

    expect(await userHasCourseAccess("auth-training", "learner@example.com")).toBe(false);
    await expect(approveAccessRequest(token)).resolves.toMatchObject({ email: "learner@example.com", courseSlug: "auth-training" });
    expect(await userHasCourseAccess("auth-training", "learner@example.com")).toBe(true);
    await expect(approveAccessRequest(token)).resolves.toBeNull();
  });
});
