import fs from "fs";
import path from "path";
import matter from "gray-matter";
import type {
  Module,
  ModuleMetadata,
  QuizMetadata,
  Lesson,
  LessonFrontmatter,
  CourseStructure,
} from "./content-types";

const COURSES_DIR = path.join(process.cwd(), "content", "courses");

function getModulesDir(courseSlug: string): string {
  return path.join(COURSES_DIR, courseSlug, "modules");
}

export function getModuleSlugs(courseSlug: string): string[] {
  try {
    const modulesDir = getModulesDir(courseSlug);
    if (!fs.existsSync(modulesDir)) {
      return [];
    }
    return fs
      .readdirSync(modulesDir)
      .filter((file) => {
        const filePath = path.join(modulesDir, file);
        return fs.statSync(filePath).isDirectory();
      })
      .sort();
  } catch (error) {
    console.error(`Error reading module slugs for ${courseSlug}:`, error);
    return [];
  }
}

export function getModuleMetadata(
  courseSlug: string,
  moduleSlug: string
): ModuleMetadata | null {
  try {
    const modulePath = path.join(
      getModulesDir(courseSlug),
      moduleSlug,
      "module.json"
    );
    if (!fs.existsSync(modulePath)) {
      return null;
    }
    const content = fs.readFileSync(modulePath, "utf8");
    return JSON.parse(content) as ModuleMetadata;
  } catch (error) {
    console.error(
      `Error reading module metadata for ${courseSlug}/${moduleSlug}:`,
      error
    );
    return null;
  }
}

export function getModuleQuiz(
  courseSlug: string,
  moduleSlug: string
): QuizMetadata | null {
  try {
    const quizPath = path.join(
      getModulesDir(courseSlug),
      moduleSlug,
      "quiz.json"
    );
    if (!fs.existsSync(quizPath)) {
      return null;
    }
    const content = fs.readFileSync(quizPath, "utf8");
    return JSON.parse(content) as QuizMetadata;
  } catch (error) {
    console.error(`Error reading quiz for ${courseSlug}/${moduleSlug}:`, error);
    return null;
  }
}

export function getLessonSlugs(
  courseSlug: string,
  moduleSlug: string
): string[] {
  try {
    const lessonsDir = path.join(
      getModulesDir(courseSlug),
      moduleSlug,
      "lessons"
    );
    if (!fs.existsSync(lessonsDir)) {
      return [];
    }
    return fs
      .readdirSync(lessonsDir)
      .filter((file) => file.endsWith(".mdx"))
      .map((file) => file.replace(/\.mdx$/, ""))
      .sort();
  } catch (error) {
    console.error(
      `Error reading lesson slugs for ${courseSlug}/${moduleSlug}:`,
      error
    );
    return [];
  }
}

export function getLesson(
  courseSlug: string,
  moduleSlug: string,
  lessonSlug: string
): Lesson | null {
  try {
    const lessonPath = path.join(
      getModulesDir(courseSlug),
      moduleSlug,
      "lessons",
      `${lessonSlug}.mdx`
    );
    if (!fs.existsSync(lessonPath)) {
      return null;
    }

    const fileContents = fs.readFileSync(lessonPath, "utf8");
    const { data, content } = matter(fileContents);

    return {
      slug: lessonSlug,
      moduleSlug,
      frontmatter: data as LessonFrontmatter,
      content,
    };
  } catch (error) {
    console.error(
      `Error reading lesson ${courseSlug}/${moduleSlug}/${lessonSlug}:`,
      error
    );
    return null;
  }
}

export function getModuleLessons(
  courseSlug: string,
  moduleSlug: string
): Lesson[] {
  const lessonSlugs = getLessonSlugs(courseSlug, moduleSlug);
  return lessonSlugs
    .map((slug) => getLesson(courseSlug, moduleSlug, slug))
    .filter((lesson): lesson is Lesson => lesson !== null);
}

export function getModule(
  courseSlug: string,
  moduleSlug: string
): Module | null {
  const metadata = getModuleMetadata(courseSlug, moduleSlug);
  if (!metadata) {
    return null;
  }

  const lessons = getModuleLessons(courseSlug, moduleSlug);
  const quiz = getModuleQuiz(courseSlug, moduleSlug);

  if (!quiz) {
    console.warn(`No quiz found for module ${courseSlug}/${moduleSlug}`);
  }

  return {
    metadata,
    lessons,
    quiz: quiz || { passingScore: 70, questions: [] },
  };
}

export function getAllModules(courseSlug: string): Module[] {
  const moduleSlugs = getModuleSlugs(courseSlug);
  return moduleSlugs
    .map((slug) => getModule(courseSlug, slug))
    .filter((module): module is Module => module !== null);
}

export function getCourseStructure(courseSlug: string): CourseStructure {
  const modules = getAllModules(courseSlug);
  const totalLessons = modules.reduce(
    (sum, module) => sum + module.lessons.length,
    0
  );
  const totalHours = modules.reduce(
    (sum, module) => sum + module.metadata.estimatedHours,
    0
  );
  return { modules, totalLessons, totalHours };
}

export function getNextLesson(
  courseSlug: string,
  currentModuleSlug: string,
  currentLessonSlug: string
): { moduleSlug: string; lessonSlug: string } | null {
  const modules = getAllModules(courseSlug);
  const currentModuleIndex = modules.findIndex(
    (m) => m.metadata.slug === currentModuleSlug
  );

  if (currentModuleIndex === -1) return null;

  const currentModule = modules[currentModuleIndex];
  const currentLessonIndex = currentModule.lessons.findIndex(
    (l) => l.slug === currentLessonSlug
  );

  if (currentLessonIndex === -1) return null;

  if (currentLessonIndex < currentModule.lessons.length - 1) {
    return {
      moduleSlug: currentModuleSlug,
      lessonSlug: currentModule.lessons[currentLessonIndex + 1].slug,
    };
  }

  return null;
}

export function getPreviousLesson(
  courseSlug: string,
  currentModuleSlug: string,
  currentLessonSlug: string
): { moduleSlug: string; lessonSlug: string } | null {
  const modules = getAllModules(courseSlug);
  const currentModuleIndex = modules.findIndex(
    (m) => m.metadata.slug === currentModuleSlug
  );

  if (currentModuleIndex === -1) return null;

  const currentModule = modules[currentModuleIndex];
  const currentLessonIndex = currentModule.lessons.findIndex(
    (l) => l.slug === currentLessonSlug
  );

  if (currentLessonIndex === -1) return null;

  if (currentLessonIndex > 0) {
    return {
      moduleSlug: currentModuleSlug,
      lessonSlug: currentModule.lessons[currentLessonIndex - 1].slug,
    };
  }

  if (currentModuleIndex > 0) {
    const previousModule = modules[currentModuleIndex - 1];
    if (previousModule.lessons.length > 0) {
      return {
        moduleSlug: previousModule.metadata.slug,
        lessonSlug:
          previousModule.lessons[previousModule.lessons.length - 1].slug,
      };
    }
  }

  return null;
}
