import { notFound, redirect } from "next/navigation";
import { getCourseMetadata } from "@/lib/courses";
import {
  getLesson,
  getModuleSlugs,
  getLessonSlugs,
  getModuleMetadata,
} from "@/lib/content";
import { InteractiveLessonClient } from "./interactive-lesson-client";
import Link from "next/link";
import path from "path";
import fs from "fs";
import { ChallengeSpec } from "@/lib/challenge-types";

interface PageProps {
  params: Promise<{
    courseSlug: string;
    moduleSlug: string;
    lessonSlug: string;
  }>;
}

export async function generateStaticParams() {
  const params: { courseSlug: string; moduleSlug: string; lessonSlug: string }[] = [];
  const { getCourseSlugs } = await import("@/lib/courses");
  const courseSlugs = getCourseSlugs();
  for (const courseSlug of courseSlugs) {
    const moduleSlugs = getModuleSlugs(courseSlug);
    for (const moduleSlug of moduleSlugs) {
      const lessonSlugs = getLessonSlugs(courseSlug, moduleSlug);
      for (const lessonSlug of lessonSlugs) {
        const lesson = getLesson(courseSlug, moduleSlug, lessonSlug);
        if (lesson?.frontmatter.type === "interactive") {
          params.push({ courseSlug, moduleSlug, lessonSlug });
        }
      }
    }
  }
  return params;
}

function loadChallenge(courseSlug: string, challengeId: string): ChallengeSpec | null {
  try {
    const filePath = path.join(
      process.cwd(),
      "content",
      "courses",
      courseSlug,
      "challenges",
      `${challengeId}.json`
    );
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw) as ChallengeSpec;
  } catch {
    return null;
  }
}

export default async function InteractiveLessonPage({ params }: PageProps) {
  const { courseSlug, moduleSlug, lessonSlug } = await params;

  const course = getCourseMetadata(courseSlug);
  if (!course) notFound();

  const lesson = getLesson(courseSlug, moduleSlug, lessonSlug);
  if (!lesson) notFound();

  // Redirect non-interactive lessons back to standard page
  if (lesson.frontmatter.type !== "interactive") {
    redirect(`/courses/${courseSlug}/learn/${moduleSlug}/${lessonSlug}`);
  }

  const moduleMetadata = getModuleMetadata(courseSlug, moduleSlug);
  const { environment, challengeId, missionTitle, estimatedMinutes } =
    lesson.frontmatter;

  // Load challenge spec
  const challenge = challengeId ? loadChallenge(courseSlug, challengeId) : null;

  // Count total interactive lessons in this module for progress dots
  const allLessonSlugs = getLessonSlugs(courseSlug, moduleSlug);
  const interactiveLessons = allLessonSlugs.filter((s) => {
    const l = getLesson(courseSlug, moduleSlug, s);
    return l?.frontmatter.type === "interactive";
  });
  const currentStep =
    interactiveLessons.indexOf(lessonSlug) + 1 || lesson.frontmatter.order;
  const totalSteps = interactiveLessons.length || allLessonSlugs.length;

  return (
    <div className="min-h-screen bg-[#0F172A]">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-900/95 backdrop-blur">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="text-xl">🔑</div>
            <span className="font-fraunces text-base font-bold text-white hidden sm:inline">
              IdentityQuest
            </span>
          </Link>
          <nav className="flex items-center gap-3 text-sm">
            <Link
              href={`/courses/${courseSlug}/learn/${moduleSlug}`}
              className="text-slate-400 hover:text-white transition-colors"
            >
              ← Module
            </Link>
            <Link
              href={`/courses/${courseSlug}/learn/${moduleSlug}/${lessonSlug}`}
              className="text-slate-400 hover:text-white transition-colors hidden sm:inline"
            >
              Standard view
            </Link>
          </nav>
        </div>
      </header>

      <InteractiveLessonClient
        courseSlug={courseSlug}
        moduleSlug={moduleSlug}
        lessonSlug={lessonSlug}
        lessonTitle={lesson.frontmatter.title}
        lessonDescription={lesson.frontmatter.description}
        lessonContent={lesson.content}
        missionTitle={missionTitle || lesson.frontmatter.title}
        currentStep={currentStep}
        totalSteps={totalSteps}
        estimatedMinutes={estimatedMinutes || lesson.frontmatter.duration}
        environment={environment || "json-editor"}
        challenge={challenge}
      />
    </div>
  );
}
