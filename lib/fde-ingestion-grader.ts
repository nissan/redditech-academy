export interface FdeIngestionChallenge {
  id?: string;
  type?: string;
  grading?: { type?: string; contractVersion?: string; providerCallsAllowed?: boolean };
}
export interface FdeIngestionGrade { pass: boolean; score: number; feedback: string }

type RecordValue = Record<string, unknown>;
type Check = [label: string, passed: boolean];

const VERSION = "fde-ingestion-v1";
const CHALLENGE_ID = "fde-03-ingestion-mission";
const ROOT_KEYS = ["acceptedRecords", "batchId", "contractVersion", "customerAcceptance", "decisionAgent", "evidenceStatus", "missionId", "quarantine", "reconciliation", "replayProof"];
const ACCEPTED_KEYS = ["amountMinor", "canonicalRecordId", "currency", "erpRecordId", "lineageIds", "ocrAmountConfidence", "ocrAmountObserved", "outcomeId", "sourceRecordId"];
const QUARANTINE_KEYS = ["evidenceIds", "ownerId", "quarantineId", "reasonId", "retryHistory", "sourceRecordId"];
const RETRY_KEYS = ["attemptId", "outcome", "timestamp"];
const RECON_KEYS = ["accepted", "erpObserved", "matchedErp", "quarantined", "sourceObserved", "unmatchedErp", "variances"];
const TOTAL_KEYS = ["amountMinor", "count"];
const VARIANCE_KEYS = ["amountMinorDelta", "countDelta", "varianceId"];
const REPLAY_KEYS = ["duplicateAcceptedCount", "firstAcceptedCount", "firstQuarantineCount", "operatorState", "postReplayProofId", "replayAcceptedCount", "replayQuarantineCount", "unresolvedQuarantineIds"];
const AGENT_KEYS = ["action", "authority", "contractVersion", "evidence", "id", "reason", "role", "timestamp", "type"];

const EXPECTED = {
  acceptedRecords: [
    { canonicalRecordId: "invoice:hc-inv-1001", sourceRecordId: "scan-001", erpRecordId: "erp-9001", outcomeId: "outcome:batch-hc-2026-10-19-001:scan-001", amountMinor: 125000, currency: "AUD", lineageIds: ["lineage:ocr:scan-001", "lineage:erp:erp-9001"], ocrAmountObserved: "1,250.00", ocrAmountConfidence: 0.98 },
    { canonicalRecordId: "invoice:hc-inv-1002", sourceRecordId: "scan-002", erpRecordId: "erp-9002", outcomeId: "outcome:batch-hc-2026-10-19-001:scan-002", amountMinor: 75000, currency: "AUD", lineageIds: ["lineage:ocr:scan-002", "lineage:erp:erp-9002"], ocrAmountObserved: "750.00", ocrAmountConfidence: 0.94 },
  ],
  quarantine: [
    { quarantineId: "quarantine:batch-hc-2026-10-19-001:scan-003", sourceRecordId: "scan-003", reasonId: "ocr-below-contract-threshold", evidenceIds: ["lineage:ocr:scan-003"], ownerId: "data-steward", retryHistory: [{ attemptId: "attempt:batch-hc-2026-10-19-001:scan-003:001", outcome: "quarantined", timestamp: "2026-10-19T00:00:00.000Z" }, { attemptId: "attempt:batch-hc-2026-10-19-001:scan-003:002", outcome: "quarantined", timestamp: "2026-10-19T00:00:00.000Z" }] },
    { quarantineId: "quarantine:batch-hc-2026-10-19-001:scan-004", sourceRecordId: "scan-004", reasonId: "canonical-id-collision", evidenceIds: ["lineage:ocr:scan-004", "lineage:ocr:scan-002"], ownerId: "data-steward", retryHistory: [{ attemptId: "attempt:batch-hc-2026-10-19-001:scan-004:001", outcome: "quarantined", timestamp: "2026-10-19T00:00:00.000Z" }, { attemptId: "attempt:batch-hc-2026-10-19-001:scan-004:002", outcome: "quarantined", timestamp: "2026-10-19T00:00:00.000Z" }] },
  ],
  reconciliation: {
    sourceObserved: { count: 4, amountMinor: 315000 }, accepted: { count: 2, amountMinor: 200000 }, quarantined: { count: 2, amountMinor: 115000 },
    erpObserved: { count: 3, amountMinor: 240000 }, matchedErp: { count: 2, amountMinor: 200000 }, unmatchedErp: { count: 1, amountMinor: 40000 },
    variances: [{ varianceId: "source-partition-count", countDelta: 0, amountMinorDelta: 0 }, { varianceId: "erp-partition-count", countDelta: 0, amountMinorDelta: 0 }, { varianceId: "accepted-vs-matched-erp", countDelta: 0, amountMinorDelta: 0 }],
  },
  replayProof: { firstAcceptedCount: 2, replayAcceptedCount: 2, duplicateAcceptedCount: 0, firstQuarantineCount: 2, replayQuarantineCount: 2, unresolvedQuarantineIds: ["quarantine:batch-hc-2026-10-19-001:scan-003", "quarantine:batch-hc-2026-10-19-001:scan-004"], operatorState: "replay-safe-with-unresolved-quarantine", postReplayProofId: "proof:batch-hc-2026-10-19-001:attempt-002" },
  decisionAgent: { id: "agent:challenge-owned-ingestion-rules-v1", type: "deterministic-rules-engine", role: "data-quality-decision", authority: "synthetic-fixture-only", action: "accept-or-quarantine", timestamp: "2026-10-19T00:00:00.000Z", reason: "contract-threshold-lineage-reconciliation", evidence: ["invoice-erp-v1.json", "scanned-invoices-v1.json", "erp-export-v1.json"], contractVersion: VERSION },
};

