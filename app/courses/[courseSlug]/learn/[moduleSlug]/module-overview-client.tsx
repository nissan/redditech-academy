"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getUserProgress } from "@/lib/storage";
import { PasswordGate } from "@/components/password-gate";
import { LessonCard } from "@/components/lesson-card";
import type { ModuleMetadata, QuizMetadata } from "@/lib/content-types";
import type { LessonProgress } from "@/lib/storage";

interface Lesson {
  id: string;
  slug: string;
  title: string;
  description: string;
  duration: number;
  order: number;
}

interface ModuleOverviewClientProps {
  courseSlug: string;
  moduleSlug: string;
  metadata: ModuleMetadata;
  lessons: Lesson[];
  quiz: QuizMetadata;
  moduleIndex: number;
  totalModules: number;
  nextModule: { slug: string; title: string } | null;
  prevModule: { slug: string; title: string } | null;
}

export function ModuleOverviewClient({
  courseSlug,
  moduleSlug,
  metadata,
  lessons,
  quiz,
  moduleIndex,
  totalModules,
  nextModule,
  prevModule,
}: ModuleOverviewClientProps) {
  const [progress, setProgress] = useState<ReturnType<typeof getUserProgress> | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setProgress(getUserProgress(courseSlug));
  }, [courseSlug]);

  const moduleProgress = (mounted && progress?.moduleProgress[metadata.id]) || null;
  const completedLessons = moduleProgress
    ? Object.values(moduleProgress.lessonProgress).filter((lp) => lp.completed).length
    : 0;
  const progressPercent = lessons.length > 0
    ? Math.round((completedLessons / lessons.length) * 100)
    : 0;
  const isCompleted = moduleProgress?.completed || false;

  const firstIncompleteLesson = lessons.find((lesson) => {
    const lp = moduleProgress?.lessonProgress[lesson.id];
    return !lp?.completed;
  });
  const startLessonSlug = firstIncompleteLesson?.slug || lessons[0]?.slug;

  const difficultyColors: Record<string, string> = {
    beginner: "text-green-400 border-green-400/30 bg-green-400/10",
    intermediate: "text-orange-400 border-orange-400/30 bg-orange-400/10",
    advanced: "text-red-400 border-red-400/30 bg-red-400/10",
    expert: "text-purple-400 border-purple-400/30 bg-purple-400/10",
  };

  const content = (
    <main className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-slate-500">
        <Link href="/" className="hover:text-white transition-colors">Courses</Link>
        <span>/</span>
        <Link href={`/courses/${courseSlug}`} className="hover:text-white transition-colors">
          {courseSlug.replace(/-/g, " ")}
        </Link>
        <span>/</span>
        <span className="text-slate-300">{metadata.title}</span>
      </nav>

      {/* Module header */}
      <div className={`mb-8 rounded-2xl border p-8 ${isCompleted ? "border-green-500/30 bg-green-500/5" : "border-slate-700 bg-slate-800"}`}>
        <div className="flex items-start gap-4 mb-4">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-slate-700 text-lg font-bold text-white">
            {isCompleted ? "✓" : moduleIndex + 1}
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap gap-2 mb-2">
              <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${difficultyColors[metadata.difficulty] || difficultyColors.intermediate}`}>
                {metadata.difficulty}
              </span>
              <span className="rounded-full border border-slate-600 px-2.5 py-0.5 text-xs text-slate-400">
                {lessons.length} lessons
              </span>
              <span className="rounded-full border border-slate-600 px-2.5 py-0.5 text-xs text-slate-400">
                ~{metadata.estimatedHours}h
              </span>
              <span className="rounded-full border border-slate-600 px-2.5 py-0.5 text-xs text-slate-400">
                Module {moduleIndex + 1} of {totalModules}
              </span>
            </div>
            <h1 className="font-fraunces text-3xl font-bold text-white mb-2">
              {metadata.title}
            </h1>
            <p className="text-slate-300">{metadata.description}</p>
          </div>
        </div>

        {/* Progress */}
        {mounted && progressPercent > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-700">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-400">Progress</span>
              <span className="text-white font-medium">{progressPercent}%</span>
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-orange-500 transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {completedLessons} of {lessons.length} lessons completed
            </p>
          </div>
        )}

        {/* CTA buttons */}
        <div className="mt-6 flex flex-wrap gap-3">
          {startLessonSlug && (
            <Link
              href={`/courses/${courseSlug}/learn/${moduleSlug}/${startLessonSlug}`}
              className="rounded-lg bg-orange-500 px-6 py-2.5 font-semibold text-slate-900 hover:bg-orange-400 transition-colors"
            >
              {completedLessons > 0 && !isCompleted ? "Continue →" : isCompleted ? "Review Lessons" : "Start Module →"}
            </Link>
          )}
          {isCompleted && (
            <Link
              href={`/courses/${courseSlug}/learn/${moduleSlug}/quiz`}
              className="rounded-lg border border-slate-600 px-6 py-2.5 text-sm font-medium text-slate-300 hover:border-orange-500 hover:text-orange-400 transition-colors"
            >
              Retake Quiz
            </Link>
          )}
          {completedLessons === lessons.length && !isCompleted && (
            <Link
              href={`/courses/${courseSlug}/learn/${moduleSlug}/quiz`}
              className="rounded-lg border border-orange-500 px-6 py-2.5 text-sm font-medium text-orange-400 hover:bg-orange-500 hover:text-slate-900 transition-colors"
            >
              Take Quiz →
            </Link>
          )}
        </div>
      </div>

      {/* Learning objectives */}
      {metadata.learningObjectives && metadata.learningObjectives.length > 0 && (
        <div className="mb-8 rounded-xl border border-slate-700 bg-slate-800 p-6">
          <h2 className="font-fraunces text-xl font-bold text-white mb-4">
            What you&apos;ll learn
          </h2>
          <ul className="space-y-2">
            {metadata.learningObjectives.map((obj, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                <span className="text-orange-500 mt-0.5 flex-shrink-0">✓</span>
                {obj}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Lessons list */}
      <div>
        <h2 className="font-fraunces text-xl font-bold text-white mb-4">
          Lessons ({lessons.length})
        </h2>
        <div className="space-y-3">
          {lessons.map((lesson) => {
            const lp = moduleProgress?.lessonProgress[lesson.id] as LessonProgress | undefined;
            return (
              <LessonCard
                key={lesson.slug}
                lesson={lesson}
                progress={lp}
                moduleSlug={moduleSlug}
                courseSlug={courseSlug}
              />
            );
          })}
        </div>
      </div>

      {/* Quiz link */}
      {quiz.questions.length > 0 && (
        <div className="mt-8 rounded-xl border border-slate-700 bg-slate-800 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-white mb-1">Module Quiz</h3>
              <p className="text-sm text-slate-400">
                {quiz.questions.length} questions · {quiz.passingScore}% to pass
              </p>
            </div>
            <Link
              href={`/courses/${courseSlug}/learn/${moduleSlug}/quiz`}
              className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:border-orange-500 hover:text-orange-400 transition-colors"
            >
              {moduleProgress?.bestQuizScore && moduleProgress.bestQuizScore >= quiz.passingScore
                ? `Best: ${moduleProgress.bestQuizScore}% — Retake`
                : "Take Quiz →"}
            </Link>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="mt-8 flex justify-between gap-4">
        {prevModule ? (
          <Link
            href={`/courses/${courseSlug}/learn/${prevModule.slug}`}
            className="flex-1 max-w-xs rounded-xl border border-slate-700 p-4 text-left hover:border-slate-500 transition-colors"
          >
            <p className="text-xs text-slate-500 mb-1">← Previous Module</p>
            <p className="text-sm font-medium text-slate-300">{prevModule.title}</p>
          </Link>
        ) : <div />}
        {nextModule ? (
          <Link
            href={`/courses/${courseSlug}/learn/${nextModule.slug}`}
            className="flex-1 max-w-xs rounded-xl border border-slate-700 p-4 text-right hover:border-slate-500 transition-colors"
          >
            <p className="text-xs text-slate-500 mb-1">Next Module →</p>
            <p className="text-sm font-medium text-slate-300">{nextModule.title}</p>
          </Link>
        ) : <div />}
      </div>

      {/* Badge */}
      <div className="mt-8 rounded-xl border border-slate-700 bg-slate-800/50 p-6 text-center">
        <div className="text-4xl mb-2">{metadata.badge.icon}</div>
        <h3 className="font-fraunces font-bold text-white mb-1">{metadata.badge.name}</h3>
        <p className="text-sm text-slate-400">{metadata.badge.description}</p>
        {isCompleted ? (
          <p className="mt-2 text-xs text-green-400">✓ Badge earned!</p>
        ) : (
          <p className="mt-2 text-xs text-slate-500">Complete all lessons and pass the quiz to earn</p>
        )}
      </div>
    </main>
  );

  if (metadata.requiresPassword && metadata.password) {
    return (
      <PasswordGate
        password={metadata.password}
        moduleId={metadata.id}
        moduleName={metadata.title}
      >
        {content}
      </PasswordGate>
    );
  }

  return content;
}
