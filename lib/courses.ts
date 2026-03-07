import fs from "fs";
import path from "path";
import type { CourseMetadata } from "./content-types";

const COURSES_DIR = path.join(process.cwd(), "content", "courses");

export function getCourseSlugs(): string[] {
  try {
    if (!fs.existsSync(COURSES_DIR)) {
      return [];
    }
    return fs
      .readdirSync(COURSES_DIR)
      .filter((file) => {
        const filePath = path.join(COURSES_DIR, file);
        return fs.statSync(filePath).isDirectory();
      })
      .sort();
  } catch (error) {
    console.error("Error reading course slugs:", error);
    return [];
  }
}

export function getCourseMetadata(courseSlug: string): CourseMetadata | null {
  try {
    const coursePath = path.join(COURSES_DIR, courseSlug, "course.json");
    if (!fs.existsSync(coursePath)) {
      return null;
    }
    const content = fs.readFileSync(coursePath, "utf8");
    return JSON.parse(content) as CourseMetadata;
  } catch (error) {
    console.error(`Error reading course metadata for ${courseSlug}:`, error);
    return null;
  }
}

export function getAllCourses(): CourseMetadata[] {
  const slugs = getCourseSlugs();
  return slugs
    .map((slug) => getCourseMetadata(slug))
    .filter((c): c is CourseMetadata => c !== null);
}
