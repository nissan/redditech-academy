import fs from "fs";
import path from "path";

import { describe, expect, it } from "vitest";

import { generateStaticParams as generateCourseParams } from "../app/courses/[courseSlug]/page";
import { generateStaticParams as generateModuleParams } from "../app/courses/[courseSlug]/learn/[moduleSlug]/page";
import { generateStaticParams as generateLessonParams } from "../app/courses/[courseSlug]/learn/[moduleSlug]/[lessonSlug]/page";
import { getCourseMetadata } from "../lib/courses";
import { getModuleMetadata, getModuleSlugs } from "../lib/content";
import { buildCourseInventoryReport } from "../scripts/course-inventory-report.mjs";

const COURSE_SLUG = "forward-deployed-ai-engineering";
const COURSE_DIR = path.join(process.cwd(), "content", "courses", COURSE_SLUG);
const EXPECTED_MODULES = [
  "00-fde-operating-model-and-discovery",
  "01-enterprise-identity-and-isolation",
  "02-private-and-disconnected-deployment",
  "03-legacy-data-ingestion-and-reconciliation",
  "04-authorisation-aware-retrieval",
  "05-safe-tools-and-legacy-integration",
  "06-sensitive-data-guardrails-and-audit",
  "07-durable-human-approval",
  "08-local-and-edge-inference",
  "09-observability-and-customer-health",
  "10-customer-specific-evaluation",
  "11-handoff-self-service-and-resilience",
];

describe("Forward Deployed AI Engineering B1 scaffold", () => {
  it("keeps review-only course metadata explicit and original", () => {
    const course = getCourseMetadata(COURSE_SLUG);

    expect(course).toMatchObject({
      id: COURSE_SLUG,
      slug: COURSE_SLUG,
      difficulty: "advanced",
      estimatedHours: 120,
      duration:
        "12–14 weeks at 8–10 hours per week; six-week accelerated format for experienced platform engineers",
      free: false,
      comingSoon: true,
      accessStatus: "catalog-metadata-only",
      learningApproach: "whole-game",
    });
    expect(course?.prerequisites).toHaveLength(3);
    expect(course?.learningObjectives).toHaveLength(5);
    expect(course?.attribution).toBe(
      "Inspired by Suraj Sharma's 12-stage Forward Deployed Engineering roadmap; curriculum, labs, examples, and assessments are original Redditech Academy material."
    );
    expect(course?.disclaimer).toContain("not endorsed");
    expect(course?.disclaimer).toContain(
      "not confer accreditation or formal certification"
    );
    expect(course?.disclaimer).toContain("synthetic");
    expect(course?.disclaimer).toContain(
      "no paid API or production credential"
    );
  });

  it("preserves the approved zero-padded order, objectives, duration, and prerequisite chain", () => {
    expect(getModuleSlugs(COURSE_SLUG)).toEqual(EXPECTED_MODULES);

    const modules = EXPECTED_MODULES.map((slug) =>
      getModuleMetadata(COURSE_SLUG, slug)
    );
    expect(modules.every(Boolean)).toBe(true);
    expect(modules.map((module) => module!.order)).toEqual(
      Array.from({ length: 12 }, (_, index) => index)
    );
    expect(
      modules.reduce((sum, module) => sum + module!.estimatedHours, 0)
    ).toBe(120);
    for (const [index, module] of modules.entries()) {
      expect(module!.id).toBe(EXPECTED_MODULES[index]);
      expect(module!.slug).toBe(EXPECTED_MODULES[index]);
      expect(module!.learningObjectives).toHaveLength(3);
      expect(module!.prerequisiteModules).toEqual(
        index === 0 ? [] : [EXPECTED_MODULES[index - 1]]
      );
    }
  });

  it("preserves the scaffold while later slices add bounded content", () => {
    const report = buildCourseInventoryReport();
    const course = report.courses.find(
      (candidate) => candidate.slug === COURSE_SLUG
    );

    expect(course).toMatchObject({
      catalogAccessStatus: "catalog-metadata-only",
      counts: {
        modules: 12,
        lessons: 2,
        quizzes: 1,
        challenges: 1,
        downloads: 4,
        interactiveLessons: 1,
      },
    });
    expect(course?.issues.inconsistentFrontmatter).toEqual([]);
    expect(course?.issues.brokenReferences).toEqual([]);
    expect(course?.issues.missingQuizzes).toHaveLength(11);
    expect(fs.readdirSync(path.join(COURSE_DIR, "challenges"))).toEqual([
      "fde-00-discovery-mission.json",
    ]);
  });

  it("generates the course, twelve module routes, and only the current bounded lesson route", async () => {
    const courseParams = await generateCourseParams();
    const moduleParams = await generateModuleParams();
    const lessonParams = await generateLessonParams();

    expect(courseParams).toContainEqual({ courseSlug: COURSE_SLUG });
    expect(
      moduleParams.filter((param) => param.courseSlug === COURSE_SLUG)
    ).toEqual(
      EXPECTED_MODULES.map((moduleSlug) => ({
        courseSlug: COURSE_SLUG,
        moduleSlug,
      }))
    );
    expect(
      lessonParams.filter((param) => param.courseSlug === COURSE_SLUG)
    ).toEqual([
      {
        courseSlug: COURSE_SLUG,
        moduleSlug: EXPECTED_MODULES[0],
        lessonSlug: "01-discovery-before-delivery",
      },
      {
        courseSlug: COURSE_SLUG,
        moduleSlug: EXPECTED_MODULES[0],
        lessonSlug: "02-bound-the-pilot-mission",
      },
    ]);
  });
});
