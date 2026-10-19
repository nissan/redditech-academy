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
  fs.cpSync(FIXTURE_PATH, fixtureRoot, { recursive: true, dereference: false });
  fs.copyFileSync(CASE_PATH, contractPath);
  const run = (...args: string[]) => spawnSync(process.execPath, [LAB_PATH, ...args], {
    cwd: ROOT,
    encoding: "utf8",
    env: { PATH: process.env.PATH ?? "", NODE_ENV: "test", FDE_INGESTION_FIXTURE_ROOT: fixtureRoot, FDE_INGESTION_CONTRACT: contractPath },
  });
  return {
    root, fixtureRoot, contractPath, run,
    contract: JSON.parse(fs.readFileSync(contractPath, "utf8")),
    save(contract: unknown) { fs.writeFileSync(contractPath, `${JSON.stringify(contract, null, 2)}\n`); },
    cleanup() { fs.rmSync(root, { recursive: true, force: true }); },
  };
}

function validSubmission(): Record<string, unknown> {
  return {
    contractVersion: "fde-ingestion-v1",
    missionId: "fde-03-ingestion-mission",
    evidenceStatus: "rubric-complete",
    customerAcceptance: "not-claimed",
    batchId: "batch-hc-2026-10-19-001",
    acceptedRecords: [
      { canonicalRecordId: "invoice:hc-inv-1001", sourceRecordId: "scan-001", erpRecordId: "erp-9001", outcomeId: "outcome:batch-hc-2026-10-19-001:scan-001", amountMinor: 125000, currency: "AUD", lineageIds: ["lineage:ocr:scan-001", "lineage:erp:erp-9001"], ocrAmountObserved: "1,250.00", ocrAmountConfidence: 0.98 },
      { canonicalRecordId: "invoice:hc-inv-1002", sourceRecordId: "scan-002", erpRecordId: "erp-9002", outcomeId: "outcome:batch-hc-2026-10-19-001:scan-002", amountMinor: 75000, currency: "AUD", lineageIds: ["lineage:ocr:scan-002", "lineage:erp:erp-9002"], ocrAmountObserved: "750.00", ocrAmountConfidence: 0.94 },
    ],
    quarantine: [
      { quarantineId: "quarantine:batch-hc-2026-10-19-001:scan-003", sourceRecordId: "scan-003", reasonId: "ocr-below-contract-threshold", evidenceIds: ["lineage:ocr:scan-003"], ownerId: "data-steward", retryHistory: [{ attemptId: "attempt:batch-hc-2026-10-19-001:scan-003:001", outcome: "quarantined", timestamp: "2026-10-19T00:00:00.000Z" }, { attemptId: "attempt:batch-hc-2026-10-19-001:scan-003:002", outcome: "quarantined", timestamp: "2026-10-19T00:00:00.000Z" }] },
      { quarantineId: "quarantine:batch-hc-2026-10-19-001:scan-004", sourceRecordId: "scan-004", reasonId: "canonical-id-collision", evidenceIds: ["lineage:ocr:scan-004", "lineage:ocr:scan-002"], ownerId: "data-steward", retryHistory: [{ attemptId: "attempt:batch-hc-2026-10-19-001:scan-004:001", outcome: "quarantined", timestamp: "2026-10-19T00:00:00.000Z" }, { attemptId: "attempt:batch-hc-2026-10-19-001:scan-004:002", outcome: "quarantined", timestamp: "2026-10-19T00:00:00.000Z" }] },
    ],
    reconciliation: {
      sourceObserved: { count: 4, amountMinor: 315000 },
      accepted: { count: 2, amountMinor: 200000 },
      quarantined: { count: 2, amountMinor: 115000 },
      erpObserved: { count: 3, amountMinor: 240000 },
      matchedErp: { count: 2, amountMinor: 200000 },
      unmatchedErp: { count: 1, amountMinor: 40000 },
      variances: [
        { varianceId: "source-partition-count", countDelta: 0, amountMinorDelta: 0 },
        { varianceId: "erp-partition-count", countDelta: 0, amountMinorDelta: 0 },
        { varianceId: "accepted-vs-matched-erp", countDelta: 0, amountMinorDelta: 0 },
      ],
    },
    replayProof: { firstAcceptedCount: 2, replayAcceptedCount: 2, duplicateAcceptedCount: 0, firstQuarantineCount: 2, replayQuarantineCount: 2, unresolvedQuarantineIds: ["quarantine:batch-hc-2026-10-19-001:scan-003", "quarantine:batch-hc-2026-10-19-001:scan-004"], operatorState: "replay-safe-with-unresolved-quarantine", postReplayProofId: "proof:batch-hc-2026-10-19-001:attempt-002" },
    decisionAgent: { id: "agent:challenge-owned-ingestion-rules-v1", type: "deterministic-rules-engine", role: "data-quality-decision", authority: "synthetic-fixture-only", action: "accept-or-quarantine", timestamp: "2026-10-19T00:00:00.000Z", reason: "contract-threshold-lineage-reconciliation", evidence: ["invoice-erp-v1.json", "scanned-invoices-v1.json", "erp-export-v1.json"], contractVersion: "fde-ingestion-v1" },
  };
}

