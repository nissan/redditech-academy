"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import {
  awardMissionPoints,
  completeLesson,
  getLeaderboard,
  getMissionProfile,
  type LeaderboardEntry,
  type MissionProfile,
} from "@/lib/storage";
import { useMissionState } from "@/lib/mission-state";
import { EnvironmentType } from "@/lib/content-types";
import { ChallengeSpec } from "@/lib/challenge-types";
import { MissionHeader } from "@/components/environments/MissionHeader";
import { HintAccordion } from "@/components/environments/HintAccordion";
import { FeedbackPanel } from "@/components/environments/FeedbackPanel";
import { HttpRequestBuilder } from "@/components/environments/HttpRequestBuilder";
import { JwtInspector } from "@/components/environments/JwtInspector";
import { JsonEditor } from "@/components/environments/JsonEditor";
import { SequenceCompleter } from "@/components/environments/SequenceCompleter";

interface MissionMapItem {
  slug: string;
  title: string;
}

interface Props {
  courseSlug: string;
  moduleSlug: string;
  lessonSlug: string;
  lessonTitle: string;
  lessonDescription: string;
  lessonContent: string;
  missionTitle: string;
  currentStep: number;
  totalSteps: number;
  estimatedMinutes: number;
  environment: EnvironmentType;
  challenge: ChallengeSpec | null;
  missionMap?: MissionMapItem[];
  rewardText?: string;
}

interface JudgeResult {
  pass: boolean;
  score: number;
  feedback: string;
}

function calculateMissionPoints(score: number, attempts: number, hintsRevealed: number): number {
  const base = 100;
  const scoreBonus = Math.round(score * 60);
  const attemptBonus = attempts <= 1 ? 45 : attempts === 2 ? 30 : attempts === 3 ? 15 : 5;
  const hintPenalty = Math.max(0, hintsRevealed - 1) * 10;
  return Math.max(40, base + scoreBonus + attemptBonus - hintPenalty);
}

function trackMissionEvent(eventName: string, payload: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  const event = {
    event: eventName,
    ...payload,
    ts: new Date().toISOString(),
  };

  const w = window as Window & { dataLayer?: Array<Record<string, unknown>> };
  if (Array.isArray(w.dataLayer)) {
    w.dataLayer.push(event);
  }

  window.dispatchEvent(new CustomEvent("academy:mission_event", { detail: event }));
}

function preprocessLessonMarkdown(
  markdown: string,
  courseSlug: string,
  moduleSlug: string,
  lessonSlug: string
): string {
  let diagramIndex = 0;

  const withoutMemeMeta = markdown
    .replace(/^\*\*Meme concept:\*\*.*$/gim, "")
    .replace(/^\*\*Why this hurts in real life:\*\*.*$/gim, "")
    .replace(/\n{3,}/g, "\n\n");

  return withoutMemeMeta.replace(/```mermaid\s*([\s\S]*?)```/g, () => {
    diagramIndex += 1;
    const imagePath = `/assets/courses/${courseSlug}/diagrams/${moduleSlug}-${lessonSlug}-d${diagramIndex}.png`;
    return [
      `<figure class="my-6 rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-500/10 via-cyan-400/5 to-fuchsia-500/10 p-3 shadow-[0_0_0_1px_rgba(99,102,241,0.15),0_12px_40px_rgba(14,116,144,0.25)]">`,
      `  <img src="${imagePath}" alt="Diagram ${diagramIndex}" class="w-full rounded-xl border border-slate-700/70 bg-slate-950/70 p-2" loading="lazy" />`,
      `</figure>`,
    ].join("\n");
  });
}

function StepDots({
  total,
  current,
  passed,
}: {
  total: number;
  current: number;
  passed: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`rounded-full transition-all ${
            i + 1 === current
              ? passed
                ? "w-3 h-3 bg-lime-500"
                : "w-3 h-3 bg-orange-500"
              : i + 1 < current
              ? "w-2 h-2 bg-slate-600"
              : "w-2 h-2 bg-slate-700"
          }`}
        />
      ))}
    </div>
  );
}

