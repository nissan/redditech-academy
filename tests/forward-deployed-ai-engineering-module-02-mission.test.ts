import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";

import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import challenge from "@/content/courses/forward-deployed-ai-engineering/challenges/fde-02-private-deployment-mission.json";
import { gradeFdePrivateDeployment } from "@/lib/fde-private-deployment-grader";
import { buildCourseInventoryReport } from "@/scripts/course-inventory-report.mjs";

const invoke = vi.fn();
const createJudgeLLM = vi.fn(() => ({ invoke }));
const judgeProviderLabel = vi.fn(() => "forbidden-provider");

vi.mock("@/lib/judge-llm", () => ({ createJudgeLLM, judgeProviderLabel }));

const COURSE_SLUG = "forward-deployed-ai-engineering";
const MODULE_SLUG = "02-private-and-disconnected-deployment";
const COURSE_DIR = path.join(process.cwd(), "content", "courses", COURSE_SLUG);
const DOWNLOAD_DIR = path.join(process.cwd(), "public", "assets", "courses", COURSE_SLUG, "downloads");
const CASE_PATH = path.join(process.cwd(), "companion-labs", COURSE_SLUG, "deployments", "private-deployment-v1.json");

function validSubmission(): Record<string, unknown> {
  return {
    contractVersion: "fde-private-deployment-v1",
    missionId: "fde-02-private-deployment-mission",
    evidenceStatus: "rubric-complete",
    customerAcceptance: "not-claimed",
    deploymentProfileId: "harbourcare-disconnected-v1",
    artifactInventory: [
      { artifactId: "app-image", version: "1.4.0", digest: "sha256:14a0a4a1f0b1c2d3e4f506172839405162738495a6b7c8d9e0f1029384756abc", path: "bundle/images/harbourcare-assistant-1.4.0.oci", required: true },
      { artifactId: "schema-migration", version: "2026.10.1", digest: "sha256:2222222222222222222222222222222222222222222222222222222222222222", path: "bundle/migrations/2026.10.1.sql", required: true },
      { artifactId: "policy-bundle", version: "3.2.1", digest: "sha256:3333333333333333333333333333333333333333333333333333333333333333", path: "bundle/policies/harbourcare-3.2.1.json", required: true },
      { artifactId: "deployment-manifest", version: "1.4.0", digest: "sha256:4444444444444444444444444444444444444444444444444444444444444444", path: "bundle/manifests/disconnected-1.4.0.yaml", required: true },
    ],
    dependencyInventory: [
      { dependencyId: "node-runtime", version: "24.18.0", digest: "sha256:5555555555555555555555555555555555555555555555555555555555555555", path: "bundle/runtime/node-v24.18.0", timing: "runtime", required: true },
      { dependencyId: "local-database", version: "16.4", digest: "sha256:6666666666666666666666666666666666666666666666666666666666666666", path: "bundle/services/database-16.4.oci", timing: "runtime", required: true },
      { dependencyId: "internal-dns", version: "harbourcare-2026.10", digest: "sha256:7777777777777777777777777777777777777777777777777777777777777777", path: "bundle/config/internal-dns-2026.10.json", timing: "runtime", required: true },
    ],
    healthChecks: [
      { checkId: "startup-artifact-and-schema", status: "pass", trafficAccepted: false, dependencyId: "local-filesystem" },
      { checkId: "readiness-bounded-workflow", status: "pass", trafficAccepted: true, dependencyId: "local-database" },
      { checkId: "liveness-progress", status: "pass", trafficAccepted: true, dependencyId: "local-process" },
      { checkId: "dependency-local-database", status: "pass", trafficAccepted: false, dependencyId: "local-database" },
    ],
    networkTests: [
      { testId: "default-deny-baseline", decision: "deny", destination: "0.0.0.0/0", port: "all", exceptionId: null, ownerId: null, purpose: "deny-undeclared-egress", reviewDate: null, contentLogged: false, rawCredentialLogged: false },
      { testId: "narrow-internal-dns", decision: "allow", destination: "10.40.0.53/32", port: "udp/53", exceptionId: "internal-dns-only", ownerId: "platform-operator", purpose: "resolve-declared-internal-services", reviewDate: "2026-11-19", contentLogged: false, rawCredentialLogged: false },
      { testId: "undeclared-public-registry", decision: "deny", destination: "registry.example.invalid", port: "tcp/443", exceptionId: null, ownerId: null, purpose: "prove-public-registry-blocked", reviewDate: null, contentLogged: false, rawCredentialLogged: false },
    ],
    offlineTests: [
      { caseId: "complete-bundle", result: "success", downloadAttempted: false, missingArtifactId: null, missingVersion: null, missingDigest: null, expectedPath: null, egressWeakened: false },
      { caseId: "missing-policy-bundle", result: "blocked-before-mutation", downloadAttempted: false, missingArtifactId: "policy-bundle", missingVersion: "3.2.1", missingDigest: "sha256:3333333333333333333333333333333333333333333333333333333333333333", expectedPath: "bundle/policies/harbourcare-3.2.1.json", egressWeakened: false },
    ],
    rollbackEvidence: {
      triggerId: "readiness-window-exceeded",
      trafficStateDuringRecovery: "off",
      networkPolicy: "default-deny-enforced",
      backupArtifactId: "backup-state-1.3.2",
      backupDigest: "sha256:8888888888888888888888888888888888888888888888888888888888888888",
      backupDigestVerified: true,
      stateAuthenticated: true,
      compatibilityDecision: "schema-data-compatible-with-1.3.2",
      recoveryPathId: "tested-forward-recovery-1.3.2",
      restoredApplicationVersion: "1.3.2",
      recoverySequence: ["traffic-off", "authenticate-backup-and-state", "establish-schema-data-compatibility", "execute-tested-recovery", "restore-accepted-application", "verify-health-workflow-egress", "resume-traffic"],
      verificationIds: ["startup-readiness-liveness-dependency", "bounded-workflow", "undeclared-egress-denied"],
      trafficResumedAfterVerification: true,
      contentLogged: false,
      rawCredentialLogged: false,
    },
  };
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

describe("Forward Deployed AI Engineering C2b private-deployment mission", () => {
  beforeEach(() => {
    invoke.mockReset();
    createJudgeLLM.mockClear();
    judgeProviderLabel.mockClear();
  });

  it("publishes the mission, learner-visible references, executable instructions, and evidence aid", () => {
    const lessonPath = path.join(COURSE_DIR, "modules", MODULE_SLUG, "lessons", "02-prove-the-disconnected-release.mdx");
    const lesson = fs.readFileSync(lessonPath, "utf8");
    for (const marker of [
      'type: "interactive"',
      'environment: "json-editor"',
      'challengeId: "fde-02-private-deployment-mission"',
      "exact artifact ID, version, digest, and expected path",
      "default-deny",
      "startup, readiness, liveness, and dependency health",
      "traffic stays off",
      "schema and data compatibility",
      "Templates are not completed evidence",
      "Passing the rubric does not mean HarbourCare has accepted",
      "Lab instructions",
    ]) expect(lesson).toContain(marker);

    const evidenceAid = fs.readFileSync(path.join(DOWNLOAD_DIR, "private-deployment-evidence-template.json"), "utf8");
    expect(() => JSON.parse(evidenceAid)).not.toThrow();
    expect(evidenceAid).toContain('"evidenceStatus": "template-not-evidence"');
    expect(evidenceAid).toContain('"customerAcceptance": "not-claimed"');

    const seed = JSON.parse(challenge.prefilled.template);
    expect(seed.artifactInventory).toHaveLength(4);
    expect(seed.dependencyInventory).toHaveLength(3);
    expect(seed.healthChecks).toHaveLength(4);
    expect(seed.networkTests).toHaveLength(3);
    expect(seed.offlineTests).toHaveLength(2);
    for (const options of Object.values(challenge.prefilled.trusted_options)) {
      for (const option of options) {
        expect(option).toEqual(expect.objectContaining({ id: expect.any(String), meaning: expect.any(String), appliesTo: expect.any(Array) }));
      }
    }

    const course = buildCourseInventoryReport().courses.find((candidate) => candidate.slug === COURSE_SLUG);
    expect(course?.counts).toMatchObject({ modules: 12, lessons: 6, quizzes: 3, challenges: 3, downloads: 6, interactiveLessons: 3 });
    expect(course?.issues.brokenReferences).toEqual([]);
  });

  it("executes every exact rendered deployment-lab command", () => {
    const lesson = fs.readFileSync(path.join(COURSE_DIR, "modules", MODULE_SLUG, "lessons", "02-prove-the-disconnected-release.mdx"), "utf8");
    const commands = [...lesson.matchAll(/`(node companion-labs\/forward-deployed-ai-engineering\/scripts\/deployment-lab\.mjs [^`]+)`/g)].map((match) => match[1]);
    expect(commands).toEqual([
      "node companion-labs/forward-deployed-ai-engineering/scripts/deployment-lab.mjs inventory",
      "node companion-labs/forward-deployed-ai-engineering/scripts/deployment-lab.mjs health",
      "node companion-labs/forward-deployed-ai-engineering/scripts/deployment-lab.mjs network",
      "node companion-labs/forward-deployed-ai-engineering/scripts/deployment-lab.mjs offline --case complete-bundle",
      "node companion-labs/forward-deployed-ai-engineering/scripts/deployment-lab.mjs offline --case missing-policy-bundle",
      "node companion-labs/forward-deployed-ai-engineering/scripts/deployment-lab.mjs rollback",
    ]);
    const results = commands.map((command) => {
      const [, script, ...args] = command.split(" ");
      const result = spawnSync(process.execPath, [script, ...args], {
        cwd: process.cwd(), encoding: "utf8", env: { PATH: process.env.PATH ?? "", NODE_ENV: "test" },
      });
      expect(result.status, result.stderr).toBe(0);
      return JSON.parse(result.stdout);
    });
    expect(results[3]).toMatchObject({ result: "success", downloadAttempted: false, egressWeakened: false });
    expect(results[4]).toMatchObject({ result: "blocked-before-mutation", missingArtifactId: "policy-bundle", missingVersion: "3.2.1", expectedPath: "bundle/policies/harbourcare-3.2.1.json" });
    expect(results[5]).toMatchObject({ trafficStateDuringRecovery: "off", backupDigestVerified: true, stateAuthenticated: true, restoredApplicationVersion: "1.3.2", trafficResumedAfterVerification: true });
    expect(JSON.stringify(results)).not.toMatch(/Bearer\s|password|session_cookie|api[_-]?key/i);
  });

  it("ships a versioned fictional contract with exact authenticated artifacts and disconnected assumptions", () => {
    const contract = JSON.parse(fs.readFileSync(CASE_PATH, "utf8"));
    expect(contract).toMatchObject({ contractVersion: "1.0.0", caseVersion: "harbourcare-private-deployment-v1", datasetId: "harbourcare-synthetic-v1", fictional: true, containsRealPersonalData: false });
    expect(contract.assumptions).toMatchObject({ publicEgress: "denied", undeclaredDownloads: "forbidden", targetNetwork: "disconnected-after-reviewed-transfer" });
    expect(contract.artifacts).toEqual(validSubmission().artifactInventory);
    expect(contract.dependencies).toEqual(validSubmission().dependencyInventory);
  });

  it("accepts rubric-complete deployment evidence without claiming customer acceptance", () => {
    expect(gradeFdePrivateDeployment(challenge, { json: JSON.stringify(validSubmission()) })).toEqual({
      pass: true,
      score: 1,
      feedback: "Private deployment evidence satisfies the deterministic rubric; customer acceptance remains explicitly unclaimed.",
    });
  });

  it("treats inventories, test collections, checks, and verification IDs as semantic sets", () => {
    const submission = clone(validSubmission()) as any;
    submission.artifactInventory.reverse();
    submission.dependencyInventory.reverse();
    submission.healthChecks.reverse();
    submission.networkTests.reverse();
    submission.offlineTests.reverse();
    submission.rollbackEvidence.verificationIds.reverse();
    expect(gradeFdePrivateDeployment(challenge, { json: JSON.stringify(submission) }).pass).toBe(true);
  });

  it.each([
    ["unknown root", (submission: any) => { submission.fabricated = true; }],
    ["unknown artifact field", (submission: any) => { submission.artifactInventory[0].source = "remote"; }],
    ["unknown dependency field", (submission: any) => { submission.dependencyInventory[0].url = "https://example.invalid"; }],
    ["unknown health field", (submission: any) => { submission.healthChecks[0].detail = "healthy"; }],
    ["unknown network field", (submission: any) => { submission.networkTests[0].packet = "hidden"; }],
    ["unknown offline field", (submission: any) => { submission.offlineTests[0].fallback = "download"; }],
    ["unknown rollback field", (submission: any) => { submission.rollbackEvidence.notes = "looks safe"; }],
    ["duplicate artifact", (submission: any) => { submission.artifactInventory[1].artifactId = submission.artifactInventory[0].artifactId; }],
    ["customer acceptance claim", (submission: any) => { submission.customerAcceptance = "accepted"; }],
    ["template evidence", (submission: any) => { submission.evidenceStatus = "template-not-evidence"; }],
    ["missing artifact without exact digest", (submission: any) => { submission.offlineTests[1].missingDigest = null; }],
    ["undeclared download", (submission: any) => { submission.offlineTests[0].downloadAttempted = true; }],
    ["weakened egress", (submission: any) => { submission.offlineTests[1].egressWeakened = true; }],
    ["broad egress exception", (submission: any) => { submission.networkTests[1].destination = "10.40.0.0/16"; }],
    ["unowned egress exception", (submission: any) => { submission.networkTests[1].ownerId = null; }],
    ["content logging", (submission: any) => { submission.networkTests[2].contentLogged = true; }],
    ["credential logging", (submission: any) => { submission.rollbackEvidence.rawCredentialLogged = true; }],
    ["traffic restored during recovery", (submission: any) => { submission.rollbackEvidence.trafficStateDuringRecovery = "on"; }],
    ["unauthenticated backup", (submission: any) => { submission.rollbackEvidence.backupDigestVerified = false; }],
    ["unverified state", (submission: any) => { submission.rollbackEvidence.stateAuthenticated = false; }],
    ["compatibility after restore", (submission: any) => { submission.rollbackEvidence.compatibilityDecision = "checked-after-restore"; }],
    ["restore before compatibility", (submission: any) => { submission.rollbackEvidence.recoverySequence.reverse(); }],
    ["traffic resumed before verification", (submission: any) => { submission.rollbackEvidence.trafficResumedAfterVerification = false; }],
  ])("rejects %s", (_label, mutate) => {
    const submission = clone(validSubmission());
    mutate(submission);
    expect(gradeFdePrivateDeployment(challenge, { json: JSON.stringify(submission) }).pass).toBe(false);
  });

  it("rejects challenge metadata lookalikes", () => {
    const lookalike = clone(challenge);
    lookalike.grading.contractVersion = "caller-selected";
    expect(gradeFdePrivateDeployment(lookalike, { json: JSON.stringify(validSubmission()) })).toEqual({
      pass: false, score: 0, feedback: "Challenge is outside the trusted FDE private-deployment grading boundary.",
    });
  });

  it("routes only trusted metadata despite a forged environment and invokes no provider", async () => {
    const { POST } = await import("@/app/api/judge/route");
    const response = await POST(new NextRequest("http://academy.invalid/api/judge", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ challengeId: challenge.id, environment: "forged-provider-bypass", userInput: { json: JSON.stringify(validSubmission()) } }),
    }));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ pass: true, score: 1, _provider: "deterministic-fde-private-deployment-v1" });
    expect(createJudgeLLM).not.toHaveBeenCalled();
    expect(judgeProviderLabel).not.toHaveBeenCalled();
    expect(invoke).not.toHaveBeenCalled();
  });
});
