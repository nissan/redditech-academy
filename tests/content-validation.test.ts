/**
 * Content Validation Tests
 *
 * Validates structural integrity of ALL challenge JSONs and interactive MDX
 * lessons so UX/rendering bugs are caught at commit time, not in production.
 *
 * Covers:
 *  1. Challenge JSON schema — required fields, environment-specific fields
 *  2. MDX frontmatter — required fields for interactive lessons
 *  3. Environment/type consistency — MDX environment must match challenge JSON type
 *  4. Cross-references — every challengeId in MDX resolves to a real JSON file
 *  5. Sequence-completer specifics — correctOrder present and valid
 *  6. Json-editor specifics — prefilled template present and parseable
 */

import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const CONTENT_DIR = path.resolve(__dirname, "../content/courses");
const VALID_ENVIRONMENTS = new Set([
  "json-editor",
  "sequence-completer",
  "http-request-builder",
  "jwt-inspector",
]);

interface ChallengeJson {
  id?: string;
  spec?: string;
  validation?: unknown;
  type?: string;
  prefilled?: {
    steps?: Array<{ id: string; label: string }>;
    correctOrder?: string[];
    template?: string;
    [key: string]: unknown;
  };
  hints?: string[];
  // legacy schema fields (sale-* challenges)
  title?: string;
  description?: string;
  starterCode?: string;
  validationRules?: unknown[];
}

interface MdxFrontmatter {
  title?: string;
  type?: string;
  environment?: string;
  challengeId?: string;
  missionTitle?: string;
  estimatedMinutes?: number;
  slug?: string;
}

/** Load and parse every challenge JSON under content/courses */
function loadAllChallenges(): Array<{ file: string; data: ChallengeJson }> {
  const results: Array<{ file: string; data: ChallengeJson }> = [];
  const courses = fs.readdirSync(CONTENT_DIR);
  for (const course of courses) {
    const challengesDir = path.join(CONTENT_DIR, course, "challenges");
    if (!fs.existsSync(challengesDir)) continue;
    for (const fname of fs.readdirSync(challengesDir)) {
      if (!fname.endsWith(".json")) continue;
      const fpath = path.join(challengesDir, fname);
      try {
        const data = JSON.parse(fs.readFileSync(fpath, "utf-8")) as ChallengeJson;
        results.push({ file: fpath, data });
      } catch (e) {
        results.push({ file: fpath, data: {} });
      }
    }
  }
  return results;
}

/** Extract frontmatter from an MDX file (parses YAML-like --- block) */
function parseMdxFrontmatter(content: string): MdxFrontmatter {
  const match = content.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!match) return {};
  const fm: MdxFrontmatter = {};
  for (const line of match[1].split("\n")) {
    const m = line.match(/^(\w+(?:_\w+)*):\s*"?([^"#\n]*?)"?\s*$/);
    if (!m) continue;
    const [, key, val] = m;
    const normalizedKey = key.toLowerCase() === "challengeid" ? "challengeId" : key;
    (fm as Record<string, unknown>)[normalizedKey] = isNaN(Number(val)) ? val.trim() : Number(val);
  }
  return fm;
}

/** Load all interactive MDX files */
function loadAllInteractiveMdx(): Array<{ file: string; fm: MdxFrontmatter }> {
  const results: Array<{ file: string; fm: MdxFrontmatter }> = [];
  function walk(dir: string) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) { walk(full); continue; }
      if (!entry.name.endsWith(".mdx")) continue;
      const content = fs.readFileSync(full, "utf-8");
      const fm = parseMdxFrontmatter(content);
      if (fm.type === "interactive") results.push({ file: full, fm });
    }
  }
  walk(CONTENT_DIR);
  return results;
}

/** Find the challenge JSON file by id */
function findChallengeById(id: string): string | null {
  const courses = fs.readdirSync(CONTENT_DIR);
  for (const course of courses) {
    const p = path.join(CONTENT_DIR, course, "challenges", `${id}.json`);
    if (fs.existsSync(p)) return p;
  }
  return null;
}

