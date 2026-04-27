import { NextRequest, NextResponse } from "next/server";
import { approveAccessRequest } from "@/lib/course-access";

export async function GET(request: NextRequest) {
  const token = new URL(request.url).searchParams.get("token");
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });
  const result = await approveAccessRequest(token);
  if (!result) return NextResponse.json({ error: "Approval link is invalid or expired" }, { status: 400 });
  return new NextResponse(`Access approved for ${result.email} on ${result.courseSlug}.`, { headers: { "content-type": "text/plain; charset=utf-8" } });
}
