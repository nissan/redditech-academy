import { NextRequest, NextResponse } from "next/server";
import { getModule, getModuleMetadata } from "@/lib/content";
import { requireCourseAccess } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const courseSlug = searchParams.get("courseSlug");
  const moduleSlug = searchParams.get("moduleSlug");

  if (!courseSlug || !moduleSlug) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  const access = await requireCourseAccess(courseSlug);
  if (!access.allowed) {
    return NextResponse.json(
      { error: access.reason === "login_required" ? "Login required" : "Access required" },
      { status: access.reason === "login_required" ? 401 : 403 }
    );
  }

  const mod = getModule(courseSlug, moduleSlug);
  const metadata = getModuleMetadata(courseSlug, moduleSlug);

  if (!mod || !metadata) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    passingScore: mod.quiz.passingScore,
    questions: mod.quiz.questions,
    moduleTitle: metadata.title,
    moduleId: metadata.id,
    badgeIcon: metadata.badge.icon,
    badgeName: metadata.badge.name,
    badgeDescription: metadata.badge.description,
  });
}