// ─── Load data once for all tests ────────────────────────────────────────────

const allChallenges = loadAllChallenges();
const allInteractiveMdx = loadAllInteractiveMdx();

// ─── Suite 1: Challenge JSON schema ──────────────────────────────────────────

describe("Challenge JSON — required fields", () => {
  it("every challenge has an id field", () => {
    const missing = allChallenges
      .filter(({ data }) => !data.id)
      .map(({ file }) => path.basename(file));
    expect(missing, `Missing id in: ${missing.join(", ")}`).toHaveLength(0);
  });

  it("every challenge has spec OR legacy title+description", () => {
    const missing = allChallenges
      .filter(({ data }) => !data.spec && !(data.title && data.description))
      .map(({ file }) => path.basename(file));
    expect(missing, `Missing spec (and no legacy title/description) in: ${missing.join(", ")}`).toHaveLength(0);
  });

  it("every challenge has validation OR legacy validationRules", () => {
    const missing = allChallenges
      .filter(({ data }) => data.validation === undefined && !data.validationRules)
      .map(({ file }) => path.basename(file));
    expect(missing, `Missing validation in: ${missing.join(", ")}`).toHaveLength(0);
  });

  it("every challenge JSON file is valid JSON (parseable)", () => {
    const unparseable = allChallenges
      .filter(({ data }) => Object.keys(data).length === 0)
      .map(({ file }) => path.basename(file));
    expect(unparseable, `Unparseable JSON: ${unparseable.join(", ")}`).toHaveLength(0);
  });

  it("challenge id matches filename", () => {
    const mismatches = allChallenges
      .filter(({ file, data }) => data.id && data.id !== path.basename(file, ".json"))
      .map(({ file, data }) => `${path.basename(file)} declares id="${data.id}"`);
    expect(mismatches, `id/filename mismatches: ${mismatches.join("; ")}`).toHaveLength(0);
  });
});

describe("Challenge JSON — schema compatibility with judge route", () => {
  it("legacy sale-* challenges use known legacy schema (starterCode + validationRules)", () => {
    const legacyChallenges = allChallenges.filter(({ data }) =>
      !data.spec && data.title && data.description
    );
    const malformed = legacyChallenges
      .filter(({ data }) => !data.starterCode && !data.validationRules)
      .map(({ file }) => path.basename(file));
    expect(malformed, `Legacy challenges missing starterCode/validationRules: ${malformed.join(", ")}`).toHaveLength(0);
  });
});

// ─── Suite 2: Sequence-completer challenges ───────────────────────────────────

