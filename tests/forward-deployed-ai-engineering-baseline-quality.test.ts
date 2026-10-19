import fs from "fs";
import os from "os";
import path from "path";
import { spawnSync } from "child_process";
import { pathToFileURL } from "url";

import { afterEach, describe, expect, it } from "vitest";

const REPO_ROOT = process.cwd();
const HARNESS = path.join(
  REPO_ROOT,
  "companion-labs",
  "forward-deployed-ai-engineering",
  "scripts",
  "baseline-quality.mjs"
);
const TRACKED_REPORT = path.join(
  REPO_ROOT,
  "companion-labs",
  "forward-deployed-ai-engineering",
  "quality",
  "baseline-report.json"
);
const temporaryDirectories: string[] = [];

function runHarness(command: "generate" | "check", reportPath = TRACKED_REPORT) {
  return spawnSync(process.execPath, [HARNESS, command, "--report", reportPath], {
    cwd: REPO_ROOT,
    encoding: "utf8",
    env: { PATH: process.env.PATH ?? "", NODE_ENV: "test" },
  });
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

describe("Forward Deployed AI Engineering B5 baseline quality harness", () => {
  it("checks the tracked deterministic report and all baseline gates", () => {
    const result = runHarness("check");
    expect(result.status, result.stderr).toBe(0);

    const report = JSON.parse(fs.readFileSync(TRACKED_REPORT, "utf8"));
    expect(report).toMatchObject({
      contractVersion: "1.0.0",
      courseId: "forward-deployed-ai-engineering",
      summary: { status: "pass", failed: 0 },
    });
    expect(report.checks.map((check: { id: string }) => check.id)).toEqual([
      "course-inventory",
      "draft-2020-12-schemas",
      "fixture-integrity",
      "evidence-references",
      "zero-placeholders",
      "credential-signatures",
    ]);
    expect(report.checks.every((check: { status: string }) => check.status === "pass")).toBe(true);
  });

  it("generates byte-identical reports on repeated runs", () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), "fde-baseline-quality-"));
    temporaryDirectories.push(directory);
    const reportPath = path.join(directory, "report.json");

    const first = runHarness("generate", reportPath);
    expect(first.status, first.stderr).toBe(0);
    const firstBytes = fs.readFileSync(reportPath);

    const second = runHarness("generate", reportPath);
    expect(second.status, second.stderr).toBe(0);
    expect(fs.readFileSync(reportPath)).toEqual(firstBytes);
    expect(runHarness("check", reportPath).status).toBe(0);
  });

  it("enforces Draft 2020-12 fixture validation, including additionalProperties", async () => {
    const fixturePath = path.join(
      REPO_ROOT,
      "companion-labs",
      "forward-deployed-ai-engineering",
      "data",
      "harbourcare-v1.json"
    );
    const schemaPath = path.join(
      REPO_ROOT,
      "companion-labs",
      "forward-deployed-ai-engineering",
      "data",
      "harbourcare-v1.schema.json"
    );
    const fixture = JSON.parse(fs.readFileSync(fixturePath, "utf8"));
    const schema = JSON.parse(fs.readFileSync(schemaPath, "utf8"));
    const harness = await import(pathToFileURL(HARNESS).href);

    expect(harness.validateDraft202012(schema, fixture)).toEqual([]);
    expect(
      harness.validateDraft202012(schema, { ...fixture, undeclaredLiveField: true })
    ).not.toEqual([]);
  });
});
