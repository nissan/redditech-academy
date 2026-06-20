import fs from "fs";
import path from "path";
import matter from "gray-matter";

const ISSUE_EXPECTED_SLUGS = [
  "agentic-ai-systems-engineering",
  "auth-training",
  "board-game-tutorial-academy",
  "churn-modeling-academy",
  "genai-ml-academy",
  "llm-benchmarking-academy",
  "martech-adtech-academy",
  "openclaw-academy",
  "python-interview-prep",
  "sales-spin-meddic",
  "solana-academy",
];

const ROOT = process.cwd();
const CONTENT_DIR = path.join(ROOT, "content", "courses");
const PUBLIC_COURSE_ASSETS_DIR = path.join(ROOT, "public", "assets", "courses");
const REPORTS_DIR = path.join(ROOT, "reports");
const REPORT_JSON = path.join(REPORTS_DIR, "course-inventory-quality-report.json");
const REPORT_MD = path.join(REPORTS_DIR, "course-inventory-quality-report.md");

const REQUIRED_COURSE_FIELDS = [
  "id",
  "slug",
  "title",
  "description",
  "tagline",
  "difficulty",
  "estimatedHours",
  "tags",
  "badge",
  "author",
  "version",
];

const REQUIRED_MODULE_FIELDS = [
  "id",
  "slug",
  "order",
  "title",
  "description",
  "difficulty",
  "estimatedHours",
  "badge",
  "learningObjectives",
];

const REQUIRED_LESSON_FIELDS = ["title", "description", "slug", "duration", "order"];
const URL_RE = /https?:\/\/[^\s)"'<>]+/g;
const MARKDOWN_LINK_RE = /!?\[[^\]]*]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;

function listDirs(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function listFiles(dir, predicate = () => true) {
  if (!fs.existsSync(dir)) return [];
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...listFiles(fullPath, predicate));
    } else if (predicate(fullPath)) {
      results.push(fullPath);
    }
  }
  return results.sort();
}

function readJson(filePath, issues, issueContext) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    issues.push(`${issueContext}: invalid JSON (${error.message})`);
    return null;
  }
}

function rel(filePath) {
  return path.relative(ROOT, filePath).replaceAll(path.sep, "/");
}

function missingFields(object, fields) {
  if (!object) return fields;
  return fields.filter((field) => object[field] === undefined || object[field] === "");
}

function firstMeaningfulMarkdown(content) {
  return content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("import ") && !line.startsWith("export "));
}

function collectUrls(text) {
  return [...new Set(text.match(URL_RE) ?? [])].sort();
}

function collectMarkdownLinks(text) {
  const links = [];
  for (const match of text.matchAll(MARKDOWN_LINK_RE)) {
    links.push(match[1]);
  }
  return [...new Set(links)].sort();
}

function publicAssetExists(assetPath) {
  const normalized = assetPath.split("#")[0].split("?")[0];
  if (!normalized.startsWith("/assets/")) return true;
  return fs.existsSync(path.join(ROOT, "public", normalized));
}

function summarizeAssets(courseSlug, subdir, predicate = () => true) {
  return listFiles(path.join(PUBLIC_COURSE_ASSETS_DIR, courseSlug, subdir), predicate);
}

