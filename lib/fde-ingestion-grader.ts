import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export interface FdeIngestionChallenge {
  id?: string;
  type?: string;
  grading?: { type?: string; contractVersion?: string; providerCallsAllowed?: boolean };
}
export interface FdeIngestionGrade { pass: boolean; score: number; feedback: string }

type JsonRecord = Record<string, any>;

const VERSION = "fde-ingestion-v1";
const CHALLENGE_ID = "fde-03-ingestion-mission";
const AUTHORITY_DIGEST = "sha256:ac03e544fe7d1441b669fc96497e96d75083cb50cc6e715b5419ae6cc4214031";
const EXPECTED_REPORT_DIGEST = "sha256:5d1aa9c0021a9f39ae2eda053088e2fb57f138e48f5ce0cd8c11b26a369b0479";
const ROOT_KEYS = ["acceptedRecords", "batchId", "contractVersion", "customerAcceptance", "decisionAgent", "evidenceStatus", "executionEvidence", "lineage", "missionId", "quarantine", "reconciliation", "replayProof"];

function record(value: unknown): value is JsonRecord { return value !== null && typeof value === "object" && !Array.isArray(value); }
function exactKeys(value: unknown, keys: string[]): value is JsonRecord {
  return record(value) && JSON.stringify(Object.keys(value).sort()) === JSON.stringify([...keys].sort());
}
function stable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stable);
  if (record(value)) return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
  return value;
}
function digest(value: unknown): string { return `sha256:${crypto.createHash("sha256").update(JSON.stringify(stable(value))).digest("hex")}`; }
function fileDigest(file: string): string { return `sha256:${crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex")}`; }
function sortBy(values: unknown, key: string): unknown {
  return Array.isArray(values) ? [...values].sort((a, b) => String(record(a) ? a[key] : "").localeCompare(String(record(b) ? b[key] : ""))) : values;
}
function canonicalReport(input: JsonRecord): JsonRecord {
  const value = structuredClone(input);
  value.acceptedRecords = sortBy(value.acceptedRecords, "canonicalRecordId");
  value.quarantine = sortBy(value.quarantine, "quarantineId");
  value.lineage = sortBy(value.lineage, "lineageId");
  if (record(value.reconciliation)) value.reconciliation.variances = sortBy(value.reconciliation.variances, "varianceId");
  if (record(value.replayProof) && Array.isArray(value.replayProof.unresolvedQuarantineIds)) value.replayProof.unresolvedQuarantineIds.sort();
  if (record(value.decisionAgent) && Array.isArray(value.decisionAgent.evidence)) value.decisionAgent.evidence.sort();
  if (record(value.executionEvidence)) value.executionEvidence.reportDigest = null;
  return value;
}
function parse(userInput: Record<string, unknown>): JsonRecord | null {
  const candidate = typeof userInput.json === "string" ? (() => { try { return JSON.parse(userInput.json) as unknown; } catch { return null; } })() : userInput;
  return record(candidate) ? candidate : null;
}
function trustedRepositoryAuthority(): boolean {
  try {
    const root = path.join(process.cwd(), "companion-labs", "forward-deployed-ai-engineering", "ingestion");
    const authorityPath = path.join(root, "challenge-authority-v1.json");
    if (fileDigest(authorityPath) !== AUTHORITY_DIGEST) return false;
    const authority = JSON.parse(fs.readFileSync(authorityPath, "utf8")) as JsonRecord;
    if (!exactKeys(authority, ["authorityVersion", "missionId", "contract", "inputs"]) || authority.missionId !== CHALLENGE_ID) return false;
    if (fileDigest(path.join(root, authority.contract.path)) !== authority.contract.digest) return false;
    return Array.isArray(authority.inputs) && authority.inputs.every((entry: JsonRecord) => fileDigest(path.join(root, "fixtures", entry.path)) === entry.digest);
  } catch { return false; }
}
function lineageLinksAreComplete(submission: JsonRecord): boolean {
  if (!Array.isArray(submission.lineage) || submission.lineage.length !== 7) return false;
  const ids = new Set(submission.lineage.map((row: unknown) => record(row) ? row.lineageId : null));
  const outcomes = [...(Array.isArray(submission.acceptedRecords) ? submission.acceptedRecords : []), ...(Array.isArray(submission.quarantine) ? submission.quarantine : [])];
  return outcomes.every((row: unknown) => record(row) && (row.lineageIds ?? row.evidenceIds)?.every((id: string) => ids.has(id)));
}

export function isTrustedFdeIngestionChallenge(challenge: FdeIngestionChallenge): boolean {
  return challenge.id === CHALLENGE_ID && challenge.type === "json-editor" && challenge.grading?.type === VERSION && challenge.grading.contractVersion === VERSION && challenge.grading.providerCallsAllowed === false;
}

export function gradeFdeIngestion(challenge: FdeIngestionChallenge, userInput: Record<string, unknown>): FdeIngestionGrade {
  if (!isTrustedFdeIngestionChallenge(challenge)) return { pass: false, score: 0, feedback: "Challenge is outside the trusted FDE ingestion grading boundary." };
  const submission = parse(userInput);
  if (!submission) return { pass: false, score: 0, feedback: "Submission is not valid JSON." };
  const evidence = submission.executionEvidence;
  const checks = [
    exactKeys(submission, ROOT_KEYS),
    submission.contractVersion === VERSION && submission.missionId === CHALLENGE_ID && submission.evidenceStatus === "rubric-complete" && submission.customerAcceptance === "not-claimed",
    trustedRepositoryAuthority(),
    exactKeys(evidence, ["authorityDigest", "ingestStateDigest", "replayStateDigest", "reportDigest"]) && evidence.authorityDigest === AUTHORITY_DIGEST && evidence.reportDigest === EXPECTED_REPORT_DIGEST,
    lineageLinksAreComplete(submission),
    digest(canonicalReport(submission)) === EXPECTED_REPORT_DIGEST,
  ];
  const passed = checks.filter(Boolean).length;
  return checks.every(Boolean)
    ? { pass: true, score: 1, feedback: "Ingestion execution evidence is fixture-authority-bound, replay-authenticated, and lineage-complete; customer and production acceptance remain explicitly unclaimed." }
    : { pass: false, score: Number((passed / checks.length).toFixed(2)), feedback: "Ingestion evidence is incomplete or not bound to trusted fixture execution." };
}
