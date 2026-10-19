export interface FdeAccessPolicyChallenge {
  id?: string;
  type?: string;
  grading?: {
    type?: string;
    contractVersion?: string;
    providerCallsAllowed?: boolean;
  };
}

export interface FdeAccessPolicyGrade {
  pass: boolean;
  score: number;
  feedback: string;
}

type Submission = Record<string, unknown>;
type Check = [label: string, passed: boolean];

const TRUSTED_CHALLENGE_ID = "fde-01-access-policy-mission";
const TRUSTED_GRADING_TYPE = "fde-access-policy-v1";
const ROOT_KEYS = ["accessMatrix", "contractVersion", "customerAcceptance", "evidenceStatus", "missionId", "policyTraces"];
const MATRIX_KEYS = ["actionId", "caseId", "expectedDecision", "identityKind", "lifecycleState", "resourceId", "roleIds", "tenantId"];
const TRACE_KEYS = ["caseId", "contentLogged", "contextAssembled", "decision", "enforcementPointId", "rawCredentialLogged", "reasonCodeIds", "retrievalAttempted", "toolInvoked"];

const ACCESS_MATRIX = [
  ["authorized-human-document-read", "human", "active", "tenant-north", ["procurement_owner"], "doc-north-procurement-policy", "read_document", "allow"],
  ["authorized-service-document-read", "service", "active", "tenant-north", ["retrieval_worker"], "doc-north-procurement-policy", "read_document", "allow"],
  ["denied-moved-human-cross-tenant-read", "human", "active", "tenant-south", ["procurement_owner"], "doc-north-staff-contact", "read_document", "deny"],
  ["denied-deprovisioned-human-read", "human", "deprovisioned", "tenant-north", ["procurement_owner"], "doc-north-procurement-policy", "read_document", "deny"],
  ["denied-cross-business-unit-action", "human", "active", "tenant-south", ["procurement_owner"], "erp-po-north-1001", "draft_purchase", "deny"],
].map(([caseId, identityKind, lifecycleState, tenantId, roleIds, resourceId, actionId, expectedDecision]) => ({
  caseId, identityKind, lifecycleState, tenantId, roleIds, resourceId, actionId, expectedDecision,
}));

const POLICY_TRACES = [
  ["authorized-human-document-read", "allow", ["lifecycle-active", "tenant-match", "role-action-allowed", "document-policy-allowed"], "before-protected-retrieval", true, true, false],
  ["authorized-service-document-read", "allow", ["lifecycle-active", "tenant-match", "service-scope-allowed", "document-policy-allowed"], "before-protected-retrieval", true, true, false],
  ["denied-moved-human-cross-tenant-read", "deny", ["tenant-mismatch"], "before-protected-retrieval", false, false, false],
  ["denied-deprovisioned-human-read", "deny", ["lifecycle-inactive"], "before-protected-retrieval", false, false, false],
  ["denied-cross-business-unit-action", "deny", ["tenant-mismatch"], "before-downstream-tool", false, false, false],
].map(([caseId, decision, reasonCodeIds, enforcementPointId, retrievalAttempted, contextAssembled, toolInvoked]) => ({
  caseId,
  decision,
  reasonCodeIds,
  enforcementPointId,
  retrievalAttempted,
  contextAssembled,
  toolInvoked,
  contentLogged: false,
  rawCredentialLogged: false,
}));

function parseSubmission(userInput: Record<string, unknown>): Submission | null {
  const candidate = typeof userInput.json === "string"
    ? (() => {
        try { return JSON.parse(userInput.json) as unknown; } catch { return null; }
      })()
    : userInput;
  return candidate && typeof candidate === "object" && !Array.isArray(candidate) ? candidate as Submission : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function exactKeys(value: unknown, expected: string[]): boolean {
  return isRecord(value) && JSON.stringify(Object.keys(value).sort()) === JSON.stringify([...expected].sort());
}

function sameScalarSet(actual: unknown, expected: unknown): boolean {
  if (!Array.isArray(actual) || !Array.isArray(expected)) return false;
  if (actual.some((item) => typeof item !== "string") || expected.some((item) => typeof item !== "string")) return false;
  if (new Set(actual).size !== actual.length || new Set(expected).size !== expected.length) return false;
  return JSON.stringify([...actual].sort()) === JSON.stringify([...expected].sort());
}

function matchesEntry(actual: unknown, expected: Record<string, unknown>, keys: string[], setKeys: string[]): boolean {
  if (!exactKeys(actual, keys)) return false;
  const record = actual as Record<string, unknown>;
  return keys.every((key) => setKeys.includes(key)
    ? sameScalarSet(record[key], expected[key])
    : Object.is(record[key], expected[key]));
}

function matchesCaseSet(actual: unknown, expected: Array<Record<string, unknown>>, keys: string[], setKeys: string[]): boolean {
  if (!Array.isArray(actual) || actual.length !== expected.length || !actual.every(isRecord)) return false;
  const caseIds = actual.map((entry) => entry.caseId);
  if (caseIds.some((id) => typeof id !== "string") || new Set(caseIds).size !== caseIds.length) return false;
  const byId = new Map(actual.map((entry) => [entry.caseId, entry]));
  return expected.every((entry) => matchesEntry(byId.get(entry.caseId), entry, keys, setKeys));
}

function finish(checks: Check[]): FdeAccessPolicyGrade {
  const failures = checks.filter(([, passed]) => !passed).map(([label]) => label);
  const passed = checks.length - failures.length;
  return {
    pass: failures.length === 0,
    score: Number((passed / checks.length).toFixed(2)),
    feedback: failures.length === 0
      ? "Access evidence satisfies the deterministic rubric; customer acceptance remains explicitly unclaimed."
      : `Access evidence is incomplete: ${failures.join("; ")}.`,
  };
}

export function isTrustedFdeAccessPolicyChallenge(challenge: FdeAccessPolicyChallenge): boolean {
  return challenge.id === TRUSTED_CHALLENGE_ID &&
    challenge.type === "json-editor" &&
    challenge.grading?.type === TRUSTED_GRADING_TYPE &&
    challenge.grading.contractVersion === TRUSTED_GRADING_TYPE &&
    challenge.grading.providerCallsAllowed === false;
}

export function gradeFdeAccessPolicy(
  challenge: FdeAccessPolicyChallenge,
  userInput: Record<string, unknown>
): FdeAccessPolicyGrade {
  if (!isTrustedFdeAccessPolicyChallenge(challenge)) {
    return { pass: false, score: 0, feedback: "Challenge is outside the trusted FDE access-policy grading boundary." };
  }
  const submission = parseSubmission(userInput);
  if (!submission) return { pass: false, score: 0, feedback: "Submission is not valid JSON." };

  return finish([
    ["root fields must match the declared contract", exactKeys(submission, ROOT_KEYS)],
    ["contract version must match", submission.contractVersion === TRUSTED_GRADING_TYPE],
    ["mission ID must match", submission.missionId === TRUSTED_CHALLENGE_ID],
    ["rubric evidence must be marked complete", submission.evidenceStatus === "rubric-complete"],
    ["customer acceptance must remain unclaimed", submission.customerAcceptance === "not-claimed"],
    ["access matrix must match all lifecycle, identity, tenant, role, document and action cases",
      matchesCaseSet(submission.accessMatrix, ACCESS_MATRIX, MATRIX_KEYS, ["roleIds"])],
    ["policy traces must prove authorised paths and denial before protected context or tools without payload logging",
      matchesCaseSet(submission.policyTraces, POLICY_TRACES, TRACE_KEYS, ["reasonCodeIds"])],
  ]);
}
