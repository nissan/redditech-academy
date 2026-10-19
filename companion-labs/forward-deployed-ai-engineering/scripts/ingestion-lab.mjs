#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const contractPath = process.env.FDE_INGESTION_CONTRACT || path.resolve(here, "../ingestion/invoice-erp-v1.json");
const fixtureRoot = process.env.FDE_INGESTION_FIXTURE_ROOT || path.resolve(here, "../ingestion/fixtures");
const action = process.argv[2];

function fail(message) { throw new Error(message); }
function isObject(value) { return value !== null && typeof value === "object" && !Array.isArray(value); }
function exactKeys(value, keys, label) {
  if (!isObject(value) || JSON.stringify(Object.keys(value).sort()) !== JSON.stringify([...keys].sort())) fail(`unknown ${label} field or missing required field`);
}
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
  if (fs.lstatSync(resolvedRoot).isSymbolicLink()) fail(`symlink root refused: ${root}`);
  let cursor = resolvedRoot;
  for (const part of parts) {
    cursor = path.join(cursor, part);
    if (fs.lstatSync(cursor).isSymbolicLink()) fail(`symlink input refused: ${relativePath}`);
  }
  if (!cursor.startsWith(`${resolvedRoot}${path.sep}`)) fail(`unconfined path: ${relativePath}`);
  return cursor;
}
function sha256(bytes) { return `sha256:${crypto.createHash("sha256").update(bytes).digest("hex")}`; }

const contract = readJson(contractPath);
exactKeys(contract, ["contractVersion", "caseVersion", "datasetId", "fictional", "containsRealPersonalData", "batchId", "eventTimestamp", "inputs", "recordContract", "decisionAgent"], "contract root");
exactKeys(contract.recordContract, ["invoiceNumberConfidenceMinimum", "amountConfidenceMinimum", "currency", "erpInvoiceAliases", "quarantineOwnerId"], "record contract");
exactKeys(contract.decisionAgent, ["id", "type", "role", "authority", "action", "reason"], "decision agent");
if (contract.contractVersion !== "fde-ingestion-v1" || contract.fictional !== true || contract.containsRealPersonalData !== false) fail("unsupported ingestion contract");
if (!Array.isArray(contract.inputs) || contract.inputs.length !== 2) fail("ingestion contract requires two inputs");
if (contract.batchId !== "batch-hc-2026-10-19-001" || contract.eventTimestamp !== "2026-10-19T00:00:00.000Z") fail("untrusted batch metadata");
if (contract.recordContract.invoiceNumberConfidenceMinimum !== 0.9 || contract.recordContract.amountConfidenceMinimum !== 0.9 || contract.recordContract.currency !== "AUD" || JSON.stringify(contract.recordContract.erpInvoiceAliases) !== JSON.stringify(["invoice_number", "invoiceNo"]) || contract.recordContract.quarantineOwnerId !== "data-steward") fail("untrusted record contract");
if (JSON.stringify(contract.decisionAgent) !== JSON.stringify({ id: "agent:challenge-owned-ingestion-rules-v1", type: "deterministic-rules-engine", role: "data-quality-decision", authority: "synthetic-fixture-only", action: "accept-or-quarantine", reason: "contract-threshold-lineage-reconciliation" })) fail("untrusted decision agent metadata");

function authenticatedInput(inputId) {
  const input = contract.inputs.find((candidate) => candidate.inputId === inputId);
  if (!input) fail(`missing input declaration: ${inputId}`);
  exactKeys(input, ["inputId", "path", "digest", "schemaVersion"], "input declaration");
  const bytes = readRegularNoFollow(confinedPath(fixtureRoot, input.path), input.path);
  const actual = sha256(bytes);
  if (actual !== input.digest) fail(`digest mismatch for ${input.path}: expected ${input.digest}, got ${actual}`);
  const value = JSON.parse(bytes.toString("utf8"));
  if (value.fixtureVersion !== input.schemaVersion) fail(`schema version mismatch for ${input.path}`);
  return value;
}

function parseAmount(value) {
  if (typeof value !== "string" || !/^\d{1,3}(?:,\d{3})*\.\d{2}$|^\d+\.\d{2}$/.test(value)) fail(`invalid amount observation: ${String(value)}`);
  return Math.round(Number(value.replaceAll(",", "")) * 100);
}
function canonicalInvoice(value) {
  if (typeof value !== "string") fail("invoice observation must be a string");
  return `invoice:${value.trim().toLowerCase()}`;
}
function sum(records, key) { return records.reduce((total, record) => total + record[key], 0); }
function total(records) { return { count: records.length, amountMinor: sum(records, "amountMinor") }; }

