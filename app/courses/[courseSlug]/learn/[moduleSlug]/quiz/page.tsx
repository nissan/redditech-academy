import { notFound } from "next/navigation";
import { AuthGateMessage } from "@/components/auth/AuthGateMessage";
import { getCourseMetadata } from "@/lib/courses";
import { getModule } from "@/lib/content";
import { requireCourseAccess } from "@/lib/auth";
import { QuizClient } from "./quiz-client";

interface PageProps {
  params: Promise<{ courseSlug: string; moduleSlug: string }>;
}

export default async function QuizPage({ params }: PageProps) {
  const { courseSlug, moduleSlug } = await params;
  const course = getCourseMetadata(courseSlug);
  if (!course) notFound();
  const mod = getModule(courseSlug, moduleSlug);
  if (!mod) notFound();

  const access = await requireCourseAccess(courseSlug);
  if (!access.allowed) {
    return <AuthGateMessage course={course} courseSlug={courseSlug} reason={access.reason ?? "login_required"} email={access.user?.email} />;
  }

  return <QuizClient courseSlug={courseSlug} moduleSlug={moduleSlug} />;
}
