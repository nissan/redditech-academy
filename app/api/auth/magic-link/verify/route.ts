import { NextRequest, NextResponse } from "next/server";
import { createSession, sanitizeRedirectPath, verifyMagicToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const redirectBase = process.env.APP_URL || url.origin;
  const token = url.searchParams.get("token");
  const next = sanitizeRedirectPath(url.searchParams.get("next"));
  if (!token) return NextResponse.redirect(new URL("/login?error=invalid", redirectBase));
  const user = await verifyMagicToken(token);
  if (!user) return NextResponse.redirect(new URL("/login?error=invalid", redirectBase));
  await createSession(user.id);
  return NextResponse.redirect(new URL(next, redirectBase));
}
