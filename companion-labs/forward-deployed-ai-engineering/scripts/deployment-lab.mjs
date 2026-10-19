#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const contractPath = path.resolve(here, "../deployments/private-deployment-v1.json");
const contract = JSON.parse(fs.readFileSync(contractPath, "utf8"));
const [action, caseFlag, caseId] = process.argv.slice(2);

let output;
if (action === "inventory" && !caseFlag) output = { caseVersion: contract.caseVersion, artifacts: contract.artifacts, dependencies: contract.dependencies };
else if (action === "health" && !caseFlag) output = { caseVersion: contract.caseVersion, healthChecks: contract.healthChecks };
else if (action === "network" && !caseFlag) output = { caseVersion: contract.caseVersion, publicEgress: contract.assumptions.publicEgress, networkTests: contract.networkTests };
else if (action === "offline" && caseFlag === "--case") output = contract.offlineTests.find((entry) => entry.caseId === caseId);
else if (action === "rollback" && !caseFlag) output = contract.rollbackEvidence;

if (!output) {
  process.stderr.write("Usage: deployment-lab.mjs inventory|health|network|offline --case <case-id>|rollback\n");
  process.exitCode = 2;
} else {
  process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
}
