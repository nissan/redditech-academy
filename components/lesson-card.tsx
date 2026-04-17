"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { LessonProgress } from "@/lib/storage";

interface Lesson {
  id: string;
  slug: string;
  title: string;
  description: string;
  duration: number;
  order: number;
}

interface LessonCardProps {
  lesson: Lesson;
  progress?: LessonProgress;
  moduleSlug: string;
  courseSlug: string;
}

export function LessonCard({
  lesson,
  progress,
  moduleSlug,
  courseSlug,
}: LessonCardProps) {
  const isCompleted = progress?.completed || false;

  return (
    <Link href={`/courses/${courseSlug}/learn/${moduleSlug}/${lesson.slug}`}>
      <Card
        className={`group cursor-pointer transition-all hover:shadow-md hover:border-orange-500/50 ${
          isCompleted ? "border-green-500/50 bg-green-500/5" : ""
        }`}
      >
        <CardHeader className="pb-2 sm:pb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <CardTitle className="flex items-start gap-2 text-sm sm:text-base group-hover:text-orange-500 leading-snug">
                {isCompleted && <span className="text-green-400 flex-shrink-0 mt-0.5">✓</span>}
                <span className="break-words">
                  Lesson {lesson.order}: {lesson.title}
                </span>
              </CardTitle>
              <CardDescription className="mt-1 line-clamp-2 text-xs sm:text-sm">
                {lesson.description}
              </CardDescription>
            </div>
            <div className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0 mt-0.5">
              {lesson.duration}m
            </div>
          </div>
        </CardHeader>

        {isCompleted && progress && (
          <CardContent className="pt-0">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              {progress.completedAt && (
                <span>
                  Completed{" "}
                  {new Date(progress.completedAt).toLocaleDateString()}
                </span>
              )}
              <span>•</span>
              <span>{progress.timeSpent} min spent</span>
            </div>
          </CardContent>
        )}
      </Card>
    </Link>
  );
}
