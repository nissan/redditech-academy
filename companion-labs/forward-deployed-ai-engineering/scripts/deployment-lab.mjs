#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const defaultContractPath = path.resolve(here, "../deployments/private-deployment-v1.json");
const defaultFixtureRoot = path.resolve(here, "../deployments/fixtures");
const contractPath = process.env.FDE_DEPLOYMENT_CONTRACT || defaultContractPath;
const fixtureRoot = process.env.FDE_DEPLOYMENT_FIXTURE_ROOT || defaultFixtureRoot;
const [action, caseFlag, caseId] = process.argv.slice(2);

function fail(message) { throw new Error(message); }

function readRegularNoFollow(filePath) {
  const descriptor = fs.openSync(filePath, fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW);
  try {
    const stat = fs.fstatSync(descriptor);
    if (!stat.isFile() || stat.nlink !== 1) fail(`refusing non-regular or hardlinked input: ${filePath}`);
    return fs.readFileSync(descriptor);
  } finally { fs.closeSync(descriptor); }
}

function readJsonNoFollow(filePath) { return JSON.parse(readRegularNoFollow(filePath).toString("utf8")); }

function confinedPath(root, relativePath) {
  if (typeof relativePath !== "string" || relativePath.length === 0 || path.isAbsolute(relativePath)) fail(`invalid relative path: ${String(relativePath)}`);
  const components = relativePath.split(/[\\/]/);
  if (components.some((part) => part === "" || part === "." || part === "..")) fail(`unconfined path: ${relativePath}`);
  const resolvedRoot = path.resolve(root);
  if (fs.lstatSync(root).isSymbolicLink()) fail(`symlink root refused: ${root}`);
  let cursor = resolvedRoot;
  for (const component of components) {
    cursor = path.join(cursor, component);
    const stat = fs.lstatSync(cursor);
    if (stat.isSymbolicLink()) fail(`symlink input refused: ${relativePath}`);
  }
  if (!cursor.startsWith(`${resolvedRoot}${path.sep}`)) fail(`unconfined path: ${relativePath}`);
  return cursor;
}

function digest(bytes) { return `sha256:${crypto.createHash("sha256").update(bytes).digest("hex")}`; }

function authenticate(relativePath, expectedDigest) {
  const bytes = readRegularNoFollow(confinedPath(fixtureRoot, relativePath));
  const actualDigest = digest(bytes);
  if (actualDigest !== expectedDigest) fail(`digest mismatch for ${relativePath}: expected ${expectedDigest}, got ${actualDigest}`);
  return bytes;
}

const contract = readJsonNoFollow(contractPath);
const inventory = [...contract.artifacts, ...contract.dependencies];

function authenticatedInventory(omitArtifactId = null) {
  if (omitArtifactId !== null && !contract.artifacts.some((entry) => entry.artifactId === omitArtifactId && entry.required)) fail(`unknown required artifact omission: ${omitArtifactId}`);
  return inventory.map((entry) => ({ entry, bytes: entry.artifactId === omitArtifactId ? null : authenticate(entry.path, entry.digest) }));
}

function writeConfined(root, relativePath, bytes) {
  const destination = path.resolve(root, relativePath);
  const resolvedRoot = path.resolve(root);
  if (!destination.startsWith(`${resolvedRoot}${path.sep}`)) fail(`unconfined output path: ${relativePath}`);
  fs.mkdirSync(path.dirname(destination), { recursive: true, mode: 0o700 });
  const descriptor = fs.openSync(destination, fs.constants.O_WRONLY | fs.constants.O_CREAT | fs.constants.O_EXCL | fs.constants.O_NOFOLLOW, 0o600);
  try { fs.writeFileSync(descriptor, bytes); fs.fsyncSync(descriptor); } finally { fs.closeSync(descriptor); }
}

function withDeployment(omitArtifactId, callback) {
  const authenticated = authenticatedInventory(omitArtifactId);
  const missing = authenticated.find(({ entry, bytes }) => entry.required && bytes === null);
  if (missing) return callback({ root: null, missing: missing.entry, mutationCount: 0 });
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "fde-private-deployment-"));
  let mutationCount = 0;
  try {
    for (const { entry, bytes } of authenticated) { writeConfined(root, entry.path, bytes); mutationCount += 1; }
    return callback({ root, missing: null, mutationCount });
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
}

function inspectInventory() {
  const authenticated = authenticatedInventory();
  return { caseVersion: contract.caseVersion, authenticatedCount: authenticated.length, artifacts: contract.artifacts, dependencies: contract.dependencies };
}

