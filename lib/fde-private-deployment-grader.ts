export interface FdePrivateDeploymentChallenge {
  id?: string;
  type?: string;
  grading?: { type?: string; contractVersion?: string; providerCallsAllowed?: boolean };
}

export interface FdePrivateDeploymentGrade { pass: boolean; score: number; feedback: string }

type Submission = Record<string, unknown>;
type Check = [label: string, passed: boolean];

const TRUSTED_CHALLENGE_ID = "fde-02-private-deployment-mission";
const TRUSTED_GRADING_TYPE = "fde-private-deployment-v1";
const ROOT_KEYS = ["artifactInventory", "contractVersion", "customerAcceptance", "dependencyInventory", "deploymentProfileId", "evidenceStatus", "healthChecks", "missionId", "networkTests", "offlineTests", "rollbackEvidence"];
const ARTIFACT_KEYS = ["artifactId", "digest", "path", "required", "version"];
const DEPENDENCY_KEYS = ["dependencyId", "digest", "path", "required", "timing", "version"];
const HEALTH_KEYS = ["checkId", "dependencyId", "status", "trafficAccepted"];
const NETWORK_KEYS = ["contentLogged", "decision", "destination", "exceptionId", "ownerId", "port", "purpose", "rawCredentialLogged", "reviewDate", "testId"];
const OFFLINE_KEYS = ["caseId", "downloadAttempted", "egressWeakened", "expectedPath", "missingArtifactId", "missingDigest", "missingVersion", "result"];
const ROLLBACK_KEYS = ["backupArtifactId", "backupDigest", "backupDigestVerified", "compatibilityDecision", "contentLogged", "networkPolicy", "rawCredentialLogged", "recoveryPathId", "recoverySequence", "restoredApplicationVersion", "stateAuthenticated", "trafficResumedAfterVerification", "trafficStateDuringRecovery", "triggerId", "verificationIds"];

const ARTIFACTS = [
  ["app-image", "1.4.0", "sha256:14a0a4a1f0b1c2d3e4f506172839405162738495a6b7c8d9e0f1029384756abc", "bundle/images/harbourcare-assistant-1.4.0.oci", true],
  ["schema-migration", "2026.10.1", "sha256:2222222222222222222222222222222222222222222222222222222222222222", "bundle/migrations/2026.10.1.sql", true],
  ["policy-bundle", "3.2.1", "sha256:3333333333333333333333333333333333333333333333333333333333333333", "bundle/policies/harbourcare-3.2.1.json", true],
  ["deployment-manifest", "1.4.0", "sha256:4444444444444444444444444444444444444444444444444444444444444444", "bundle/manifests/disconnected-1.4.0.yaml", true],
].map(([artifactId, version, digest, path, required]) => ({ artifactId, version, digest, path, required }));

const DEPENDENCIES = [
  ["node-runtime", "24.18.0", "sha256:5555555555555555555555555555555555555555555555555555555555555555", "bundle/runtime/node-v24.18.0", "runtime", true],
  ["local-database", "16.4", "sha256:6666666666666666666666666666666666666666666666666666666666666666", "bundle/services/database-16.4.oci", "runtime", true],
  ["internal-dns", "harbourcare-2026.10", "sha256:7777777777777777777777777777777777777777777777777777777777777777", "bundle/config/internal-dns-2026.10.json", "runtime", true],
].map(([dependencyId, version, digest, path, timing, required]) => ({ dependencyId, version, digest, path, timing, required }));

const HEALTH = [
  ["startup-artifact-and-schema", "pass", false, "local-filesystem"],
  ["readiness-bounded-workflow", "pass", true, "local-database"],
  ["liveness-progress", "pass", true, "local-process"],
  ["dependency-local-database", "pass", false, "local-database"],
].map(([checkId, status, trafficAccepted, dependencyId]) => ({ checkId, status, trafficAccepted, dependencyId }));

const NETWORK = [
  ["default-deny-baseline", "deny", "0.0.0.0/0", "all", null, null, "deny-undeclared-egress", null],
  ["narrow-internal-dns", "allow", "10.40.0.53/32", "udp/53", "internal-dns-only", "platform-operator", "resolve-declared-internal-services", "2026-11-19"],
  ["undeclared-public-registry", "deny", "registry.example.invalid", "tcp/443", null, null, "prove-public-registry-blocked", null],
].map(([testId, decision, destination, port, exceptionId, ownerId, purpose, reviewDate]) => ({ testId, decision, destination, port, exceptionId, ownerId, purpose, reviewDate, contentLogged: false, rawCredentialLogged: false }));

const OFFLINE = [
  { caseId: "complete-bundle", result: "success", downloadAttempted: false, missingArtifactId: null, missingVersion: null, missingDigest: null, expectedPath: null, egressWeakened: false },
  { caseId: "missing-policy-bundle", result: "blocked-before-mutation", downloadAttempted: false, missingArtifactId: "policy-bundle", missingVersion: "3.2.1", missingDigest: "sha256:3333333333333333333333333333333333333333333333333333333333333333", expectedPath: "bundle/policies/harbourcare-3.2.1.json", egressWeakened: false },
];

const ROLLBACK = {
  triggerId: "readiness-window-exceeded", trafficStateDuringRecovery: "off", networkPolicy: "default-deny-enforced",
  backupArtifactId: "backup-state-1.3.2", backupDigest: "sha256:8888888888888888888888888888888888888888888888888888888888888888", backupDigestVerified: true, stateAuthenticated: true,
  compatibilityDecision: "schema-data-compatible-with-1.3.2", recoveryPathId: "tested-forward-recovery-1.3.2",
  restoredApplicationVersion: "1.3.2",
  recoverySequence: ["traffic-off", "authenticate-backup-and-state", "establish-schema-data-compatibility", "execute-tested-recovery", "restore-accepted-application", "verify-health-workflow-egress", "resume-traffic"],
  verificationIds: ["startup-readiness-liveness-dependency", "bounded-workflow", "undeclared-egress-denied"],
  trafficResumedAfterVerification: true, contentLogged: false, rawCredentialLogged: false,
};