describe("sequence-completer challenges", () => {
  const sequenceChallenges = allChallenges.filter(
    ({ data }) => data.type === "sequence-completer" || data.type === "sequence"
  );

  it("all sequence-completer challenges have prefilled.correctOrder", () => {
    const missing = sequenceChallenges
      .filter(({ data }) => !data.prefilled?.correctOrder)
      .map(({ file }) => path.basename(file));
    expect(missing, `Missing correctOrder: ${missing.join(", ")}`).toHaveLength(0);
  });

  it("correctOrder contains only IDs that exist in prefilled.steps", () => {
    const errors: string[] = [];
    for (const { file, data } of sequenceChallenges) {
      const steps = data.prefilled?.steps;
      const order = data.prefilled?.correctOrder;
      if (!steps || !order) continue;
      const validIds = new Set(steps.map((s) => s.id));
      const badIds = order.filter((id) => !validIds.has(id));
      if (badIds.length > 0) {
        errors.push(`${path.basename(file)}: unknown IDs in correctOrder: ${badIds.join(", ")}`);
      }
    }
    expect(errors, errors.join("; ")).toHaveLength(0);
  });

  it("correctOrder length matches steps length", () => {
    const errors: string[] = [];
    for (const { file, data } of sequenceChallenges) {
      const steps = data.prefilled?.steps;
      const order = data.prefilled?.correctOrder;
      if (!steps || !order) continue;
      if (steps.length !== order.length) {
        errors.push(
          `${path.basename(file)}: steps.length=${steps.length} but correctOrder.length=${order.length}`
        );
      }
    }
    expect(errors, errors.join("; ")).toHaveLength(0);
  });

  it("correctOrder contains no duplicate IDs", () => {
    const errors: string[] = [];
    for (const { file, data } of sequenceChallenges) {
      const order = data.prefilled?.correctOrder;
      if (!order) continue;
      const dupes = order.filter((id, i) => order.indexOf(id) !== i);
      if (dupes.length > 0) {
        errors.push(`${path.basename(file)}: duplicate IDs: ${dupes.join(", ")}`);
      }
    }
    expect(errors, errors.join("; ")).toHaveLength(0);
  });

  it("all steps have non-empty id and label", () => {
    const errors: string[] = [];
    for (const { file, data } of sequenceChallenges) {
      const steps = data.prefilled?.steps;
      if (!steps) continue;
      for (const s of steps) {
        if (!s.id?.trim()) errors.push(`${path.basename(file)}: step with empty id`);
        if (!s.label?.trim()) errors.push(`${path.basename(file)}: step id="${s.id}" has empty label`);
      }
    }
    expect(errors, errors.join("; ")).toHaveLength(0);
  });
});

// ─── Suite 3: Json-editor challenges ─────────────────────────────────────────

describe("json-editor challenges", () => {
  const jsonEditorChallenges = allChallenges.filter(
    ({ data }) => data.type === "json-editor"
  );

  it("all json-editor challenges have prefilled.template or legacy starterCode", () => {
    const missing = jsonEditorChallenges
      .filter(({ data }) => !data.prefilled?.template && !data.starterCode)
      .map(({ file }) => path.basename(file));
    expect(
      missing,
      `json-editor challenges missing template (add prefilled.template or starterCode): ${missing.join(", ")}`
    ).toHaveLength(0);
  });

  it("prefilled.template is valid JSON where present", () => {
    const errors: string[] = [];
    for (const { file, data } of jsonEditorChallenges) {
      const tmpl = data.prefilled?.template ?? data.starterCode;
      if (!tmpl) continue;
      try {
        JSON.parse(tmpl);
      } catch {
        errors.push(`${path.basename(file)}: template is not valid JSON`);
      }
    }
    expect(errors, errors.join("; ")).toHaveLength(0);
  });
});

// ─── Suite 4: MDX frontmatter ─────────────────────────────────────────────────

describe("interactive MDX frontmatter", () => {
  it("all interactive MDX files have a non-empty environment", () => {
    const missing = allInteractiveMdx
      .filter(({ fm }) => !fm.environment?.trim())
      .map(({ file }) => path.relative(CONTENT_DIR, file));
    expect(
      missing,
      `Interactive MDX with missing environment: ${missing.join(", ")}`
    ).toHaveLength(0);
  });

  it("all environment values are known types", () => {
    const unknown = allInteractiveMdx
      .filter(({ fm }) => fm.environment && !VALID_ENVIRONMENTS.has(fm.environment))
      .map(({ file, fm }) => `${path.relative(CONTENT_DIR, file)} (environment="${fm.environment}")`);
    expect(
      unknown,
      `Unknown environment types: ${unknown.join(", ")}`
    ).toHaveLength(0);
  });

  it("interactive MDX files with an environment field must also have a challengeId", () => {
    // Only lessons that declare an `environment` are wired to an interactive
    // challenge panel. Those must have a challengeId. Lessons that are
    // type:interactive but have no environment are content-only reads.
    const missing = allInteractiveMdx
      .filter(({ fm }) => fm.environment?.trim() && !fm.challengeId?.trim())
      .map(({ file }) => path.relative(CONTENT_DIR, file));
    expect(
      missing,
      `Interactive MDX with environment but no challengeId: ${missing.join(", ")}`
    ).toHaveLength(0);
  });

  it("all interactive MDX files have a missionTitle", () => {
    const missing = allInteractiveMdx
      .filter(({ fm }) => !fm.missionTitle?.trim())
      .map(({ file }) => path.relative(CONTENT_DIR, file));
    expect(
      missing,
      `Interactive MDX missing missionTitle: ${missing.join(", ")}`
    ).toHaveLength(0);
  });

  it("all interactive MDX files have estimatedMinutes > 0", () => {
    const bad = allInteractiveMdx
      .filter(({ fm }) => !fm.estimatedMinutes || fm.estimatedMinutes <= 0)
      .map(({ file }) => path.relative(CONTENT_DIR, file));
    expect(
      bad,
      `Interactive MDX missing/zero estimatedMinutes: ${bad.join(", ")}`
    ).toHaveLength(0);
  });
});

