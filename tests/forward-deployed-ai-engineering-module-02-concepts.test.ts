import fs from "fs";
import path from "path";

import { describe, expect, it } from "vitest";

import { getModule, getModuleQuiz } from "../lib/content";
import { buildCourseInventoryReport } from "../scripts/course-inventory-report.mjs";

const COURSE_SLUG = "forward-deployed-ai-engineering";
const MODULE_SLUG = "02-private-and-disconnected-deployment";
const MODULE_DIR = path.join(
  process.cwd(),
  "content",
  "courses",
  COURSE_SLUG,
  "modules",
  MODULE_SLUG
);

describe("Forward Deployed AI Engineering C2a private deployment concepts", () => {
  it("adds one standard customer-signal lesson with packaging, egress, and recovery boundaries", () => {
    const module = getModule(COURSE_SLUG, MODULE_SLUG);

    expect(module?.lessons).toHaveLength(2);
    expect(module?.lessons[0].frontmatter).toMatchObject({
      slug: "01-package-before-you-disconnect",
      order: 1,
      type: "standard",
      duration: 45,
    });
    expect(module?.lessons[0].frontmatter.keyTakeaways).toHaveLength(4);

    const lesson = fs.readFileSync(
      path.join(MODULE_DIR, "lessons", "01-package-before-you-disconnect.mdx"),
      "utf8"
    );
    const singleLineLesson = lesson.replace(/\s+/g, " ");
    for (const requiredConcept of [
      "Customer signal",
      "Artifact inventory",
      "Dependency inventory",
      "Default-deny egress",
      "Health checks",
      "Rollback criteria",
      "Rollback sequence",
      "Production acceptance",
    ]) {
      expect(lesson).toContain(requiredConcept);
    }
    expect(lesson).toContain("Software Bill of Materials (SBOM)");
    expect(lesson).toContain("HarbourCare");
    expect(lesson).toContain("fictional");
    expect(singleLineLesson).toMatch(/offline.*disconnected|disconnected.*offline/i);
    expect(singleLineLesson).toMatch(/exact missing artifact/i);
    expect(singleLineLesson).toMatch(/never.*(?:open|weaken).*egress/i);
    expect(singleLineLesson).toMatch(/packaging proof.*does not.*production acceptance/i);
    expect(lesson).toContain("https://kubernetes.io/docs/concepts/services-networking/network-policies/");
    expect(lesson).toContain("https://csrc.nist.gov/pubs/sp/800/190/final");
  });

  it("adds a balanced scenario-led check for dependency and egress trade-offs", () => {
    const quiz = getModuleQuiz(COURSE_SLUG, MODULE_SLUG);

    expect(quiz).toMatchObject({ passingScore: 80 });
    expect(quiz?.questions).toHaveLength(6);
    expect(quiz?.questions.map((question) => question.id)).toEqual([
      "q1",
      "q2",
      "q3",
      "q4",
      "q5",
      "q6",
    ]);

    const answerPositions = quiz?.questions.map((question) => question.correctAnswer) ?? [];
    expect(new Set(answerPositions)).toEqual(new Set([0, 1, 2, 3]));
    for (const position of [0, 1, 2, 3]) {
      expect(answerPositions.filter((answer) => answer === position).length).toBeLessThanOrEqual(2);
    }

    for (const question of quiz?.questions ?? []) {
      expect(question.options).toHaveLength(4);
      expect(question.correctAnswer).toBeGreaterThanOrEqual(0);
      expect(question.correctAnswer).toBeLessThan(question.options.length);
      expect(question.explanation.length).toBeGreaterThan(60);
      expect(
        (question as typeof question & { relatedLessonId?: string }).relatedLessonId
      ).toBe("01-package-before-you-disconnect");

      const optionLengths = question.options.map((option) => option.length);
      expect(Math.max(...optionLengths) - Math.min(...optionLengths)).toBeLessThan(95);
    }
    expect(
      (quiz?.questions ?? []).filter((question) => {
        const correctLength = question.options[question.correctAnswer].length;
        return correctLength === Math.max(...question.options.map((option) => option.length));
      })
    ).toHaveLength(3);

    const quizText = JSON.stringify(quiz);
    expect(quizText).toMatch(/dependency|artifact/i);
    expect(quizText).toMatch(/default-deny|egress/i);
    expect(quizText).toMatch(/rollback/i);
    expect(quizText).toMatch(/production acceptance/i);
    expect(
      quiz?.questions.filter((question) => question.question.includes("HarbourCare"))
    ).toHaveLength(6);
  });

  it("preserves the concept slice in the cumulative course inventory", () => {
    const course = buildCourseInventoryReport().courses.find(
      (candidate) => candidate.slug === COURSE_SLUG
    );

    expect(course?.counts).toMatchObject({
      modules: 12,
      lessons: 7,
      quizzes: 4,
      challenges: 3,
      downloads: 6,
      interactiveLessons: 3,
    });
    expect(course?.issues.inconsistentFrontmatter).toEqual([]);
    expect(course?.issues.brokenReferences).toEqual([]);
    expect(course?.issues.missingQuizzes).toHaveLength(8);
  });
});
