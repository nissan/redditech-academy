"use client";

import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import { getUserProgress } from "@/lib/storage";

export type DesktopCourse = {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  icon: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  estimatedHours: number;
  comingSoon: boolean;
  free: boolean;
  moduleCount: number;
  totalLessons: number;
  courseUrl: string;
  firstLessonUrl: string;
  interactiveLessonKeys: string[];
  immersiveEntryUrl: string | null;
  immersiveLabel: string | null;
  modules: Array<{
    moduleSlug: string;
    moduleTitle: string;
    lessonCount: number;
    firstLessonSlug: string | null;
  }>;
};

type WindowState = {
  id: string;
  courseSlug: string;
  minimised: boolean;
  zIndex: number;
  x: number;
  y: number;
};

type CourseProgress = {
  completedLessons: number;
  totalLessons: number;
  percent: number;
  resumeUrl: string;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function difficultyPill(difficulty: DesktopCourse["difficulty"]): string {
  if (difficulty === "beginner") return "text-green-300 border-green-400/40 bg-green-400/10";
  if (difficulty === "advanced") return "text-red-300 border-red-400/40 bg-red-400/10";
  return "text-orange-300 border-orange-400/40 bg-orange-400/10";
}

export function DesktopShell({ courses }: { courses: DesktopCourse[] }) {
  const [windows, setWindows] = useState<WindowState[]>([]);
  const [launcherOpen, setLauncherOpen] = useState(false);
  const [launcherQuery, setLauncherQuery] = useState("");
  const [clock, setClock] = useState("");
  const [progressByCourse, setProgressByCourse] = useState<Record<string, CourseProgress>>({});

  useEffect(() => {
    const tick = () => {
      setClock(
        new Date().toLocaleString("en-AU", {
          weekday: "short",
          day: "numeric",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    };
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const next: Record<string, CourseProgress> = {};

    for (const course of courses) {
      const progress = getUserProgress(course.slug);
      const completedLessons = progress.totalLessonsCompleted || 0;
      const totalLessons = Math.max(course.totalLessons, 1);
      const percent = clamp(Math.round((completedLessons / totalLessons) * 100), 0, 100);

      const hasResume = progress.currentModuleId && progress.currentLessonId;
      let resumeUrl = hasResume
        ? `/courses/${course.slug}/learn/${progress.currentModuleId}/${progress.currentLessonId}`
        : course.firstLessonUrl;

      if (hasResume && progress.currentModuleId && progress.currentLessonId) {
        const key = `${progress.currentModuleId}/${progress.currentLessonId}`;
        if (course.interactiveLessonKeys.includes(key)) {
          resumeUrl = `/courses/${course.slug}/learn/${progress.currentModuleId}/${progress.currentLessonId}/interactive`;
        }
      }

      if (!hasResume && course.immersiveEntryUrl) {
        resumeUrl = course.immersiveEntryUrl;
      }

      next[course.slug] = {
        completedLessons,
        totalLessons: course.totalLessons,
        percent,
        resumeUrl,
      };
    }

    setProgressByCourse(next);
  }, [courses]);

  function focusWindow(courseSlug: string) {
    setWindows((current) => {
      const top = Math.max(10, ...current.map((w) => w.zIndex)) + 1;
      return current.map((w) =>
        w.courseSlug === courseSlug ? { ...w, minimised: false, zIndex: top } : w
      );
    });
  }

  function openCourse(courseSlug: string) {
    setWindows((current) => {
      const existing = current.find((w) => w.courseSlug === courseSlug);
      const top = Math.max(10, ...current.map((w) => w.zIndex)) + 1;

      if (existing) {
        return current.map((w) =>
          w.courseSlug === courseSlug ? { ...w, minimised: false, zIndex: top } : w
        );
      }

      const offset = current.length * 28;
      return [
        ...current,
        {
          id: `course-${courseSlug}`,
          courseSlug,
          minimised: false,
          zIndex: top,
          x: 120 + offset,
          y: 84 + offset,
        },
      ];
    });

    setLauncherOpen(false);
  }

  function closeCourse(courseSlug: string) {
    setWindows((current) => current.filter((w) => w.courseSlug !== courseSlug));
  }

  function minimiseCourse(courseSlug: string) {
    setWindows((current) =>
      current.map((w) => (w.courseSlug === courseSlug ? { ...w, minimised: true } : w))
    );
  }

  const visibleWindows = windows
    .filter((w) => !w.minimised)
    .sort((a, b) => a.zIndex - b.zIndex);

  const courseMap = useMemo(() => {
    const map: Record<string, DesktopCourse> = {};
    for (const c of courses) map[c.slug] = c;
    return map;
  }, [courses]);

  const filteredLauncherCourses = courses.filter((c) => {
    const q = launcherQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      c.title.toLowerCase().includes(q) ||
      c.slug.toLowerCase().includes(q) ||
      c.tagline.toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#0b1220]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(249,115,22,0.14),transparent_35%),radial-gradient(circle_at_80%_75%,rgba(56,189,248,0.13),transparent_30%),linear-gradient(180deg,#0b1220_0%,#0f172a_100%)]" />

      <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.04)_1px,transparent_1px)] bg-[size:72px_72px]" />

      <div className="absolute top-0 left-0 right-0 z-[999] h-8 border-b border-white/10 bg-slate-900/70 backdrop-blur-xl px-4 flex items-center justify-between">
        <div className="flex items-center gap-4 text-xs text-slate-200">
          <button onClick={() => setLauncherOpen(true)} className="font-semibold text-orange-300 hover:text-orange-200">
            🧪 Redditech Academy
          </button>
          <span className="hidden md:inline text-slate-400">Desktop</span>
          <Link href="/" className="hidden md:inline text-slate-400 hover:text-white">Classic Catalog</Link>
        </div>
        <div className="text-[11px] text-slate-300 font-mono">{clock}</div>
      </div>

      <div className="absolute left-6 top-14 right-6 bottom-28">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-x-6 gap-y-8 max-w-[1200px]">
          {courses.map((course) => {
            const progress = progressByCourse[course.slug];
            return (
              <button
                key={course.slug}
                className="group flex w-[130px] flex-col items-center"
                onClick={() => !course.comingSoon && openCourse(course.slug)}
                disabled={course.comingSoon}
              >
                <div className="relative h-20 w-20 rounded-2xl border border-white/10 bg-slate-900/60 shadow-[0_14px_30px_rgba(0,0,0,0.35)] transition-transform group-hover:scale-105 flex items-center justify-center text-4xl">
                  {course.icon}
                  {course.comingSoon && (
                    <span className="absolute -bottom-2 rounded-full border border-orange-400/40 bg-orange-500/20 px-2 py-0.5 text-[10px] text-orange-200">
                      Soon
                    </span>
                  )}
                </div>
                <span className="mt-2 text-center text-xs text-slate-100 leading-tight line-clamp-2">{course.title}</span>
                <span className="mt-1 text-[10px] text-slate-400">
                  {progress ? `${progress.percent}%` : "0%"} complete
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {visibleWindows.map((win) => {
        const course = courseMap[win.courseSlug];
        if (!course) return null;
        const progress = progressByCourse[course.slug];

        return (
          <div
            key={win.id}
            className="absolute rounded-xl border border-white/10 bg-slate-900/95 shadow-[0_28px_60px_rgba(0,0,0,0.5)] overflow-hidden"
            style={{
              zIndex: win.zIndex,
              left: win.x,
              top: win.y,
              width: "min(860px, calc(100vw - 48px))",
              height: "min(620px, calc(100vh - 140px))",
            }}
            onMouseDown={() => focusWindow(course.slug)}
          >
            <div className="h-10 border-b border-white/10 bg-slate-950/90 px-3 flex items-center gap-2">
              <button onClick={() => closeCourse(course.slug)} className="h-3 w-3 rounded-full bg-red-400" aria-label="Close" />
              <button onClick={() => minimiseCourse(course.slug)} className="h-3 w-3 rounded-full bg-amber-400" aria-label="Minimise" />
              <span className="h-3 w-3 rounded-full bg-emerald-400" aria-hidden />
              <span className="ml-3 text-xs text-slate-300">{course.title}</span>
            </div>

            <div className="h-[calc(100%-40px)] overflow-auto p-5">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-fraunces text-2xl text-white">{course.title}</h2>
                  <p className="mt-1 text-sm text-slate-400">{course.tagline}</p>
                </div>
                <span className={`rounded-full border px-2.5 py-0.5 text-xs ${difficultyPill(course.difficulty)}`}>
                  {course.difficulty}
                </span>
              </div>

              <div className="mb-5 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="rounded-lg border border-white/10 bg-slate-800/50 p-3 text-slate-300">{course.moduleCount} modules</div>
                <div className="rounded-lg border border-white/10 bg-slate-800/50 p-3 text-slate-300">{course.totalLessons} lessons</div>
                <div className="rounded-lg border border-white/10 bg-slate-800/50 p-3 text-slate-300">~{course.estimatedHours}h</div>
                <div className="rounded-lg border border-white/10 bg-slate-800/50 p-3 text-slate-300">{progress?.percent ?? 0}% done</div>
              </div>

              <div className="mb-6 flex flex-wrap gap-3">
                <Link
                  href={progress?.resumeUrl ?? course.firstLessonUrl}
                  className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-orange-400"
                >
                  {course.immersiveLabel ?? "Resume learning"}
                </Link>
                <Link
                  href={course.firstLessonUrl}
                  className="rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-sm text-slate-200 hover:bg-slate-700"
                >
                  Start from first lesson
                </Link>
                <Link
                  href={course.courseUrl}
                  className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
                >
                  Open classic view
                </Link>
              </div>

              <div className="rounded-xl border border-white/10 bg-slate-800/40 p-4">
                <h3 className="mb-3 text-sm font-semibold text-white">Modules</h3>
                <div className="space-y-2">
                  {course.modules.map((module) => (
                    <div key={module.moduleSlug} className="flex items-center justify-between rounded-lg border border-white/10 bg-slate-900/40 px-3 py-2">
                      <div>
                        <p className="text-sm text-slate-100">{module.moduleTitle}</p>
                        <p className="text-xs text-slate-400">{module.lessonCount} lesson{module.lessonCount === 1 ? "" : "s"}</p>
                      </div>
                      {module.firstLessonSlug ? (
                        <Link
                          href={
                            course.interactiveLessonKeys.includes(
                              `${module.moduleSlug}/${module.firstLessonSlug}`
                            )
                              ? `/courses/${course.slug}/learn/${module.moduleSlug}/${module.firstLessonSlug}/interactive`
                              : `/courses/${course.slug}/learn/${module.moduleSlug}/${module.firstLessonSlug}`
                          }
                          className="text-xs text-orange-300 hover:text-orange-200"
                        >
                          Open
                        </Link>
                      ) : (
                        <span className="text-xs text-slate-500">No lessons</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })}

      <div className="fixed bottom-4 left-1/2 z-[998] -translate-x-1/2 rounded-2xl border border-white/15 bg-slate-900/70 px-3 py-2 backdrop-blur-xl">
        <div className="flex items-end gap-2">
          <button
            onClick={() => setLauncherOpen(true)}
            className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-700/80 text-xl hover:bg-slate-600"
            title="Launcher"
          >
            🔎
          </button>
          {courses.slice(0, 8).map((course) => {
            const win = windows.find((w) => w.courseSlug === course.slug);
            const isOpen = !!win && !win.minimised;
            return (
              <button
                key={course.slug}
                onClick={() => openCourse(course.slug)}
                className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800 text-xl hover:bg-slate-700"
                title={course.title}
              >
                {course.icon}
                <span
                  className={`absolute -bottom-1 h-1.5 w-1.5 rounded-full ${isOpen ? "bg-orange-400" : "bg-transparent"}`}
                />
              </button>
            );
          })}
        </div>
      </div>

      {launcherOpen && (
        <div
          className="fixed inset-0 z-[1000] bg-black/45 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setLauncherOpen(false)}
        >
          <div
            className="w-full max-w-3xl rounded-2xl border border-white/15 bg-slate-900/95 p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-3 text-lg font-semibold text-white">Course Launcher</h2>
            <input
              autoFocus
              value={launcherQuery}
              onChange={(e) => setLauncherQuery(e.target.value)}
              placeholder="Search courses"
              className="mb-4 w-full rounded-lg border border-white/15 bg-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-500 outline-none focus:border-orange-400/50"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[52vh] overflow-auto">
              {filteredLauncherCourses.map((course) => {
                const progress = progressByCourse[course.slug];
                return (
                  <button
                    key={course.slug}
                    onClick={() => !course.comingSoon && openCourse(course.slug)}
                    disabled={course.comingSoon}
                    className="rounded-xl border border-white/10 bg-slate-800/60 p-3 text-left hover:border-orange-400/40 disabled:opacity-55"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{course.icon}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate">{course.title}</p>
                        <p className="text-xs text-slate-400 truncate">{course.tagline}</p>
                        <p className="mt-1 text-[11px] text-slate-500">{progress?.percent ?? 0}% complete</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
