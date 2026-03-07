import Link from "next/link";
import { notFound } from "next/navigation";
import { getCourseMetadata } from "@/lib/courses";
import { getModule, getAllModules, getModuleSlugs } from "@/lib/content";
import { getCourseSlugs } from "@/lib/courses";
import { ModuleOverviewClient } from "./module-overview-client";

interface PageProps {
  params: Promise<{ courseSlug: string; moduleSlug: string }>;
}

export async function generateStaticParams() {
  const params: { courseSlug: string; moduleSlug: string }[] = [];
  const courseSlugs = getCourseSlugs();
  for (const courseSlug of courseSlugs) {
    const moduleSlugs = getModuleSlugs(courseSlug);
    for (const moduleSlug of moduleSlugs) {
      params.push({ courseSlug, moduleSlug });
    }
  }
  return params;
}

export async function generateMetadata({ params }: PageProps) {
  const { courseSlug, moduleSlug } = await params;
  const mod = getModule(courseSlug, moduleSlug);
  if (!mod) return {};
  return {
    title: `${mod.metadata.title} — Redditech Academy`,
    description: mod.metadata.description,
  };
}

export default async function ModuleOverviewPage({ params }: PageProps) {
  const { courseSlug, moduleSlug } = await params;
  const course = getCourseMetadata(courseSlug);
  if (!course) notFound();

  const mod = getModule(courseSlug, moduleSlug);
  if (!mod) notFound();

  const allModules = getAllModules(courseSlug);
  const moduleIndex = allModules.findIndex(
    (m) => m.metadata.slug === moduleSlug
  );
  const nextModule = allModules[moduleIndex + 1] || null;
  const prevModule = allModules[moduleIndex - 1] || null;

  const lessons = mod.lessons.map((lesson) => ({
    id: lesson.frontmatter.slug,
    slug: lesson.slug,
    title: lesson.frontmatter.title,
    description: lesson.frontmatter.description,
    duration: lesson.frontmatter.duration,
    order: lesson.frontmatter.order,
  }));

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
          <nav className="flex items-center gap-4">
            <Link
              href={`/courses/${courseSlug}`}
              className="text-sm text-slate-400 hover:text-white transition-colors"
            >
              ← {course.title}
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

      <ModuleOverviewClient
        courseSlug={courseSlug}
        moduleSlug={moduleSlug}
        metadata={mod.metadata}
        lessons={lessons}
        quiz={mod.quiz}
        moduleIndex={moduleIndex}
        totalModules={allModules.length}
        nextModule={nextModule ? { slug: nextModule.metadata.slug, title: nextModule.metadata.title } : null}
        prevModule={prevModule ? { slug: prevModule.metadata.slug, title: prevModule.metadata.title } : null}
      />
    </div>
  );
}