export function InteractiveLessonClient({
  courseSlug,
  moduleSlug,
  lessonSlug,
  lessonTitle,
  lessonDescription,
  lessonContent,
  missionTitle,
  currentStep,
  totalSteps,
  estimatedMinutes,
  environment,
  challenge,
  missionMap = [],
  rewardText,
}: Props) {
  const { state, recordAttempt, showAnswer } = useMissionState(
    courseSlug,
    moduleSlug,
    lessonSlug
  );
  const [loading, setLoading] = useState(false);
  const [missionProfile, setMissionProfile] = useState<MissionProfile | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [awardedPoints, setAwardedPoints] = useState<number | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    trackMissionEvent("mission_started", {
      courseSlug,
      moduleSlug,
      lessonSlug,
      missionTitle,
      currentStep,
      totalSteps,
      environment,
    });
  }, [courseSlug, moduleSlug, lessonSlug, missionTitle, currentStep, totalSteps, environment]);

  useEffect(() => {
    setMissionProfile(getMissionProfile(courseSlug));
    setLeaderboard(getLeaderboard(courseSlug));
  }, [courseSlug]);

  const callJudge = useCallback(
    async (userInput: Record<string, unknown>): Promise<void> => {
      if (!challenge) return;
      setLoading(true);
      try {
        const res = await fetch("/api/judge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            challengeId: challenge.id,
            environment,
            userInput,
          }),
        });
        if (!res.ok) throw new Error(`Judge API error: ${res.status}`);
        const result: JudgeResult = await res.json();
        const nextAttempt = state.attempts + 1;

        recordAttempt(result.pass, result.score, result.feedback);

        if (result.pass) {
          if (!state.passed) {
            const pointsEarned = calculateMissionPoints(
              result.score,
              nextAttempt,
              state.hintsRevealed
            );
            const nextProfile = awardMissionPoints(
              courseSlug,
              pointsEarned,
              `${moduleSlug}/${lessonSlug}`
            );
            setMissionProfile(nextProfile);
            setLeaderboard(getLeaderboard(courseSlug));
            setAwardedPoints(pointsEarned);

            trackMissionEvent("mission_passed", {
              courseSlug,
              moduleSlug,
              lessonSlug,
              challengeId: challenge.id,
              score: result.score,
              attempts: nextAttempt,
              pointsEarned,
              totalPoints: nextProfile.points,
              environment,
            });
          }
          completeLesson(courseSlug, moduleSlug, lessonSlug, 0);
        } else {
          trackMissionEvent("mission_failed", {
            courseSlug,
            moduleSlug,
            lessonSlug,
            challengeId: challenge.id,
            score: result.score,
            attempts: nextAttempt,
            environment,
          });
        }
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Network error — please try again";
        recordAttempt(false, 0, msg);
      } finally {
        setLoading(false);
      }
    },
    [
      challenge,
      courseSlug,
      environment,
      moduleSlug,
      lessonSlug,
      recordAttempt,
      state.attempts,
      state.hintsRevealed,
      state.passed,
    ]
  );

  const renderedLessonMarkdown = useMemo(
    () => preprocessLessonMarkdown(lessonContent, courseSlug, moduleSlug, lessonSlug),
    [lessonContent, courseSlug, moduleSlug, lessonSlug]
  );

  // Parse challenge prefilled for each environment
  const prefilled = (challenge?.prefilled || {}) as Record<string, unknown>;

  const renderEnvironment = () => {
    switch (environment) {
      case "http-request-builder":
        return (
          <HttpRequestBuilder
            method={(prefilled.method as "GET" | "POST") || "GET"}
            endpoint={(prefilled.endpoint as string) || ""}
            prefilled={(prefilled.params as Record<string, string>) || {}}
            prefilledBody={(prefilled.body as Record<string, string>) || {}}
            prefilledHeaders={(prefilled.headers as Record<string, string>) || {}}
            onSubmit={(data) => callJudge(data)}
            loading={loading}
          />
        );

      case "jwt-inspector": {
        const jwtPrefilled = prefilled as {
          jwt?: string;
          mode?: "decode" | "audit";
        };
        return (
          <JwtInspector
            mode={jwtPrefilled.mode || "audit"}
            initialToken={jwtPrefilled.jwt || ""}
            onSubmit={(data) => callJudge(data as Record<string, unknown>)}
            loading={loading}
          />
        );
      }

      case "json-editor": {
        const template =
          (prefilled.template as string) ||
          JSON.stringify(prefilled.scenario_json || {}, null, 2);
        return (
          <JsonEditor
            template={template}
            onSubmit={(val) => callJudge({ json: val })}
            loading={loading}
          />
        );
      }

      case "sequence-completer": {
        const stepsRaw = (prefilled.steps as Array<{ id: string; label: string }>) || [];
        const correctOrder = (prefilled.correctOrder as string[]) || [];
        return (
          <SequenceCompleter
            steps={stepsRaw}
            correctOrder={correctOrder}
            onSubmit={(order) => callJudge({ order })}
            loading={loading}
          />
        );
      }

      default:
        return (
          <div className="text-slate-400 text-sm p-4">
            Unknown environment: {environment}
          </div>
        );
    }
  };

  const hints = challenge?.hints || [];
  const missionRank = missionProfile
    ? Math.max(1, leaderboard.findIndex((entry) => entry.userId === missionProfile.userId) + 1)
    : null;

  const missionGoals = [
    { label: "Complete this mission", done: state.passed },
    { label: "Score at least 80%", done: state.score >= 0.8 },
    { label: "Finish in 3 attempts or less", done: state.passed && state.attempts <= 3 },
  ];

  return (
    <div className="flex flex-col lg:flex-row lg:h-[calc(100vh-3.5rem)]">
      {/* Left pane — Narrative (40%) */}
      <div className="w-full lg:w-[40%] lg:h-full overflow-y-auto border-b lg:border-b-0 lg:border-r border-slate-800 flex flex-col max-h-[55vh] lg:max-h-none">
        <div className="p-5 flex-1">
          <MissionHeader
            missionTitle={missionTitle}
            currentStep={currentStep}
            totalSteps={totalSteps}
            passed={state.passed}
          />

          {/* Lesson description */}
          <p className="text-slate-400 text-sm mb-4 leading-relaxed">
            {lessonDescription}
          </p>

          <div className="rounded border border-fuchsia-500/30 bg-fuchsia-900/10 p-4 mb-5">
            <div className="text-xs font-mono text-fuchsia-300 uppercase tracking-wider mb-3">
              Mission HUD
            </div>
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mb-3">
              <div className="rounded border border-slate-700 px-3 py-2 text-xs text-slate-300">
                <span className="text-slate-500">Points</span>
                <div className="text-base font-semibold text-fuchsia-200">
                  {missionProfile?.points ?? 0}
                </div>
              </div>
              <div className="rounded border border-slate-700 px-3 py-2 text-xs text-slate-300">
                <span className="text-slate-500">Streak</span>
                <div className="text-base font-semibold text-orange-300">
                  {missionProfile?.currentStreak ?? 0}
                </div>
              </div>
              <div className="rounded border border-slate-700 px-3 py-2 text-xs text-slate-300">
                <span className="text-slate-500">Leaderboard rank</span>
                <div className="text-base font-semibold text-cyan-300">
                  {missionRank ? `#${missionRank}` : "-"}
                </div>
              </div>
            </div>

            <div className="mb-3">
              <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1.5">
                Mission goals
              </div>
              <div className="space-y-1">
                {missionGoals.map((goal) => (
                  <div key={goal.label} className="text-xs text-slate-300 flex items-center gap-2">
                    <span className={goal.done ? "text-lime-400" : "text-slate-500"}>
                      {goal.done ? "✓" : "○"}
                    </span>
                    <span>{goal.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1.5">
                Top operators
              </div>
              <div className="space-y-1">
                {leaderboard.slice(0, 5).map((entry, idx) => {
                  const isYou = missionProfile && entry.userId === missionProfile.userId;
                  return (
                    <div
                      key={entry.userId}
                      className={`rounded px-2 py-1 text-xs border flex items-center justify-between ${
                        isYou
                          ? "border-fuchsia-500/40 bg-fuchsia-500/10 text-fuchsia-200"
                          : "border-slate-700 text-slate-300"
                      }`}
                    >
                      <span>
                        #{idx + 1} {entry.displayName} {isYou ? "(you)" : ""}
                      </span>
                      <span className="font-mono text-slate-400">{entry.points} pts</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Concept content (Markdown + Mermaid image pipeline) */}
          <div className="prose prose-sm prose-invert prose-slate max-w-none text-slate-300 mb-6">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw]}
              components={{
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                code({ inline, className, children, ...props }: any) {
                  const match = /language-(\w+)/.exec(className || "");
                  if (!inline && match) {
                    return (
                      <pre className="bg-slate-900 border border-slate-700 rounded-lg p-4 overflow-x-auto mb-4">
                        <code className={`language-${match[1]} text-sm font-mono text-slate-200`} {...props}>
                          {children}
                        </code>
                      </pre>
                    );
                  }
                  return (
                    <code
                      className="bg-slate-700 px-1.5 py-0.5 rounded text-sm font-mono text-cyan-300"
                      {...props}
                    >
                      {children}
                    </code>
                  );
                },
                pre({ children }) {
                  return <>{children}</>;
                },
                img({ src, alt }) {
                  const srcValue = typeof src === "string" ? src : "";
                  const isMeme = srcValue.includes("/memes/");
                  return (
                    <img
                      src={srcValue}
                      alt={alt || "Lesson image"}
                      className={isMeme
                        ? "w-full rounded-xl border border-orange-500/30 bg-gradient-to-br from-orange-500/20 via-pink-500/10 to-violet-500/20 p-1"
                        : "w-full rounded-xl border border-slate-700/70 bg-slate-950/70 p-2"}
                      loading="lazy"
                    />
                  );
                },
                table({ children }) {
                  return (
                    <div className="overflow-x-auto mb-4">
                      <table className="w-full border-collapse text-sm">{children}</table>
                    </div>
                  );
                },
                th({ children }) {
                  return (
                    <th className="bg-slate-700 border border-slate-600 px-4 py-2 text-left font-semibold text-white">
                      {children}
                    </th>
                  );
                },
                td({ children }) {
                  return <td className="border border-slate-700 px-4 py-2 text-slate-300">{children}</td>;
                },
              }}
            >
              {renderedLessonMarkdown}
            </ReactMarkdown>
          </div>

          {/* Task description from challenge */}
          {challenge && (
            <div className="rounded border border-orange-700/30 bg-orange-900/10 p-4 mb-4">
              <div className="text-xs font-mono text-orange-400 uppercase tracking-wider mb-2">
                Your Task
              </div>
              <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                {challenge.spec}
              </p>
            </div>
          )}

          {/* Show worked answer after 4 failures */}
          {showAnswer && challenge?.prefilled && (
            <div className="rounded border border-slate-600 bg-slate-800/50 p-4 mb-4">
              <div className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-2">
                Worked Solution
              </div>
              <pre className="text-xs text-slate-300 font-mono whitespace-pre-wrap overflow-x-auto">
                {JSON.stringify(challenge.prefilled, null, 2)}
              </pre>
            </div>
          )}

          {/* Mission map */}
          {missionMap.length > 1 && (
            <div className="rounded border border-slate-700 bg-slate-900/40 p-3 mb-4">
              <div className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-2">
                Mission map
              </div>
              <div className="space-y-1.5">
                {missionMap.map((m, idx) => {
                  const active = m.slug === lessonSlug;
                  return (
                    <div
                      key={m.slug}
                      className={`text-xs rounded px-2 py-1 border ${
                        active
                          ? "border-orange-500/40 bg-orange-500/10 text-orange-200"
                          : "border-slate-700 text-slate-300"
                      }`}
                    >
                      {idx + 1}. {m.title}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Hints */}
          <HintAccordion hints={hints} revealed={state.hintsRevealed} />
        </div>

        {/* Step progress dots + attempt counter */}
        <div className="border-t border-slate-800 px-5 py-3 flex items-center justify-between">
          <StepDots
            total={totalSteps}
            current={currentStep}
            passed={state.passed}
          />
          <div className="text-xs text-slate-500 font-mono">
            {estimatedMinutes}min
            {state.attempts > 0 && (
              <span className="ml-2 text-slate-600">
                · {state.attempts} attempt{state.attempts !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right pane — Interactive env (60%) */}
      <div className="w-full lg:w-[60%] lg:h-full overflow-y-auto flex flex-col min-h-[45vh] lg:min-h-0">
        <div className="p-5 flex-1 flex flex-col">
          <div className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-4">
            {lessonTitle} — {environment.replace(/-/g, " ")}
          </div>

          {/* Environment component */}
          <div className="flex-1">{renderEnvironment()}</div>

          {/* Feedback panel */}
          {state.feedback && (
            <FeedbackPanel
              pass={state.passed}
              score={state.score}
              feedback={state.feedback}
              rewardText={
                state.passed && awardedPoints
                  ? `${rewardText || "Mission progress updated"} · +${awardedPoints} points`
                  : rewardText
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}