function loadInputs() {
  const ocr = authenticatedInput("ocr-invoices");
  const erp = authenticatedInput("erp-export");
  exactKeys(ocr, ["fixtureVersion", "batchId", "capturedAt", "fictional", "records"], "OCR fixture root");
  exactKeys(erp, ["fixtureVersion", "exportedAt", "fictional", "rows"], "ERP fixture root");
  if (ocr.batchId !== contract.batchId || ocr.fictional !== true || erp.fictional !== true) fail("fixture identity mismatch");
  if (!Array.isArray(ocr.records) || !Array.isArray(erp.rows)) fail("fixture collections must be arrays");
  const sourceIds = new Set();
  for (const record of ocr.records) {
    exactKeys(record, ["sourceRecordId", "invoiceNumber", "amount", "currency", "supplier"], "OCR record");
    if (sourceIds.has(record.sourceRecordId)) fail(`duplicate sourceRecordId: ${record.sourceRecordId}`);
    sourceIds.add(record.sourceRecordId);
    for (const field of ["invoiceNumber", "amount", "currency", "supplier"]) {
      exactKeys(record[field], ["observed", "confidence"], `OCR ${field}`);
      if (typeof record[field].confidence !== "number" || record[field].confidence < 0 || record[field].confidence > 1) fail(`invalid OCR confidence: ${field}`);
    }
    parseAmount(record.amount.observed);
  }
  const erpIds = new Set();
  for (const row of erp.rows) {
    const alias = contract.recordContract.erpInvoiceAliases.filter((key) => Object.hasOwn(row, key));
    if (alias.length !== 1) fail("ERP row must contain exactly one declared invoice alias");
    exactKeys(row, ["erpRecordId", alias[0], "amount", "currency"], "ERP row");
    if (erpIds.has(row.erpRecordId)) fail(`duplicate erpRecordId: ${row.erpRecordId}`);
    erpIds.add(row.erpRecordId);
    parseAmount(row.amount);
  }
  return { ocr, erp };
}

