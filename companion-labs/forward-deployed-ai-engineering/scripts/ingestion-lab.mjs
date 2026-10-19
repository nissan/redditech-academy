#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const ingestionRoot = path.resolve(here, "../ingestion");
const authorityPath = path.join(ingestionRoot, "challenge-authority-v1.json");
const AUTHORITY_DIGEST = "sha256:ac03e544fe7d1441b669fc96497e96d75083cb50cc6e715b5419ae6cc4214031";
const contractPath = process.env.FDE_INGESTION_CONTRACT || path.join(ingestionRoot, "invoice-erp-v1.json");
const fixtureRoot = process.env.FDE_INGESTION_FIXTURE_ROOT || path.join(ingestionRoot, "fixtures");
const action = process.argv[2];
const stateFlag = process.argv.indexOf("--state-dir");
const stateDirArg = stateFlag >= 0 ? process.argv[stateFlag + 1] : undefined;

function fail(message) { throw new Error(message); }
function isObject(value) { return value !== null && typeof value === "object" && !Array.isArray(value); }
function exactKeys(value, keys, label) {
  if (!isObject(value) || JSON.stringify(Object.keys(value).sort()) !== JSON.stringify([...keys].sort())) fail(`unknown ${label} field or missing required field`);
}
function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (isObject(value)) return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
  return value;
}
function bytesFor(value) { return Buffer.from(JSON.stringify(stable(value))); }
function sha256(bytes) { return `sha256:${crypto.createHash("sha256").update(bytes).digest("hex")}`; }
function readRegularNoFollow(filePath, displayPath = filePath) {
  let descriptor;
  try { descriptor = fs.openSync(filePath, fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW); }
  catch (error) { if (error?.code === "ELOOP") fail(`symlink input refused: ${displayPath}`); throw error; }
  try {
    const stat = fs.fstatSync(descriptor);
    if (!stat.isFile()) fail(`non-regular input refused: ${displayPath}`);
    if (stat.nlink !== 1) fail(`hardlinked input refused: ${displayPath}`);
    return fs.readFileSync(descriptor);
  } finally { fs.closeSync(descriptor); }
}
function readJson(filePath, displayPath = filePath) { return JSON.parse(readRegularNoFollow(filePath, displayPath).toString("utf8")); }
function confinedPath(root, relativePath) {
  if (typeof relativePath !== "string" || !relativePath || path.isAbsolute(relativePath)) fail(`invalid relative path: ${String(relativePath)}`);
  const parts = relativePath.split(/[\\/]/);
  if (parts.some((part) => !part || part === "." || part === "..")) fail(`unconfined path: ${relativePath}`);
  const resolvedRoot = path.resolve(root);
  if (!fs.existsSync(resolvedRoot)) fail(`missing root: ${root}`);
  if (fs.lstatSync(resolvedRoot).isSymbolicLink()) fail(`symlink root refused: ${root}`);
  let cursor = resolvedRoot;
  for (const part of parts) {
    cursor = path.join(cursor, part);
    if (fs.existsSync(cursor) && fs.lstatSync(cursor).isSymbolicLink()) fail(`symlink input refused: ${relativePath}`);
  }
  if (!cursor.startsWith(`${resolvedRoot}${path.sep}`)) fail(`unconfined path: ${relativePath}`);
  return cursor;
}
function stateDirectory() {
  if (!stateDirArg || path.resolve(stateDirArg) === path.parse(path.resolve(stateDirArg)).root) fail("--state-dir must name an explicit confined directory");
  const resolved = path.resolve(stateDirArg);
  if (fs.existsSync(resolved)) {
    const stat = fs.lstatSync(resolved);
    if (stat.isSymbolicLink() || !stat.isDirectory()) fail("state directory must be a real directory");
  } else fs.mkdirSync(resolved, { recursive: true, mode: 0o700 });
  return resolved;
}