function record(value: unknown): value is RecordValue { return value !== null && typeof value === "object" && !Array.isArray(value); }
function exactKeys(value: unknown, keys: string[]): value is RecordValue { return record(value) && JSON.stringify(Object.keys(value).sort()) === JSON.stringify([...keys].sort()); }
function sameSet(actual: unknown, expected: unknown): boolean {
  return Array.isArray(actual) && Array.isArray(expected) && actual.every((value) => typeof value === "string") && expected.every((value) => typeof value === "string") && new Set(actual).size === actual.length && JSON.stringify([...actual].sort()) === JSON.stringify([...expected].sort());
}
function retryHistory(actual: unknown, expected: unknown): boolean {
  return Array.isArray(actual) && Array.isArray(expected) && actual.length === expected.length && actual.every((entry, index) => exactKeys(entry, RETRY_KEYS) && JSON.stringify(entry) === JSON.stringify(expected[index]));
}
function accepted(actual: unknown, expected: RecordValue): boolean {
  return exactKeys(actual, ACCEPTED_KEYS) && ACCEPTED_KEYS.every((key) => key === "lineageIds" ? sameSet(actual[key], expected[key]) : Object.is(actual[key], expected[key]));
}
function quarantined(actual: unknown, expected: RecordValue): boolean {
  return exactKeys(actual, QUARANTINE_KEYS) && QUARANTINE_KEYS.every((key) => key === "evidenceIds" ? sameSet(actual[key], expected[key]) : key === "retryHistory" ? retryHistory(actual[key], expected[key]) : Object.is(actual[key], expected[key]));
}
function objectSet(actual: unknown, expected: RecordValue[], idKey: string, matcher: (actual: unknown, expected: RecordValue) => boolean): boolean {
  if (!Array.isArray(actual) || actual.length !== expected.length || !actual.every(record)) return false;
  const byId = new Map(actual.map((entry) => [entry[idKey], entry]));
  return byId.size === expected.length && expected.every((entry) => matcher(byId.get(entry[idKey]), entry));
}
function totals(actual: unknown, expected: RecordValue): boolean { return exactKeys(actual, TOTAL_KEYS) && TOTAL_KEYS.every((key) => Object.is(actual[key], expected[key])); }
function reconciliation(actual: unknown): boolean {
  if (!exactKeys(actual, RECON_KEYS)) return false;
  const expected = EXPECTED.reconciliation as unknown as RecordValue;
  return ["sourceObserved", "accepted", "quarantined", "erpObserved", "matchedErp", "unmatchedErp"].every((key) => totals(actual[key], expected[key] as RecordValue))
    && objectSet(actual.variances, EXPECTED.reconciliation.variances, "varianceId", (value, target) => exactKeys(value, VARIANCE_KEYS) && VARIANCE_KEYS.every((key) => Object.is(value[key], target[key])));
}
function replay(actual: unknown): boolean {
  if (!exactKeys(actual, REPLAY_KEYS)) return false;
  return REPLAY_KEYS.every((key) => key === "unresolvedQuarantineIds" ? sameSet(actual[key], EXPECTED.replayProof[key]) : Object.is(actual[key], EXPECTED.replayProof[key as keyof typeof EXPECTED.replayProof]));
}
function agent(actual: unknown): boolean {
  return exactKeys(actual, AGENT_KEYS) && AGENT_KEYS.every((key) => key === "evidence" ? sameSet(actual[key], EXPECTED.decisionAgent.evidence) : Object.is(actual[key], EXPECTED.decisionAgent[key as keyof typeof EXPECTED.decisionAgent]));
}
function parse(userInput: Record<string, unknown>): RecordValue | null {
  const candidate = typeof userInput.json === "string" ? (() => { try { return JSON.parse(userInput.json) as unknown; } catch { return null; } })() : userInput;
  return record(candidate) ? candidate : null;
}
function finish(checks: Check[]): FdeIngestionGrade {
  const failures = checks.filter(([, passed]) => !passed).map(([label]) => label);
  return { pass: failures.length === 0, score: Number(((checks.length - failures.length) / checks.length).toFixed(2)), feedback: failures.length === 0
    ? "Ingestion evidence satisfies the deterministic rubric; customer and production acceptance remain explicitly unclaimed."
    : `Ingestion evidence is incomplete: ${failures.join("; ")}.` };
}

