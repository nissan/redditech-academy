import fs from "fs";
import path from "path";

import { render, screen } from "@testing-library/react";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import HomePage from "../app/page";
import CourseOverviewPage from "../app/courses/[courseSlug]/page";
import ModuleOverviewPage from "../app/courses/[courseSlug]/learn/[moduleSlug]/page";
import LessonPage from "../app/courses/[courseSlug]/learn/[moduleSlug]/[lessonSlug]/page";
import { GET as getCourseStructure } from "../app/api/course-structure/route";
import { GET as getQuiz } from "../app/api/quiz/route";
import { getAllCourses } from "../lib/courses";
import { getCourseStructure as readCourseStructure } from "../lib/content";

const SMOKE_COURSE_SLUG = "auth-training";
const SMOKE_MODULE_SLUG = "00-executive-overview";
const SMOKE_INTERACTIVE_LESSON_SLUG = "00-module-briefing";
const SOLANA_COURSE_SLUG = "solana-academy";
const SOLANA_MODULE_SLUG = "00-solana-first-principles";
const SOLANA_INTERACTIVE_LESSON_SLUG = "01-mental-models-and-vocabulary";

function stubLocalStorage() {
  const store = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: vi.fn((key: string) => store.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store.set(key, value);
    }),
    removeItem: vi.fn((key: string) => {
      store.delete(key);
    }),
    clear: vi.fn(() => {
      store.clear();
    }),
  });
}

function requestFor(pathname: string) {
  return new NextRequest(`http://localhost${pathname}`);
}

describe("route smoke coverage", () => {
  beforeEach(() => {
    stubLocalStorage();
  });

  it("renders the home catalog with current free courses", () => {
    render(<HomePage />);

    const courses = getAllCourses();
    expect(courses.length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: "Available Courses" })).toBeTruthy();

    const visibleFreeCourses = courses.filter(
      (course) => course.free && !course.comingSoon
    );
    expect(visibleFreeCourses.length).toBeGreaterThan(0);

    for (const course of visibleFreeCourses.slice(0, 3)) {
      expect(screen.getByRole("heading", { name: course.title })).toBeTruthy();
    }

    expect(screen.getAllByText("Free").length).toBeGreaterThanOrEqual(
      visibleFreeCourses.length
    );
    const startableCourses = courses.filter((course) => !course.comingSoon);
    expect(screen.getAllByRole("link", { name: /Start Learning/ }).length).toBe(
      startableCourses.length
    );
  });

  it("renders a public free course route and its current access-state affordances", async () => {
    const course = getAllCourses().find(
      (candidate) => candidate.slug === SMOKE_COURSE_SLUG
    );
    const structure = readCourseStructure(SMOKE_COURSE_SLUG);
    expect(course?.free).toBe(true);
    expect(structure.modules.length).toBeGreaterThan(0);

    render(
      await CourseOverviewPage({
        params: Promise.resolve({ courseSlug: SMOKE_COURSE_SLUG }),
      })
    );

    expect(screen.getByRole("heading", { name: course!.title })).toBeTruthy();
    expect(screen.getAllByText("Free").length).toBeGreaterThan(0);
    expect(
      screen.getByRole("link", { name: /Start First Module/ })
    ).toHaveAttribute(
      "href",
      `/courses/${SMOKE_COURSE_SLUG}/learn/${SMOKE_MODULE_SLUG}`
    );
    expect(screen.getByRole("link", { name: "View Progress" })).toHaveAttribute(
      "href",
      `/courses/${SMOKE_COURSE_SLUG}/progress`
    );

    for (const mod of structure.modules.slice(0, 2)) {
      expect(screen.getByRole("heading", { name: mod.metadata.title })).toBeTruthy();
      expect(screen.getByText(mod.metadata.description)).toBeTruthy();
    }
  });

  it("renders Solana module and lesson mission path affordances", async () => {
    render(
      await ModuleOverviewPage({
        params: Promise.resolve({
          courseSlug: SOLANA_COURSE_SLUG,
          moduleSlug: SOLANA_MODULE_SLUG,
        }),
      })
    );

    expect(screen.getByText("Standard path")).toBeTruthy();
    expect(screen.getByText("Mission path")).toBeTruthy();
    expect(
      screen.getByRole("link", { name: /Start Mission Mode/ })
    ).toHaveAttribute(
      "href",
      `/courses/${SOLANA_COURSE_SLUG}/learn/${SOLANA_MODULE_SLUG}/${SOLANA_INTERACTIVE_LESSON_SLUG}/interactive`
    );

    render(
      await LessonPage({
        params: Promise.resolve({
          courseSlug: SOLANA_COURSE_SLUG,
          moduleSlug: SOLANA_MODULE_SLUG,
          lessonSlug: SOLANA_INTERACTIVE_LESSON_SLUG,
        }),
      })
    );

    expect(screen.getByText("Mission path available")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Open Mission →" })).toHaveAttribute(
      "href",
      `/courses/${SOLANA_COURSE_SLUG}/learn/${SOLANA_MODULE_SLUG}/${SOLANA_INTERACTIVE_LESSON_SLUG}/interactive`
    );
  });

  it("keeps mission path affordances scoped to Solana", async () => {
    render(
      await ModuleOverviewPage({
        params: Promise.resolve({
          courseSlug: SMOKE_COURSE_SLUG,
          moduleSlug: SMOKE_MODULE_SLUG,
        }),
      })
    );

    expect(screen.queryByText("Mission path")).toBeNull();
    expect(screen.queryByRole("link", { name: /Start Mission Mode/ })).toBeNull();

    render(
      await LessonPage({
        params: Promise.resolve({
          courseSlug: SMOKE_COURSE_SLUG,
          moduleSlug: SMOKE_MODULE_SLUG,
          lessonSlug: SMOKE_INTERACTIVE_LESSON_SLUG,
        }),
      })
    );

    expect(screen.queryByText("Mission path available")).toBeNull();
    expect(screen.queryByRole("link", { name: "Open Mission →" })).toBeNull();
  });

  it("documents absent auth and request-access route targets on the current branch", () => {
    const routeTargets = [
      "app/login/page.tsx",
      "app/request-access/page.tsx",
      "app/api/auth/route.ts",
      "app/api/request-access/route.ts",
    ];

    for (const routeTarget of routeTargets) {
      expect(fs.existsSync(path.join(process.cwd(), routeTarget))).toBe(false);
    }
  });
});