describe("Forward Deployed AI Engineering C3b ingestion mission", () => {
  beforeEach(() => { invoke.mockReset(); createJudgeLLM.mockClear(); judgeProviderLabel.mockClear(); });

  it("publishes the mission, visible references, exact commands, and template-only downloads", () => {
    const lesson = fs.readFileSync(path.join(ROOT, "content", "courses", COURSE_SLUG, "modules", MODULE_SLUG, "lessons", "02-prove-replay-safe-ingestion.mdx"), "utf8");
    for (const marker of ["fde-03-ingestion-mission", "source observations", "OCR confidence", "count and amount", "canonical-ID collision", "unresolved items remain quarantined", "Templates are not completed evidence", "does not mean HarbourCare has accepted"]) expect(lesson).toContain(marker);
    const commands = [...lesson.matchAll(/`(node companion-labs\/forward-deployed-ai-engineering\/scripts\/ingestion-lab\.mjs [^`]+)`/g)].map((match) => match[1]);
    expect(commands).toEqual([
      "node companion-labs/forward-deployed-ai-engineering/scripts/ingestion-lab.mjs ingest",
      "node companion-labs/forward-deployed-ai-engineering/scripts/ingestion-lab.mjs reconcile",
      "node companion-labs/forward-deployed-ai-engineering/scripts/ingestion-lab.mjs replay",
      "node companion-labs/forward-deployed-ai-engineering/scripts/ingestion-lab.mjs report",
    ]);
    for (const command of commands) {
      const [, script, ...args] = command.split(" ");
      const result = spawnSync(process.execPath, [script, ...args], { cwd: ROOT, encoding: "utf8", env: { PATH: process.env.PATH ?? "", NODE_ENV: "test" } });
      expect(result.status, result.stderr).toBe(0);
      expect(() => JSON.parse(result.stdout)).not.toThrow();
    }
    for (const file of ["ingestion-data-quality-report-template.json", "ingestion-lineage-quarantine-template.json"]) {
      const body = fs.readFileSync(path.join(ROOT, "public", "assets", "courses", COURSE_SLUG, "downloads", file), "utf8");
      expect(body).toContain('"evidenceStatus": "template-not-evidence"');
      expect(body).toContain('"customerAcceptance": "not-claimed"');
    }
    expect(JSON.parse(challenge.prefilled.template)).toMatchObject({ contractVersion: "fde-ingestion-v1", evidenceStatus: "rubric-complete" });
    const course = buildCourseInventoryReport().courses.find((candidate) => candidate.slug === COURSE_SLUG);
    expect(course?.counts).toMatchObject({ modules: 12, lessons: 8, quizzes: 4, challenges: 4, downloads: 8, interactiveLessons: 4 });
    expect(course?.issues.brokenReferences).toEqual([]);
  });

  it("derives outcomes from authenticated fixture bytes", () => {
    const result = spawnSync(process.execPath, [LAB_PATH, "report"], { cwd: ROOT, encoding: "utf8", env: { PATH: process.env.PATH ?? "", NODE_ENV: "test" } });
    expect(result.status, result.stderr).toBe(0);
    expect(JSON.parse(result.stdout)).toEqual(validSubmission());

    const lab = isolatedLab();
    try {
      fs.appendFileSync(path.join(lab.fixtureRoot, "scanned-invoices-v1.json"), "corrupt\n");
      const corrupt = lab.run("report");
      expect(corrupt.status).toBe(1);
      expect(corrupt.stderr).toContain("digest mismatch for scanned-invoices-v1.json");
    } finally { lab.cleanup(); }
  });

  it("fails closed on schema drift, collision, reconciliation mismatch, and traversal", () => {
    const cases: Array<[string, (lab: ReturnType<typeof isolatedLab>) => void, string]> = [
      ["schema", (lab) => {
        const p = path.join(lab.fixtureRoot, "erp-export-v1.json"); const value = JSON.parse(fs.readFileSync(p, "utf8")); value.rows[0].unexpected = true; fs.writeFileSync(p, `${JSON.stringify(value, null, 2)}\n`); lab.contract.inputs[1].digest = digest(fs.readFileSync(p)); lab.save(lab.contract);
      }, "unknown ERP row field"],
      ["collision", (lab) => {
        const p = path.join(lab.fixtureRoot, "scanned-invoices-v1.json"); const value = JSON.parse(fs.readFileSync(p, "utf8")); value.records[1].sourceRecordId = "scan-001"; fs.writeFileSync(p, `${JSON.stringify(value, null, 2)}\n`); lab.contract.inputs[0].digest = digest(fs.readFileSync(p)); lab.save(lab.contract);
      }, "duplicate sourceRecordId"],
      ["reconcile", (lab) => {
        const p = path.join(lab.fixtureRoot, "erp-export-v1.json"); const value = JSON.parse(fs.readFileSync(p, "utf8")); value.rows[0].amount = "1,251.00"; fs.writeFileSync(p, `${JSON.stringify(value, null, 2)}\n`); lab.contract.inputs[1].digest = digest(fs.readFileSync(p)); lab.save(lab.contract);
      }, "accepted-vs-matched-erp variance"],
      ["traversal", (lab) => { lab.contract.inputs[0].path = "../scanned-invoices-v1.json"; lab.save(lab.contract); }, "unconfined path"],
      ["authority", (lab) => { lab.contract.decisionAgent.authority = "production-write"; lab.save(lab.contract); }, "untrusted decision agent metadata"],
    ];
    for (const [, mutate, expected] of cases) {
      const lab = isolatedLab();
      try { mutate(lab); const result = lab.run("report"); expect(result.status).toBe(1); expect(result.stderr).toContain(expected); } finally { lab.cleanup(); }
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
        const result = lab.run("report");
        expect(result.status).toBe(1);
        expect(result.stderr).toMatch(kind === "symlink" ? /symlink input refused/ : /hardlinked input/);
      } finally { lab.cleanup(); }
    }
  });

  it("grades semantic sets strictly and rejects unsupported claims", () => {
    expect(gradeFdeIngestion(challenge, { json: JSON.stringify(validSubmission()) })).toEqual({ pass: true, score: 1, feedback: "Ingestion evidence satisfies the deterministic rubric; customer and production acceptance remain explicitly unclaimed." });
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
