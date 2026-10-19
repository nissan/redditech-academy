import fs from "fs";
import path from "path";

import { describe, expect, it } from "vitest";

import { getModule, getModuleQuiz } from "../lib/content";
import { buildCourseInventoryReport } from "../scripts/course-inventory-report.mjs";

const COURSE_SLUG = "forward-deployed-ai-engineering";
const MODULE_SLUG = "01-enterprise-identity-and-isolation";
const MODULE_DIR = path.join(
  process.cwd(),
  "content",
  "courses",
  COURSE_SLUG,
  "modules",
  MODULE_SLUG
);

describe("Forward Deployed AI Engineering C1a identity and isolation concepts", () => {
  it("adds one standard customer-signal lesson with explicit identity and policy boundaries", () => {
    const module = getModule(COURSE_SLUG, MODULE_SLUG);

    expect(module?.lessons).toHaveLength(2);
    const conceptLesson = module?.lessons.find((lesson) => lesson.frontmatter.slug === "01-identity-is-not-authority");
    expect(conceptLesson?.frontmatter).toMatchObject({
      slug: "01-identity-is-not-authority",
      order: 1,
      type: "standard",
      duration: 40,
    });
    expect(conceptLesson?.frontmatter.keyTakeaways).toHaveLength(4);

    const lesson = fs.readFileSync(
      path.join(MODULE_DIR, "lessons", "01-identity-is-not-authority.mdx"),
      "utf8"
    );
    const singleLineLesson = lesson.replace(/\s+/g, " ");
    for (const requiredConcept of [
      "Customer signal",
      "Authentication",
      "Provisioning and deprovisioning",
      "Authorisation",
      "Policy enforcement",
      "Tenant",
      "Role",
      "Document",
      "Action",
      "Policy before context",
      "Audit evidence",
    ]) {
      expect(lesson).toContain(requiredConcept);
    }
    expect(lesson).toContain("HarbourCare");
    expect(lesson).toContain("fictional");
    expect(lesson).toMatch(/cross-(tenant|business-unit)/i);
    expect(singleLineLesson).toMatch(/den(?:y|ied).*before.*(?:context|tool)/i);
    expect(singleLineLesson).toMatch(/deprovision.*(?:session|token|group|access)/i);
    expect(singleLineLesson).toMatch(/metadata.*no restricted content.*raw credential/i);
    expect(lesson).toContain("https://csrc.nist.gov/pubs/sp/800/63/4/final");
    expect(lesson).toContain("https://csrc.nist.gov/pubs/sp/800/207/final");
  });

  it("adds a scenario-led knowledge check for identity lifecycle and pre-context denial", () => {
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
    for (const question of quiz?.questions ?? []) {
      expect(question.options).toHaveLength(4);
      expect(question.correctAnswer).toBeGreaterThanOrEqual(0);
      expect(question.correctAnswer).toBeLessThan(question.options.length);
      expect(question.explanation.length).toBeGreaterThan(50);
      expect(
        (question as typeof question & { relatedLessonId?: string }).relatedLessonId
      ).toBe("01-identity-is-not-authority");
    }
    expect(
      quiz?.questions.filter((question) => question.question.includes("HarbourCare"))
    ).toHaveLength(6);
    expect(JSON.stringify(quiz)).toMatch(/authentication/i);
    expect(JSON.stringify(quiz)).toMatch(/deprovision/i);
    expect(JSON.stringify(quiz)).toMatch(/before (?:retrieval|context|tool)/i);
    expect(JSON.stringify(quiz)).toMatch(/audit/i);
  });

  it("preserves the C1a concepts in the cumulative C1b inventory", () => {
    const course = buildCourseInventoryReport().courses.find(
      (candidate) => candidate.slug === COURSE_SLUG
    );

    expect(course?.counts).toMatchObject({
      modules: 12,
      lessons: 8,
      quizzes: 4,
      challenges: 4,
      downloads: 8,
      interactiveLessons: 4,
    });
    expect(course?.issues.inconsistentFrontmatter).toEqual([]);
    expect(course?.issues.brokenReferences).toEqual([]);
    expect(course?.issues.missingQuizzes).toHaveLength(8);
  });
});