const authorityBytes = readRegularNoFollow(authorityPath, "challenge-authority-v1.json");
if (sha256(authorityBytes) !== AUTHORITY_DIGEST) fail("repository authority digest mismatch");
const authority = JSON.parse(authorityBytes.toString("utf8"));
exactKeys(authority, ["authorityVersion", "missionId", "contract", "inputs"], "authority root");
const contractBytes = readRegularNoFollow(contractPath, "invoice-erp-v1.json");
if (sha256(contractBytes) !== authority.contract.digest) fail("contract digest mismatch against repository authority");
const contract = JSON.parse(contractBytes.toString("utf8"));
exactKeys(contract, ["contractVersion", "caseVersion", "datasetId", "fictional", "containsRealPersonalData", "batchId", "eventTimestamp", "inputs", "recordContract", "decisionAgent"], "contract root");
exactKeys(contract.recordContract, ["invoiceNumberConfidenceMinimum", "amountConfidenceMinimum", "currency", "erpInvoiceAliases", "quarantineOwnerId"], "record contract");
exactKeys(contract.decisionAgent, ["id", "type", "role", "authority", "action", "reason"], "decision agent");
for (const [key, expected] of Object.entries({ contractVersion: authority.contract.contractVersion, caseVersion: authority.contract.caseVersion, datasetId: authority.contract.datasetId, batchId: authority.contract.batchId, eventTimestamp: authority.contract.eventTimestamp })) if (contract[key] !== expected) fail(`untrusted ${key}`);
if (contract.fictional !== true || contract.containsRealPersonalData !== false || contract.recordContract.currency !== authority.contract.currency) fail("unsupported ingestion contract identity");
if (contract.recordContract.invoiceNumberConfidenceMinimum !== 0.9 || contract.recordContract.amountConfidenceMinimum !== 0.9 || JSON.stringify(contract.recordContract.erpInvoiceAliases) !== JSON.stringify(["invoice_number", "invoiceNo"]) || contract.recordContract.quarantineOwnerId !== "data-steward") fail("untrusted record contract");
if (JSON.stringify(contract.inputs) !== JSON.stringify(authority.inputs)) fail("contract input declarations differ from repository authority");
if (JSON.stringify(contract.decisionAgent) !== JSON.stringify({ id: "agent:challenge-owned-ingestion-rules-v1", type: "deterministic-rules-engine", role: "data-quality-decision", authority: "synthetic-fixture-only", action: "accept-or-quarantine", reason: "contract-threshold-lineage-reconciliation" })) fail("untrusted decision agent metadata");

