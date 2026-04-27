import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { requestCourseAccess } from "@/lib/course-access";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Login required" }, { status: 401 });
  }

  const courseSlug = String(body.courseSlug || "");
  const reason = String(body.reason || "").slice(0, 2000);
  if (!courseSlug) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const result = await requestCourseAccess({ courseSlug, email: user.email, reason, requestUrl: request.url });
  return NextResponse.json({ ok: true, devApproveLink: process.env.NODE_ENV === "production" ? undefined : result.approveLink });
}
