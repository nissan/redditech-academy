import { NextRequest, NextResponse } from "next/server";
import { createMagicLink, normalizeEmail, sanitizeRedirectPath } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const contentType = request.headers.get("content-type") || "";
  let email = "";
  let next = "/";
  if (contentType.includes("application/json")) {
    const body = await request.json().catch(() => ({}));
    email = String(body.email || "");
    next = String(body.next || "/");
  } else {
    const form = await request.formData();
    email = String(form.get("email") || "");
    next = String(form.get("next") || "/");
  }

  next = sanitizeRedirectPath(next);
  const normalized = normalizeEmail(email);
  let devLink: string | undefined;
  if (normalized.includes("@")) {
    const result = await createMagicLink(normalized, request.url, next);
    devLink = result.emailResult.devFallback ? result.magicLink : undefined;
  }

  if (contentType.includes("application/json")) {
    return NextResponse.json({ ok: true, devLink: process.env.NODE_ENV === "production" ? undefined : devLink });
  }
  const url = new URL("/login", request.url);
  url.searchParams.set("sent", "1");
  url.searchParams.set("next", next);
  if (devLink) url.searchParams.set("devLink", devLink);
  return NextResponse.redirect(url, { status: 303 });
}
