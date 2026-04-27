import { NextRequest, NextResponse } from "next/server";
import { createSession, getOrCreateEmailUser, normalizeEmail, sanitizeRedirectPath } from "@/lib/auth";
import { userHasCourseAccess } from "@/lib/course-access";

export async function POST(request: NextRequest) {
  const contentType = request.headers.get("content-type") || "";
  const body = contentType.includes("application/json")
    ? await request.json()
    : Object.fromEntries((await request.formData()).entries());

  const email = normalizeEmail(String(body.email || ""));
  const code = String(body.code || "").trim();
  const next = sanitizeRedirectPath(String(body.next || "/courses/python-interview-prep"), "/courses/python-interview-prep");
  const expectedCode = process.env.TESTER_LOGIN_CODE?.trim();

  if (!email || !code || !expectedCode || code !== expectedCode) {
    return NextResponse.redirect(new URL(`/login?error=tester-code&next=${encodeURIComponent(next)}`, request.url), 303);
  }

  const globallyAllowed = await userHasCourseAccess("__tester_global_probe__", email);
  if (!globallyAllowed) {
    return NextResponse.redirect(new URL(`/login?error=tester-email&next=${encodeURIComponent(next)}`, request.url), 303);
  }

  const user = await getOrCreateEmailUser(email);
  await createSession(user.id);
  return NextResponse.redirect(new URL(next, request.url), 303);
}
