#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const LAB_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const POLICY_PATH = path.join(LAB_ROOT, "policies", "access-policy-v1.json");

function fail(message) {
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
}

function loadPolicy() {
  return JSON.parse(fs.readFileSync(POLICY_PATH, "utf8"));
}

function evaluate(policy, caseId) {
  const testCase = policy.cases.find((candidate) => candidate.id === caseId);
  if (!testCase) throw new Error(`unknown case: ${caseId}`);
  const identity = policy.identities.find((candidate) => candidate.id === testCase.identityId);
  const resource = policy.resources.find((candidate) => candidate.id === testCase.resourceId);
  if (!identity || !resource) throw new Error(`case ${caseId} has an unresolved identity or resource`);

  const actionIsTool = testCase.actionId === "draft_purchase";
  let decision = "allow";
  let reasonCodeIds;
  if (identity.lifecycleState !== "active") {
    decision = "deny";
    reasonCodeIds = ["lifecycle-inactive"];
  } else if (identity.tenantId !== resource.tenantId) {
    decision = "deny";
    reasonCodeIds = ["tenant-mismatch"];
  } else if (!identity.allowedActionIds.includes(testCase.actionId)) {
    decision = "deny";
    reasonCodeIds = [identity.kind === "service" ? "service-scope-denied" : "role-action-denied"];
  } else if (!identity.roleIds.some((roleId) => resource.allowedRoleIds.includes(roleId))) {
    decision = "deny";
    reasonCodeIds = ["document-policy-denied"];
  } else {
    reasonCodeIds = [
      "lifecycle-active",
      "tenant-match",
      identity.kind === "service" ? "service-scope-allowed" : "role-action-allowed",
      "document-policy-allowed",
    ];
  }

  if (decision !== testCase.expectedDecision) throw new Error(`case ${caseId} does not match its expected decision`);
  return {
    contractVersion: "fde-access-trace-v1",
    caseId,
    correlationId: `trace-${caseId}`,
    policyVersion: policy.policyVersion,
    identityRef: identity.id,
    identityKind: identity.kind,
    lifecycleState: identity.lifecycleState,
    assignmentRef: identity.assignmentId,
    tenantId: identity.tenantId,
    roleIds: [...identity.roleIds].sort(),
    resourceRef: resource.id,
    resourceTenantId: resource.tenantId,
    documentClass: resource.classification,
    actionId: testCase.actionId,
    decision,
    reasonCodeIds,
    enforcementPointId: actionIsTool ? "before-downstream-tool" : "before-protected-retrieval",
    retrievalAttempted: decision === "allow" && !actionIsTool,
    contextAssembled: decision === "allow" && !actionIsTool,
    toolInvoked: decision === "allow" && actionIsTool,
    contentLogged: false,
    rawCredentialLogged: false
  };
}

const [action, caseFlag, caseId, ...extras] = process.argv.slice(2);
if (action !== "run" || caseFlag !== "--case" || !caseId || extras.length > 0) {
  fail("usage: node policy-lab.mjs run --case <case-id>");
} else {
  try {
    process.stdout.write(`${JSON.stringify(evaluate(loadPolicy(), caseId), null, 2)}\n`);
  } catch (error) {
    fail(error instanceof Error ? error.message : String(error));
  }
}
