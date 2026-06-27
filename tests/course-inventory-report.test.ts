import { describe, expect, it } from "vitest";

import {
  buildCourseInventoryReport,
  sequenceIntegrityIssue,
} from "../scripts/course-inventory-report.mjs";

describe("course inventory report", () => {
  const report = buildCourseInventoryReport();

  it("records the reconciled active expected slug list and the actual repo list", () => {
    expect(report.issue.expectedSlugs).toEqual([
      "auth-training",
      "churn-modeling-academy",
      "genai-ml-academy",
      "llm-benchmarking-academy",
      "martech-adtech-academy",
      "openclaw-academy",
      "python-interview-prep",
      "sales-spin-meddic",
      "solana-academy",
    ]);
    expect(report.issue.reconciliationIssue).toBe(25);
    expect(report.issue.compatibilityIssue).toBe(34);
    expect(report.issue.actualSlugs).toEqual(
      report.issue.actualSlugs.slice().sort()
    );
    expect(report.issue.missingExpectedSlugs).toEqual([]);
    expect(report.issue.absentCourseReconciliation).toEqual([
      expect.objectContaining({
        slug: "agentic-ai-systems-engineering",
        status: "follow-up-required",
      }),
      expect.objectContaining({
        slug: "board-game-tutorial-academy",
        status: "not-active-in-current-branch",
      }),
    ]);
  });

  it("counts required inventory dimensions for every actual course", () => {
    expect(report.courses.length).toBe(report.issue.actualSlugs.length);
    for (const course of report.courses) {
      expect(course.counts.modules, course.slug).toBeGreaterThan(0);
      expect(course.counts.lessons, course.slug).toBeGreaterThan(0);
      expect(course.counts.quizzes, course.slug).toBeGreaterThanOrEqual(0);
      expect(course.counts.challenges, course.slug).toBeGreaterThanOrEqual(0);
      expect(course.counts.diagrams, course.slug).toBeGreaterThanOrEqual(0);
      expect(course.counts.downloads, course.slug).toBeGreaterThanOrEqual(0);
      expect(course.counts.videos, course.slug).toBeGreaterThanOrEqual(0);
      expect(course.counts.externalDependencies, course.slug).toBeGreaterThanOrEqual(0);
      expect(course.issues).toHaveProperty("missingQuizzes");
      expect(course.issues).toHaveProperty("brokenReferences");
      expect(course.issues).toHaveProperty("emptyLessons");
      expect(course.issues).toHaveProperty("inconsistentFrontmatter");
      expect(course.issues).toHaveProperty("wholeGameGaps");
      expect(course).toHaveProperty("compatibilityBuckets");
    }
  });

  it("counts the current challenge/frontmatter compatibility buckets explicitly", () => {
    expect(report.compatibilityBucketTotals).toEqual({
      lowercaseChallengeId: 0,
      lessonSlugFilenameMismatch: 230,
      missingChallengeJsonType: 12,
      legacyTitleDescription: 181,
      legacyStarterCode: 181,
      legacyValidationRules: 181,
      missingVisibleSpec: 181,
      missingEffectiveJsonEditorSeed: 0,
      sequenceCorrectOrderIntegrity: 0,
      environmentCoverageGaps: 5,
    });

    const solana = report.courses.find((course) => course.slug === "solana-academy");
    expect(solana?.compatibilityBuckets.missingChallengeJsonType).toHaveLength(0);
    expect(solana?.compatibilityBuckets.environmentCoverageGaps).toHaveLength(0);

    const authTraining = report.courses.find((course) => course.slug === "auth-training");
    expect(authTraining?.compatibilityBuckets.lowercaseChallengeId).toHaveLength(0);
    expect(authTraining?.compatibilityBuckets.legacyValidationRules).toHaveLength(54);

    for (const slug of [
      "auth-training",
      "churn-modeling-academy",
      "genai-ml-academy",
      "llm-benchmarking-academy",
      "martech-adtech-academy",
      "openclaw-academy",
      "python-interview-prep",
      "sales-spin-meddic",
      "solana-academy",
    ]) {
      const course = report.courses.find((candidate) => candidate.slug === slug);
      expect(course?.compatibilityBuckets.lowercaseChallengeId).toHaveLength(0);
    }
  });

  it("fails closed on malformed sequence challenge integrity inputs", () => {
    const validSequenceChallenge = {
      prefilled: {
        steps: [
          { id: "A", label: "Plan" },
          { id: "B", label: "Ship" },
        ],
        correctOrder: ["A", "B"],
      },
    };

    expect(sequenceIntegrityIssue(validSequenceChallenge)).toBeNull();
    expect(sequenceIntegrityIssue({ prefilled: { correctOrder: ["A"] } })).toBe(
      "missing prefilled.steps"
    );
    expect(
      sequenceIntegrityIssue({
        prefilled: {
          steps: [{ id: "A", label: "Plan" }],
          correctOrder: ["A", "B"],
        },
      })
    ).toContain("does not match correctOrder length");
    expect(
      sequenceIntegrityIssue({
        prefilled: {
          steps: [{ id: "A" }],
          correctOrder: ["A"],
        },
      })
    ).toContain("steps missing id or label");
    expect(
      sequenceIntegrityIssue({
        prefilled: {
          steps: [{ id: "A", label: "Plan" }],
          correctOrder: ["B"],
        },
      })
    ).toContain("unknown step ids");
  });
});