export function isTrustedFdeIngestionChallenge(challenge: FdeIngestionChallenge): boolean {
  return challenge.id === CHALLENGE_ID && challenge.type === "json-editor" && challenge.grading?.type === VERSION && challenge.grading.contractVersion === VERSION && challenge.grading.providerCallsAllowed === false;
}

export function gradeFdeIngestion(challenge: FdeIngestionChallenge, userInput: Record<string, unknown>): FdeIngestionGrade {
  if (!isTrustedFdeIngestionChallenge(challenge)) return { pass: false, score: 0, feedback: "Challenge is outside the trusted FDE ingestion grading boundary." };
  const submission = parse(userInput);
  if (!submission) return { pass: false, score: 0, feedback: "Submission is not valid JSON." };
  return finish([
    ["root fields must match the versioned record contract", exactKeys(submission, ROOT_KEYS)],
    ["contract and mission identifiers must match", submission.contractVersion === VERSION && submission.missionId === CHALLENGE_ID && submission.batchId === "batch-hc-2026-10-19-001"],
    ["rubric completion must not claim customer acceptance", submission.evidenceStatus === "rubric-complete" && submission.customerAcceptance === "not-claimed"],
    ["accepted records must preserve canonical IDs, lineage, observations and confidence", objectSet(submission.acceptedRecords, EXPECTED.acceptedRecords, "canonicalRecordId", accepted)],
    ["quarantine must preserve bounded reason, evidence, owner and replay history", objectSet(submission.quarantine, EXPECTED.quarantine, "quarantineId", quarantined)],
    ["named count and amount reconciliation must close", reconciliation(submission.reconciliation)],
    ["duplicate replay must add no accepted records and retain unresolved quarantine", replay(submission.replayProof)],
    ["decision-agent provenance must be stable, bounded, non-secret and versioned", agent(submission.decisionAgent)],
  ]);
}
