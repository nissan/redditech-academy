"use client";

import { useState, useCallback } from "react";
import { completeLesson } from "@/lib/storage";
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
}

interface JudgeResult {
  pass: boolean;
  score: number;
  feedback: string;
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
}: Props) {
  const { state, recordAttempt, showAnswer } = useMissionState(
    courseSlug,
    moduleSlug,
    lessonSlug
  );
  const [loading, setLoading] = useState(false);

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
        recordAttempt(result.pass, result.score, result.feedback);
        if (result.pass) {
          completeLesson(courseSlug, moduleSlug, lessonSlug, 0);
        }
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Network error — please try again";
        recordAttempt(false, 0, msg);
      } finally {
        setLoading(false);
      }
    },
    [challenge, courseSlug, environment, moduleSlug, lessonSlug, recordAttempt]
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

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-3.5rem)]">
      {/* Left pane — Narrative (40%) */}
      <div className="w-full lg:w-[40%] lg:h-full overflow-y-auto border-b lg:border-b-0 lg:border-r border-slate-800 flex flex-col">
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

          {/* Concept content (MDX rendered as HTML-like text) */}
          <div
            className="prose prose-sm prose-invert prose-slate max-w-none text-slate-300 [&_code]:text-cyan-300 [&_code]:bg-slate-800 [&_code]:px-1 [&_code]:rounded [&_strong]:text-white mb-6"
            dangerouslySetInnerHTML={{
              __html: lessonContent
                .replace(/^#+\s+(.+)$/gm, "<h3>$1</h3>")
                .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
                .replace(/`([^`]+)`/g, "<code>$1</code>")
                .replace(/\n\n/g, "</p><p>")
                .replace(/^/, "<p>")
                .replace(/$/, "</p>"),
            }}
          />

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
      <div className="w-full lg:w-[60%] lg:h-full overflow-y-auto flex flex-col">
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
            />
          )}
        </div>
      </div>
    </div>
  );
}
