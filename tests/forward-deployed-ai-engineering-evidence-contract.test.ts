import crypto from "crypto";
import fs from "fs";
import path from "path";

import { describe, expect, it } from "vitest";

const EVIDENCE_DIR = path.join(
  process.cwd(),
  "companion-labs",
  "forward-deployed-ai-engineering",
  "evidence"
);
const manifest = JSON.parse(
  fs.readFileSync(path.join(EVIDENCE_DIR, "manifest.json"), "utf8")
);
const schema = JSON.parse(
  fs.readFileSync(path.join(EVIDENCE_DIR, "manifest.schema.json"), "utf8")
);
const readme = fs.readFileSync(path.join(EVIDENCE_DIR, "README.md"), "utf8");

function sha256(filePath: string) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function markdownHeadings(markdown: string) {
  return new Set(
    markdown
      .split("\n")
      .filter((line) => /^##? /.test(line))
      .map((line) => line.replace(/^#+\s+/, "").trim())
  );
}

describe("Forward Deployed AI Engineering B3 evidence repository contract", () => {
  it("is a strict, versioned, local-only manifest with deterministic ordering", () => {
    expect(manifest).toMatchObject({
      contractVersion: "1.0.0",
      courseId: "forward-deployed-ai-engineering",
      datasetId: "harbourcare-synthetic-v1",
      localOnly: true,
      containsCredentials: false,
    });
    expect(schema.$schema).toBe("https://json-schema.org/draft/2020-12/schema");
    expect(schema.additionalProperties).toBe(false);
    expect(schema.$defs.template.additionalProperties).toBe(false);

    const indexes = manifest.templates.map((template: { index: number }) => template.index);
    const ids = manifest.templates.map((template: { id: string }) => template.id);
    expect(indexes).toEqual(Array.from({ length: indexes.length }, (_, index) => index));
    expect(ids).toEqual([...ids].sort());
    expect(new Set(ids).size).toBe(ids.length);
    expect(manifest.requiredDirectories).toEqual([
      "discovery/",
      "decisions/",
      "risks/",
      "runbooks/",
      "evaluations/",
      "tests/",
      "reports/",
    ]);
  });

  it("confines every declared path to the evidence repository and authenticates template bytes", () => {
    for (const template of manifest.templates) {
      expect(template.path).toMatch(/^templates\/[a-z0-9-]+\.md$/);
      expect(template.outputDirectory).toMatch(/^[a-z0-9-]+\/$/);
      expect(template.path).not.toContain("..");
      expect(template.outputDirectory).not.toContain("..");

      const templatePath = path.resolve(EVIDENCE_DIR, template.path);
      expect(templatePath.startsWith(`${path.resolve(EVIDENCE_DIR)}${path.sep}`)).toBe(true);
      expect(manifest.requiredDirectories).toContain(template.outputDirectory);
      expect(fs.lstatSync(templatePath).isSymbolicLink()).toBe(false);
      expect(fs.statSync(templatePath).isFile()).toBe(true);
      expect(fs.realpathSync(templatePath).startsWith(`${fs.realpathSync(EVIDENCE_DIR)}${path.sep}`)).toBe(true);
      expect(sha256(templatePath)).toBe(template.sha256);
    }
  });

  it("provides the required discovery, ADR, risk, runbook, and evaluation structures", () => {
    const expectedTemplateIds = [
      "00-discovery-brief",
      "01-architecture-decision-record",
      "02-risk-register",
      "03-operator-runbook",
      "04-evaluation-card",
    ];
    expect(manifest.templates.map((template: { id: string }) => template.id)).toEqual(expectedTemplateIds);

    for (const template of manifest.templates) {
      const markdown = fs.readFileSync(path.join(EVIDENCE_DIR, template.path), "utf8");
      const headings = markdownHeadings(markdown);
      for (const requiredHeading of template.requiredSections) {
        expect(headings.has(requiredHeading), `${template.id} is missing ${requiredHeading}`).toBe(true);
      }
      expect(markdown).toContain("HarbourCare");
      expect(markdown).toContain("Synthetic evidence only");
    }
  });

  it("maps foundational templates to declared BDD coverage without claiming completed evidence", () => {
    const scenarios = new Set(
      manifest.templates.flatMap((template: { bddScenarios: string[] }) => template.bddScenarios)
    );
    expect(scenarios).toEqual(new Set(["FDE-02", "FDE-03", "FDE-17", "FDE-18", "FDE-19", "FDE-21"]));
    expect(readme).toContain("Templates are not completed evidence");
    expect(readme).toContain("append-only");
    expect(readme).toContain("no paid API");
    expect(readme).toContain("no production credential");
    expect(JSON.stringify(manifest)).not.toMatch(/api[_-]?key|bearer\s+[a-z0-9]|password/i);
  });
});