function parseSubmission(userInput: Record<string, unknown>): Submission | null {
  const candidate = typeof userInput.json === "string" ? (() => { try { return JSON.parse(userInput.json) as unknown; } catch { return null; } })() : userInput;
  return candidate && typeof candidate === "object" && !Array.isArray(candidate) ? candidate as Submission : null;
}
function isRecord(value: unknown): value is Record<string, unknown> { return Boolean(value) && typeof value === "object" && !Array.isArray(value); }
function exactKeys(value: unknown, expected: string[]): boolean { return isRecord(value) && JSON.stringify(Object.keys(value).sort()) === JSON.stringify([...expected].sort()); }
function sameScalarSet(actual: unknown, expected: unknown): boolean {
  if (!Array.isArray(actual) || !Array.isArray(expected) || actual.some((v) => typeof v !== "string") || expected.some((v) => typeof v !== "string")) return false;
  if (new Set(actual).size !== actual.length || new Set(expected).size !== expected.length) return false;
  return JSON.stringify([...actual].sort()) === JSON.stringify([...expected].sort());
}
function matchesEntry(actual: unknown, expected: Record<string, unknown>, keys: string[], setKeys: string[] = []): boolean {
  if (!exactKeys(actual, keys)) return false;
  const record = actual as Record<string, unknown>;
  return keys.every((key) => setKeys.includes(key)
    ? sameScalarSet(record[key], expected[key])
    : Array.isArray(expected[key])
      ? JSON.stringify(record[key]) === JSON.stringify(expected[key])
      : Object.is(record[key], expected[key]));
}
function matchesSet(actual: unknown, expected: Array<Record<string, unknown>>, idKey: string, keys: string[]): boolean {
  if (!Array.isArray(actual) || actual.length !== expected.length || !actual.every(isRecord)) return false;
  const ids = actual.map((entry) => entry[idKey]);
  if (ids.some((id) => typeof id !== "string") || new Set(ids).size !== ids.length) return false;
  const byId = new Map(actual.map((entry) => [entry[idKey], entry]));
  return expected.every((entry) => matchesEntry(byId.get(entry[idKey]), entry, keys));
}
function finish(checks: Check[]): FdePrivateDeploymentGrade {
  const failures = checks.filter(([, pass]) => !pass).map(([label]) => label);
  return { pass: failures.length === 0, score: Number(((checks.length - failures.length) / checks.length).toFixed(2)), feedback: failures.length === 0
    ? "Private deployment evidence satisfies the deterministic rubric; customer acceptance remains explicitly unclaimed."
    : `Private deployment evidence is incomplete: ${failures.join("; ")}.` };
}

export function isTrustedFdePrivateDeploymentChallenge(challenge: FdePrivateDeploymentChallenge): boolean {
  return challenge.id === TRUSTED_CHALLENGE_ID && challenge.type === "json-editor" && challenge.grading?.type === TRUSTED_GRADING_TYPE && challenge.grading.contractVersion === TRUSTED_GRADING_TYPE && challenge.grading.providerCallsAllowed === false;
}

export function gradeFdePrivateDeployment(challenge: FdePrivateDeploymentChallenge, userInput: Record<string, unknown>): FdePrivateDeploymentGrade {
  if (!isTrustedFdePrivateDeploymentChallenge(challenge)) return { pass: false, score: 0, feedback: "Challenge is outside the trusted FDE private-deployment grading boundary." };
  const submission = parseSubmission(userInput);
  if (!submission) return { pass: false, score: 0, feedback: "Submission is not valid JSON." };
  return finish([
    ["root fields must match the declared contract", exactKeys(submission, ROOT_KEYS)],
    ["contract version must match", submission.contractVersion === TRUSTED_GRADING_TYPE],
    ["mission ID must match", submission.missionId === TRUSTED_CHALLENGE_ID],
    ["rubric evidence must be marked complete", submission.evidenceStatus === "rubric-complete"],
    ["customer acceptance must remain unclaimed", submission.customerAcceptance === "not-claimed"],
    ["disconnected profile must match", submission.deploymentProfileId === "harbourcare-disconnected-v1"],
    ["artifact inventory must authenticate exact IDs, versions, digests, paths and requirement state", matchesSet(submission.artifactInventory, ARTIFACTS, "artifactId", ARTIFACT_KEYS)],
    ["dependency inventory must authenticate exact IDs, versions, digests, paths, timing and requirement state", matchesSet(submission.dependencyInventory, DEPENDENCIES, "dependencyId", DEPENDENCY_KEYS)],
    ["startup, readiness, liveness and dependency health must pass", matchesSet(submission.healthChecks, HEALTH, "checkId", HEALTH_KEYS)],
    ["default deny, narrow exception and undeclared-destination denial must pass without payload logging", matchesSet(submission.networkTests, NETWORK, "testId", NETWORK_KEYS)],
    ["offline cases must avoid downloads and identify the exact missing artifact before mutation", matchesSet(submission.offlineTests, OFFLINE, "caseId", OFFLINE_KEYS)],
    ["rollback must keep traffic off, authenticate state, establish compatibility before restore, and verify before resume", matchesEntry(submission.rollbackEvidence, ROLLBACK, ROLLBACK_KEYS, ["verificationIds"])],
  ]);
}
