import fs from "fs";
import os from "os";
import path from "path";
import { spawnSync } from "child_process";

import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import challenge from "@/content/courses/forward-deployed-ai-engineering/challenges/fde-03-ingestion-mission.json";
import { gradeFdeIngestion } from "@/lib/fde-ingestion-grader";
import { buildCourseInventoryReport } from "@/scripts/course-inventory-report.mjs";

const invoke = vi.fn();
const createJudgeLLM = vi.fn(() => ({ invoke }));
const judgeProviderLabel = vi.fn(() => "forbidden-provider");
vi.mock("@/lib/judge-llm", () => ({ createJudgeLLM, judgeProviderLabel }));

const COURSE_SLUG = "forward-deployed-ai-engineering";
const MODULE_SLUG = "03-legacy-data-ingestion-and-reconciliation";
const ROOT = process.cwd();
const CASE_PATH = path.join(ROOT, "companion-labs", COURSE_SLUG, "ingestion", "invoice-erp-v1.json");
const FIXTURE_PATH = path.join(ROOT, "companion-labs", COURSE_SLUG, "ingestion", "fixtures");
const LAB_PATH = path.join(ROOT, "companion-labs", COURSE_SLUG, "scripts", "ingestion-lab.mjs");

function clone<T>(value: T): T { return JSON.parse(JSON.stringify(value)) as T; }
function digest(bytes: Buffer | string): string {
  return `sha256:${require("crypto").createHash("sha256").update(bytes).digest("hex")}`;
}

function isolatedLab() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "fde-ingestion-test-"));
  const fixtureRoot = path.join(root, "fixtures");
  const contractPath = path.join(root, "invoice-erp-v1.json");
  const stateDir = path.join(root, "state");
  fs.cpSync(FIXTURE_PATH, fixtureRoot, { recursive: true, dereference: false });
  fs.copyFileSync(CASE_PATH, contractPath);
  const run = (...args: string[]) => spawnSync(process.execPath, [LAB_PATH, ...args, "--state-dir", stateDir], {
    cwd: ROOT,
    encoding: "utf8",
    env: { PATH: process.env.PATH ?? "", NODE_ENV: "test", FDE_INGESTION_FIXTURE_ROOT: fixtureRoot, FDE_INGESTION_CONTRACT: contractPath },
  });
  return {
    root, fixtureRoot, contractPath, stateDir, run,
    contract: JSON.parse(fs.readFileSync(contractPath, "utf8")),
    save(contract: unknown) { fs.writeFileSync(contractPath, `${JSON.stringify(contract, null, 2)}\n`); },
    cleanup() { fs.rmSync(root, { recursive: true, force: true }); },
  };
}

function validSubmission(): Record<string, unknown> {
  const lab = isolatedLab();
  try {
    expect(lab.run("ingest").status).toBe(0);
    expect(lab.run("replay").status).toBe(0);
    const report = lab.run("report");
    expect(report.status, report.stderr).toBe(0);
    return JSON.parse(report.stdout) as Record<string, unknown>;
  } finally { lab.cleanup(); }
}

