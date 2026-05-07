import { NextRequest, NextResponse } from "next/server";
import { createSession, getOrCreateEmailUser, normalizeEmail, sanitizeRedirectPath } from "@/lib/auth";
import { grantTesterCodeAccess } from "@/lib/course-access";

function redirectUrl(path: string) {
  return new URL(path, process.env.APP_URL || "http://localhost:3000");
}

export async function POST(request: NextRequest) {
  const contentType = request.headers.get("content-type") || "";
  const body = contentType.includes("application/json")
    ? await request.json()
    : Object.fromEntries((await request.formData()).entries());

  const email = normalizeEmail(String(body.email || ""));
  const code = String(body.code || "").trim();
  const next = sanitizeRedirectPath(String(body.next || "/courses/agentic-ai-systems-engineering"), "/courses/agentic-ai-systems-engineering");
  const requestedCourseSlug = next.match(/^\/courses\/([^/?#]+)/)?.[1];

  if (!email || !code) {
    return NextResponse.redirect(redirectUrl(`/login?error=tester-code&next=${encodeURIComponent(next)}`), 303);
  }

  const granted = await grantTesterCodeAccess(code, email, requestedCourseSlug);
  if (!granted) {
    return NextResponse.redirect(redirectUrl(`/login?error=tester-code&next=${encodeURIComponent(next)}`), 303);
  }

  const user = await getOrCreateEmailUser(email);
  await createSession(user.id);
  return NextResponse.redirect(redirectUrl(next), 303);
}