describe("API route smoke coverage", () => {
  it("returns course structure for an existing course and rejects missing/unknown slugs", async () => {
    const okResponse = await getCourseStructure(
      requestFor(`/api/course-structure?courseSlug=${SMOKE_COURSE_SLUG}`)
    );
    expect(okResponse.status).toBe(200);

    const okBody = await okResponse.json();
    expect(okBody).toMatchObject({
      title: "Auth & Identity Mastery",
      totalLessons: expect.any(Number),
      modules: expect.arrayContaining([
        expect.objectContaining({
          slug: SMOKE_MODULE_SLUG,
          title: "Executive Overview: Identity & Access Management",
          lessonCount: expect.any(Number),
        }),
      ]),
    });

    const missingResponse = await getCourseStructure(
      requestFor("/api/course-structure")
    );
    expect(missingResponse.status).toBe(400);
    await expect(missingResponse.json()).resolves.toEqual({
      error: "Missing courseSlug",
    });

    const unknownResponse = await getCourseStructure(
      requestFor("/api/course-structure?courseSlug=missing-course")
    );
    expect(unknownResponse.status).toBe(404);
  });

  it("returns quiz metadata for an existing module and rejects missing/unknown params", async () => {
    const okResponse = await getQuiz(
      requestFor(
        `/api/quiz?courseSlug=${SMOKE_COURSE_SLUG}&moduleSlug=${SMOKE_MODULE_SLUG}`
      )
    );
    expect(okResponse.status).toBe(200);

    const okBody = await okResponse.json();
    expect(okBody).toMatchObject({
      passingScore: 70,
      moduleTitle: "Executive Overview: Identity & Access Management",
      moduleId: SMOKE_MODULE_SLUG,
      badgeName: "IAM Strategist",
    });
    expect(okBody.questions.length).toBeGreaterThan(0);
    expect(okBody.questions[0]).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        question: expect.any(String),
        options: expect.any(Array),
        correctAnswer: expect.any(Number),
      })
    );

    const missingResponse = await getQuiz(requestFor("/api/quiz"));
    expect(missingResponse.status).toBe(400);
    await expect(missingResponse.json()).resolves.toEqual({
      error: "Missing params",
    });

    const unknownResponse = await getQuiz(
      requestFor(
        `/api/quiz?courseSlug=${SMOKE_COURSE_SLUG}&moduleSlug=missing-module`
      )
    );
    expect(unknownResponse.status).toBe(404);
  });
});
