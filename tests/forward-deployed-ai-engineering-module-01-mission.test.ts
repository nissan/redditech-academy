import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";

import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import challenge from "@/content/courses/forward-deployed-ai-engineering/challenges/fde-01-access-policy-mission.json";
import { gradeFdeAccessPolicy } from "@/lib/fde-access-policy-grader";
import { buildCourseInventoryReport } from "@/scripts/course-inventory-report.mjs";

const invoke = vi.fn();
const createJudgeLLM = vi.fn(() => ({ invoke }));
const judgeProviderLabel = vi.fn(() => "forbidden-provider");

vi.mock("@/lib/judge-llm", () => ({ createJudgeLLM, judgeProviderLabel }));

const COURSE_SLUG = "forward-deployed-ai-engineering";
const MODULE_SLUG = "01-enterprise-identity-and-isolation";
const COURSE_DIR = path.join(process.cwd(), "content", "courses", COURSE_SLUG);
const DOWNLOAD_DIR = path.join(process.cwd(), "public", "assets", "courses", COURSE_SLUG, "downloads");
const POLICY_PATH = path.join(
  process.cwd(),
  "companion-labs",
  COURSE_SLUG,
  "policies",
  "access-policy-v1.json"
);

function validSubmission(): Record<string, unknown> {
  return {
    contractVersion: "fde-access-policy-v1",
    missionId: "fde-01-access-policy-mission",
    evidenceStatus: "rubric-complete",
    customerAcceptance: "not-claimed",
    accessMatrix: [
      {
        caseId: "authorized-human-document-read",
        identityKind: "human",
        lifecycleState: "active",
        tenantId: "tenant-north",
        roleIds: ["procurement_owner"],
        resourceId: "doc-north-procurement-policy",
        actionId: "read_document",
        expectedDecision: "allow",
      },
      {
        caseId: "authorized-service-document-read",
        identityKind: "service",
        lifecycleState: "active",
        tenantId: "tenant-north",
        roleIds: ["retrieval_worker"],
        resourceId: "doc-north-procurement-policy",
        actionId: "read_document",
        expectedDecision: "allow",
      },
      {
        caseId: "denied-moved-human-cross-tenant-read",
        identityKind: "human",
        lifecycleState: "active",
        tenantId: "tenant-south",
        roleIds: ["procurement_owner"],
        resourceId: "doc-north-staff-contact",
        actionId: "read_document",
        expectedDecision: "deny",
      },
      {
        caseId: "denied-deprovisioned-human-read",
        identityKind: "human",
        lifecycleState: "deprovisioned",
        tenantId: "tenant-north",
        roleIds: ["procurement_owner"],
        resourceId: "doc-north-procurement-policy",
        actionId: "read_document",
        expectedDecision: "deny",
      },
      {
        caseId: "denied-cross-business-unit-action",
        identityKind: "human",
        lifecycleState: "active",
        tenantId: "tenant-south",
        roleIds: ["procurement_owner"],
        resourceId: "erp-po-north-1001",
        actionId: "draft_purchase",
        expectedDecision: "deny",
      },
    ],
    policyTraces: [
      {
        caseId: "authorized-human-document-read",
        decision: "allow",
        reasonCodeIds: ["lifecycle-active", "tenant-match", "role-action-allowed", "document-policy-allowed"],
        enforcementPointId: "before-protected-retrieval",
        retrievalAttempted: true,
        contextAssembled: true,
        toolInvoked: false,
        contentLogged: false,
        rawCredentialLogged: false,
      },
      {
        caseId: "authorized-service-document-read",
        decision: "allow",
        reasonCodeIds: ["lifecycle-active", "tenant-match", "service-scope-allowed", "document-policy-allowed"],
        enforcementPointId: "before-protected-retrieval",
        retrievalAttempted: true,
        contextAssembled: true,
        toolInvoked: false,
        contentLogged: false,
        rawCredentialLogged: false,
      },
      {
        caseId: "denied-moved-human-cross-tenant-read",
        decision: "deny",
        reasonCodeIds: ["tenant-mismatch"],
        enforcementPointId: "before-protected-retrieval",
        retrievalAttempted: false,
        contextAssembled: false,
        toolInvoked: false,
        contentLogged: false,
        rawCredentialLogged: false,
      },
      {
        caseId: "denied-deprovisioned-human-read",
        decision: "deny",
        reasonCodeIds: ["lifecycle-inactive"],
        enforcementPointId: "before-protected-retrieval",
        retrievalAttempted: false,
        contextAssembled: false,
        toolInvoked: false,
        contentLogged: false,
        rawCredentialLogged: false,
      },
      {
        caseId: "denied-cross-business-unit-action",
        decision: "deny",
        reasonCodeIds: ["tenant-mismatch"],
        enforcementPointId: "before-downstream-tool",
        retrievalAttempted: false,
        contextAssembled: false,
        toolInvoked: false,
        contentLogged: false,
        rawCredentialLogged: false,
      },
    ],
  };
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

describe("Forward Deployed AI Engineering C1b access-policy mission", () => {
  beforeEach(() => {
    invoke.mockReset();
    createJudgeLLM.mockClear();
    judgeProviderLabel.mockClear();
  });

  it("publishes the mission, trusted references, lab instructions, and an evidence aid", () => {
    const lessonPath = path.join(COURSE_DIR, "modules", MODULE_SLUG, "lessons", "02-enforce-policy-before-context.mdx");
    const lesson = fs.readFileSync(lessonPath, "utf8");
    for (const marker of [
      'type: "interactive"',
      'environment: "json-editor"',
      'challengeId: "fde-01-access-policy-mission"',
      "Provisioning and deprovisioning",
      "Human and service identities",
      "before protected retrieval",
      "before downstream tool",
      "no restricted content or raw credential",
      "Passing the rubric does not mean HarbourCare has accepted",
      "Templates are not completed evidence",
      "Lab instructions",
    ]) expect(lesson).toContain(marker);

    const evidenceAid = fs.readFileSync(path.join(DOWNLOAD_DIR, "identity-access-evidence-template.json"), "utf8");
    expect(() => JSON.parse(evidenceAid)).not.toThrow();
    expect(evidenceAid).toContain('"evidenceStatus": "template-not-evidence"');
    expect(evidenceAid).toContain('"customerAcceptance": "not-claimed"');

    const seed = JSON.parse(challenge.prefilled.template);
    expect(seed.accessMatrix.length).toBe(5);
    expect(seed.policyTraces.length).toBe(5);
    expect(Object.keys(challenge.prefilled.trusted_options).sort()).toEqual([
      "actionIds",
      "decisionIds",
      "enforcementPointIds",
      "identityKindIds",
      "lifecycleStateIds",
      "reasonCodeIds",
      "roleIds",
    ]);
    for (const options of Object.values(challenge.prefilled.trusted_options)) {
      for (const option of options) {
        expect(option).toEqual(expect.objectContaining({ id: expect.any(String), meaning: expect.any(String), appliesTo: expect.any(Array) }));
      }
    }

    const course = buildCourseInventoryReport().courses.find((candidate) => candidate.slug === COURSE_SLUG);
    expect(course?.counts).toMatchObject({ modules: 12, lessons: 7, quizzes: 4, challenges: 3, downloads: 6, interactiveLessons: 3 });
    expect(course?.issues.brokenReferences).toEqual([]);
  });

  it("executes the exact rendered policy-lab commands with deterministic redacted traces", () => {
    const lesson = fs.readFileSync(
      path.join(COURSE_DIR, "modules", MODULE_SLUG, "lessons", "02-enforce-policy-before-context.mdx"),
      "utf8"
    );
    const commands = [...lesson.matchAll(/`(node companion-labs\/forward-deployed-ai-engineering\/scripts\/policy-lab\.mjs run --case (?:authorized-human-document-read|denied-moved-human-cross-tenant-read|denied-cross-business-unit-action))`/g)]
      .map((match) => match[1]);
    expect(commands).toHaveLength(3);

    const results = commands.map((command) => {
      const [, script, action, caseFlag, caseId] = command.split(" ");
      const result = spawnSync(process.execPath, [script, action, caseFlag, caseId], {
        cwd: process.cwd(),
        encoding: "utf8",
        env: { PATH: process.env.PATH ?? "", NODE_ENV: "test" },
      });
      expect(result.status, result.stderr).toBe(0);
      return JSON.parse(result.stdout);
    });
    expect(results.map((result) => result.decision)).toEqual(["allow", "deny", "deny"]);
    expect(results[0]).toMatchObject({ retrievalAttempted: true, contextAssembled: true, toolInvoked: false });
    expect(results[1]).toMatchObject({ retrievalAttempted: false, contextAssembled: false, toolInvoked: false });
    expect(results[2]).toMatchObject({ retrievalAttempted: false, contextAssembled: false, toolInvoked: false });
    for (const result of results) {
      expect(result).toMatchObject({ contentLogged: false, rawCredentialLogged: false, policyVersion: "harbourcare-access-policy-v1" });
      expect(JSON.stringify(result)).not.toMatch(/north\.buyer@|Purchases above|Bearer\s|session_cookie/);
    }
  });

  it("ships a versioned synthetic policy contract covering identity lifecycle and both enforcement boundaries", () => {
    const policy = JSON.parse(fs.readFileSync(POLICY_PATH, "utf8"));
    expect(policy).toMatchObject({
      contractVersion: "1.0.0",
      policyVersion: "harbourcare-access-policy-v1",
      datasetId: "harbourcare-synthetic-v1",
      fictional: true,
      containsRealPersonalData: false,
      logging: { restrictedContent: false, rawCredentials: false },
    });
    expect(new Set(policy.identities.map((identity: { kind: string }) => identity.kind))).toEqual(new Set(["human", "service"]));
    expect(new Set(policy.identities.map((identity: { lifecycleState: string }) => identity.lifecycleState))).toEqual(new Set(["active", "deprovisioned"]));
    expect(policy.cases.map((entry: { id: string }) => entry.id).sort()).toEqual(
      (validSubmission().accessMatrix as Array<{ caseId: string }>).map((entry) => entry.caseId).sort()
    );
  });

  it("accepts rubric-complete evidence without claiming customer acceptance", () => {
    expect(gradeFdeAccessPolicy(challenge, { json: JSON.stringify(validSubmission()) })).toEqual({
      pass: true,
      score: 1,
      feedback: "Access evidence satisfies the deterministic rubric; customer acceptance remains explicitly unclaimed.",
    });
  });

  it("treats matrix rows, traces, role IDs, and reason codes as semantic sets", () => {
    const submission = clone(validSubmission()) as any;
    submission.accessMatrix.reverse();
    submission.policyTraces.reverse();
    submission.accessMatrix[0].roleIds.reverse();
    submission.policyTraces[0].reasonCodeIds.reverse();
    expect(gradeFdeAccessPolicy(challenge, { json: JSON.stringify(submission) }).pass).toBe(true);
  });

  it.each([
    ["unknown root", (submission: any) => { submission.fabricated = true; }],
    ["unknown matrix field", (submission: any) => { submission.accessMatrix[0].notes = "looks safe"; }],
    ["unknown trace field", (submission: any) => { submission.policyTraces[0].payload = "hidden"; }],
    ["duplicate matrix case", (submission: any) => { submission.accessMatrix[1].caseId = submission.accessMatrix[0].caseId; }],
    ["fabricated case", (submission: any) => { submission.policyTraces[0].caseId = "fabricated"; }],
    ["customer acceptance claim", (submission: any) => { submission.customerAcceptance = "accepted"; }],
    ["template evidence", (submission: any) => { submission.evidenceStatus = "template-not-evidence"; }],
    ["content logging", (submission: any) => { submission.policyTraces[0].contentLogged = true; }],
    ["credential logging", (submission: any) => { submission.policyTraces[0].rawCredentialLogged = true; }],
    ["post-context denial", (submission: any) => { submission.policyTraces[2].contextAssembled = true; }],
    ["post-tool denial", (submission: any) => { submission.policyTraces[4].toolInvoked = true; }],
  ])("rejects %s", (_label, mutate) => {
    const submission = clone(validSubmission());
    mutate(submission);
    expect(gradeFdeAccessPolicy(challenge, { json: JSON.stringify(submission) }).pass).toBe(false);
  });

  it("rejects challenge metadata lookalikes", () => {
    const lookalike = clone(challenge);
    lookalike.grading.contractVersion = "caller-selected";
    expect(gradeFdeAccessPolicy(lookalike, { json: JSON.stringify(validSubmission()) })).toEqual({
      pass: false,
      score: 0,
      feedback: "Challenge is outside the trusted FDE access-policy grading boundary.",
    });
  });

  it("routes only trusted challenge metadata and constructs or invokes no provider", async () => {
    const { POST } = await import("@/app/api/judge/route");
    const response = await POST(new NextRequest("http://academy.invalid/api/judge", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        challengeId: challenge.id,
        environment: "forged-provider-bypass",
        userInput: { json: JSON.stringify(validSubmission()) },
      }),
    }));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ pass: true, score: 1, _provider: "deterministic-fde-access-policy-v1" });
    expect(createJudgeLLM).not.toHaveBeenCalled();
    expect(judgeProviderLabel).not.toHaveBeenCalled();
    expect(invoke).not.toHaveBeenCalled();
  });
});
