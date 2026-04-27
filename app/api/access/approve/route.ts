import { NextRequest, NextResponse } from "next/server";
import { approveAccessRequest } from "@/lib/course-access";

function confirmationPage(token: string) {
  const escapedToken = token.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  return new NextResponse(
    `<!doctype html><html><head><meta charset="utf-8"/><meta name="robots" content="noindex,nofollow"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Confirm access approval</title></head><body style="margin:0;background:#0f172a;color:#e2e8f0;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;display:grid;min-height:100vh;place-items:center;padding:24px"><main style="max-width:500px;border:1px solid #334155;background:#111827;border-radius:20px;padding:32px;text-align:center;box-shadow:0 20px 50px rgba(0,0,0,.3)"><div style="font-size:40px;margin-bottom:16px">✅</div><h1 style="margin:0 0 12px;font-size:28px;color:white">Confirm access approval</h1><p style="margin:0 0 24px;color:#cbd5e1">Approve this Redditech Academy access request. This extra step keeps email scanners from approving links automatically.</p><form method="post"><input type="hidden" name="token" value="${escapedToken}"/><button style="border:0;border-radius:12px;background:#f97316;color:#020617;font-weight:700;padding:14px 20px;cursor:pointer" type="submit">Approve access</button></form></main></body></html>`,
    {
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store",
      },
    },
  );
}

async function approve(token: string | null) {
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });
  const result = await approveAccessRequest(token);
  if (!result) return NextResponse.json({ error: "Approval link is invalid or expired" }, { status: 400 });
  return new NextResponse(`Access approved for ${result.email} on ${result.courseSlug}.`, { headers: { "content-type": "text/plain; charset=utf-8" } });
}

export async function GET(request: NextRequest) {
  const token = new URL(request.url).searchParams.get("token");
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });
  return confirmationPage(token);
}

export async function POST(request: NextRequest) {
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const body = await request.json().catch(() => ({}));
    return approve(typeof body.token === "string" ? body.token : null);
  }
  const form = await request.formData().catch(() => null);
  return approve(form?.get("token")?.toString() || null);
}
