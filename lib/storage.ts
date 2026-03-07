/**
 * Redditech Academy - Local Storage Management
 * All keys namespaced by courseSlug for future auth migration.
 */

export interface LessonProgress {
  lessonId: string;
  completed: boolean;
  completedAt?: Date;
  timeSpent: number;
}

export interface ModuleProgress {
  moduleId: string;
  started: boolean;
  startedAt?: Date;
  completed: boolean;
  completedAt?: Date;
  lessonProgress: Record<string, LessonProgress>;
  quizAttempts: QuizAttempt[];
  bestQuizScore: number;
  badgeEarned: boolean;
  totalTimeSpent: number;
}

export interface QuizAttempt {
  quizId: string;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  answers: Record<string, number>;
  passed: boolean;
  attemptNumber: number;
  completedAt: Date;
}

export interface UserProgress {
  userId: string;
  createdAt: Date;
  lastActive: Date;
  moduleProgress: Record<string, ModuleProgress>;
  totalLessonsCompleted: number;
  totalQuizzesPassed: number;
  totalTimeSpent: number;
  badgesEarned: string[];
  currentModuleId?: string;
  currentLessonId?: string;
}

const USER_ID_KEY = "rt_academy_user_id";

function generateUserId(): string {
  return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function getUserId(): string {
  if (typeof window === "undefined") return "";
  let userId = localStorage.getItem(USER_ID_KEY);
  if (!userId) {
    userId = generateUserId();
    localStorage.setItem(USER_ID_KEY, userId);
  }
  return userId;
}

function getStorageKey(courseSlug: string): string {
  return `rt_academy_progress_${courseSlug}`;
}

function initializeUserProgress(): UserProgress {
  const userId = getUserId();
  return {
    userId,
    createdAt: new Date(),
    lastActive: new Date(),
    moduleProgress: {},
    totalLessonsCompleted: 0,
    totalQuizzesPassed: 0,
    totalTimeSpent: 0,
    badgesEarned: [],
  };
}

export function getUserProgress(courseSlug: string): UserProgress {
  if (typeof window === "undefined") return initializeUserProgress();

  const stored = localStorage.getItem(getStorageKey(courseSlug));
  if (!stored) {
    return initializeUserProgress();
  }

  try {
    const parsed = JSON.parse(stored);
    parsed.createdAt = new Date(parsed.createdAt);
    parsed.lastActive = new Date(parsed.lastActive);

    for (const moduleId in parsed.moduleProgress) {
      const mp = parsed.moduleProgress[moduleId];
      if (mp.startedAt) mp.startedAt = new Date(mp.startedAt);
      if (mp.completedAt) mp.completedAt = new Date(mp.completedAt);
      for (const lessonId in mp.lessonProgress) {
        const lp = mp.lessonProgress[lessonId];
        if (lp.completedAt) lp.completedAt = new Date(lp.completedAt);
      }
      mp.quizAttempts = mp.quizAttempts.map((attempt: QuizAttempt) => ({
        ...attempt,
        completedAt: new Date(attempt.completedAt),
      }));
    }

    return parsed;
  } catch (error) {
    console.error("Error parsing user progress:", error);
    return initializeUserProgress();
  }
}

export function saveUserProgress(
  courseSlug: string,
  progress: UserProgress
): void {
  if (typeof window === "undefined") return;
  progress.lastActive = new Date();
  localStorage.setItem(getStorageKey(courseSlug), JSON.stringify(progress));
}

export function completeLesson(
  courseSlug: string,
  moduleId: string,
  lessonId: string,
  timeSpent: number
): void {
  const progress = getUserProgress(courseSlug);

  if (!progress.moduleProgress[moduleId]) {
    progress.moduleProgress[moduleId] = {
      moduleId,
      started: true,
      startedAt: new Date(),
      completed: false,
      lessonProgress: {},
      quizAttempts: [],
      bestQuizScore: 0,
      badgeEarned: false,
      totalTimeSpent: 0,
    };
  }

  const moduleProgress = progress.moduleProgress[moduleId];
  if (!moduleProgress.lessonProgress[lessonId]?.completed) {
    progress.totalLessonsCompleted++;
  }

  moduleProgress.lessonProgress[lessonId] = {
    lessonId,
    completed: true,
    completedAt: new Date(),
    timeSpent,
  };

  moduleProgress.totalTimeSpent += timeSpent;
  progress.totalTimeSpent += timeSpent;
  progress.currentModuleId = moduleId;
  progress.currentLessonId = lessonId;

  saveUserProgress(courseSlug, progress);
}

export function recordQuizAttempt(
  courseSlug: string,
  moduleId: string,
  quizAttempt: Omit<QuizAttempt, "attemptNumber" | "completedAt">
): void {
  const progress = getUserProgress(courseSlug);

  if (!progress.moduleProgress[moduleId]) {
    progress.moduleProgress[moduleId] = {
      moduleId,
      started: true,
      startedAt: new Date(),
      completed: false,
      lessonProgress: {},
      quizAttempts: [],
      bestQuizScore: 0,
      badgeEarned: false,
      totalTimeSpent: 0,
    };
  }

  const moduleProgress = progress.moduleProgress[moduleId];
  const attemptNumber = moduleProgress.quizAttempts.length + 1;
  const fullAttempt: QuizAttempt = {
    ...quizAttempt,
    attemptNumber,
    completedAt: new Date(),
  };

  moduleProgress.quizAttempts.push(fullAttempt);
  if (quizAttempt.score > moduleProgress.bestQuizScore) {
    moduleProgress.bestQuizScore = quizAttempt.score;
  }
  if (quizAttempt.passed && !moduleProgress.completed) {
    progress.totalQuizzesPassed++;
  }

  saveUserProgress(courseSlug, progress);
}

export function awardBadge(
  courseSlug: string,
  moduleId: string,
  badgeId: string
): void {
  const progress = getUserProgress(courseSlug);

  if (!progress.badgesEarned.includes(badgeId)) {
    progress.badgesEarned.push(badgeId);
  }

  if (progress.moduleProgress[moduleId]) {
    progress.moduleProgress[moduleId].badgeEarned = true;
    progress.moduleProgress[moduleId].completed = true;
    progress.moduleProgress[moduleId].completedAt = new Date();
  }

  saveUserProgress(courseSlug, progress);
}

export interface LearningStats {
  overallProgress: number;
  completedModules: number;
  totalModules: number;
  completedLessons: number;
  totalLessons: number;
  badgesEarned: number;
  totalBadges: number;
  averageQuizScore: number;
  totalTimeSpent: number;
  streak: number;
  lastActiveDate: Date;
}

export function getLearningStats(
  courseSlug: string,
  totalModules: number,
  totalLessons: number
): LearningStats {
  const progress = getUserProgress(courseSlug);
  const completedModules = Object.values(progress.moduleProgress).filter(
    (mp) => mp.completed
  ).length;
  const averageQuizScore =
    Object.values(progress.moduleProgress).reduce(
      (sum, mp) => sum + mp.bestQuizScore,
      0
    ) / Math.max(Object.keys(progress.moduleProgress).length, 1);
  const overallProgress =
    (progress.totalLessonsCompleted / Math.max(totalLessons, 1)) * 100;

  const daysSinceActive = Math.floor(
    (Date.now() - progress.lastActive.getTime()) / (1000 * 60 * 60 * 24)
  );

  return {
    overallProgress: Math.min(overallProgress, 100),
    completedModules,
    totalModules,
    completedLessons: progress.totalLessonsCompleted,
    totalLessons,
    badgesEarned: progress.badgesEarned.length,
    totalBadges: totalModules,
    averageQuizScore,
    totalTimeSpent: progress.totalTimeSpent,
    streak: daysSinceActive === 0 ? 1 : 0,
    lastActiveDate: progress.lastActive,
  };
}

export function resetProgress(courseSlug: string): void {
  if (typeof window === "undefined") return;
  const userId = getUserId();
  const freshProgress = initializeUserProgress();
  freshProgress.userId = userId;
  saveUserProgress(courseSlug, freshProgress);
}

export function getCaseStudyResponse(moduleId: string, lessonId: string): string {
  if (typeof window === "undefined") return "";
  const key = `rt_academy_casestudy_${moduleId}_${lessonId}`;
  return localStorage.getItem(key) || "";
}

export function saveCaseStudyResponse(moduleId: string, lessonId: string, response: string): void {
  if (typeof window === "undefined") return;
  const key = `rt_academy_casestudy_${moduleId}_${lessonId}`;
  localStorage.setItem(key, response);
}