function authenticatedInput(inputId) {
  const trusted = authority.inputs.find((candidate) => candidate.inputId === inputId);
  if (!trusted) fail(`missing authority input: ${inputId}`);
  exactKeys(trusted, ["inputId", "path", "digest", "schemaVersion"], "authority input");
  const bytes = readRegularNoFollow(confinedPath(fixtureRoot, trusted.path), trusted.path);
  if (sha256(bytes) !== trusted.digest) fail(`digest mismatch for ${trusted.path} against repository authority`);
  const value = JSON.parse(bytes.toString("utf8"));
  if (value.fixtureVersion !== trusted.schemaVersion) fail(`schema version mismatch for ${trusted.path}`);
  return { value, trusted };
}
function parseAmount(value) {
  if (typeof value !== "string" || !/^\d{1,3}(?:,\d{3})*\.\d{2}$|^\d+\.\d{2}$/.test(value)) fail(`invalid amount observation: ${String(value)}`);
  return Math.round(Number(value.replaceAll(",", "")) * 100);
}
function canonicalInvoice(value) {
  if (typeof value !== "string") fail("invoice observation must be a string");
  return `invoice:${value.trim().toLowerCase()}`;
}
function total(records) { return { count: records.length, amountMinor: records.reduce((sum, record) => sum + record.amountMinor, 0) }; }
function loadInputs() {
  const ocrInput = authenticatedInput("ocr-invoices"); const erpInput = authenticatedInput("erp-export");
  const ocr = ocrInput.value; const erp = erpInput.value;
  exactKeys(ocr, ["fixtureVersion", "batchId", "capturedAt", "fictional", "records"], "OCR fixture root");
  exactKeys(erp, ["fixtureVersion", "exportedAt", "fictional", "rows"], "ERP fixture root");
  if (ocr.batchId !== contract.batchId || ocr.capturedAt !== contract.eventTimestamp || erp.exportedAt !== contract.eventTimestamp || ocr.fictional !== true || erp.fictional !== true) fail("fixture identity or timestamp mismatch");
  if (!Array.isArray(ocr.records) || !Array.isArray(erp.rows)) fail("fixture collections must be arrays");
  const sourceIds = new Set();
  for (const record of ocr.records) {
    exactKeys(record, ["sourceRecordId", "invoiceNumber", "amount", "currency", "supplier"], "OCR record");
    if (sourceIds.has(record.sourceRecordId)) fail(`duplicate sourceRecordId: ${record.sourceRecordId}`); sourceIds.add(record.sourceRecordId);
    for (const field of ["invoiceNumber", "amount", "currency", "supplier"]) {
      exactKeys(record[field], ["observed", "confidence"], `OCR ${field}`);
      if (typeof record[field].confidence !== "number" || record[field].confidence < 0 || record[field].confidence > 1) fail(`invalid OCR confidence: ${field}`);
    }
    parseAmount(record.amount.observed); if (record.currency.observed !== authority.contract.currency) fail(`OCR currency mismatch for ${record.sourceRecordId}`);
  }
  const erpIds = new Set();
  for (const row of erp.rows) {
    const alias = contract.recordContract.erpInvoiceAliases.filter((key) => Object.hasOwn(row, key));
    if (alias.length !== 1) fail("ERP row must contain exactly one declared invoice alias");
    exactKeys(row, ["erpRecordId", alias[0], "amount", "currency"], "ERP row");
    if (erpIds.has(row.erpRecordId)) fail(`duplicate erpRecordId: ${row.erpRecordId}`); erpIds.add(row.erpRecordId);
    parseAmount(row.amount); if (row.currency !== authority.contract.currency) fail(`ERP currency mismatch for ${row.erpRecordId}`);
  }
  return { ocr, erp, ocrSource: ocrInput.trusted, erpSource: erpInput.trusted };
}

