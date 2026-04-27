import { NextRequest, NextResponse } from "next/server";
import { requireCourseAccess } from "@/lib/auth";
import { getCourseMetadata } from "@/lib/courses";
import { getCourseStructure } from "@/lib/content";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const courseSlug = searchParams.get("courseSlug");

  if (!courseSlug) {
    return NextResponse.json({ error: "Missing courseSlug" }, { status: 400 });
  }

  const access = await requireCourseAccess(courseSlug);
  if (!access.allowed) {
    return NextResponse.json(
      { error: access.reason === "login_required" ? "Login required" : "Access required" },
      { status: access.reason === "login_required" ? 401 : 403 }
    );
  }

  const course = getCourseMetadata(courseSlug);
  if (!course) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const structure = getCourseStructure(courseSlug);

  return NextResponse.json({
    title: course.title,
    icon: course.icon,
    totalLessons: structure.totalLessons,
    modules: structure.modules.map((m) => ({
      id: m.metadata.id,
      slug: m.metadata.slug,
      title: m.metadata.title,
      lessonCount: m.lessons.length,
      badge: m.metadata.badge,
    })),
  });
}
