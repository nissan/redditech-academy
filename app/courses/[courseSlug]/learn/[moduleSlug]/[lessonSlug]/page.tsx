import Link from "next/link";
import { notFound } from "next/navigation";
import { getCourseMetadata, getCourseSlugs } from "@/lib/courses";
import {
  getLesson,
  getModuleSlugs,
  getLessonSlugs,
  getNextLesson,
  getPreviousLesson,
  getModuleMetadata,
} from "@/lib/content";
import { LessonPageClient } from "./lesson-page-client";
import { MDXContent } from "./mdx-content";

interface PageProps {
  params: Promise<{
    courseSlug: string;
    moduleSlug: string;
    lessonSlug: string;
  }>;
}

export async function generateStaticParams() {
  const params: { courseSlug: string; moduleSlug: string; lessonSlug: string }[] =
    [];
  const courseSlugs = getCourseSlugs();
  for (const courseSlug of courseSlugs) {
    const moduleSlugs = getModuleSlugs(courseSlug);
    for (const moduleSlug of moduleSlugs) {
      const lessonSlugs = getLessonSlugs(courseSlug, moduleSlug);
      for (const lessonSlug of lessonSlugs) {
        params.push({ courseSlug, moduleSlug, lessonSlug });
      }
    }
  }
  return params;
}

export async function generateMetadata({ params }: PageProps) {
  const { courseSlug, moduleSlug, lessonSlug } = await params;
  const lesson = getLesson(courseSlug, moduleSlug, lessonSlug);
  if (!lesson) return {};
  return {
    title: `${lesson.frontmatter.title} — Redditech Academy`,
    description: lesson.frontmatter.description,
  };
}

export default async function LessonPage({ params }: PageProps) {
  const { courseSlug, moduleSlug, lessonSlug } = await params;
  const course = getCourseMetadata(courseSlug);
  if (!course) notFound();

  const lesson = getLesson(courseSlug, moduleSlug, lessonSlug);
  if (!lesson) notFound();

  const moduleMetadata = getModuleMetadata(courseSlug, moduleSlug);
  const nextLesson = getNextLesson(courseSlug, moduleSlug, lessonSlug);
  const previousLesson = getPreviousLesson(courseSlug, moduleSlug, lessonSlug);

  return (
    <div className="min-h-screen bg-[#0F172A]">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-900/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="text-2xl">🧪</div>
            <span className="font-fraunces text-lg font-bold text-white hidden sm:inline">
              Redditech Academy
            </span>
          </Link>
          <nav className="flex items-center gap-2 sm:gap-4">
            <Link
              href={`/courses/${courseSlug}/learn/${moduleSlug}`}
              className="text-sm text-slate-400 hover:text-white transition-colors"
            >
              ← Module
            </Link>
            <Link
              href={`/courses/${courseSlug}/progress`}
              className="text-sm text-slate-400 hover:text-white transition-colors hidden sm:inline"
            >
              Progress
            </Link>
          </nav>
        </div>
      </header>

      <main className="container mx-auto max-w-4xl px-4 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-sm text-slate-500 flex-wrap">
          <Link href="/" className="hover:text-white transition-colors">Courses</Link>
          <span>/</span>
          <Link href={`/courses/${courseSlug}`} className="hover:text-white transition-colors">
            {course.title}
          </Link>
          <span>/</span>
          <Link href={`/courses/${courseSlug}/learn/${moduleSlug}`} className="hover:text-white transition-colors">
            {moduleMetadata?.title || moduleSlug}
          </Link>
          <span>/</span>
          <span className="text-slate-300">{lesson.frontmatter.title}</span>
        </nav>

        <LessonPageClient
          courseSlug={courseSlug}
          moduleSlug={moduleSlug}
          lessonSlug={lessonSlug}
          lessonId={lesson.frontmatter.slug}
          title={lesson.frontmatter.title}
          description={lesson.frontmatter.description}
          order={lesson.frontmatter.order}
          duration={lesson.frontmatter.duration}
          keyTakeaways={lesson.frontmatter.keyTakeaways || []}
          nextLesson={nextLesson}
          previousLesson={previousLesson}
          moduleTitle={moduleMetadata?.title}
        >
          <MDXContent courseSlug={courseSlug} moduleSlug={moduleSlug} lessonSlug={lessonSlug} />
        </LessonPageClient>
      </main>
    </div>
  );
}
