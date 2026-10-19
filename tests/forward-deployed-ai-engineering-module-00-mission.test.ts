import fs from "fs";
import os from "os";
import path from "path";
import { spawnSync } from "child_process";

import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import challenge from "@/content/courses/forward-deployed-ai-engineering/challenges/fde-00-discovery-mission.json";
import { gradeFdeDiscovery } from "@/lib/fde-discovery-grader";
import { buildCourseInventoryReport } from "@/scripts/course-inventory-report.mjs";

const invoke = vi.fn();
const createJudgeLLM = vi.fn(() => ({ invoke }));
const judgeProviderLabel = vi.fn(() => "forbidden-provider");

vi.mock("@/lib/judge-llm", () => ({ createJudgeLLM, judgeProviderLabel }));

const COURSE_SLUG = "forward-deployed-ai-engineering";
const MODULE_SLUG = "00-fde-operating-model-and-discovery";
const COURSE_DIR = path.join(process.cwd(), "content", "courses", COURSE_SLUG);
const DOWNLOAD_DIR = path.join(process.cwd(), "public", "assets", "courses", COURSE_SLUG, "downloads");

function validSubmission(): Record<string, unknown> {
  return {
    contractVersion: "fde-discovery-v1",
    missionId: "fde-00-discovery-mission",
    discovery: {
      customerRequestId: "harbourcare-procurement-assistant-v1",
      assumptions: [
        {
          id: "assumption-outbound-internet",
          ownerId: "persona-platform-operator",
          state: "unvalidated",
          validationEvidenceId: "evidence-connectivity-workshop",
        },
      ],
      stakeholders: [
        { id: "persona-north-procurement", decisionRightId: "accept-pilot-outcomes" },
        { id: "persona-north-security", decisionRightId: "accept-security-risk" },
        { id: "persona-platform-operator", decisionRightId: "accept-operability" },
        { id: "role-fde", decisionRightId: "produce-delivery-evidence" },
      ],
      outcomes: [
        {
          id: "outcome-cited-answer",
          actorId: "persona-north-procurement",
          behaviourId: "locate-cited-policy-answer",
          measureId: "18-of-20-under-120-seconds",
          safetyConditionId: "no-cross-tenant-context",
          evidenceWindowId: "four-week-pilot",
        },
        {
          id: "outcome-draft-only-purchase",
          actorId: "persona-north-procurement",
          behaviourId: "create-draft-purchase-request",
          measureId: "20-of-20-remain-draft",
          safetyConditionId: "independent-approval-required",
          evidenceWindowId: "four-week-pilot",
        },
      ],
      architecture: {
        insideBoundaryIds: ["local-user-interface", "policy-gateway", "synthetic-document-index"],
        outsideBoundaryIds: ["live-clinical-data", "production-erp-write", "cloud-model-provider"],
        trustBoundaryIds: ["authenticated-user-to-app", "app-to-synthetic-data"],
      },
      risks: [
        {
          id: "risk-connectivity-assumption",
          ownerId: "persona-platform-operator",
          responseId: "validate-before-pilot-entry",
          evidenceId: "evidence-connectivity-workshop",
        },
        {
          id: "risk-source-mislabel",
          ownerId: "persona-north-security",
          responseId: "metadata-quality-and-denial-tests",
          evidenceId: "evidence-metadata-quality-report",
        },
      ],
      nonGoalIds: ["no-live-data", "no-production-write", "no-approval-policy-replacement"],
      pilotSow: {
        timeboxId: "four-weeks",
        startDate: "2026-11-02",
        endDate: "2026-11-27",
        deliverableIds: [
          "week-1-discovery-baseline",
          "week-2-local-prototype",
          "week-3-adversarial-evaluation",
          "week-4-handoff-decision",
        ],
        entryCriteriaIds: ["synthetic-fixture-verified", "decision-owners-named"],
        exitCriteriaIds: ["outcome-scorecard-reviewed", "residual-risks-owned"],
        acceptanceOwnerIds: ["persona-north-procurement", "persona-north-security", "persona-platform-operator"],
      },
    },
    revisionHistory: [
      {
        revisionId: "revision-001-connected-proposal",
        previousRevisionId: null,
        assumptionId: "assumption-outbound-internet",
        designId: "design-cloud-dependent-observability",
        status: "superseded",
      },
      {
        revisionId: "revision-002-disconnected-production",
        previousRevisionId: "revision-001-connected-proposal",
        invalidAssumptionId: "assumption-outbound-internet",
        constraintId: "constraint-disconnected-production",
        affectedComponentIds: ["cloud-model-provider", "outbound-observability"],
        selectedAlternativeId: "alternative-local-cpu-fixture-stack",
        remainingRiskId: "risk-local-quality-latency-gap",
        status: "accepted",
      },
    ],
  };
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function setPath(input: Record<string, any>, dottedPath: string, value: unknown): void {
  const keys = dottedPath.replace(/\[(\d+)\]/g, ".$1").split(".");
  let current = input;
  for (const key of keys.slice(0, -1)) current = current[key];
  current[keys.at(-1)!] = value;
}

describe("Forward Deployed AI Engineering C0b discovery mission", () => {
  beforeEach(() => {
    invoke.mockReset();
    createJudgeLLM.mockClear();
    judgeProviderLabel.mockClear();
  });

  it("publishes one interactive mission and four synthetic/local downloads", () => {
    const lessonPath = path.join(
      COURSE_DIR,
      "modules",
      MODULE_SLUG,
      "lessons",
      "02-bound-the-pilot-mission.mdx"
    );
    const lesson = fs.readFileSync(lessonPath, "utf8");

    for (const marker of [
      'type: "interactive"',
      'environment: "json-editor"',
      'challengeId: "fde-00-discovery-mission"',
      "Changing constraint",
      "append-only",
      "Lab instructions",
      "no paid API",
    ]) {
      expect(lesson).toContain(marker);
    }

    const downloads = [
      "discovery-pilot-sow-template.md",
      "discovery-risk-register-template.md",
      "disconnected-production-adr-template.md",
      "discovery-evidence-submission-template.json",
    ];
    expect(fs.readdirSync(DOWNLOAD_DIR)).toEqual(expect.arrayContaining(downloads));
    for (const file of downloads) {
      const content = fs.readFileSync(path.join(DOWNLOAD_DIR, file), "utf8");
      expect(content).toMatch(/HarbourCare/);
      expect(content).toMatch(/synthetic/i);
      expect(content).not.toMatch(/sk-[A-Za-z0-9]{20,}|AKIA[A-Z0-9]{16}|Bearer\s+[A-Za-z0-9._-]{20,}/);
    }

    const course = buildCourseInventoryReport().courses.find((candidate) => candidate.slug === COURSE_SLUG);
    expect(course?.counts).toMatchObject({
      modules: 12,
      lessons: 6,
      quizzes: 3,
      challenges: 3,
      downloads: 6,
      interactiveLessons: 3,
    });
    expect(course?.issues.brokenReferences).toEqual([]);
    expect(course?.compatibilityBuckets.environmentCoverageGaps).toEqual([]);
    expect(course?.compatibilityBuckets.legacyTitleDescription).toEqual([]);
    expect(course?.compatibilityBuckets.missingEffectiveJsonEditorSeed).toEqual([]);
  });

  it("executes the exact learner-facing lab commands and reports the documented statuses", () => {
    const lessonPath = path.join(
      COURSE_DIR,
      "modules",
      MODULE_SLUG,
      "lessons",
      "02-bound-the-pilot-mission.mdx"
    );
    const lesson = fs.readFileSync(lessonPath, "utf8");
    const commands = [...lesson.matchAll(/`(node companion-labs\/forward-deployed-ai-engineering\/scripts\/lab-bootstrap\.mjs (?:setup|health|reset) --profile fixture)`/g)]
      .map((match) => match[1]);
    expect(commands).toEqual([
      "node companion-labs/forward-deployed-ai-engineering/scripts/lab-bootstrap.mjs setup --profile fixture",
      "node companion-labs/forward-deployed-ai-engineering/scripts/lab-bootstrap.mjs health --profile fixture",
      "node companion-labs/forward-deployed-ai-engineering/scripts/lab-bootstrap.mjs reset --profile fixture",
    ]);
    for (const marker of [
      "Expected output includes `status: ready`",
      "Expected output includes `status: healthy`",
      "Expected output is `status: reset`",
    ]) {
      expect(lesson).toContain(marker);
    }

    const parent = fs.mkdtempSync(path.join(os.tmpdir(), "fde-rendered-commands-"));
    const stateDir = path.join(parent, "state");
    try {
      const statuses = commands.map((command) => {
        const [, script, action, profileFlag, profile] = command.split(" ");
        const result = spawnSync(
          process.execPath,
          [script, action, profileFlag, profile, "--state-dir", stateDir],
          {
            cwd: process.cwd(),
            encoding: "utf8",
            env: { PATH: process.env.PATH ?? "", NODE_ENV: "test" },
          }
        );
        expect(result.status, result.stderr).toBe(0);
        return JSON.parse(result.stdout);
      });
      expect(statuses).toEqual([
        expect.objectContaining({ status: "ready", profile: "fixture", networkEgress: "deny" }),
        expect.objectContaining({ status: "healthy", profile: "fixture", networkEgress: "deny" }),
        { status: "reset", profile: "fixture" },
      ]);
    } finally {
      fs.rmSync(parent, { recursive: true, force: true });
    }
  });

  it("accepts the complete FDE-02 rubric and append-only FDE-03 revision", () => {
    expect(gradeFdeDiscovery(challenge, { json: JSON.stringify(validSubmission()) })).toEqual({
      pass: true,
      score: 1,
      feedback: "Discovery evidence satisfies the pilot rubric and preserves the superseded design in append-only history.",
    });
  });

  it("keeps the visible editor seed parseable and aligned with trusted options", () => {
    const seed = JSON.parse(challenge.prefilled.template);
    expect(seed).toMatchObject({
      contractVersion: "fde-discovery-v1",
      missionId: challenge.id,
    });
    expect(seed.discovery.assumptions[0].id).toBe("SELECT_FROM_TRUSTED_OPTIONS");
    expect(seed.revisionHistory.map((revision: { revisionId: string }) => revision.revisionId)).toEqual([
      "revision-001-connected-proposal",
      "revision-002-disconnected-production",
    ]);
    expect(challenge.prefilled.trusted_options.assumptionIds).toEqual([
      expect.objectContaining({
        id: "assumption-outbound-internet",
        appliesTo: ["discovery.assumptions[0].id", "revisionHistory[1].invalidAssumptionId"],
      }),
    ]);
    expect(() => JSON.parse(
      fs.readFileSync(path.join(DOWNLOAD_DIR, "discovery-evidence-submission-template.json"), "utf8")
    )).not.toThrow();
  });

  it("rejects lookalike challenges outside the exact trusted grading boundary", () => {
    const lookalike = clone(challenge);
    lookalike.grading.type = "caller-selected-provider";
    expect(gradeFdeDiscovery(lookalike, { json: JSON.stringify(validSubmission()) })).toEqual({
      pass: false,
      score: 0,
      feedback: "Challenge is outside the trusted FDE discovery grading boundary.",
    });
  });

  it.each([
    ["discovery.assumptions[0].id", "fabricated-assumption"],
    ["discovery.stakeholders[1].decisionRightId", "fde-accepts-risk"],
    ["discovery.outcomes[0].measureId", "looks-good"],
    ["discovery.outcomes[1].safetyConditionId", "none"],
    ["discovery.architecture.insideBoundaryIds", ["cloud-model-provider"]],
    ["discovery.risks[0].ownerId", "role-fde"],
    ["discovery.nonGoalIds", []],
    ["discovery.pilotSow.timeboxId", "open-ended"],
    ["discovery.pilotSow.endDate", "2026-12-31"],
  ])("rejects incomplete or fabricated rubric evidence at %s", (field, value) => {
    const submission = clone(validSubmission());
    setPath(submission, field, value);
    expect(gradeFdeDiscovery(challenge, { json: JSON.stringify(submission) }).pass).toBe(false);
  });

  it.each([
    ["revisionHistory[0].status", "deleted"],
    ["revisionHistory[1].previousRevisionId", null],
    ["revisionHistory[1].invalidAssumptionId", "fabricated-assumption"],
    ["revisionHistory[1].affectedComponentIds", ["unrelated-component"]],
    ["revisionHistory[1].selectedAlternativeId", "keep-cloud-design"],
    ["revisionHistory[1].remainingRiskId", "none"],
  ])("rejects rewritten or unbound changing-constraint history at %s", (field, value) => {
    const submission = clone(validSubmission());
    setPath(submission, field, value);
    expect(gradeFdeDiscovery(challenge, { json: JSON.stringify(submission) }).pass).toBe(false);
  });

  it.each([
    { json: "{" },
    { json: JSON.stringify({ ...validSubmission(), missionId: "other-mission" }) },
    { json: JSON.stringify({ ...validSubmission(), contractVersion: "future-contract" }) },
    { json: JSON.stringify({ ...validSubmission(), discovery: "keyword stuffed assumptions stakeholders outcomes architecture boundaries risks non-goals SOW" }) },
  ])("fails closed for malformed or spoofed submissions", (userInput) => {
    expect(gradeFdeDiscovery(challenge, userInput).pass).toBe(false);
  });

  it("routes only the trusted challenge-owned grading type and never constructs a provider", async () => {
    const { POST } = await import("@/app/api/judge/route");
    const request = new NextRequest("http://academy.invalid/api/judge", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        challengeId: challenge.id,
        environment: "forged-provider-bypass",
        userInput: { json: JSON.stringify(validSubmission()) },
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      pass: true,
      score: 1,
      _provider: "deterministic-fde-discovery-v1",
    });
    expect(createJudgeLLM).not.toHaveBeenCalled();
    expect(judgeProviderLabel).not.toHaveBeenCalled();
    expect(invoke).not.toHaveBeenCalled();
  });
});