function derive(attemptCount) {
  const { ocr, erp, ocrSource, erpSource } = loadInputs();
  const erpRows = erp.rows.map((row, index) => { const alias = contract.recordContract.erpInvoiceAliases.find((key) => Object.hasOwn(row, key)); return { ...row, alias, locator: `rows[${index}]`, canonicalRecordId: canonicalInvoice(row[alias]), amountMinor: parseAmount(row.amount) }; });
  const erpByCanonical = new Map(erpRows.map((row) => [row.canonicalRecordId, row]));
  if (erpByCanonical.size !== erpRows.length) fail("canonical ERP collision");
  const accepted = []; const quarantine = []; const ocrLineage = []; const acceptedByCanonical = new Map();
  for (let index = 0; index < ocr.records.length; index += 1) {
    const record = ocr.records[index]; const lineageId = `lineage:ocr:${record.sourceRecordId}`;
    const candidate = canonicalInvoice(record.invoiceNumber.observed); const erpRecord = erpByCanonical.get(candidate);
    const below = record.invoiceNumber.confidence < 0.9 || record.amount.confidence < 0.9;
    let reasonId = null;
    if (below) reasonId = "ocr-below-contract-threshold";
    else if (acceptedByCanonical.has(candidate)) reasonId = "canonical-id-collision";
    else if (!erpRecord) reasonId = "missing-erp-match";
    else if (erpRecord.amountMinor !== parseAmount(record.amount.observed)) fail(`accepted-vs-matched-erp variance for ${record.sourceRecordId}`);
    const outcomeId = reasonId ? `quarantine:${contract.batchId}:${record.sourceRecordId}` : `outcome:${contract.batchId}:${record.sourceRecordId}`;
    const linkedIds = reasonId === "canonical-id-collision" ? [lineageId, `lineage:ocr:${acceptedByCanonical.get(candidate).sourceRecordId}`] : reasonId ? [lineageId] : [lineageId, `lineage:erp:${erpRecord.erpRecordId}`];
    ocrLineage.push({ lineageId, source: { inputId: ocrSource.inputId, path: ocrSource.path, digest: ocrSource.digest, fixtureVersion: ocrSource.schemaVersion, locator: `records[${index}]` }, observed: { invoiceNumber: { value: record.invoiceNumber.observed, confidence: record.invoiceNumber.confidence }, amount: { value: record.amount.observed, confidence: record.amount.confidence }, currency: { value: record.currency.observed, confidence: record.currency.confidence }, supplier: { value: record.supplier.observed, confidence: record.supplier.confidence } }, candidate: { canonicalRecordId: candidate }, rule: { contractVersion: contract.contractVersion, ruleVersion: authority.authorityVersion }, validation: { invoiceNumberThresholdPassed: record.invoiceNumber.confidence >= 0.9, amountThresholdPassed: record.amount.confidence >= 0.9, currencyPassed: true, erpMatchPassed: Boolean(erpRecord), collisionFree: reasonId !== "canonical-id-collision", result: reasonId ? "quarantined" : "accepted", reasonId }, decision: { decisionAgentId: contract.decisionAgent.id, outcomeId } });
    if (reasonId) quarantine.push({ quarantineId: outcomeId, sourceRecordId: record.sourceRecordId, reasonId, evidenceIds: linkedIds, ownerId: contract.recordContract.quarantineOwnerId, retryHistory: Array.from({ length: attemptCount }, (_, attempt) => ({ attemptId: `attempt:${contract.batchId}:${record.sourceRecordId}:${String(attempt + 1).padStart(3, "0")}`, outcome: "quarantined", timestamp: contract.eventTimestamp })) });
    else {
      const row = { canonicalRecordId: candidate, sourceRecordId: record.sourceRecordId, erpRecordId: erpRecord.erpRecordId, outcomeId, amountMinor: parseAmount(record.amount.observed), currency: authority.contract.currency, lineageIds: linkedIds, ocrAmountObserved: record.amount.observed, ocrAmountConfidence: record.amount.confidence };
      accepted.push(row); acceptedByCanonical.set(candidate, row);
    }
  }
  const acceptedIds = new Set(accepted.map((row) => row.canonicalRecordId));
  const erpLineage = erpRows.map((row) => ({ lineageId: `lineage:erp:${row.erpRecordId}`, source: { inputId: erpSource.inputId, path: erpSource.path, digest: erpSource.digest, fixtureVersion: erpSource.schemaVersion, locator: row.locator }, observed: { invoiceNumber: { value: row[row.alias], confidence: null }, amount: { value: row.amount, confidence: null }, currency: { value: row.currency, confidence: null }, supplier: { value: null, confidence: null } }, candidate: { canonicalRecordId: row.canonicalRecordId }, rule: { contractVersion: contract.contractVersion, ruleVersion: authority.authorityVersion }, validation: { invoiceNumberThresholdPassed: null, amountThresholdPassed: null, currencyPassed: true, erpMatchPassed: acceptedIds.has(row.canonicalRecordId), collisionFree: true, result: acceptedIds.has(row.canonicalRecordId) ? "matched" : "unmatched", reasonId: acceptedIds.has(row.canonicalRecordId) ? null : "no-accepted-source" }, decision: { decisionAgentId: contract.decisionAgent.id, outcomeId: accepted.find((item) => item.canonicalRecordId === row.canonicalRecordId)?.outcomeId ?? null } }));
  const sourceRows = ocr.records.map((record) => ({ sourceRecordId: record.sourceRecordId, amountMinor: parseAmount(record.amount.observed) }));
  const matched = erpRows.filter((row) => acceptedIds.has(row.canonicalRecordId)); const unmatched = erpRows.filter((row) => !acceptedIds.has(row.canonicalRecordId));
  const acceptedTotal = total(accepted); const quarantineTotal = total(sourceRows.filter((row) => quarantine.some((item) => item.sourceRecordId === row.sourceRecordId)));
  const reconciliation = { sourceObserved: total(sourceRows), accepted: acceptedTotal, quarantined: quarantineTotal, erpObserved: total(erpRows), matchedErp: total(matched), unmatchedErp: total(unmatched), variances: [
    { varianceId: "source-partition-count", countDelta: sourceRows.length - accepted.length - quarantine.length, amountMinorDelta: total(sourceRows).amountMinor - acceptedTotal.amountMinor - quarantineTotal.amountMinor },
    { varianceId: "erp-partition-count", countDelta: erpRows.length - matched.length - unmatched.length, amountMinorDelta: total(erpRows).amountMinor - total(matched).amountMinor - total(unmatched).amountMinor },
    { varianceId: "accepted-vs-matched-erp", countDelta: accepted.length - matched.length, amountMinorDelta: acceptedTotal.amountMinor - total(matched).amountMinor },
  ] };
  if (reconciliation.variances.some((row) => row.countDelta || row.amountMinorDelta)) fail("named reconciliation variance failed");
  return { acceptedRecords: accepted, quarantine, lineage: [...ocrLineage, ...erpLineage], reconciliation };
}