function executeHealth(root) {
  const app = readRegularNoFollow(path.join(root, contract.artifacts[0].path)).toString("utf8");
  const migration = readRegularNoFollow(path.join(root, contract.artifacts[1].path)).toString("utf8");
  const policy = JSON.parse(readRegularNoFollow(path.join(root, contract.artifacts[2].path)).toString("utf8"));
  const database = readRegularNoFollow(path.join(root, contract.dependencies[1].path)).toString("utf8");
  const records = JSON.parse(authenticate(contract.healthInputs.recordsPath, contract.healthInputs.recordsDigest).toString("utf8"));
  const startup = app.includes("version=1.4.0") && migration.includes("schema_version=2026.10.1");
  const workflowResult = { recordCount: records.records.length, openCount: records.records.filter((record) => record.status === "open").length };
  const readiness = policy.workflow === contract.healthInputs.workflow && policy.allowedDataset === contract.healthInputs.datasetId && records.datasetId === contract.healthInputs.datasetId && workflowResult.recordCount === contract.healthInputs.expectedRecordCount && workflowResult.openCount === 2;
  let progressCounter = 0;
  progressCounter += readiness ? 1 : 0;
  const checks = [
    { checkId: "startup-artifact-and-schema", status: startup ? "pass" : "fail", trafficAccepted: false, dependencyId: "local-filesystem" },
    { checkId: "readiness-bounded-workflow", status: readiness ? "pass" : "fail", trafficAccepted: readiness, dependencyId: "local-database" },
    { checkId: "liveness-progress", status: progressCounter === 1 ? "pass" : "fail", trafficAccepted: progressCounter === 1, dependencyId: "local-process" },
    { checkId: "dependency-local-database", status: database.includes("status=available") && database.includes(`dataset=${contract.healthInputs.datasetId}`) ? "pass" : "fail", trafficAccepted: false, dependencyId: "local-database" },
  ];
  if (checks.some((check) => check.status !== "pass")) fail("synthetic health verification failed");
  return checks;
}

function evaluateNetworkPolicy() {
  if (contract.networkPolicy.defaultDecision !== "deny") fail("network policy must default deny");
  const tests = contract.networkPolicy.probes.map((probe) => {
    const exception = contract.networkPolicy.exceptions.find((candidate) => candidate.destination === probe.destination && candidate.port === probe.port);
    return { testId: probe.testId, decision: exception ? "allow" : "deny", destination: probe.destination, port: probe.port, exceptionId: exception?.exceptionId ?? null, ownerId: exception?.ownerId ?? null, purpose: probe.purpose, reviewDate: exception?.reviewDate ?? null, contentLogged: false, rawCredentialLogged: false };
  });
  const expected = new Map([["default-deny-baseline", "deny"], ["narrow-internal-dns", "allow"], ["undeclared-public-registry", "deny"]]);
  if (tests.some((test) => expected.get(test.testId) !== test.decision)) fail("synthetic egress policy verification failed");
  return tests;
}

function executeRestoredHealth(root, plan) {
  const accepted = readRegularNoFollow(path.join(root, "restored/accepted-application.oci")).toString("utf8");
  const policy = JSON.parse(readRegularNoFollow(path.join(root, contract.artifacts[2].path)).toString("utf8"));
  const database = readRegularNoFollow(path.join(root, contract.dependencies[1].path)).toString("utf8");
  const records = JSON.parse(authenticate(contract.healthInputs.recordsPath, contract.healthInputs.recordsDigest).toString("utf8"));
  const startup = accepted.includes(`version=${plan.restoredApplicationVersion}`) && accepted.includes(`schema=${plan.acceptedSchemaVersion}`);
  const workflowResult = { recordCount: records.records.length, openCount: records.records.filter((record) => record.status === "open").length };
  const readiness = policy.workflow === contract.healthInputs.workflow && workflowResult.recordCount === contract.healthInputs.expectedRecordCount && workflowResult.openCount === 2 && stateCompatibility(plan);
  const checks = [
    { checkId: "startup-artifact-and-schema", status: startup ? "pass" : "fail", trafficAccepted: false, dependencyId: "local-filesystem" },
    { checkId: "readiness-bounded-workflow", status: readiness ? "pass" : "fail", trafficAccepted: readiness, dependencyId: "local-database" },
    { checkId: "liveness-progress", status: startup && readiness ? "pass" : "fail", trafficAccepted: startup && readiness, dependencyId: "local-process" },
    { checkId: "dependency-local-database", status: database.includes("status=available") ? "pass" : "fail", trafficAccepted: false, dependencyId: "local-database" },
  ];
  if (checks.some((check) => check.status !== "pass")) fail("restored application health verification failed");
  return checks;
}

function stateCompatibility(plan) {
  const recovery = JSON.parse(authenticate(plan.recoveryPath, plan.recoveryDigest).toString("utf8"));
  return recovery.fromSchema === plan.candidateSchemaVersion && recovery.toSchema === plan.acceptedSchemaVersion && recovery.tested === true;
}

