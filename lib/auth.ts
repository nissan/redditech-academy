import { randomUUID } from "crypto";
import { cookies } from "next/headers";
import { and, eq, isNull } from "drizzle-orm";
import { getDb, ensureAuthSchema } from "@/lib/db/client";
import { authMagicTokens, sessions, users } from "@/lib/db/schema";
import { isCourseProtected, userHasCourseAccess } from "@/lib/course-access";
import { sendEmail } from "@/lib/email/resend";
import { createRawToken, hashToken, normalizeEmail } from "@/lib/tokens";
export { createRawToken, hashToken, normalizeEmail } from "@/lib/tokens";

export const SESSION_COOKIE = "rt_academy_session";
export const DEMO_RESET_COOKIE = "rt_academy_demo_bucket";
const MAGIC_TTL_MS = 15 * 60 * 1000;
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  provider: "google" | "email";
  courseAccess: Record<string, string[]>;
}

function appUrl(requestUrl?: string) {
  return process.env.APP_URL || (requestUrl ? new URL(requestUrl).origin : "http://localhost:3000");
}

export function sanitizeRedirectPath(input: unknown, fallback = "/") {
  if (typeof input !== "string") return fallback;
  const value = input.trim();
  if (!value.startsWith("/") || value.startsWith("//")) return fallback;
  try {
    const parsed = new URL(value, "http://academy.local");
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}

export async function createMagicLink(emailInput: string, requestUrl?: string, nextPath?: string) {
  await ensureAuthSchema();
  const email = normalizeEmail(emailInput);
  const rawToken = createRawToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + MAGIC_TTL_MS);
  await getDb().insert(authMagicTokens).values({
    id: randomUUID(),
    email,
    tokenHash,
    expiresAt,
    createdAt: new Date(),
  });
  const url = new URL("/api/auth/magic-link/verify", appUrl(requestUrl));
  url.searchParams.set("token", rawToken);
  const safeNext = sanitizeRedirectPath(nextPath);
  if (safeNext !== "/") url.searchParams.set("next", safeNext);
  const result = await sendEmail({
    to: email,
    subject: "Your Redditech Academy login link",
    text: `Use this link to sign in. It expires in 15 minutes.\n\n${url.toString()}`,
    html: `<p>Use this link to sign in. It expires in 15 minutes.</p><p><a href="${url.toString()}">Sign in to Redditech Academy</a></p>`,
  });
  return { email, expiresAt, magicLink: url.toString(), emailResult: result };
}

export async function getOrCreateEmailUser(emailInput: string) {
  await ensureAuthSchema();
  const email = normalizeEmail(emailInput);
  const now = new Date();
  const existing = await getDb().select().from(users).where(eq(users.email, email)).limit(1);
  let user = existing[0];
  if (!user) {
    user = { id: randomUUID(), email, createdAt: now, lastLoginAt: now };
    await getDb().insert(users).values(user);
  } else {
    await getDb().update(users).set({ lastLoginAt: now }).where(eq(users.id, user.id));
  }
  return { id: user.id, email: user.email, provider: "email" as const, courseAccess: {} } satisfies User;
}

export async function verifyMagicToken(rawToken: string) {
  await ensureAuthSchema();
  const tokenHash = hashToken(rawToken);
  const rows = await getDb().select().from(authMagicTokens).where(eq(authMagicTokens.tokenHash, tokenHash)).limit(1);
  const token = rows[0];
  if (!token || token.usedAt || token.expiresAt.getTime() <= Date.now()) return null;

  const now = new Date();
  const consumed = await getDb()
    .update(authMagicTokens)
    .set({ usedAt: now })
    .where(and(eq(authMagicTokens.id, token.id), isNull(authMagicTokens.usedAt)))
    .returning({ id: authMagicTokens.id });
  if (consumed.length === 0) return null;

  return getOrCreateEmailUser(token.email);
}

export async function createSession(userId: string, options?: { ttlMs?: number; demoBucket?: string }) {
  await ensureAuthSchema();
  const rawToken = createRawToken();
  const sessionHash = hashToken(rawToken);
  const ttlMs = options?.ttlMs ?? SESSION_TTL_MS;
  const expiresAt = new Date(Date.now() + ttlMs);
  await getDb().insert(sessions).values({
    id: randomUUID(),
    userId,
    sessionHash,
    expiresAt,
    createdAt: new Date(),
  });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, rawToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
  if (options?.demoBucket) {
    jar.set(DEMO_RESET_COOKIE, options.demoBucket, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: expiresAt,
    });
  }
  return { rawToken, expiresAt };
}

export async function destroySession() {
  await ensureAuthSchema();
  const jar = await cookies();
  const rawToken = jar.get(SESSION_COOKIE)?.value;
  if (rawToken) {
    await getDb().delete(sessions).where(eq(sessions.sessionHash, hashToken(rawToken)));
  }
  jar.delete(SESSION_COOKIE);
  jar.delete(DEMO_RESET_COOKIE);
}

export async function getCurrentUser(): Promise<User | null> {
  const jar = await cookies();
  const rawToken = jar.get(SESSION_COOKIE)?.value;
  if (!rawToken) return null;
  await ensureAuthSchema();
  const rows = await getDb()
    .select({ session: sessions, user: users })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.sessionHash, hashToken(rawToken)))
    .limit(1);
  const row = rows[0];
  if (!row || row.session.expiresAt.getTime() <= Date.now()) return null;
  return { id: row.user.id, email: row.user.email, provider: "email", courseAccess: {} };
}

export async function requireCourseAccess(courseSlug: string) {
  if (!isCourseProtected(courseSlug)) return { allowed: true, protected: false as const, user: await getCurrentUser() };
  const user = await getCurrentUser();
  if (!user) return { allowed: false, protected: true as const, reason: "login_required" as const, user: null };
  const allowed = await userHasCourseAccess(courseSlug, user.email);
  return allowed
    ? { allowed: true, protected: true as const, user }
    : { allowed: false, protected: true as const, reason: "access_required" as const, user };
}

// Backwards-compatible names for older imports.
export const getUser = getCurrentUser;
export async function signIn(_provider: "google" | "email") {
  throw new Error("Use the email magic-link routes instead");
}
export const signOut = destroySession;
