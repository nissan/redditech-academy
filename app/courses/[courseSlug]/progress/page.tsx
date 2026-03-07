"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import {
  getUserProgress,
  getLearningStats,
  resetProgress,
} from "@/lib/storage";

interface PageProps {
  params: Promise<{ courseSlug: string }>;
}

interface CourseData {
  title: string;
  icon: string;
  modules: Array<{
    id: string;
    slug: string;
    title: string;
    lessonCount: number;
    badge: { name: string; icon: string; description: string };
  }>;
  totalLessons: number;
}

export default function ProgressPage({ params }: PageProps) {
  const { courseSlug } = use(params);
  const [mounted, setMounted] = useState(false);
  const [courseData, setCourseData] = useState<CourseData | null>(null);
  const [progress, setProgress] = useState<ReturnType<typeof getUserProgress> | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    setMounted(true);
    setProgress(getUserProgress(courseSlug));
    fetch(`/api/course-structure?courseSlug=${courseSlug}`)
      .then((r) => r.json())
      .then((data) => setCourseData(data))
      .catch(() => {});
  }, [courseSlug]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }

  const stats = courseData
    ? getLearningStats(
        courseSlug,
        courseData.modules.length,
        courseData.totalLessons
      )
    : null;

  const handleReset = () => {
    if (showResetConfirm) {
      resetProgress(courseSlug);
      setProgress(getUserProgress(courseSlug));
      setShowResetConfirm(false);
    } else {
      setShowResetConfirm(true);
    }
  };

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
          <Link
            href={`/courses/${courseSlug}`}
            className="text-sm text-slate-400 hover:text-white transition-colors"
          >
            ← Course Overview
          </Link>
        </div>
      </header>

      <main className="container mx-auto max-w-4xl px-4 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-sm text-slate-500">
          <Link href="/" className="hover:text-white transition-colors">Courses</Link>
          <span>/</span>
          <Link href={`/courses/${courseSlug}`} className="hover:text-white transition-colors">
            {courseData?.title || courseSlug}
          </Link>
          <span>/</span>
          <span className="text-slate-300">My Progress</span>
        </nav>

        <h1 className="font-fraunces text-3xl font-bold text-white mb-8">
          My Progress
        </h1>

        {/* Stats overview */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Overall", value: `${Math.round(stats.overallProgress)}%`, icon: "📊" },
              { label: "Modules Done", value: `${stats.completedModules}/${stats.totalModules}`, icon: "📦" },
              { label: "Lessons Done", value: `${stats.completedLessons}/${stats.totalLessons}`, icon: "📖" },
              { label: "Badges", value: `${stats.badgesEarned}/${stats.totalBadges}`, icon: "🏆" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl border border-slate-700 bg-slate-800 p-4 text-center">
                <div className="text-2xl mb-1">{stat.icon}</div>
                <div className="font-fraunces text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-xs text-slate-400 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Overall progress bar */}
        {stats && (
          <div className="rounded-xl border border-slate-700 bg-slate-800 p-6 mb-8">
            <div className="flex justify-between text-sm mb-3">
              <span className="font-medium text-white">Course Completion</span>
              <span className="text-slate-400">{Math.round(stats.overallProgress)}%</span>
            </div>
            <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-orange-500 transition-all rounded-full"
                style={{ width: `${stats.overallProgress}%` }}
              />
            </div>
            {stats.totalTimeSpent > 0 && (
              <p className="mt-2 text-xs text-slate-500">
                ~{Math.round(stats.totalTimeSpent)} minutes spent learning
              </p>
            )}
          </div>
        )}

        {/* Module progress */}
        {courseData && progress && (
          <div>
            <h2 className="font-fraunces text-xl font-bold text-white mb-4">Module Breakdown</h2>
            <div className="space-y-3">
              {courseData.modules.map((mod) => {
                const modProgress = progress.moduleProgress[mod.id];
                const isCompleted = modProgress?.completed || false;
                const completedLessons = modProgress
                  ? Object.values(modProgress.lessonProgress).filter((lp) => lp.completed).length
                  : 0;
                const lessonProgress = mod.lessonCount > 0
                  ? Math.round((completedLessons / mod.lessonCount) * 100)
                  : 0;
                const badgeEarned = modProgress?.badgeEarned || false;
                const bestQuizScore = modProgress?.bestQuizScore || 0;

                return (
                  <div
                    key={mod.id}
                    className={`rounded-xl border p-5 ${isCompleted ? "border-green-500/30 bg-green-500/5" : "border-slate-700 bg-slate-800"}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-white text-sm">{mod.title}</h3>
                          {badgeEarned && (
                            <span className="text-sm" title={mod.badge.name}>
                              {mod.badge.icon}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
                          <span>{completedLessons}/{mod.lessonCount} lessons</span>
                          {bestQuizScore > 0 && <span>Quiz best: {bestQuizScore}%</span>}
                        </div>
                        <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${isCompleted ? "bg-green-500" : "bg-orange-500"}`}
                            style={{ width: `${lessonProgress}%` }}
                          />
                        </div>
                      </div>
                      <div className="flex-shrink-0 flex items-center gap-2">
                        {isCompleted && (
                          <span className="text-xs text-green-400">✓ Done</span>
                        )}
                        <Link
                          href={`/courses/${courseSlug}/learn/${mod.slug}`}
                          className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs text-slate-300 hover:border-orange-500 hover:text-orange-400 transition-colors"
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
        )}

        {/* Badges */}
        {progress && progress.badgesEarned.length > 0 && courseData && (
          <div className="mt-8">
            <h2 className="font-fraunces text-xl font-bold text-white mb-4">Badges Earned</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {progress.badgesEarned.map((badgeId) => {
                const mod = courseData.modules.find((m) => `badge-${m.id}` === badgeId || m.id === badgeId);
                if (!mod) return null;
                return (
                  <div key={badgeId} className="rounded-xl border border-green-500/30 bg-green-500/5 p-4 text-center">
                    <div className="text-4xl mb-2">{mod.badge.icon}</div>
                    <p className="font-semibold text-white text-sm">{mod.badge.name}</p>
                    <p className="text-xs text-slate-400 mt-1">{mod.badge.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Registration CTA */}
        <div className="mt-8 rounded-xl border border-slate-700 bg-slate-800/50 p-6">
          <h3 className="font-fraunces text-lg font-bold text-white mb-2">
            💡 Sync across devices
          </h3>
          <p className="text-sm text-slate-400 mb-4">
            Your progress is currently saved in this browser only. Create a free account to sync across devices.
          </p>
          <button
            className="rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-semibold text-slate-900 hover:bg-orange-400 transition-colors"
            onClick={() => alert("Coming soon — check back shortly!")}
          >
            Create free account →
          </button>
        </div>

        {/* Reset */}
        <div className="mt-8 pt-8 border-t border-slate-800">
          <h3 className="text-sm font-semibold text-slate-400 mb-3">Danger Zone</h3>
          <button
            onClick={handleReset}
            className={`rounded-lg px-4 py-2 text-sm transition-colors ${
              showResetConfirm
                ? "bg-red-500 text-white hover:bg-red-600"
                : "border border-slate-700 text-slate-500 hover:border-red-500 hover:text-red-400"
            }`}
          >
            {showResetConfirm ? "Confirm: Reset all progress" : "Reset progress"}
          </button>
          {showResetConfirm && (
            <button
              onClick={() => setShowResetConfirm(false)}
              className="ml-3 text-sm text-slate-500 hover:text-slate-300 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
