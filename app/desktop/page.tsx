import { DesktopShell, type DesktopCourse } from "@/components/os/DesktopShell";
import { getAllCourses } from "@/lib/courses";
import {
  getLesson,
  getLessonSlugs,
  getModuleMetadata,
  getModuleSlugs,
} from "@/lib/content";

function buildDesktopCourses(): DesktopCourse[] {
  const courses = getAllCourses();

  return courses.map((course) => {
    const moduleSlugs = getModuleSlugs(course.slug);

    const interactiveLessonKeys: string[] = [];

    const modules = moduleSlugs
      .map((moduleSlug) => {
        const metadata = getModuleMetadata(course.slug, moduleSlug);
        if (!metadata) return null;

        const lessonSlugs = getLessonSlugs(course.slug, moduleSlug);
        for (const lessonSlug of lessonSlugs) {
          const lesson = getLesson(course.slug, moduleSlug, lessonSlug);
          if (lesson?.frontmatter.type === "interactive") {
            interactiveLessonKeys.push(`${metadata.slug}/${lessonSlug}`);
          }
        }

        return {
          moduleSlug: metadata.slug,
          moduleTitle: metadata.title,
          lessonCount: lessonSlugs.length,
          firstLessonSlug: lessonSlugs[0] ?? null,
        };
      })
      .filter((m): m is NonNullable<typeof m> => m !== null)
      .sort((a, b) => a.moduleSlug.localeCompare(b.moduleSlug));

    const totalLessons = modules.reduce((sum, m) => sum + m.lessonCount, 0);
    const firstModule = modules[0];
    const firstLessonUrl =
      firstModule && firstModule.firstLessonSlug
        ? `/courses/${course.slug}/learn/${firstModule.moduleSlug}/${firstModule.firstLessonSlug}`
        : `/courses/${course.slug}`;

    const immersiveEntry =
      course.slug === "auth-training"
        ? {
            url: "/courses/auth-training/learn/02-oauth2/01-oauth-roles/interactive",
            label: "Play IdentityQuest",
          }
        : course.slug === "solana-academy"
        ? {
            url: "/courses/solana-academy/learn/08-solana-new-app-builder/01-solana-new-workflow/interactive",
            label: "Start Beginner Solana Mission",
          }
        : course.slug === "llm-benchmarking-academy"
        ? {
            url: "/courses/llm-benchmarking-academy/learn/11-retrieval-and-long-context-evals/01-core-concepts/interactive",
            label: "Run Eval Mission",
          }
        : null;

    return {
      id: course.id,
      slug: course.slug,
      title: course.title,
      tagline: course.tagline,
      icon: course.icon,
      difficulty: course.difficulty,
      estimatedHours: course.estimatedHours,
      comingSoon: !!course.comingSoon,
      free: course.free,
      moduleCount: modules.length,
      totalLessons,
      courseUrl: `/courses/${course.slug}`,
      firstLessonUrl,
      modules,
      interactiveLessonKeys,
      immersiveEntryUrl: immersiveEntry?.url ?? null,
      immersiveLabel: immersiveEntry?.label ?? null,
    };
  });
}

export default function DesktopPage() {
  const courses = buildDesktopCourses();
  return <DesktopShell courses={courses} />;
}
