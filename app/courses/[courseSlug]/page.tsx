import Link from "next/link";
import { notFound } from "next/navigation";
import { getCourseMetadata, getCourseSlugs } from "@/lib/courses";
import { getCourseStructure } from "@/lib/content";
import { CourseOverviewClient } from "./course-overview-client";

interface PageProps {
  params: Promise<{ courseSlug: string }>;
}

export async function generateStaticParams() {
  const slugs = getCourseSlugs();
  return slugs.map((courseSlug) => ({ courseSlug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { courseSlug } = await params;
  const course = getCourseMetadata(courseSlug);
  if (!course) return {};
  return {
    title: `${course.title} — Redditech Academy`,
    description: course.description,
  };
}

export default async function CourseOverviewPage({ params }: PageProps) {
  const { courseSlug } = await params;
  const course = getCourseMetadata(courseSlug);
  if (!course) notFound();

  const structure = getCourseStructure(courseSlug);

  const modules = structure.modules.map((m) => ({
    id: m.metadata.id,
    slug: m.metadata.slug,
    order: m.metadata.order,
    title: m.metadata.title,
    description: m.metadata.description,
    difficulty: m.metadata.difficulty,
    estimatedHours: m.metadata.estimatedHours,
    lessonCount: m.lessons.length,
    badge: m.metadata.badge,
    requiresPassword: m.metadata.requiresPassword || false,
  }));

  return (
    <div className="min-h-screen bg-[#0F172A]">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-900/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="text-2xl">🧪</div>
            <span className="font-fraunces text-lg font-bold text-white">
              Redditech Academy
            </span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href={`/courses/${courseSlug}/progress`}
              className="text-sm text-slate-400 hover:text-white transition-colors"
            >
              My Progress
            </Link>
          </nav>
        </div>
      </header>

      <CourseOverviewClient
        course={course}
        modules={modules}
        courseSlug={courseSlug}
        totalLessons={structure.totalLessons}
        totalHours={structure.totalHours}
      />
    </div>
  );
}
