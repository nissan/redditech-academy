"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getUserProgress, completeLesson } from "@/lib/storage";
import { ShareLesson } from "@/components/share-lesson";

interface LessonPageClientProps {
  courseSlug: string;
  moduleSlug: string;
  lessonSlug: string;
  lessonId: string;
  title: string;
  description: string;
  order: number;
  duration: number;
  keyTakeaways: string[];
  nextLesson: { moduleSlug: string; lessonSlug: string } | null;
  previousLesson: { moduleSlug: string; lessonSlug: string } | null;
  moduleTitle?: string;
  children: React.ReactNode;
}

export function LessonPageClient({
  courseSlug,
  moduleSlug,
  lessonSlug,
  lessonId,
  title,
  description,
  order,
  duration,
  keyTakeaways,
  nextLesson,
  previousLesson,
  moduleTitle,
  children,
}: LessonPageClientProps) {
  const [progress, setProgress] = useState<ReturnType<typeof getUserProgress> | null>(null);
  const [mounted, setMounted] = useState(false);
  const [lessonStartTime] = useState<number>(Date.now());

  useEffect(() => {
    setMounted(true);
    setProgress(getUserProgress(courseSlug));
  }, [courseSlug, lessonSlug]);

  if (!mounted) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-slate-800 rounded mb-4 w-3/4" />
        <div className="h-4 bg-slate-800 rounded mb-8 w-1/2" />
        <div className="space-y-3">
          <div className="h-4 bg-slate-800 rounded w-full" />
          <div className="h-4 bg-slate-800 rounded w-full" />
          <div className="h-4 bg-slate-800 rounded w-2/3" />
        </div>
      </div>
    );
  }

  const lessonProgress =
    progress?.moduleProgress[moduleSlug]?.lessonProgress[lessonId];
  const isCompleted = lessonProgress?.completed || false;

  const handleComplete = () => {
    const timeSpent = Math.round((Date.now() - lessonStartTime) / 1000 / 60);
    completeLesson(courseSlug, moduleSlug, lessonId, Math.max(timeSpent, 1));
    setProgress(getUserProgress(courseSlug));
  };

  return (
    <div>
      {/* Lesson header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3 flex-wrap">
          <span className="text-sm text-slate-500">Lesson {order}</span>
          <span className="text-slate-600">·</span>
          <span className="text-sm text-slate-500">{duration} min read</span>
          {isCompleted && (
            <span className="rounded-full bg-green-500/10 border border-green-500/30 px-2.5 py-0.5 text-xs text-green-400">
              ✓ Completed
            </span>
          )}
        </div>
        <h1 className="font-fraunces text-3xl font-bold text-white sm:text-4xl mb-3">
          {title}
        </h1>
        <p className="text-slate-400 text-lg">{description}</p>

        {/* Registration CTA */}
        <div className="mt-4 rounded-lg border border-slate-700 bg-slate-800/50 p-4 text-sm text-slate-400">
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

      {/* Lesson content */}
      <div className="rounded-xl border border-slate-700 bg-slate-800 p-6 sm:p-8 mb-8">
        {children}
      </div>

      {/* Key Takeaways */}
      {keyTakeaways && keyTakeaways.length > 0 && (
        <div className="mb-8 rounded-xl border border-orange-500/30 bg-orange-500/5 p-6">
          <h3 className="font-fraunces text-xl font-bold text-white mb-4">
            Key Takeaways
          </h3>
          <ul className="space-y-2">
            {keyTakeaways.map((point, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                <span className="text-orange-500 mt-0.5 flex-shrink-0">→</span>
                {point}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Complete + Navigation */}
      <div className="rounded-xl border border-slate-700 bg-slate-800 p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="font-semibold text-white mb-1">
              {isCompleted ? "✓ Lesson completed!" : "Mark this lesson complete"}
            </h3>
            <p className="text-sm text-slate-400">
              {isCompleted
                ? "Great work! Continue to the next lesson or take the quiz."
                : "When you're done reading, mark it complete to track progress."}
            </p>
          </div>
          {!isCompleted ? (
            <button
              onClick={handleComplete}
              className="flex-shrink-0 rounded-lg bg-orange-500 px-5 py-2.5 font-semibold text-slate-900 hover:bg-orange-400 transition-colors"
            >
              Mark Complete ✓
            </button>
          ) : (
            <div className="flex-shrink-0 rounded-lg bg-green-500/10 border border-green-500/30 px-5 py-2.5 text-sm font-medium text-green-400">
              ✓ Completed
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-700">
          {previousLesson ? (
            <Link
              href={`/courses/${courseSlug}/learn/${previousLesson.moduleSlug}/${previousLesson.lessonSlug}`}
              className="flex-1 rounded-lg border border-slate-600 px-4 py-3 text-center text-sm font-medium text-slate-300 hover:border-slate-500 hover:text-white transition-colors"
            >
              ← Previous Lesson
            </Link>
          ) : (
            <Link
              href={`/courses/${courseSlug}/learn/${moduleSlug}`}
              className="flex-1 rounded-lg border border-slate-600 px-4 py-3 text-center text-sm font-medium text-slate-300 hover:border-slate-500 hover:text-white transition-colors"
            >
              ← Back to Module
            </Link>
          )}

          {nextLesson ? (
            <Link
              href={`/courses/${courseSlug}/learn/${nextLesson.moduleSlug}/${nextLesson.lessonSlug}`}
              className="flex-1 rounded-lg bg-orange-500 px-4 py-3 text-center text-sm font-semibold text-slate-900 hover:bg-orange-400 transition-colors"
            >
              Next Lesson →
            </Link>
          ) : (
            <Link
              href={`/courses/${courseSlug}/learn/${moduleSlug}/quiz`}
              className="flex-1 rounded-lg bg-orange-500 px-4 py-3 text-center text-sm font-semibold text-slate-900 hover:bg-orange-400 transition-colors"
            >
              Take Module Quiz →
            </Link>
          )}
        </div>

        {/* Share */}
        <div className="mt-4 pt-4 border-t border-slate-700 flex justify-end">
          <ShareLesson title={title} moduleTitle={moduleTitle} />
        </div>
      </div>
    </div>
  );
}
