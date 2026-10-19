import fs from "fs";
import path from "path";

import { describe, expect, it } from "vitest";

import { getModule, getModuleQuiz } from "../lib/content";
import { buildCourseInventoryReport } from "../scripts/course-inventory-report.mjs";

const COURSE_SLUG = "forward-deployed-ai-engineering";
const MODULE_SLUG = "03-legacy-data-ingestion-and-reconciliation";
const MODULE_DIR = path.join(
  process.cwd(),
  "content",
  "courses",
  COURSE_SLUG,
  "modules",
  MODULE_SLUG
);

describe("Forward Deployed AI Engineering C3a ingestion concepts", () => {
  it("adds one standard customer-signal lesson with explicit uncertainty and recovery boundaries", () => {
    const module = getModule(COURSE_SLUG, MODULE_SLUG);

    expect(module?.lessons).toHaveLength(1);
    expect(module?.lessons[0].frontmatter).toMatchObject({
      slug: "01-reconcile-uncertain-records",
      order: 1,
      type: "standard",
      duration: 45,
    });
    expect(module?.lessons[0].frontmatter.keyTakeaways).toHaveLength(4);

    const lesson = fs.readFileSync(
      path.join(MODULE_DIR, "lessons", "01-reconcile-uncertain-records.mdx"),
      "utf8"
    );
    const singleLineLesson = lesson.replace(/\s+/g, " ");
    for (const requiredConcept of [
      "Customer signal",
      "Record contract",
      "Canonical identifier",
      "Confidence is evidence, not truth",
      "Lineage and provenance",
      "Quarantine",
      "Reconciliation",
      "Idempotent replay",
      "Operator-visible recovery",
      "Production acceptance",
    ]) {
      expect(lesson).toContain(requiredConcept);
    }
    expect(lesson).toContain("Optical Character Recognition (OCR)");
    expect(lesson).toContain("Enterprise Resource Planning (ERP)");
    expect(lesson).toContain("HarbourCare");
    expect(lesson).toContain("fictional");
    expect(singleLineLesson).toMatch(/never silently (?:coerce|replace|correct)/i);
    expect(singleLineLesson).toMatch(/reason code.*evidence|evidence.*reason code/i);
    expect(singleLineLesson).toMatch(/accepted.*quarantined.*rejected/i);
    expect(singleLineLesson).toMatch(/same batch.*no duplicate/i);
    expect(singleLineLesson).toMatch(/data-quality proof.*does not.*production acceptance/i);
    expect(lesson).toContain("https://www.w3.org/TR/prov-overview/");
    expect(lesson).toContain("https://www.w3.org/TR/vocab-dqv/");
  });

  it("adds a balanced scenario-led check for confidence, quarantine, reconciliation, and replay trade-offs", () => {
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
      expect(question.question).toContain("HarbourCare");
      expect(question.options).toHaveLength(4);
      expect(question.correctAnswer).toBeGreaterThanOrEqual(0);
      expect(question.correctAnswer).toBeLessThan(question.options.length);
      expect(question.explanation.length).toBeGreaterThan(70);
      expect(
        (question as typeof question & { relatedLessonId?: string }).relatedLessonId
      ).toBe("01-reconcile-uncertain-records");

      const optionLengths = question.options.map((option) => option.length);
      expect(Math.max(...optionLengths) - Math.min(...optionLengths)).toBeLessThan(100);
    }
    const correctIsLongest = (quiz?.questions ?? []).filter((question) => {
      const lengths = question.options.map((option) => option.length);
      return lengths[question.correctAnswer] === Math.max(...lengths);
    });
    expect(correctIsLongest.length).toBeGreaterThanOrEqual(2);
    expect(correctIsLongest.length).toBeLessThanOrEqual(4);

    const quizText = JSON.stringify(quiz);
    expect(quizText).toMatch(/record contract|canonical identifier/i);
    expect(quizText).toMatch(/confidence|quarantine/i);
    expect(quizText).toMatch(/lineage|provenance/i);
    expect(quizText).toMatch(/reconcil/i);
    expect(quizText).toMatch(/idempoten|replay|duplicate batch/i);
    expect(quizText).toMatch(/production acceptance/i);
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