function inventoryCourse(courseSlug) {
  const courseDir = path.join(CONTENT_DIR, courseSlug);
  const courseIssues = {
    missingQuizzes: [],
    brokenReferences: [],
    emptyLessons: [],
    inconsistentFrontmatter: [],
    wholeGameGaps: [],
  };
  const courseJsonPath = path.join(courseDir, "course.json");
  const course = readJson(courseJsonPath, courseIssues.inconsistentFrontmatter, `${rel(courseJsonPath)}`) ?? {};
  const missingCourseFields = missingFields(course, REQUIRED_COURSE_FIELDS);
  if (missingCourseFields.length > 0) {
    courseIssues.inconsistentFrontmatter.push(
      `${rel(courseJsonPath)} missing fields: ${missingCourseFields.join(", ")}`
    );
  }
  if (course.slug && course.slug !== courseSlug) {
    courseIssues.inconsistentFrontmatter.push(
      `${rel(courseJsonPath)} slug "${course.slug}" does not match folder "${courseSlug}"`
    );
  }

  const moduleSlugs = listDirs(path.join(courseDir, "modules"));
  const challengeFiles = listFiles(path.join(courseDir, "challenges"), (file) => file.endsWith(".json"));
  const challengeIds = new Set(challengeFiles.map((file) => path.basename(file, ".json")));
  const externalDependencies = new Set();
  const referencedLocalAssets = new Set();
  let lessonCount = 0;
  let quizCount = 0;
  let mermaidBlockCount = 0;
  let interactiveLessonCount = 0;
  let wholeGameLessonSignals = 0;
  let capstoneSignals = courseSlug.includes("capstone") || String(course.title ?? "").toLowerCase().includes("capstone") ? 1 : 0;

  for (const moduleSlug of moduleSlugs) {
    const moduleDir = path.join(courseDir, "modules", moduleSlug);
    const moduleJsonPath = path.join(moduleDir, "module.json");
    const moduleMetadata = readJson(
      moduleJsonPath,
      courseIssues.inconsistentFrontmatter,
      `${rel(moduleJsonPath)}`
    );
    const missingModuleFields = missingFields(moduleMetadata, REQUIRED_MODULE_FIELDS);
    if (missingModuleFields.length > 0) {
      courseIssues.inconsistentFrontmatter.push(
        `${rel(moduleJsonPath)} missing fields: ${missingModuleFields.join(", ")}`
      );
    }
    if (moduleMetadata?.slug && moduleMetadata.slug !== moduleSlug) {
      courseIssues.inconsistentFrontmatter.push(
        `${rel(moduleJsonPath)} slug "${moduleMetadata.slug}" does not match folder "${moduleSlug}"`
      );
    }
    if (moduleSlug.toLowerCase().includes("capstone") || String(moduleMetadata?.title ?? "").toLowerCase().includes("capstone")) {
      capstoneSignals += 1;
    }

    const quizPath = path.join(moduleDir, "quiz.json");
    if (!fs.existsSync(quizPath)) {
      courseIssues.missingQuizzes.push(`${courseSlug}/${moduleSlug}`);
    } else {
      quizCount += 1;
      const quiz = readJson(quizPath, courseIssues.inconsistentFrontmatter, `${rel(quizPath)}`);
      if (!Array.isArray(quiz?.questions) || quiz.questions.length === 0) {
        courseIssues.missingQuizzes.push(`${courseSlug}/${moduleSlug} has empty quiz questions`);
      }
    }

    const lessonFiles = listFiles(path.join(moduleDir, "lessons"), (file) => file.endsWith(".mdx"));
    if (lessonFiles.length === 0) {
      courseIssues.emptyLessons.push(`${courseSlug}/${moduleSlug} has no lesson files`);
    }
    for (const lessonFile of lessonFiles) {
      lessonCount += 1;
      const raw = fs.readFileSync(lessonFile, "utf8");
      const parsed = matter(raw);
      const frontmatter = parsed.data ?? {};
      const lessonSlug = path.basename(lessonFile, ".mdx");
      const meaningfulLines = firstMeaningfulMarkdown(parsed.content);

      if (meaningfulLines.join("\n").length < 80) {
        courseIssues.emptyLessons.push(rel(lessonFile));
      }

      const missingLessonFields = missingFields(frontmatter, REQUIRED_LESSON_FIELDS);
      if (missingLessonFields.length > 0) {
        courseIssues.inconsistentFrontmatter.push(
          `${rel(lessonFile)} missing frontmatter: ${missingLessonFields.join(", ")}`
        );
      }
      if (frontmatter.slug && frontmatter.slug !== lessonSlug) {
        courseIssues.inconsistentFrontmatter.push(
          `${rel(lessonFile)} slug "${frontmatter.slug}" does not match filename "${lessonSlug}"`
        );
      }
      if (frontmatter.challengeid && !frontmatter.challengeId) {
        courseIssues.inconsistentFrontmatter.push(
          `${rel(lessonFile)} uses non-canonical challengeid; prefer challengeId`
        );
      }

      const challengeId = frontmatter.challengeId ?? frontmatter.challengeid;
      if (frontmatter.type === "interactive") {
        interactiveLessonCount += 1;
        if (!challengeId) {
          courseIssues.brokenReferences.push(`${rel(lessonFile)} interactive lesson missing challengeId`);
        }
      }
      if (challengeId && !challengeIds.has(challengeId)) {
        courseIssues.brokenReferences.push(`${rel(lessonFile)} references missing challenge ${challengeId}`);
      }

      for (const url of collectUrls(raw)) externalDependencies.add(url);
      for (const link of collectMarkdownLinks(raw)) {
        if (link.startsWith("http://") || link.startsWith("https://")) {
          externalDependencies.add(link);
        } else if (link.startsWith("/assets/")) {
          referencedLocalAssets.add(link);
          if (!publicAssetExists(link)) {
            courseIssues.brokenReferences.push(`${rel(lessonFile)} references missing asset ${link}`);
          }
        }
      }

      mermaidBlockCount += (raw.match(/```mermaid/g) ?? []).length;
      if (/Your Running Project|The Game|whole[- ]game|capstone/i.test(raw)) {
        wholeGameLessonSignals += 1;
      }
    }
  }

  const diagramFiles = summarizeAssets(courseSlug, "diagrams", (file) => /\.(png|svg)$/i.test(file));
  const downloadFiles = [
    ...summarizeAssets(courseSlug, "downloads"),
    ...listFiles(path.join(courseDir, "downloads")),
  ];
  const videoFiles = summarizeAssets(courseSlug, "videos", (file) => /\.(mp4|webm|mov|m4v)$/i.test(file));

  if (course.learningApproach !== "whole-game") {
    courseIssues.wholeGameGaps.push("course.json missing learningApproach: whole-game");
  }
  if (wholeGameLessonSignals < moduleSlugs.length) {
    courseIssues.wholeGameGaps.push(
      `${moduleSlugs.length - wholeGameLessonSignals} modules/lessons lack an obvious running-project or game signal`
    );
  }
  if (capstoneSignals === 0) {
    courseIssues.wholeGameGaps.push("no capstone signal found in course/module titles or slugs");
  }

  return {
    slug: courseSlug,
    title: course.title ?? courseSlug,
    protectedOrFreeStatus: course.free === true ? "free" : "protected",
    counts: {
      modules: moduleSlugs.length,
      lessons: lessonCount,
      quizzes: quizCount,
      challenges: challengeFiles.length,
      diagrams: diagramFiles.length,
      inlineMermaidBlocks: mermaidBlockCount,
      downloads: downloadFiles.length,
      videos: videoFiles.length,
      externalDependencies: externalDependencies.size,
      referencedLocalAssets: referencedLocalAssets.size,
      interactiveLessons: interactiveLessonCount,
    },
    samples: {
      externalDependencies: [...externalDependencies].slice(0, 12),
      diagrams: diagramFiles.slice(0, 6).map(rel),
      downloads: downloadFiles.slice(0, 6).map(rel),
      videos: videoFiles.slice(0, 6).map(rel),
    },
    issues: courseIssues,
  };
}

export function buildCourseInventoryReport() {
  const actualSlugs = listDirs(CONTENT_DIR).filter((slug) =>
    fs.existsSync(path.join(CONTENT_DIR, slug, "course.json"))
  );
  const courses = actualSlugs.map(inventoryCourse);
  const totals = courses.reduce(
    (acc, course) => {
      for (const [key, value] of Object.entries(course.counts)) {
        acc[key] = (acc[key] ?? 0) + value;
      }
      return acc;
    },
    {}
  );

  const expectedSet = new Set(ISSUE_EXPECTED_SLUGS);
  const actualSet = new Set(actualSlugs);
  const missingExpectedSlugs = ISSUE_EXPECTED_SLUGS.filter((slug) => !actualSet.has(slug));
  const additionalActualSlugs = actualSlugs.filter((slug) => !expectedSet.has(slug));

  return {
    generatedAt: process.env.COURSE_INVENTORY_GENERATED_AT ?? "2026-06-20T00:00:00.000Z",
    issue: {
      number: 14,
      expectedSlugs: ISSUE_EXPECTED_SLUGS,
      missingExpectedSlugs,
      additionalActualSlugs,
      actualSlugs,
    },
    totals,
    courses,
  };
}

function issueCount(course, key) {
  return course.issues[key].length;
}

export function renderMarkdownReport(report) {
  const lines = [
    "# Course Inventory And Quality Report",
    "",
    `Generated by \`pnpm content:inventory\` for GitHub issue #${report.issue.number}.`,
    "",
    "## Slug Coverage",
    "",
    `- Issue expected slugs: ${report.issue.expectedSlugs.length}`,
    `- Actual course folders with \`course.json\`: ${report.issue.actualSlugs.length}`,
    `- Missing from this repo branch: ${report.issue.missingExpectedSlugs.length > 0 ? report.issue.missingExpectedSlugs.map((slug) => `\`${slug}\``).join(", ") : "none"}`,
    `- Additional actual slugs not named in issue: ${report.issue.additionalActualSlugs.length > 0 ? report.issue.additionalActualSlugs.map((slug) => `\`${slug}\``).join(", ") : "none"}`,
    "",
    "The issue lists eleven course slugs, but the current `origin/main` content tree contains nine. This report inventories the actual tree and records the difference instead of creating or editing course content.",
    "",
    "## Totals",
    "",
    "| Modules | Lessons | Quizzes | Challenges | Diagrams | Mermaid blocks | Downloads | Videos | External deps |",
    "| ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |",
    `| ${report.totals.modules} | ${report.totals.lessons} | ${report.totals.quizzes} | ${report.totals.challenges} | ${report.totals.diagrams} | ${report.totals.inlineMermaidBlocks} | ${report.totals.downloads} | ${report.totals.videos} | ${report.totals.externalDependencies} |`,
    "",
    "## Course Inventory",
    "",
    "| Course | Status | Modules | Lessons | Quizzes | Challenges | Diagrams | Downloads | Videos | External deps | Quality flags |",
    "| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |",
  ];

  for (const course of report.courses) {
    const flags =
      issueCount(course, "missingQuizzes") +
      issueCount(course, "brokenReferences") +
      issueCount(course, "emptyLessons") +
      issueCount(course, "inconsistentFrontmatter") +
      issueCount(course, "wholeGameGaps");
    lines.push(
      `| \`${course.slug}\` | ${course.protectedOrFreeStatus} | ${course.counts.modules} | ${course.counts.lessons} | ${course.counts.quizzes} | ${course.counts.challenges} | ${course.counts.diagrams} | ${course.counts.downloads} | ${course.counts.videos} | ${course.counts.externalDependencies} | ${flags} |`
    );
  }

  lines.push("", "## Quality Flags", "");
  for (const course of report.courses) {
    lines.push(`### ${course.slug}`, "");
    for (const [label, values] of Object.entries(course.issues)) {
      lines.push(`- ${label}: ${values.length}`);
      for (const value of values.slice(0, 12)) {
        lines.push(`  - ${value}`);
      }
      if (values.length > 12) {
        lines.push(`  - ...and ${values.length - 12} more`);
      }
    }
    if (course.samples.externalDependencies.length > 0) {
      lines.push("- external dependency samples:");
      for (const value of course.samples.externalDependencies.slice(0, 5)) {
        lines.push(`  - ${value}`);
      }
    }
    lines.push("");
  }

  return `${lines.join("\n")}\n`;
}

function writeReport(report) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
  fs.writeFileSync(REPORT_JSON, `${JSON.stringify(report, null, 2)}\n`);
  fs.writeFileSync(REPORT_MD, renderMarkdownReport(report));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const report = buildCourseInventoryReport();
  if (process.argv.includes("--json")) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } else {
    writeReport(report);
    console.log(`Wrote ${rel(REPORT_MD)}`);
    console.log(`Wrote ${rel(REPORT_JSON)}`);
  }
}
