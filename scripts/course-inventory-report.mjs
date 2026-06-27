import fs from "fs";
import path from "path";
import matter from "gray-matter";

const ACTIVE_EXPECTED_SLUGS = [
  "auth-training",
  "churn-modeling-academy",
  "genai-ml-academy",
  "llm-benchmarking-academy",
  "martech-adtech-academy",
  "openclaw-academy",
  "python-interview-prep",
  "sales-spin-meddic",
  "solana-academy",
];

const ABSENT_COURSE_RECONCILIATION = [
  {
    slug: "agentic-ai-systems-engineering",
    status: "follow-up-required",
    finding:
      "Absent from origin/main, but prior workspace status and the feat/bdd-phase1-validators-and-genai-dryrun branch record implemented/deployed course content at commits 92bed9d and 4fe0740.",
    action:
      "Restore or intentionally retire this course in a dedicated implementation decision issue; do not count it as active in the current branch inventory until course content lands on main.",
  },
  {
    slug: "board-game-tutorial-academy",
    status: "not-active-in-current-branch",
    finding:
      "Absent from origin/main and no course-content history or source/design artifact was found in this repository for this slug.",
    action:
      "Treat as a historical planning reference only unless Nissan provides a source/design brief for a new course.",
  },
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
const COMPATIBILITY_BUCKETS = [
  "lowercaseChallengeId",
  "lessonSlugFilenameMismatch",
  "missingChallengeJsonType",
  "legacyTitleDescription",
  "legacyStarterCode",
  "legacyValidationRules",
  "missingVisibleSpec",
  "missingEffectiveJsonEditorSeed",
  "sequenceCorrectOrderIntegrity",
  "environmentCoverageGaps",
];
const WHOLE_GAME_MARKERS = [
  "theGame",
  "yourRunningProject",
  "hardPartLanguage",
  "transferAdversarialFraming",
  "soloAiPrompts",
  "caseStudySourceProvenance",
];
const WHOLE_GAME_MARKER_LABELS = {
  theGame: "The Game",
  yourRunningProject: "Your Running Project",
  hardPartLanguage: "hard-part language",
  transferAdversarialFraming: "transfer/adversarial framing",
  soloAiPrompts: "solo AI prompts",
  caseStudySourceProvenance: "case-study source/provenance",
};
const WHOLE_GAME_MARKER_PATTERNS = {
  theGame: /\bThe Game\b/i,
  yourRunningProject: /\bYour Running Project\b/i,
  hardPartLanguage: /\b(?:The\s+)?Hard Part\b|hard[- ]part/i,
  soloAiPrompts: /\bSolo AI Discussion Prompts\b/i,
};
const TRANSFER_ADVERSARIAL_RE = /\b(?:transfer|adversarial)\b/i;
const CASE_STUDY_RE = /\b(?:case study|Harvard-Style Case Study)\b/i;
const SOURCE_PROVENANCE_RE = /(?:^\s*\*\*Sources?:\*\*|^\s*#{1,6}\s+Sources?\b|\bprovenance\b)/im;

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

function createCompatibilityBuckets() {
  return Object.fromEntries(COMPATIBILITY_BUCKETS.map((bucket) => [bucket, []]));
}

function createWholeGameMarkers() {
  return Object.fromEntries(WHOLE_GAME_MARKERS.map((marker) => [marker, []]));
}

function pushBucket(buckets, bucket, filePath, detail) {
  buckets[bucket].push(detail ? `${rel(filePath)}: ${detail}` : rel(filePath));
}

function pushMarker(markers, marker, filePath) {
  markers[marker].push(rel(filePath));
}

function lessonMarkerSurface(raw, parsed) {
  const frontmatterSurface = Object.entries(parsed.data ?? {})
    .filter(([key]) => ["title", "description", "missionTitle"].includes(key))
    .map(([, value]) => String(value ?? ""))
    .join("\n");
  const headingSurface = parsed.content
    .split("\n")
    .filter((line) => /^#{1,6}\s/.test(line.trim()))
    .join("\n");
  return `${frontmatterSurface}\n${headingSurface}`;
}

function effectiveChallengeType(challenge) {
  if (challenge?.type) return challenge.type;
  if (Array.isArray(challenge?.prefilled?.steps) || Array.isArray(challenge?.prefilled?.correctOrder)) {
    return "sequence-completer";
  }
  if (challenge?.prefilled?.template !== undefined || challenge?.starterCode !== undefined) {
    return "json-editor";
  }
  return undefined;
}

function hasJsonEditorSeed(challenge) {
  return (
    typeof challenge?.prefilled?.template === "string" ||
    typeof challenge?.starterCode === "string"
  );
}

export function sequenceIntegrityIssue(challenge) {
  const correctOrder = challenge?.prefilled?.correctOrder;
  if (!Array.isArray(correctOrder) || correctOrder.length === 0) {
    return "missing prefilled.correctOrder";
  }
  const steps = challenge?.prefilled?.steps;
  if (!Array.isArray(steps) || steps.length === 0) {
    return "missing prefilled.steps";
  }
  if (steps.length !== correctOrder.length) {
    return `prefilled.steps length ${steps.length} does not match correctOrder length ${correctOrder.length}`;
  }
  const invalidSteps = steps
    .map((step, index) => ({ step, index }))
    .filter(({ step }) => !step?.id || !step?.label);
  if (invalidSteps.length > 0) {
    return `steps missing id or label at indexes: ${invalidSteps.map(({ index }) => index).join(", ")}`;
  }
  const duplicateIds = correctOrder.filter((id, index) => correctOrder.indexOf(id) !== index);
  if (duplicateIds.length > 0) {
    return `duplicate correctOrder ids: ${[...new Set(duplicateIds)].join(", ")}`;
  }
  const stepIds = new Set(steps.map((step) => step.id));
  const unknownIds = correctOrder.filter((id) => !stepIds.has(id));
  if (unknownIds.length > 0) {
    return `correctOrder references unknown step ids: ${unknownIds.join(", ")}`;
  }
  return null;
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
  const challengeById = new Map();
  const compatibilityBuckets = createCompatibilityBuckets();
  for (const challengeFile of challengeFiles) {
    const challenge = readJson(
      challengeFile,
      courseIssues.inconsistentFrontmatter,
      `${rel(challengeFile)}`
    );
    if (!challenge) continue;
    const challengeFilenameId = path.basename(challengeFile, ".json");
    const challengeId = challenge.id ?? challengeFilenameId;
    challengeById.set(challengeFilenameId, challenge);
    challengeById.set(challengeId, challenge);
    const type = effectiveChallengeType(challenge);
    if (!challenge.type) {
      pushBucket(compatibilityBuckets, "missingChallengeJsonType", challengeFile);
    }
    if (challenge.title !== undefined || challenge.description !== undefined) {
      pushBucket(compatibilityBuckets, "legacyTitleDescription", challengeFile);
    }
    if (challenge.starterCode !== undefined) {
      pushBucket(compatibilityBuckets, "legacyStarterCode", challengeFile);
    }
    if (challenge.validationRules !== undefined) {
      pushBucket(compatibilityBuckets, "legacyValidationRules", challengeFile);
    }
    if (typeof challenge.spec !== "string" || challenge.spec.trim() === "") {
      pushBucket(compatibilityBuckets, "missingVisibleSpec", challengeFile);
    }
    if (type === "json-editor" && !hasJsonEditorSeed(challenge)) {
      pushBucket(compatibilityBuckets, "missingEffectiveJsonEditorSeed", challengeFile);
    }
    if (type === "sequence-completer") {
      const issue = sequenceIntegrityIssue(challenge);
      if (issue) {
        pushBucket(compatibilityBuckets, "sequenceCorrectOrderIntegrity", challengeFile, issue);
      }
    }
  }
  const externalDependencies = new Set();
  const referencedLocalAssets = new Set();
  let lessonCount = 0;
  let quizCount = 0;
  let mermaidBlockCount = 0;
  let interactiveLessonCount = 0;
  let wholeGameLessonSignals = 0;
  let capstoneSignals = courseSlug.includes("capstone") || String(course.title ?? "").toLowerCase().includes("capstone") ? 1 : 0;
  const wholeGameMarkers = createWholeGameMarkers();

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
        pushBucket(
          compatibilityBuckets,
          "lessonSlugFilenameMismatch",
          lessonFile,
          `slug "${frontmatter.slug}" does not match filename "${lessonSlug}"`
        );
      }
      if (frontmatter.challengeid && !frontmatter.challengeId) {
        courseIssues.inconsistentFrontmatter.push(
          `${rel(lessonFile)} uses non-canonical challengeid; prefer challengeId`
        );
        pushBucket(compatibilityBuckets, "lowercaseChallengeId", lessonFile);
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
      const challenge = challengeId ? challengeById.get(challengeId) : undefined;
      if (frontmatter.environment && !challengeId) {
        pushBucket(
          compatibilityBuckets,
          "environmentCoverageGaps",
          lessonFile,
          `environment "${frontmatter.environment}" has no challengeId`
        );
      } else if (frontmatter.environment && !challenge) {
        pushBucket(
          compatibilityBuckets,
          "environmentCoverageGaps",
          lessonFile,
          `environment "${frontmatter.environment}" references missing challenge "${challengeId}"`
        );
      } else if (frontmatter.environment && challenge) {
        const type = effectiveChallengeType(challenge);
        if (!type) {
          pushBucket(
            compatibilityBuckets,
            "environmentCoverageGaps",
            lessonFile,
            `environment "${frontmatter.environment}" references challenge without effective type "${challengeId}"`
          );
        } else if (frontmatter.environment !== type) {
          pushBucket(
            compatibilityBuckets,
            "environmentCoverageGaps",
            lessonFile,
            `environment "${frontmatter.environment}" differs from effective challenge type "${type}" (${challengeId})`
          );
        }
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
      const markerSurface = lessonMarkerSurface(raw, parsed);
      for (const [marker, pattern] of Object.entries(WHOLE_GAME_MARKER_PATTERNS)) {
        if (pattern.test(raw)) {
          pushMarker(wholeGameMarkers, marker, lessonFile);
        }
      }
      if (TRANSFER_ADVERSARIAL_RE.test(markerSurface)) {
        pushMarker(wholeGameMarkers, "transferAdversarialFraming", lessonFile);
      }
      if (CASE_STUDY_RE.test(raw) && SOURCE_PROVENANCE_RE.test(raw)) {
        pushMarker(wholeGameMarkers, "caseStudySourceProvenance", lessonFile);
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
    compatibilityBuckets,
    wholeGameMarkers,
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
  const compatibilityBucketTotals = Object.fromEntries(
    COMPATIBILITY_BUCKETS.map((bucket) => [
      bucket,
      courses.reduce((sum, course) => sum + course.compatibilityBuckets[bucket].length, 0),
    ])
  );
  const wholeGameMarkerTotals = Object.fromEntries(
    WHOLE_GAME_MARKERS.map((marker) => [
      marker,
      courses.reduce((sum, course) => sum + course.wholeGameMarkers[marker].length, 0),
    ])
  );

  const expectedSet = new Set(ACTIVE_EXPECTED_SLUGS);
  const actualSet = new Set(actualSlugs);
  const missingExpectedSlugs = ACTIVE_EXPECTED_SLUGS.filter((slug) => !actualSet.has(slug));
  const additionalActualSlugs = actualSlugs.filter((slug) => !expectedSet.has(slug));

  return {
    generatedAt: process.env.COURSE_INVENTORY_GENERATED_AT ?? "2026-06-20T00:00:00.000Z",
    issue: {
      number: 14,
      reconciliationIssue: 25,
      compatibilityIssue: 34,
      wholeGameMarkerIssue: 84,
      expectedSlugs: ACTIVE_EXPECTED_SLUGS,
      missingExpectedSlugs,
      additionalActualSlugs,
      actualSlugs,
      absentCourseReconciliation: ABSENT_COURSE_RECONCILIATION,
    },
    totals,
    compatibilityBucketTotals,
    wholeGameMarkerTotals,
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
    `Generated by \`pnpm content:inventory\` for GitHub issue #${report.issue.number}, with slug expectations reconciled by issue #${report.issue.reconciliationIssue}, challenge/frontmatter buckets added for issue #${report.issue.compatibilityIssue}, and informational whole-game markers added for issue #${report.issue.wholeGameMarkerIssue}.`,
    "",
    "## Slug Coverage",
    "",
    `- Active expected slugs for this branch: ${report.issue.expectedSlugs.length}`,
    `- Actual course folders with \`course.json\`: ${report.issue.actualSlugs.length}`,
    `- Missing active expected slugs from this repo branch: ${report.issue.missingExpectedSlugs.length > 0 ? report.issue.missingExpectedSlugs.map((slug) => `\`${slug}\``).join(", ") : "none"}`,
    `- Additional actual slugs not named in issue: ${report.issue.additionalActualSlugs.length > 0 ? report.issue.additionalActualSlugs.map((slug) => `\`${slug}\``).join(", ") : "none"}`,
    "",
    "Issue #14 originally listed eleven course slugs. Issue #25 reconciles that historical expectation to the nine active course folders present on `origin/main`; absent historical references are documented below instead of being counted as missing active inventory.",
    "",
    "## Absent Course Reconciliation",
    "",
    "| Slug | Status | Finding | Action |",
    "| --- | --- | --- | --- |",
    ...report.issue.absentCourseReconciliation.map(
      (course) => `| \`${course.slug}\` | ${course.status} | ${course.finding} | ${course.action} |`
    ),
    "",
    "## Totals",
    "",
    "| Modules | Lessons | Quizzes | Challenges | Diagrams | Mermaid blocks | Downloads | Videos | External deps |",
    "| ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |",
    `| ${report.totals.modules} | ${report.totals.lessons} | ${report.totals.quizzes} | ${report.totals.challenges} | ${report.totals.diagrams} | ${report.totals.inlineMermaidBlocks} | ${report.totals.downloads} | ${report.totals.videos} | ${report.totals.externalDependencies} |`,
    "",
    "## Challenge/Frontmatter Compatibility Buckets",
    "",
    "Issue #29 tracks challenge/frontmatter normalization. These buckets are report-only and intentionally separate from the issue #25 slug inventory reconciliation above.",
    "",
    "| Bucket | Affected files |",
    "| --- | ---: |",
    ...COMPATIBILITY_BUCKETS.map(
      (bucket) => `| ${bucket} | ${report.compatibilityBucketTotals[bucket]} |`
    ),
    "",
    "## Compatibility Buckets By Course",
    "",
    "| Course | lowercase challengeId | slug/filename mismatch | missing JSON type | legacy title/description | legacy starterCode | legacy validationRules | missing spec | missing JSON seed | sequence integrity | env gaps |",
    "| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |",
    ...report.courses.map(
      (course) =>
        `| \`${course.slug}\` | ${course.compatibilityBuckets.lowercaseChallengeId.length} | ${course.compatibilityBuckets.lessonSlugFilenameMismatch.length} | ${course.compatibilityBuckets.missingChallengeJsonType.length} | ${course.compatibilityBuckets.legacyTitleDescription.length} | ${course.compatibilityBuckets.legacyStarterCode.length} | ${course.compatibilityBuckets.legacyValidationRules.length} | ${course.compatibilityBuckets.missingVisibleSpec.length} | ${course.compatibilityBuckets.missingEffectiveJsonEditorSeed.length} | ${course.compatibilityBuckets.sequenceCorrectOrderIntegrity.length} | ${course.compatibilityBuckets.environmentCoverageGaps.length} |`
    ),
    "",
    "## Informational Whole-Game Markers",
    "",
    "Issue #84 tracks whole-game audit signals that were previously counted manually. These counts are informational and are not included in Quality flags or treated as blocking inventory errors.",
    "",
    "| Marker | Lessons with marker |",
    "| --- | ---: |",
    ...WHOLE_GAME_MARKERS.map(
      (marker) => `| ${WHOLE_GAME_MARKER_LABELS[marker]} | ${report.wholeGameMarkerTotals[marker]} |`
    ),
    "",
    "## Informational Whole-Game Markers By Course",
    "",
    "| Course | The Game | Your Running Project | hard-part language | transfer/adversarial framing | solo AI prompts | case-study source/provenance |",
    "| --- | ---: | ---: | ---: | ---: | ---: | ---: |",
    ...report.courses.map(
      (course) =>
        `| \`${course.slug}\` | ${course.wholeGameMarkers.theGame.length} | ${course.wholeGameMarkers.yourRunningProject.length} | ${course.wholeGameMarkers.hardPartLanguage.length} | ${course.wholeGameMarkers.transferAdversarialFraming.length} | ${course.wholeGameMarkers.soloAiPrompts.length} | ${course.wholeGameMarkers.caseStudySourceProvenance.length} |`
    ),
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
    lines.push("- compatibility buckets:");
    for (const bucket of COMPATIBILITY_BUCKETS) {
      const values = course.compatibilityBuckets[bucket];
      lines.push(`  - ${bucket}: ${values.length}`);
      for (const value of values.slice(0, 8)) {
        lines.push(`    - ${value}`);
      }
      if (values.length > 8) {
        lines.push(`    - ...and ${values.length - 8} more`);
      }
    }
    lines.push("- informational whole-game markers:");
    for (const marker of WHOLE_GAME_MARKERS) {
      const values = course.wholeGameMarkers[marker];
      lines.push(`  - ${marker}: ${values.length}`);
      for (const value of values.slice(0, 8)) {
        lines.push(`    - ${value}`);
      }
      if (values.length > 8) {
        lines.push(`    - ...and ${values.length - 8} more`);
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

  return `${lines.join("\n").replace(/\n+$/, "")}\n`;
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
