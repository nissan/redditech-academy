"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getUserProgress } from "@/lib/storage";
import type { CourseMetadata } from "@/lib/content-types";

interface Module {
  id: string;
  slug: string;
  order: number;
  title: string;
  description: string;
  difficulty: string;
  estimatedHours: number;
  lessonCount: number;
  badge: { name: string; icon: string; description: string };
  requiresPassword: boolean;
  firstInteractiveLessonSlug: string | null;
}

interface CourseOverviewClientProps {
  course: CourseMetadata;
  modules: Module[];
  courseSlug: string;
  totalLessons: number;
  totalHours: number;
}

export function CourseOverviewClient({
  course,
  modules,
  courseSlug,
  totalLessons,
  totalHours,
}: CourseOverviewClientProps) {
  const [progress, setProgress] = useState<ReturnType<typeof getUserProgress> | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setProgress(getUserProgress(courseSlug));
  }, [courseSlug]);

  const completedModules = mounted && progress
    ? Object.values(progress.moduleProgress).filter((mp) => mp.completed).length
    : 0;
  const completedLessons = mounted && progress ? progress.totalLessonsCompleted : 0;
  const overallProgress = totalLessons > 0
    ? Math.min(Math.round((completedLessons / totalLessons) * 100), 100)
    : 0;

  // Find continue point
  const firstIncompleteModule = modules.find(
    (m) => !progress?.moduleProgress[m.id]?.completed
  );
  const firstMissionModule =
    modules.find(
      (m) => m.firstInteractiveLessonSlug && !progress?.moduleProgress[m.id]?.completed
    ) || modules.find((m) => m.firstInteractiveLessonSlug);

  const difficultyColors: Record<string, string> = {
    beginner: "text-green-400 border-green-400/30 bg-green-400/10",
    intermediate: "text-orange-400 border-orange-400/30 bg-orange-400/10",
    advanced: "text-red-400 border-red-400/30 bg-red-400/10",
    expert: "text-purple-400 border-purple-400/30 bg-purple-400/10",
  };

  return (
    <main className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-slate-500">
        <Link href="/" className="hover:text-white transition-colors">
          Courses
        </Link>
        <span>/</span>
        <span className="text-slate-300">{course.title}</span>
      </nav>

      {/* Course Hero */}
      <div className="mb-10 rounded-2xl border border-slate-700 bg-slate-800 p-4 sm:p-8">
        <div className="flex items-start gap-3 sm:gap-6">
          <div className="text-4xl sm:text-6xl flex-shrink-0">{course.icon}</div>
          <div className="flex-1 min-w-0">
            <div className="mb-2 flex flex-wrap gap-1.5 sm:gap-2">
              <span
                className={`rounded-full border px-2 py-0.5 text-xs font-medium ${difficultyColors[course.difficulty] || difficultyColors.intermediate}`}
              >
                {course.difficulty}
              </span>
              <span className="rounded-full border border-slate-600 px-2 py-0.5 text-xs text-slate-400">
                {modules.length} modules
              </span>
              <span className="rounded-full border border-slate-600 px-2 py-0.5 text-xs text-slate-400">
                {totalLessons} lessons
              </span>
              <span className="rounded-full border border-slate-600 px-2 py-0.5 text-xs text-slate-400">
                ~{Math.round(totalHours)}h
              </span>
              {course.free && (
                <span className="rounded-full border border-green-500/30 bg-green-500/10 px-2 py-0.5 text-xs text-green-400">
                  Free
                </span>
              )}
            </div>
            <h1 className="font-fraunces mb-2 sm:mb-3 text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight break-words">
              {course.title}
            </h1>
            <p className="mb-3 sm:mb-4 text-sm sm:text-base text-slate-300">{course.description}</p>
            <p className="text-xs sm:text-sm text-slate-500">
              By <span className="text-slate-300">{course.author}</span> ·{" "}
              v{course.version}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        {mounted && overallProgress > 0 && (
          <div className="mt-6 pt-6 border-t border-slate-700">
            <div className="flex items-center justify-between mb-2 text-sm">
              <span className="text-slate-400">Overall progress</span>
              <span className="text-white font-medium">{overallProgress}%</span>
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-orange-500 transition-all"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-slate-500">
              {completedModules} of {modules.length} modules completed ·{" "}
              {completedLessons} of {totalLessons} lessons
            </p>
          </div>
        )}

        {/* CTA */}
        <div className="mt-6 flex flex-wrap gap-3">
          {firstIncompleteModule ? (
            <Link
              href={`/courses/${courseSlug}/learn/${firstIncompleteModule.slug}`}
              className="rounded-lg bg-orange-500 px-6 py-2.5 font-semibold text-slate-900 hover:bg-orange-400 transition-colors"
            >
              {completedModules > 0 ? "Continue Learning →" : "Start First Module →"}
            </Link>
          ) : (
            <Link
              href={`/courses/${courseSlug}/learn/${modules[0]?.slug}`}
              className="rounded-lg bg-orange-500 px-6 py-2.5 font-semibold text-slate-900 hover:bg-orange-400 transition-colors"
            >
              Review Course →
            </Link>
          )}
          {firstMissionModule?.firstInteractiveLessonSlug && (
            <Link
              href={`/courses/${courseSlug}/learn/${firstMissionModule.slug}/${firstMissionModule.firstInteractiveLessonSlug}/interactive`}
              className="rounded-lg border border-fuchsia-500/50 bg-fuchsia-500/10 px-6 py-2.5 text-sm font-semibold text-fuchsia-300 hover:bg-fuchsia-500/20 transition-colors"
            >
              {completedModules > 0 ? "Continue Mission Mode →" : "Start Mission Mode →"}
            </Link>
          )}
          <Link
            href={`/courses/${courseSlug}/progress`}
            className="rounded-lg border border-slate-600 px-6 py-2.5 text-sm font-medium text-slate-300 hover:border-slate-500 hover:text-white transition-colors"
          >
            View Progress
          </Link>
        </div>

        {firstMissionModule?.firstInteractiveLessonSlug && (
          <div className="mt-5 rounded-lg border border-fuchsia-500/30 bg-fuchsia-900/10 p-4">
            <p className="text-xs font-mono uppercase tracking-wider text-fuchsia-300 mb-1">
              Mission path (gamified)
            </p>
            <p className="text-sm text-slate-300">
              Prefer CryptoZombies style? Run mission mode with goals, points, streaks, and leaderboard.
            </p>
          </div>
        )}

        {/* Registration CTA */}
        <div className="mt-4 rounded-lg border border-slate-700 bg-slate-700/30 p-4 text-sm text-slate-400">
          <span className="font-medium text-slate-200">Track your progress across devices.</span>{" "}
          Sign up free with your email or Google account.{" "}
          <button
            className="text-orange-500 hover:underline"
            onClick={() => alert("Coming soon — check back shortly!")}
          >
            Create account →
          </button>
        </div>
      </div>

      {/* Module List */}
      <div>
        <h2 className="font-fraunces mb-6 text-2xl font-bold text-white">
          Course Modules
        </h2>
        <div className="space-y-4">
          {modules.map((mod, index) => {
            const modProgress = (mounted && progress?.moduleProgress[mod.id]) || null;
            const isCompleted = modProgress?.completed || false;
            const completedLessonsInMod = modProgress
              ? Object.values(modProgress.lessonProgress).filter((lp) => lp.completed).length
              : 0;
            const lessonProgress = mod.lessonCount > 0
              ? Math.round((completedLessonsInMod / mod.lessonCount) * 100)
              : 0;

            return (
              <div
                key={mod.id}
                className={`rounded-xl border p-6 transition-all hover:border-orange-500/50 ${
                  isCompleted
                    ? "border-green-500/30 bg-green-500/5"
                    : "border-slate-700 bg-slate-800"
                }`}
              >
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="flex h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0 items-center justify-center rounded-full bg-slate-700 text-xs sm:text-sm font-bold text-white">
                    {isCompleted ? "✓" : index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 flex-wrap mb-1">
                      <h3 className="font-semibold text-white text-sm sm:text-base leading-snug break-words">{mod.title}</h3>
                      {mod.requiresPassword && (
                        <span className="text-xs text-yellow-400 whitespace-nowrap">🔒 Password required</span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-slate-400 mb-2 sm:mb-3 line-clamp-2">{mod.description}</p>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                      <span>{mod.lessonCount} lessons</span>
                      <span className="hidden sm:inline">·</span>
                      <span>~{mod.estimatedHours}h</span>
                      <span className="hidden sm:inline">·</span>
                      <span className={difficultyColors[mod.difficulty] || "text-slate-400"}>
                        {mod.difficulty}
                      </span>
                    </div>
                    {mounted && lessonProgress > 0 && !isCompleted && (
                      <div className="mt-3">
                        <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-orange-500/70 transition-all"
                            style={{ width: `${lessonProgress}%` }}
                          />
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          {completedLessonsInMod}/{mod.lessonCount} lessons
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="flex-shrink-0 flex flex-col sm:flex-row gap-2 items-end sm:items-center">
                    {mod.firstInteractiveLessonSlug && (
                      <Link
                        href={`/courses/${courseSlug}/learn/${mod.slug}/${mod.firstInteractiveLessonSlug}/interactive`}
                        className="rounded-lg border border-fuchsia-500/50 bg-fuchsia-500/10 px-2.5 py-1.5 text-xs text-fuchsia-300 hover:bg-fuchsia-500/20 transition-colors whitespace-nowrap"
                      >
                        Mission
                      </Link>
                    )}
                    <Link
                      href={`/courses/${courseSlug}/learn/${mod.slug}`}
                      className="rounded-lg border border-slate-600 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm text-slate-300 hover:border-orange-500 hover:text-orange-400 transition-colors whitespace-nowrap"
                    >
                      {isCompleted ? "Review" : modProgress?.started ? "Continue" : "Start"}
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Badge preview */}
      <div className="mt-10 rounded-xl border border-slate-700 bg-slate-800 p-6 text-center">
        <div className="text-5xl mb-3">{course.badge.icon}</div>
        <h3 className="font-fraunces text-xl font-bold text-white mb-1">
          {course.badge.name}
        </h3>
        <p className="text-sm text-slate-400">{course.badge.description}</p>
        <p className="mt-2 text-xs text-slate-500">
          Earn this badge by completing all modules
        </p>
      </div>
    </main>
  );
}