// ─── Suite 5: Cross-reference — challengeId → JSON file ──────────────────────

describe("challengeId cross-references", () => {
  it("every challengeId in MDX resolves to a real challenge JSON file", () => {
    const broken = allInteractiveMdx
      .filter(({ fm }) => fm.challengeId && !findChallengeById(fm.challengeId))
      .map(({ file, fm }) => `${path.relative(CONTENT_DIR, file)} → "${fm.challengeId}" not found`);
    expect(
      broken,
      `Broken challengeId references: ${broken.join("; ")}`
    ).toHaveLength(0);
  });
});

// ─── Suite 6: Environment / challenge type consistency ────────────────────────

describe("environment ↔ challenge type consistency", () => {
  it("MDX environment matches challenge JSON type", () => {
    const mismatches: string[] = [];
    for (const { file, fm } of allInteractiveMdx) {
      if (!fm.environment || !fm.challengeId) continue;
      const cfile = findChallengeById(fm.challengeId);
      if (!cfile) continue;
      const challenge = JSON.parse(fs.readFileSync(cfile, "utf-8")) as ChallengeJson;
      if (!challenge.type) continue; // type not required for legacy
      if (challenge.type !== fm.environment) {
        mismatches.push(
          `${path.relative(CONTENT_DIR, file)}: MDX env="${fm.environment}" but challenge type="${challenge.type}" (id=${fm.challengeId})`
        );
      }
    }
    expect(mismatches, `Environment/type mismatches:\n${mismatches.join("\n")}`).toHaveLength(0);
  });
});

// ─── Suite 7: Content quality — no raw JSON code blocks in MDX ───────────────

describe("MDX content quality", () => {
  it("interactive MDX files do not contain editable-looking JSON code blocks in lesson narrative", () => {
    // Detects ```json blocks whose content looks like a fill-in-the-blank template
    // (values are empty strings ""). These render as read-only but look interactive.
    const flagged: string[] = [];
    function walk(dir: string) {
      if (!fs.existsSync(dir)) return;
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) { walk(full); continue; }
        if (!entry.name.endsWith(".mdx")) continue;
        const content = fs.readFileSync(full, "utf-8");
        // Look for ```json blocks containing fields with empty string values
        const jsonBlocks = [...content.matchAll(/```json\s*\n([\s\S]*?)```/g)];
        for (const block of jsonBlocks) {
          // Flag if it has multiple "key": "" patterns (fill-in-the-blank template)
          const emptyFields = (block[1].match(/"[^"]+"\s*:\s*""/g) || []).length;
          if (emptyFields >= 2) {
            flagged.push(
              `${path.relative(CONTENT_DIR, full)}: has fill-in-the-blank JSON code block (${emptyFields} empty fields) — replace with blockquote or prose`
            );
          }
        }
      }
    }
    walk(CONTENT_DIR);
    expect(flagged, `Confusing JSON code blocks:\n${flagged.join("\n")}`).toHaveLength(0);
  });
});
