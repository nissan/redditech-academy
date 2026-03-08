'use client';

import { useState, useEffect, useCallback } from 'react';

export interface MissionState {
  courseSlug: string;
  moduleSlug: string;
  lessonSlug: string;
  attempts: number;
  hintsRevealed: number; // 0-3
  passed: boolean;
  score: number;
  feedback: string;
}

function storageKey(courseSlug: string, moduleSlug: string, lessonSlug: string): string {
  return `rt_academy_mission_${courseSlug}_${moduleSlug}_${lessonSlug}`;
}

function defaultState(
  courseSlug: string,
  moduleSlug: string,
  lessonSlug: string
): MissionState {
  return {
    courseSlug,
    moduleSlug,
    lessonSlug,
    attempts: 0,
    hintsRevealed: 0,
    passed: false,
    score: 0,
    feedback: '',
  };
}

export function useMissionState(
  courseSlug: string,
  moduleSlug: string,
  lessonSlug: string
) {
  const key = storageKey(courseSlug, moduleSlug, lessonSlug);

  const [state, setStateRaw] = useState<MissionState>(() =>
    defaultState(courseSlug, moduleSlug, lessonSlug)
  );

  // Load from localStorage on mount (client-only)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        setStateRaw(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
  }, [key]);

  const save = useCallback(
    (next: MissionState) => {
      setStateRaw(next);
      try {
        localStorage.setItem(key, JSON.stringify(next));
      } catch {
        // ignore quota errors
      }
    },
    [key]
  );

  // Called after the judge returns a result
  const recordAttempt = useCallback(
    (pass: boolean, score: number, feedback: string) => {
      setStateRaw((prev) => {
        const attempts = prev.attempts + 1;
        // Reveal hints progressively: hint 1 on attempt 2, hint 2 on attempt 3, all on attempt 4+
        const hintsRevealed = pass ? prev.hintsRevealed : Math.min(3, attempts);
        const next: MissionState = {
          ...prev,
          attempts,
          hintsRevealed,
          passed: pass || prev.passed,
          score: pass ? Math.max(prev.score, score) : prev.score,
          feedback,
        };
        try {
          localStorage.setItem(key, JSON.stringify(next));
        } catch {
          // ignore
        }
        return next;
      });
    },
    [key]
  );

  const reset = useCallback(() => {
    const fresh = defaultState(courseSlug, moduleSlug, lessonSlug);
    save(fresh);
  }, [courseSlug, moduleSlug, lessonSlug, save]);

  // Show worked solution after 4 failed attempts
  const showAnswer = state.attempts >= 4 && !state.passed;

  return { state, recordAttempt, reset, showAnswer };
}
