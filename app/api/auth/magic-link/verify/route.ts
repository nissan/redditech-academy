import { NextRequest, NextResponse } from "next/server";
import { createSession, sanitizeRedirectPath, verifyMagicToken } from "@/lib/auth";

function redirectBaseFor(request: NextRequest) {
  const url = new URL(request.url);
  return process.env.APP_URL || url.origin;
}

function invalidRedirect(request: NextRequest) {
  return NextResponse.redirect(new URL("/login?error=invalid", redirectBaseFor(request)));
}

function confirmationPage(token: string, next: string) {
  const escapedToken = token.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  const escapedNext = next.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  return new NextResponse(
    `<!doctype html><html><head><meta charset="utf-8"/><meta name="robots" content="noindex,nofollow"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Confirm sign in</title></head><body style="margin:0;background:#0f172a;color:#e2e8f0;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;display:grid;min-height:100vh;place-items:center;padding:24px"><main style="max-width:460px;border:1px solid #334155;background:#111827;border-radius:20px;padding:32px;text-align:center;box-shadow:0 20px 50px rgba(0,0,0,.3)"><div style="font-size:40px;margin-bottom:16px">🔐</div><h1 style="margin:0 0 12px;font-size:28px;color:white">Confirm your sign in</h1><p style="margin:0 0 24px;color:#cbd5e1">Continue to Redditech Academy. This extra step keeps email scanners from using your magic link.</p><form method="post"><input type="hidden" name="token" value="${escapedToken}"/><input type="hidden" name="next" value="${escapedNext}"/><button style="border:0;border-radius:12px;background:#f97316;color:#020617;font-weight:700;padding:14px 20px;cursor:pointer" type="submit">Continue to course</button></form></main></body></html>`,
    {
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store",
      },
    },
  );
}

async function consumeMagicLink(request: NextRequest, token: string | null, nextInput: string | null) {
  const next = sanitizeRedirectPath(nextInput);
  if (!token) return invalidRedirect(request);
  const user = await verifyMagicToken(token);
  if (!user) return invalidRedirect(request);
  await createSession(user.id);
  return NextResponse.redirect(new URL(next, redirectBaseFor(request)), { status: 303 });
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  const next = sanitizeRedirectPath(url.searchParams.get("next"));
  if (!token) return invalidRedirect(request);
  return confirmationPage(token, next);
}

export async function POST(request: NextRequest) {
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const body = await request.json().catch(() => ({}));
    return consumeMagicLink(request, typeof body.token === "string" ? body.token : null, typeof body.next === "string" ? body.next : null);
  }
  const form = await request.formData().catch(() => null);
  return consumeMagicLink(request, form?.get("token")?.toString() || null, form?.get("next")?.toString() || null);
}
