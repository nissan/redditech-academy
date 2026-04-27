import fs from "fs";
import path from "path";

export interface ChallengeStep {
  id: string;
  label: string;
}

export interface ChallengePrefilled {
  steps?: ChallengeStep[];
  correctOrder?: string[];
  template?: string;
  [key: string]: unknown;
}

export interface ChallengeSpec {
  id: string;
  spec: string;
  validation: unknown;
  eli_notes?: string;
  hints?: string[];
  prefilled?: ChallengePrefilled;
  socratic_mode?: boolean;
  max_strikes_before_reveal?: number;
}

export interface ResolvedChallenge {
  courseSlug: string;
  challenge: ChallengeSpec;
}

const COURSES_DIR = path.join(process.cwd(), "content", "courses");

export function loadChallengeForCourse(courseSlug: string, challengeId: string): ResolvedChallenge | null {
  try {
    const challengePath = path.join(COURSES_DIR, courseSlug, "challenges", `${challengeId}.json`);
    if (!fs.existsSync(challengePath)) return null;
    return {
      courseSlug,
      challenge: JSON.parse(fs.readFileSync(challengePath, "utf-8")) as ChallengeSpec,
    };
  } catch {
    return null;
  }
}

export function resolveChallenge(challengeId: string, courseSlug?: string | null): ResolvedChallenge | null {
  if (courseSlug) return loadChallengeForCourse(courseSlug, challengeId);
  try {
    const courses = fs.readdirSync(COURSES_DIR);
    for (const course of courses) {
      const resolved = loadChallengeForCourse(course, challengeId);
      if (resolved) return resolved;
    }
  } catch {
    // ignore
  }
  return null;
}
