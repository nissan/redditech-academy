import { describe, expect, it } from "vitest";

import { buildCourseInventoryReport } from "../scripts/course-inventory-report.mjs";

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
    }
  });
});