describe("Forward Deployed AI Engineering C3b ingestion mission", () => {
  beforeEach(() => { invoke.mockReset(); createJudgeLLM.mockClear(); judgeProviderLabel.mockClear(); });

  it("requires authenticated durable attempt-001 state before a separate replay process", () => {
    const lab = isolatedLab();
    try {
      const freshReplay = lab.run("replay");
      expect(freshReplay.status).toBe(1);
      expect(freshReplay.stderr).toMatch(/missing authenticated ingest state/i);

      const ingest = lab.run("ingest");
      expect(ingest.status, ingest.stderr).toBe(0);
      const statePath = path.join(lab.stateDir, "ingestion-state.json");
      expect(fs.existsSync(statePath)).toBe(true);
      const firstState = fs.readFileSync(statePath, "utf8");
      expect(JSON.parse(firstState)).toMatchObject({ phase: "ingested", lastAttempt: 1 });

      const replay = lab.run("replay");
      expect(replay.status, replay.stderr).toBe(0);
      const replayedState = fs.readFileSync(statePath, "utf8");
      expect(JSON.parse(replayedState)).toMatchObject({ phase: "replayed", lastAttempt: 2 });
      const duplicateCallback = lab.run("replay");
      expect(duplicateCallback.status, duplicateCallback.stderr).toBe(0);
      expect(fs.readFileSync(statePath, "utf8")).toBe(replayedState);

      const forged = JSON.parse(replayedState);
      forged.acceptedRecords[0].amountMinor += 1;
      fs.writeFileSync(statePath, `${JSON.stringify(forged, null, 2)}\n`);
      const report = lab.run("report");
      expect(report.status).toBe(1);
      expect(report.stderr).toMatch(/state integrity mismatch/i);
    } finally { lab.cleanup(); }
  });

  it("binds immutable repository authority and complete observation lineage into execution proof", () => {
    const lab = isolatedLab();
    try {
      expect(lab.run("ingest").status).toBe(0);
      expect(lab.run("replay").status).toBe(0);
      const reportRun = lab.run("report");
      expect(reportRun.status, reportRun.stderr).toBe(0);
      const report = JSON.parse(reportRun.stdout);
      expect(report.executionEvidence).toMatchObject({ authorityDigest: expect.stringMatching(/^sha256:/), ingestStateDigest: expect.stringMatching(/^sha256:/), replayStateDigest: expect.stringMatching(/^sha256:/), reportDigest: expect.stringMatching(/^sha256:/) });
      expect(report.lineage).toHaveLength(7);
      expect(report.lineage.find((row: any) => row.lineageId === "lineage:ocr:scan-003")).toMatchObject({ observed: { invoiceNumber: { value: "HC-INV-I003", confidence: 0.61 }, amount: { value: "400.00", confidence: 0.58 } }, validation: { result: "quarantined" } });
      expect(report.lineage.find((row: any) => row.lineageId === "lineage:ocr:scan-004")).toMatchObject({ validation: { result: "quarantined", reasonId: "canonical-id-collision" } });
      expect(gradeFdeIngestion(challenge, { json: JSON.stringify(report) }).pass).toBe(true);

      for (const mutate of [
        (v: any) => { delete v.lineage[0].observed.invoiceNumber.confidence; },
        (v: any) => { v.lineage[2].observed.amount.value = "401.00"; },
        (v: any) => { v.lineage[0].source.digest = "sha256:" + "0".repeat(64); },
        (v: any) => { v.executionEvidence.reportDigest = "sha256:" + "0".repeat(64); },
      ]) {
        const changed = clone(report); mutate(changed);
        expect(gradeFdeIngestion(challenge, { json: JSON.stringify(changed) }).pass).toBe(false);
      }
    } finally { lab.cleanup(); }
  });

  it("publishes the mission, visible references, exact commands, and template-only downloads", () => {
    const lesson = fs.readFileSync(path.join(ROOT, "content", "courses", COURSE_SLUG, "modules", MODULE_SLUG, "lessons", "02-prove-replay-safe-ingestion.mdx"), "utf8");
    for (const marker of ["fde-03-ingestion-mission", "source observations", "OCR confidence", "count and amount", "canonical-ID collision", "unresolved items remain quarantined", "Templates are not completed evidence", "does not mean HarbourCare has accepted"]) expect(lesson).toContain(marker);
    const commands = [...lesson.matchAll(/`(node companion-labs\/forward-deployed-ai-engineering\/scripts\/ingestion-lab\.mjs [^`]+)`/g)].map((match) => match[1]);
    expect(commands).toEqual([
      "node companion-labs/forward-deployed-ai-engineering/scripts/ingestion-lab.mjs ingest --state-dir \"$FDE_INGESTION_STATE_DIR\"",
      "node companion-labs/forward-deployed-ai-engineering/scripts/ingestion-lab.mjs reconcile --state-dir \"$FDE_INGESTION_STATE_DIR\"",
      "node companion-labs/forward-deployed-ai-engineering/scripts/ingestion-lab.mjs replay --state-dir \"$FDE_INGESTION_STATE_DIR\"",
      "node companion-labs/forward-deployed-ai-engineering/scripts/ingestion-lab.mjs report --state-dir \"$FDE_INGESTION_STATE_DIR\"",
    ]);
    const lab = isolatedLab();
    try { for (const action of ["ingest", "reconcile", "replay", "report"]) { const result = lab.run(action); expect(result.status, result.stderr).toBe(0); expect(() => JSON.parse(result.stdout)).not.toThrow(); } } finally { lab.cleanup(); }
    for (const file of ["ingestion-data-quality-report-template.json", "ingestion-lineage-quarantine-template.json"]) {
      const body = fs.readFileSync(path.join(ROOT, "public", "assets", "courses", COURSE_SLUG, "downloads", file), "utf8");
      expect(body).toContain('"evidenceStatus": "template-not-evidence"');
      expect(body).toContain('"customerAcceptance": "not-claimed"');
    }
    expect(JSON.parse(challenge.prefilled.template)).toMatchObject({ missionId: "fde-03-ingestion-mission", evidenceStatus: "template-not-evidence" });
    const course = buildCourseInventoryReport().courses.find((candidate) => candidate.slug === COURSE_SLUG);
    expect(course?.counts).toMatchObject({ modules: 12, lessons: 8, quizzes: 4, challenges: 4, downloads: 8, interactiveLessons: 4 });
    expect(course?.issues.brokenReferences).toEqual([]);
  });

  it("derives outcomes from authenticated fixture bytes", () => {
    expect(validSubmission()).toMatchObject({ evidenceStatus: "rubric-complete", lineage: expect.any(Array), executionEvidence: { reportDigest: expect.stringMatching(/^sha256:/) } });

    const lab = isolatedLab();
    try {
      fs.appendFileSync(path.join(lab.fixtureRoot, "scanned-invoices-v1.json"), "corrupt\n");
      const corrupt = lab.run("ingest");
      expect(corrupt.status).toBe(1);
      expect(corrupt.stderr).toContain("digest mismatch for scanned-invoices-v1.json");
    } finally { lab.cleanup(); }
  });

  it("fails closed on schema drift, collision, reconciliation mismatch, and traversal", () => {
    const cases: Array<[string, (lab: ReturnType<typeof isolatedLab>) => void, string]> = [
      ["schema", (lab) => {
        const p = path.join(lab.fixtureRoot, "erp-export-v1.json"); const value = JSON.parse(fs.readFileSync(p, "utf8")); value.rows[0].unexpected = true; fs.writeFileSync(p, `${JSON.stringify(value, null, 2)}\n`); lab.contract.inputs[1].digest = digest(fs.readFileSync(p)); lab.save(lab.contract);
      }, "contract digest mismatch against repository authority"],
      ["collision", (lab) => {
        const p = path.join(lab.fixtureRoot, "scanned-invoices-v1.json"); const value = JSON.parse(fs.readFileSync(p, "utf8")); value.records[1].sourceRecordId = "scan-001"; fs.writeFileSync(p, `${JSON.stringify(value, null, 2)}\n`); lab.contract.inputs[0].digest = digest(fs.readFileSync(p)); lab.save(lab.contract);
      }, "contract digest mismatch against repository authority"],
      ["reconcile", (lab) => {
        const p = path.join(lab.fixtureRoot, "erp-export-v1.json"); const value = JSON.parse(fs.readFileSync(p, "utf8")); value.rows[0].amount = "1,251.00"; fs.writeFileSync(p, `${JSON.stringify(value, null, 2)}\n`); lab.contract.inputs[1].digest = digest(fs.readFileSync(p)); lab.save(lab.contract);
      }, "contract digest mismatch against repository authority"],
      ["traversal", (lab) => { lab.contract.inputs[0].path = "../scanned-invoices-v1.json"; lab.save(lab.contract); }, "contract digest mismatch against repository authority"],
      ["authority", (lab) => { lab.contract.decisionAgent.authority = "production-write"; lab.save(lab.contract); }, "contract digest mismatch against repository authority"],
    ];
    for (const [, mutate, expected] of cases) {
      const lab = isolatedLab();
      try { mutate(lab); const result = lab.run("report"); expect(result.status).toBe(1); expect(result.stderr).toContain(expected); } finally { lab.cleanup(); }
    }
  });

  it("rejects renamed or recomputed fixtures and forged case, dataset, currency, or timestamp authority", () => {
    const mutations: Array<(lab: ReturnType<typeof isolatedLab>) => void> = [
      (lab) => { fs.renameSync(path.join(lab.fixtureRoot, "scanned-invoices-v1.json"), path.join(lab.fixtureRoot, "renamed-ocr.json")); lab.contract.inputs[0].path = "renamed-ocr.json"; lab.contract.inputs[0].digest = digest(fs.readFileSync(path.join(lab.fixtureRoot, "renamed-ocr.json"))); lab.save(lab.contract); },
      (lab) => { lab.contract.caseVersion = "forged-case"; lab.save(lab.contract); },
      (lab) => { lab.contract.datasetId = "forged-dataset"; lab.save(lab.contract); },
      (lab) => { lab.contract.recordContract.currency = "USD"; lab.save(lab.contract); },
      (lab) => { lab.contract.eventTimestamp = "2026-10-20T00:00:00.000Z"; lab.save(lab.contract); },
      (lab) => { const file = path.join(lab.fixtureRoot, "scanned-invoices-v1.json"); const value = JSON.parse(fs.readFileSync(file, "utf8")); value.records[0].currency.observed = "USD"; fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`); lab.contract.inputs[0].digest = digest(fs.readFileSync(file)); lab.save(lab.contract); },
    ];
    for (const mutate of mutations) {
      const lab = isolatedLab();
      try { mutate(lab); const result = lab.run("ingest"); expect(result.status).toBe(1); expect(result.stderr).toContain("contract digest mismatch against repository authority"); } finally { lab.cleanup(); }
    }
  });

  it("rejects symlinks and hardlinks at the fixture boundary", () => {
    for (const kind of ["symlink", "hardlink"] as const) {
      const lab = isolatedLab();
      try {
        const target = path.join(lab.fixtureRoot, "scanned-invoices-v1.json");
        const original = path.join(lab.root, "outside.json");
        fs.copyFileSync(target, original); fs.unlinkSync(target);
        if (kind === "symlink") fs.symlinkSync(original, target); else fs.linkSync(original, target);
        const result = lab.run("ingest");
        expect(result.status).toBe(1);
        expect(result.stderr).toMatch(kind === "symlink" ? /symlink input refused/ : /hardlinked input/);
      } finally { lab.cleanup(); }
    }
  });

  it("rejects swapped, symlinked, hardlinked, and path-traversal durable state", () => {
    const first = isolatedLab(); const second = isolatedLab();
    try {
      expect(first.run("ingest").status).toBe(0);
      expect(second.run("ingest").status).toBe(0);
      const firstState = path.join(first.stateDir, "ingestion-state.json");
      const secondState = path.join(second.stateDir, "ingestion-state.json");
      fs.copyFileSync(firstState, secondState);
      expect(second.run("replay").stderr).toMatch(/state integrity mismatch/);

      for (const kind of ["symlink", "hardlink"] as const) {
        fs.rmSync(second.stateDir, { recursive: true, force: true }); fs.mkdirSync(second.stateDir);
        const outside = path.join(second.root, `${kind}-state.json`); fs.copyFileSync(firstState, outside);
        if (kind === "symlink") fs.symlinkSync(outside, secondState); else fs.linkSync(outside, secondState);
        expect(second.run("replay").stderr).toMatch(kind === "symlink" ? /symlink input refused/ : /hardlinked input refused/);
      }
      const traversal = spawnSync(process.execPath, [LAB_PATH, "replay", "--state-dir", "/"], { cwd: ROOT, encoding: "utf8", env: { PATH: process.env.PATH ?? "", NODE_ENV: "test" } });
      expect(traversal.status).toBe(1); expect(traversal.stderr).toMatch(/explicit confined directory/);
    } finally { first.cleanup(); second.cleanup(); }
  });

  it("grades semantic sets strictly and rejects unsupported claims", () => {
    expect(gradeFdeIngestion(challenge, { json: JSON.stringify(validSubmission()) })).toEqual({ pass: true, score: 1, feedback: "Ingestion execution evidence is fixture-authority-bound, replay-authenticated, and lineage-complete; customer and production acceptance remain explicitly unclaimed." });
    const reordered = clone(validSubmission()) as any;
    reordered.acceptedRecords.reverse(); reordered.quarantine.reverse(); reordered.reconciliation.variances.reverse(); reordered.replayProof.unresolvedQuarantineIds.reverse(); reordered.decisionAgent.evidence.reverse();
    expect(gradeFdeIngestion(challenge, { json: JSON.stringify(reordered) }).pass).toBe(true);
    const mutations: Array<(value: any) => void> = [
      (v) => { v.fabricated = true; },
      (v) => { v.acceptedRecords[0].rawText = "secret"; },
      (v) => { v.quarantine[0].notes = "trust me"; },
      (v) => { v.quarantine[0].retryHistory[0].detail = "hidden"; },
      (v) => { v.reconciliation.accepted.extra = 1; },
      (v) => { v.reconciliation.variances[0].detail = "looks closed"; },
      (v) => { v.replayProof.duplicateAcceptedCount = 1; },
      (v) => { v.replayProof.contentLogged = false; },
      (v) => { v.replayProof.replayQuarantineCount = 1; },
      (v) => { v.evidenceStatus = "template-not-evidence"; },
      (v) => { v.customerAcceptance = "accepted"; },
      (v) => { v.decisionAgent.authority = "production-write"; },
      (v) => { v.decisionAgent.rawCredentialLogged = false; },
      (v) => { v.acceptedRecords[0].ocrAmountObserved = "1250.00"; },
      (v) => { v.quarantine[0].retryHistory = []; },
    ];
    for (const mutate of mutations) { const value = clone(validSubmission()); mutate(value); expect(gradeFdeIngestion(challenge, { json: JSON.stringify(value) }).pass).toBe(false); }
  });

  it("routes only repository-trusted metadata and never constructs a provider", async () => {
    const { POST } = await import("@/app/api/judge/route");
    const request = new NextRequest("http://localhost/api/judge", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ challengeId: challenge.id, environment: "llm-provider", userInput: { json: JSON.stringify(validSubmission()) } }) });
    const response = await POST(request);
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ pass: true, score: 1, _provider: "deterministic-fde-ingestion-v1" });
    expect(createJudgeLLM).not.toHaveBeenCalled(); expect(invoke).not.toHaveBeenCalled();
  });
});