function compute() {
  const { ocr, erp } = loadInputs();
  const erpByCanonical = new Map(erp.rows.map((row) => {
    const alias = contract.recordContract.erpInvoiceAliases.find((key) => Object.hasOwn(row, key));
    return [canonicalInvoice(row[alias]), { ...row, canonicalRecordId: canonicalInvoice(row[alias]), amountMinor: parseAmount(row.amount) }];
  }));
  if (erpByCanonical.size !== erp.rows.length) fail("canonical ERP collision");

  const acceptedByCanonical = new Map();
  const quarantineBySource = new Map();
  const sourceRows = ocr.records.map((record) => ({ sourceRecordId: record.sourceRecordId, amountMinor: parseAmount(record.amount.observed) }));
  const runAttempt = (attempt) => {
    for (const record of ocr.records) {
      const attemptId = `attempt:${contract.batchId}:${record.sourceRecordId}:${String(attempt).padStart(3, "0")}`;
      const lineageId = `lineage:ocr:${record.sourceRecordId}`;
      let reasonId = null;
      let evidenceIds = [lineageId];
      const belowThreshold = record.invoiceNumber.confidence < contract.recordContract.invoiceNumberConfidenceMinimum || record.amount.confidence < contract.recordContract.amountConfidenceMinimum;
      const canonicalRecordId = belowThreshold ? null : canonicalInvoice(record.invoiceNumber.observed);
      if (belowThreshold) reasonId = "ocr-below-contract-threshold";
      else if (acceptedByCanonical.has(canonicalRecordId) && acceptedByCanonical.get(canonicalRecordId).sourceRecordId !== record.sourceRecordId) {
        reasonId = "canonical-id-collision";
        evidenceIds = [lineageId, `lineage:ocr:${acceptedByCanonical.get(canonicalRecordId).sourceRecordId}`];
      } else if (!erpByCanonical.has(canonicalRecordId)) reasonId = "missing-erp-match";
      else if (erpByCanonical.get(canonicalRecordId).amountMinor !== parseAmount(record.amount.observed)) fail(`accepted-vs-matched-erp variance for ${record.sourceRecordId}`);

      if (reasonId) {
        const quarantineId = `quarantine:${contract.batchId}:${record.sourceRecordId}`;
        const existing = quarantineBySource.get(record.sourceRecordId);
        const nextAttempt = { attemptId, outcome: "quarantined", timestamp: contract.eventTimestamp };
        if (existing) existing.retryHistory.push(nextAttempt);
        else quarantineBySource.set(record.sourceRecordId, { quarantineId, sourceRecordId: record.sourceRecordId, reasonId, evidenceIds, ownerId: contract.recordContract.quarantineOwnerId, retryHistory: [nextAttempt] });
        continue;
      }
      if (!acceptedByCanonical.has(canonicalRecordId)) {
        const erpRecord = erpByCanonical.get(canonicalRecordId);
        acceptedByCanonical.set(canonicalRecordId, {
          canonicalRecordId,
          sourceRecordId: record.sourceRecordId,
          erpRecordId: erpRecord.erpRecordId,
          outcomeId: `outcome:${contract.batchId}:${record.sourceRecordId}`,
          amountMinor: parseAmount(record.amount.observed),
          currency: record.currency.observed,
          lineageIds: [lineageId, `lineage:erp:${erpRecord.erpRecordId}`],
          ocrAmountObserved: record.amount.observed,
          ocrAmountConfidence: record.amount.confidence,
        });
      }
    }
  };

  runAttempt(1);
  const firstAcceptedCount = acceptedByCanonical.size;
  const firstQuarantineCount = quarantineBySource.size;
  runAttempt(2);
  const acceptedRecords = [...acceptedByCanonical.values()];
  const quarantine = [...quarantineBySource.values()];
  const erpRows = [...erpByCanonical.values()];
  const matchedErp = erpRows.filter((row) => acceptedByCanonical.has(row.canonicalRecordId));
  const unmatchedErp = erpRows.filter((row) => !acceptedByCanonical.has(row.canonicalRecordId));
  const acceptedTotals = total(acceptedRecords);
  const matchedTotals = total(matchedErp);
  const reconciliation = {
    sourceObserved: total(sourceRows),
    accepted: acceptedTotals,
    quarantined: { count: quarantine.length, amountMinor: sourceRows.filter((row) => quarantineBySource.has(row.sourceRecordId)).reduce((totalValue, row) => totalValue + row.amountMinor, 0) },
    erpObserved: total(erpRows),
    matchedErp: matchedTotals,
    unmatchedErp: total(unmatchedErp),
    variances: [
      { varianceId: "source-partition-count", countDelta: sourceRows.length - acceptedRecords.length - quarantine.length, amountMinorDelta: total(sourceRows).amountMinor - acceptedTotals.amountMinor - sourceRows.filter((row) => quarantineBySource.has(row.sourceRecordId)).reduce((value, row) => value + row.amountMinor, 0) },
      { varianceId: "erp-partition-count", countDelta: erpRows.length - matchedErp.length - unmatchedErp.length, amountMinorDelta: total(erpRows).amountMinor - matchedTotals.amountMinor - total(unmatchedErp).amountMinor },
      { varianceId: "accepted-vs-matched-erp", countDelta: acceptedRecords.length - matchedErp.length, amountMinorDelta: acceptedTotals.amountMinor - matchedTotals.amountMinor },
    ],
  };
  const failedVariance = reconciliation.variances.find((variance) => variance.countDelta !== 0 || variance.amountMinorDelta !== 0);
  if (failedVariance) fail(`${failedVariance.varianceId} variance: count=${failedVariance.countDelta} amountMinor=${failedVariance.amountMinorDelta}`);
  const replayProof = {
    firstAcceptedCount,
    replayAcceptedCount: acceptedByCanonical.size,
    duplicateAcceptedCount: acceptedByCanonical.size - firstAcceptedCount,
    firstQuarantineCount,
    replayQuarantineCount: quarantineBySource.size,
    unresolvedQuarantineIds: quarantine.map((record) => record.quarantineId),
    operatorState: "replay-safe-with-unresolved-quarantine",
    postReplayProofId: `proof:${contract.batchId}:attempt-002`,
  };
  return { acceptedRecords, quarantine, reconciliation, replayProof };
}

function report() {
  const result = compute();
  return {
    contractVersion: contract.contractVersion,
    missionId: "fde-03-ingestion-mission",
    evidenceStatus: "rubric-complete",
    customerAcceptance: "not-claimed",
    batchId: contract.batchId,
    ...result,
    decisionAgent: { ...contract.decisionAgent, timestamp: contract.eventTimestamp, evidence: ["invoice-erp-v1.json", "scanned-invoices-v1.json", "erp-export-v1.json"], contractVersion: contract.contractVersion },
  };
}

try {
  const result = report();
  let output;
  if (action === "ingest") output = { batchId: result.batchId, acceptedRecords: result.acceptedRecords, quarantine: result.quarantine };
  else if (action === "reconcile") output = { batchId: result.batchId, reconciliation: result.reconciliation };
  else if (action === "replay") output = { batchId: result.batchId, replayProof: result.replayProof, quarantine: result.quarantine };
  else if (action === "report") output = result;
  else { process.stderr.write("Usage: ingestion-lab.mjs ingest|reconcile|replay|report\n"); process.exit(2); }
  process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
} catch (error) {
  process.stderr.write(`${JSON.stringify({ error: error instanceof Error ? error.message : "ingestion lab failed" })}\n`);
  process.exit(1);
}