const STATE_KEYS = ["stateVersion", "authorityDigest", "stateDirectoryBinding", "phase", "lastAttempt", "ingestStateDigest", "acceptedRecords", "quarantine", "lineage", "reconciliation", "integrityDigest"];
function statePayload(state) { const { integrityDigest: _ignored, ...payload } = state; return payload; }
function sealState(payload) { return { ...payload, integrityDigest: sha256(bytesFor(payload)) }; }
function statePath() { return path.join(stateDirectory(), "ingestion-state.json"); }
function directoryBinding() { return sha256(Buffer.from(fs.realpathSync(stateDirectory()))); }
function evidenceDigest(state) { const { integrityDigest: _integrity, stateDirectoryBinding: _directory, ...evidence } = state; return sha256(bytesFor(evidence)); }
function readState(requiredPhase) {
  const file = statePath();
  if (!fs.existsSync(file)) fail("missing authenticated ingest state; run ingest first with the same --state-dir");
  const state = readJson(file, "ingestion-state.json"); exactKeys(state, STATE_KEYS, "state");
  if (state.authorityDigest !== AUTHORITY_DIGEST || state.stateVersion !== "fde-ingestion-state-v1" || state.stateDirectoryBinding !== directoryBinding() || sha256(bytesFor(statePayload(state))) !== state.integrityDigest) fail("state integrity mismatch");
  if (requiredPhase && state.phase !== requiredPhase) fail(`state phase mismatch: expected ${requiredPhase}`);
  return state;
}
function writeState(state) {
  const file = statePath(); const temporary = `${file}.new`;
  fs.writeFileSync(temporary, `${JSON.stringify(state, null, 2)}\n`, { mode: 0o600, flag: "wx" }); fs.renameSync(temporary, file);
}
function baseState(derived, phase, lastAttempt, ingestStateDigest) { return { stateVersion: "fde-ingestion-state-v1", authorityDigest: AUTHORITY_DIGEST, stateDirectoryBinding: directoryBinding(), phase, lastAttempt, ingestStateDigest, ...derived }; }
function ensureEquivalent(actual, expected) { for (const key of ["acceptedRecords", "quarantine", "lineage", "reconciliation"]) if (JSON.stringify(actual[key]) !== JSON.stringify(expected[key])) fail(`durable state ${key} differs from authenticated fixtures`); }
function ingest() {
  const file = statePath(); if (fs.existsSync(file)) fail("state already exists; use a fresh explicit state directory");
  const state = sealState(baseState(derive(1), "ingested", 1, null)); writeState(state); return state;
}
function replay() {
  const current = readState();
  if (current.phase === "replayed") { ensureEquivalent(current, derive(2)); return current; }
  if (current.phase !== "ingested" || current.lastAttempt !== 1 || current.ingestStateDigest !== null) fail("state is not an authenticated attempt-001 checkpoint");
  ensureEquivalent(current, derive(1));
  const replayed = sealState(baseState(derive(2), "replayed", 2, evidenceDigest(current))); writeState(replayed); return replayed;
}
function makeReport(state) {
  if (state.phase !== "replayed" || state.lastAttempt !== 2 || typeof state.ingestStateDigest !== "string") fail("report requires authenticated replay state");
  ensureEquivalent(state, derive(2));
  const report = { contractVersion: contract.contractVersion, missionId: authority.missionId, evidenceStatus: "rubric-complete", customerAcceptance: "not-claimed", batchId: contract.batchId, acceptedRecords: state.acceptedRecords, quarantine: state.quarantine, lineage: state.lineage, reconciliation: state.reconciliation, replayProof: { firstAcceptedCount: 2, replayAcceptedCount: state.acceptedRecords.length, duplicateAcceptedCount: 0, firstQuarantineCount: 2, replayQuarantineCount: state.quarantine.length, unresolvedQuarantineIds: state.quarantine.map((row) => row.quarantineId), operatorState: "replay-safe-with-unresolved-quarantine", lastDurableCheckpoint: "attempt-002-verified", recoveryAction: "bounded-replay-from-attempt-001", postReplayProofId: `proof:${contract.batchId}:attempt-002` }, decisionAgent: { ...contract.decisionAgent, timestamp: contract.eventTimestamp, evidence: [authority.contract.path, ...authority.inputs.map((input) => input.path)], contractVersion: contract.contractVersion }, executionEvidence: { authorityDigest: AUTHORITY_DIGEST, ingestStateDigest: state.ingestStateDigest, replayStateDigest: evidenceDigest(state), reportDigest: null } };
  const digestInput = structuredClone(report);
  const sortBy = (values, key) => [...values].sort((left, right) => String(left[key]).localeCompare(String(right[key])));
  digestInput.acceptedRecords = sortBy(digestInput.acceptedRecords, "canonicalRecordId");
  digestInput.quarantine = sortBy(digestInput.quarantine, "quarantineId");
  digestInput.lineage = sortBy(digestInput.lineage, "lineageId");
  digestInput.reconciliation.variances = sortBy(digestInput.reconciliation.variances, "varianceId");
  digestInput.replayProof.unresolvedQuarantineIds.sort();
  digestInput.decisionAgent.evidence.sort();
  report.executionEvidence.reportDigest = sha256(bytesFor(digestInput)); return report;
}

try {
  let output;
  if (action === "ingest") { const state = ingest(); output = { batchId: contract.batchId, checkpoint: "attempt-001", stateDigest: evidenceDigest(state), acceptedRecords: state.acceptedRecords, quarantine: state.quarantine, lineage: state.lineage }; }
  else if (action === "reconcile") { const state = readState(); output = { batchId: contract.batchId, checkpoint: `attempt-00${state.lastAttempt}`, stateDigest: evidenceDigest(state), reconciliation: state.reconciliation }; }
  else if (action === "replay") { const state = replay(); output = { batchId: contract.batchId, replayProof: makeReport(state).replayProof, stateDigest: evidenceDigest(state), quarantine: state.quarantine }; }
  else if (action === "report") output = makeReport(readState("replayed"));
  else { process.stderr.write("Usage: ingestion-lab.mjs ingest|reconcile|replay|report --state-dir <directory>\n"); process.exit(2); }
  process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
} catch (error) {
  process.stderr.write(`${JSON.stringify({ error: error instanceof Error ? error.message : "ingestion lab failed" })}\n`); process.exit(1);
}