function executeOffline(selectedCase) {
  const definition = contract.offlineCases[selectedCase];
  if (!definition) fail(`unknown offline case: ${selectedCase}`);
  return withDeployment(definition.omitArtifactId, ({ root, missing, mutationCount }) => {
    if (missing) {
      if (mutationCount !== 0) fail("missing artifact was detected after mutation");
      return { caseId: selectedCase, result: "blocked-before-mutation", authenticatedArtifactCount: inventory.length - 1, stateMutationCount: mutationCount, downloadAttempted: false, missingArtifactId: missing.artifactId, missingVersion: missing.version, missingDigest: missing.digest, expectedPath: missing.path, egressWeakened: false };
    }
    executeHealth(root);
    evaluateNetworkPolicy();
    return { caseId: selectedCase, result: "success", authenticatedArtifactCount: inventory.length, stateMutationCount: mutationCount, downloadAttempted: false, missingArtifactId: null, missingVersion: null, missingDigest: null, expectedPath: null, egressWeakened: false };
  });
}

function executeRollback() {
  return withDeployment(null, ({ root }) => {
    const plan = contract.rollbackPlan;
    const state = { traffic: "on", backupAuthenticated: false, compatible: false, recovered: false, restored: false, verified: false };
    const observed = [];
    for (const step of plan.steps) {
      if (step === "traffic-off" && state.traffic === "on") state.traffic = "off";
      else if (step === "authenticate-backup-and-state" && state.traffic === "off") {
        const backup = JSON.parse(authenticate(plan.backupPath, plan.backupDigest).toString("utf8"));
        state.backupAuthenticated = backup.applicationVersion === plan.restoredApplicationVersion && backup.datasetId === contract.datasetId;
      } else if (step === "establish-schema-data-compatibility" && state.backupAuthenticated) {
        const recovery = JSON.parse(authenticate(plan.recoveryPath, plan.recoveryDigest).toString("utf8"));
        state.compatible = recovery.fromSchema === plan.candidateSchemaVersion && recovery.toSchema === plan.acceptedSchemaVersion && recovery.tested === true;
      } else if (step === "execute-tested-recovery" && state.compatible) state.recovered = true;
      else if (step === "restore-accepted-application" && state.recovered && state.traffic === "off") {
        const accepted = authenticate(plan.acceptedApplicationPath, plan.acceptedApplicationDigest);
        writeConfined(root, "restored/accepted-application.oci", accepted);
        state.restored = accepted.toString("utf8").includes(`version=${plan.restoredApplicationVersion}`);
      } else if (step === "verify-health-workflow-egress" && state.restored && state.traffic === "off") {
        state.verified = executeRestoredHealth(root, plan).every((check) => check.status === "pass") && evaluateNetworkPolicy().find((test) => test.testId === "undeclared-public-registry")?.decision === "deny";
      } else if (step === "resume-traffic" && state.verified && state.traffic === "off") state.traffic = "on";
      else fail(`invalid rollback transition: ${step}`);
      if (step === "authenticate-backup-and-state" && !state.backupAuthenticated) fail(`rollback transition failed: ${step}`);
      if (step === "establish-schema-data-compatibility" && !state.compatible) fail(`rollback transition failed: ${step}`);
      if (step === "restore-accepted-application" && !state.restored) fail(`rollback transition failed: ${step}`);
      if (step === "verify-health-workflow-egress" && !state.verified) fail(`rollback transition failed: ${step}`);
      observed.push(step);
    }
    if (state.traffic !== "on" || !state.verified) fail("rollback did not reach verified traffic-resumed state");
    return { triggerId: plan.triggerId, trafficStateDuringRecovery: "off", networkPolicy: "default-deny-enforced", backupArtifactId: plan.backupArtifactId, backupDigest: plan.backupDigest, backupDigestVerified: state.backupAuthenticated, stateAuthenticated: state.backupAuthenticated, compatibilityDecision: "schema-data-compatible-with-1.3.2", recoveryPathId: plan.recoveryPathId, restoredApplicationVersion: plan.restoredApplicationVersion, recoverySequence: observed, verificationIds: ["startup-readiness-liveness-dependency", "bounded-workflow", "undeclared-egress-denied"], trafficResumedAfterVerification: state.traffic === "on" && state.verified, contentLogged: false, rawCredentialLogged: false };
  });
}

try {
  let output;
  if (action === "inventory" && !caseFlag) output = inspectInventory();
  else if (action === "health" && !caseFlag) output = withDeployment(null, ({ root }) => ({ caseVersion: contract.caseVersion, healthChecks: executeHealth(root) }));
  else if (action === "network" && !caseFlag) output = { caseVersion: contract.caseVersion, publicEgress: contract.assumptions.publicEgress, networkTests: evaluateNetworkPolicy() };
  else if (action === "offline" && caseFlag === "--case" && caseId) output = executeOffline(caseId);
  else if (action === "rollback" && !caseFlag) output = executeRollback();
  else { process.stderr.write("Usage: deployment-lab.mjs inventory|health|network|offline --case <case-id>|rollback\n"); process.exit(2); }
  process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
} catch (error) {
  process.stderr.write(`${JSON.stringify({ error: error instanceof Error ? error.message : "deployment lab failed" })}\n`);
  process.exit(1);
}
