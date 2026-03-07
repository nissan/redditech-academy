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
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2 text-base group-hover:text-orange-500">
                {isCompleted && <span className="text-green-400">✓</span>}
                <span>
                  Lesson {lesson.order}: {lesson.title}
                </span>
              </CardTitle>
              <CardDescription className="mt-1 line-clamp-2">
                {lesson.description}
              </CardDescription>
            </div>
            <div className="text-xs text-muted-foreground whitespace-nowrap">
              {lesson.duration} min
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
