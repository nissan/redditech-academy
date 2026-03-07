import Link from "next/link";
import { getAllCourses } from "@/lib/courses";
import { getCourseStructure } from "@/lib/content";
import type { CourseMetadata } from "@/lib/content-types";

function CourseCard({ course }: { course: CourseMetadata }) {
  let moduleCount = 0;
  try {
    const structure = getCourseStructure(course.slug);
    moduleCount = structure.modules.length;
  } catch {
    moduleCount = 0;
  }

  const difficultyColors = {
    beginner: "text-green-400 bg-green-400/10 border-green-400/30",
    intermediate: "text-orange-400 bg-orange-400/10 border-orange-400/30",
    advanced: "text-red-400 bg-red-400/10 border-red-400/30",
  };

  const difficultyColor =
    difficultyColors[course.difficulty] || difficultyColors.intermediate;

  return (
    <div
      className={`group relative rounded-xl border border-slate-700 bg-slate-800 p-6 transition-all hover:border-orange-500/50 hover:shadow-lg hover:shadow-orange-500/10 ${
        course.comingSoon ? "opacity-60" : ""
      }`}
    >
      {course.comingSoon && (
        <div className="absolute right-3 top-3 rounded-full bg-slate-700 px-2 py-0.5 text-xs text-slate-400">
          Coming Soon
        </div>
      )}

      <div className="mb-4 flex items-start gap-4">
        <div className="text-4xl">{course.icon}</div>
        <div className="flex-1">
          <h2 className="font-fraunces text-xl font-bold text-white group-hover:text-orange-400 transition-colors">
            {course.title}
          </h2>
          <p className="mt-1 text-sm text-slate-400">{course.tagline}</p>
        </div>
      </div>

      <p className="mb-4 text-sm text-slate-300 line-clamp-3">
        {course.description}
      </p>

      <div className="mb-4 flex flex-wrap gap-2">
        <span
          className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${difficultyColor}`}
        >
          {course.difficulty}
        </span>
        {moduleCount > 0 && (
          <span className="rounded-full border border-slate-600 px-2.5 py-0.5 text-xs text-slate-400">
            {moduleCount} modules
          </span>
        )}
        <span className="rounded-full border border-slate-600 px-2.5 py-0.5 text-xs text-slate-400">
          ~{course.estimatedHours}h
        </span>
        {course.free && (
          <span className="rounded-full border border-green-500/30 bg-green-500/10 px-2.5 py-0.5 text-xs text-green-400">
            Free
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        {course.tags.slice(0, 4).map((tag) => (
          <span
            key={tag}
            className="rounded text-xs text-slate-500 bg-slate-700/50 px-2 py-0.5"
          >
            #{tag}
          </span>
        ))}
      </div>

      {course.comingSoon ? (
        <div className="block rounded-lg bg-slate-700 px-4 py-2.5 text-center text-sm font-medium text-slate-500 cursor-not-allowed">
          Coming Soon
        </div>
      ) : (
        <Link
          href={`/courses/${course.slug}`}
          className="block rounded-lg bg-orange-500 px-4 py-2.5 text-center text-sm font-semibold text-slate-900 transition-colors hover:bg-orange-400"
        >
          Start Learning →
        </Link>
      )}
    </div>
  );
}

export default function HomePage() {
  const courses = getAllCourses();

  return (
    <div className="min-h-screen bg-[#0F172A]">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="text-2xl">🧪</div>
            <span className="font-fraunces text-lg font-bold text-white">
              Redditech Academy
            </span>
          </Link>
          <nav className="flex items-center gap-4">
            <a
              href="https://reddi.tech"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-slate-400 hover:text-white transition-colors"
            >
              reddi.tech
            </a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="mx-auto max-w-3xl">
          <div className="mb-4 inline-flex items-center rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-1.5 text-sm text-orange-400">
            🔬 Built in the lab, free for everyone
          </div>
          <h1 className="font-fraunces mb-6 text-4xl font-bold text-white sm:text-5xl lg:text-6xl">
            Redditech Labs
            <br />
            <span className="text-orange-500">Training Platform</span>
          </h1>
          <p className="text-lg text-slate-400">
            Free technical courses from the lab. Master OAuth, OIDC, AI agents,
            and the tools we actually build with.
          </p>
        </div>
      </section>

      {/* Course Grid */}
      <main className="container mx-auto px-4 pb-20">
        {courses.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            No courses available yet. Check back soon!
          </div>
        ) : (
          <>
            <h2 className="font-fraunces mb-8 text-2xl font-bold text-white">
              Available Courses
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8 text-center text-sm text-slate-500">
        <p>
          Built by{" "}
          <a
            href="https://reddi.tech"
            className="text-orange-500 hover:underline"
          >
            Redditech Labs
          </a>{" "}
          ·{" "}
          <a
            href="https://github.com/reddinft/redditech-academy"
            className="text-orange-500 hover:underline"
          >
            GitHub
          </a>
        </p>
      </footer>
    </div>
  );
}
