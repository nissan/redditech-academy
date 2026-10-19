import fs from "fs";
import path from "path";

import { describe, expect, it } from "vitest";

import { getModule, getModuleQuiz } from "../lib/content";
import { buildCourseInventoryReport } from "../scripts/course-inventory-report.mjs";

const COURSE_SLUG = "forward-deployed-ai-engineering";
const MODULE_SLUG = "00-fde-operating-model-and-discovery";
const MODULE_DIR = path.join(
  process.cwd(),
  "content",
  "courses",
  COURSE_SLUG,
  "modules",
  MODULE_SLUG
);

describe("Forward Deployed AI Engineering C0a discovery concepts", () => {
  it("adds one standard customer-signal lesson with inspectable discovery boundaries", () => {
    const module = getModule(COURSE_SLUG, MODULE_SLUG);

    expect(module?.lessons).toHaveLength(2);
    expect(module?.lessons[0].frontmatter).toMatchObject({
      slug: "01-discovery-before-delivery",
      order: 1,
      type: "standard",
      duration: 35,
    });
    expect(module?.lessons[0].frontmatter.keyTakeaways).toHaveLength(4);

    const lesson = fs.readFileSync(
      path.join(MODULE_DIR, "lessons", "01-discovery-before-delivery.mdx"),
      "utf8"
    );
    for (const requiredConcept of [
      "Customer signal",
      "Role boundary",
      "Stakeholder map",
      "Outcome contract",
      "Non-goals",
      "Residual risk",
    ]) {
      expect(lesson).toContain(requiredConcept);
    }
    expect(lesson).toContain("https://airc.nist.gov/airmf-resources/playbook/");
    expect(lesson).toContain("https://www.gov.uk/service-manual/agile-delivery/how-the-discovery-phase-works");
    expect(lesson).toContain("HarbourCare");
    expect(lesson).toContain("fictional");
    expect(lesson).not.toMatch(/production credential|paid API key/i);
  });

  it("adds a scenario-led knowledge check that assesses boundaries and outcomes", () => {
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
      expect(question.explanation.length).toBeGreaterThan(40);
    }
    expect(
      quiz?.questions.filter((question) => question.question.includes("HarbourCare"))
    ).toHaveLength(5);
  });

  it("preserves the concept slice in the cumulative module 0 inventory", () => {
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
