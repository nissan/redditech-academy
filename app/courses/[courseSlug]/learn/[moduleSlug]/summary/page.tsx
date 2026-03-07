"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { getUserProgress } from "@/lib/storage";

interface PageProps {
  params: Promise<{ courseSlug: string; moduleSlug: string }>;
}

export default function SummaryPage({ params }: PageProps) {
  const { courseSlug, moduleSlug } = use(params);
  const [moduleData, setModuleData] = useState<{
    title: string;
    badge: { name: string; icon: string; description: string };
    id: string;
  } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetch(`/api/quiz?courseSlug=${courseSlug}&moduleSlug=${moduleSlug}`)
      .then((r) => r.json())
      .then((data) => {
        setModuleData({
          title: data.moduleTitle,
          badge: {
            name: data.badgeName,
            icon: data.badgeIcon,
            description: data.badgeDescription,
          },
          id: data.moduleId,
        });
      })
      .catch(() => {});
  }, [courseSlug, moduleSlug]);

  const progress = mounted ? getUserProgress(courseSlug) : null;
  const moduleProgress = progress && moduleData
    ? progress.moduleProgress[moduleData.id]
    : null;
  const badgeEarned = moduleProgress?.badgeEarned || false;

  return (
    <div className="min-h-screen bg-[#0F172A]">
      <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-900/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="text-2xl">🧪</div>
            <span className="font-fraunces text-lg font-bold text-white">
              Redditech Academy
            </span>
          </Link>
          <Link href={`/courses/${courseSlug}`} className="text-sm text-slate-400 hover:text-white">
            ← Course
          </Link>
        </div>
      </header>

      <div className="container mx-auto max-w-2xl px-4 py-16 text-center">
        <div className="text-6xl mb-6">{badgeEarned ? moduleData?.badge.icon || "🎉" : "📚"}</div>
        <h1 className="font-fraunces text-3xl font-bold text-white mb-4">
          {badgeEarned ? `${moduleData?.badge.name || "Module"} Badge Earned!` : "Module Complete!"}
        </h1>
        {moduleData && (
          <>
            <p className="text-slate-300 mb-8">{moduleData.badge.description}</p>
          </>
        )}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href={`/courses/${courseSlug}/learn/${moduleSlug}/quiz`}
            className="rounded-lg border border-slate-600 px-6 py-3 text-sm font-medium text-slate-300 hover:border-slate-500 hover:text-white transition-colors"
          >
            Take Quiz
          </Link>
          <Link
            href={`/courses/${courseSlug}`}
            className="rounded-lg bg-orange-500 px-6 py-3 text-sm font-semibold text-slate-900 hover:bg-orange-400 transition-colors"
          >
            Continue Course →
          </Link>
        </div>
      </div>
    </div>
  );
}
