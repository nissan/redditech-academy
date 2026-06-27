import fs from "fs";
import path from "path";
import matter from "gray-matter";

const ROOT = process.cwd();
const COURSE_SLUG = "solana-academy";
const COURSE_DIR = path.join(ROOT, "content", "courses", COURSE_SLUG);
const CHALLENGES_DIR = path.join(COURSE_DIR, "challenges");
const MODULES_DIR = path.join(COURSE_DIR, "modules");
const REPORTS_DIR = path.join(ROOT, "reports");
const REPORT_JSON = path.join(REPORTS_DIR, "solana-sequence-environment-mismatch-classification.json");
const REPORT_MD = path.join(REPORTS_DIR, "solana-sequence-environment-mismatch-classification.md");

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

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function rel(filePath) {
  return path.relative(ROOT, filePath).replaceAll(path.sep, "/");
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

function splitForModule(moduleSlug) {
  const number = Number.parseInt(moduleSlug.match(/^(\d+)/)?.[1] ?? "", 10);
  if (Number.isNaN(number) || number <= 7) {
    return {
      id: "solana-foundation-json-editor-env-alignment",
      title: "Solana foundation modules JSON-editor environment alignment",
      modules: "00-07",
    };
  }
  if (number >= 9 && number <= 16) {
    return {
      id: "solana-integration-json-editor-env-alignment",
      title: "Solana integration modules JSON-editor environment alignment",
      modules: "09-16",
    };
  }
  return {
    id: "solana-validator-json-editor-env-alignment",
    title: "Solana validator modules JSON-editor environment alignment",
    modules: "17-22",
  };
}

function classifyRow({ challenge, moduleSlug }) {
  const hasTemplate = typeof challenge?.prefilled?.template === "string";
  const hasStarterCode = typeof challenge?.starterCode === "string";
  const hasSequenceSteps = Array.isArray(challenge?.prefilled?.steps);
  const hasCorrectOrder = Array.isArray(challenge?.prefilled?.correctOrder);
  const split = splitForModule(moduleSlug);

  return {
    classification: "keep-json-editor-change-mdx-environment",
    implementationSplit: split.id,
    rationale: [
      hasTemplate ? "has prefilled.template" : null,
      hasStarterCode ? "has legacy starterCode" : null,
      !hasSequenceSteps ? "no prefilled.steps" : null,
      !hasCorrectOrder ? "no prefilled.correctOrder" : null,
      "sequence conversion would require authoring new learner-visible order data",
    ].filter(Boolean),
  };
}

function collectRows() {
  const challengeFiles = listFiles(CHALLENGES_DIR, (file) => file.endsWith(".json"));
  const challengeById = new Map();
  for (const challengeFile of challengeFiles) {
    const challenge = readJson(challengeFile);
    const fileId = path.basename(challengeFile, ".json");
    challengeById.set(fileId, { challenge, challengeFile });
    if (challenge.id) {
      challengeById.set(challenge.id, { challenge, challengeFile });
    }
  }

  const lessonFiles = listFiles(MODULES_DIR, (file) => file.endsWith(".mdx"));
  const rows = [];
  for (const lessonFile of lessonFiles) {
    const parsed = matter(fs.readFileSync(lessonFile, "utf8"));
    const frontmatter = parsed.data ?? {};
    if (frontmatter.environment !== "sequence-completer") continue;

    const challengeId = frontmatter.challengeId ?? frontmatter.challengeid;
    if (!challengeId) continue;

    const challengeRecord = challengeById.get(challengeId);
    if (!challengeRecord) continue;

    const { challenge, challengeFile } = challengeRecord;
    const effectiveType = effectiveChallengeType(challenge);
    if (challenge.type || effectiveType !== "json-editor") continue;

    const moduleSlug = rel(lessonFile).split("/")[4];
    const classification = classifyRow({ challenge, moduleSlug });
    rows.push({
      challengeId,
      moduleSlug,
      lessonSlug: path.basename(lessonFile, ".mdx"),
      lessonTitle: frontmatter.title,
      lessonFile: rel(lessonFile),
      challengeFile: rel(challengeFile),
      mdxEnvironment: frontmatter.environment,
      explicitChallengeType: challenge.type ?? null,
      effectiveChallengeType: effectiveType,
      hasPrefilledTemplate: typeof challenge?.prefilled?.template === "string",
      hasPrefilledSteps: Array.isArray(challenge?.prefilled?.steps),
      hasCorrectOrder: Array.isArray(challenge?.prefilled?.correctOrder),
      ...classification,
    });
  }

  return rows.sort((a, b) => a.lessonFile.localeCompare(b.lessonFile));
}

function buildReport() {
  const rows = collectRows();
  const splits = new Map();
  for (const row of rows) {
    const split = splitForModule(row.moduleSlug);
    if (!splits.has(split.id)) {
      splits.set(split.id, {
        ...split,
        count: 0,
        challengeIds: [],
        dependsOn: ["#44"],
        blocks: ["#36"],
        uiEvidence:
          "Required in the implementation PR because changing MDX environment changes rendered challenge UI.",
      });
    }
    const entry = splits.get(split.id);
    entry.count += 1;
    entry.challengeIds.push(row.challengeId);
  }

  return {
    issue: 44,
    courseSlug: COURSE_SLUG,
    decision:
      "All current Solana sequence-completer environment mismatches should stay JSON-editor challenges and move to JSON-editor MDX environments in follow-up implementation PRs.",
    guardrail:
      "This classification report is read-only. It does not edit challenge JSON, MDX frontmatter, renderer behavior, judge behavior, tutor behavior, provider behavior, or learner-visible task copy.",
    counts: {
      mismatches: rows.length,
      keepJsonEditorChangeMdxEnvironment: rows.filter(
        (row) => row.classification === "keep-json-editor-change-mdx-environment"
      ).length,
      convertToSequenceCompleter: 0,
      holdForContentSpec: 0,
    },
    implementationSplits: [...splits.values()],
    rows,
  };
}

function renderMarkdown(report) {
  const lines = [
    "# Solana Sequence Environment Mismatch Classification",
    "",
    "Generated by `node scripts/solana-mismatch-classification.mjs` for GitHub issue #44.",
    "",
    "## Decision",
    "",
    report.decision,
    "",
    "These lessons declare `environment: \"sequence-completer\"` in MDX, but the referenced challenge JSON has JSON-editor shape: `prefilled.template` and no sequence data (`prefilled.steps` / `prefilled.correctOrder`). Converting them into true sequence-completer challenges would require inventing new learner-visible ordering data, so the lower-risk implementation path is to align MDX environment and JSON type to `json-editor` in follow-up PRs with UI evidence.",
    "",
    "## Counts",
    "",
    `- Total mismatches classified: ${report.counts.mismatches}`,
    `- Keep JSON editor, change MDX environment later: ${report.counts.keepJsonEditorChangeMdxEnvironment}`,
    `- Convert to true sequence completer: ${report.counts.convertToSequenceCompleter}`,
    `- Hold for content spec: ${report.counts.holdForContentSpec}`,
    "",
    "## Guardrails",
    "",
    `- ${report.guardrail}`,
    "- Follow-up PRs that change MDX environment or rendered challenge behavior need UI screenshots or video.",
    "- Any future sequence conversion must include `prefilled.steps`, `prefilled.correctOrder`, and sequence integrity tests.",
    "- Keep #37 slug/frontmatter cleanup separate from this lane.",
    "",
    "## Implementation Splits",
    "",
  ];

  for (const split of report.implementationSplits) {
    lines.push(`### ${split.title}`);
    lines.push("");
    lines.push(`- Modules: ${split.modules}`);
    lines.push(`- Count: ${split.count}`);
    lines.push(`- Depends on: ${split.dependsOn.join(", ")}`);
    lines.push(`- Blocks: ${split.blocks.join(", ")}`);
    lines.push(`- UI evidence: ${split.uiEvidence}`);
    lines.push(`- Challenge IDs: ${split.challengeIds.map((id) => `\`${id}\``).join(", ")}`);
    lines.push("");
  }

  lines.push("## Classified Pairs");
  lines.push("");
  lines.push("| Module | Lesson | Challenge ID | Classification | Split | Rationale |");
  lines.push("| --- | --- | --- | --- | --- | --- |");
  for (const row of report.rows) {
    lines.push(
      `| ${row.moduleSlug} | ${row.lessonSlug} | \`${row.challengeId}\` | ${row.classification} | ${row.implementationSplit} | ${row.rationale.join("; ")} |`
    );
  }
  lines.push("");
  return `${lines.join("\n").replace(/\n+$/, "")}\n`;
}

function writeReport(report) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
  fs.writeFileSync(REPORT_JSON, `${JSON.stringify(report, null, 2)}\n`);
  fs.writeFileSync(REPORT_MD, renderMarkdown(report));
}

export { buildReport, renderMarkdown };

if (import.meta.url === `file://${process.argv[1]}`) {
  const report = buildReport();
  writeReport(report);
  console.log(`Classified ${report.counts.mismatches} Solana sequence environment mismatches.`);
  console.log(`Wrote ${rel(REPORT_JSON)}`);
  console.log(`Wrote ${rel(REPORT_MD)}`);
}
