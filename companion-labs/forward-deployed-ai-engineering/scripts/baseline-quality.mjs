#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { Validator } from "@langchain/core/utils/json_schema";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const LAB_DIR = path.resolve(path.dirname(SCRIPT_PATH), "..");
const REPO_ROOT = path.resolve(LAB_DIR, "..", "..");
const COURSE_DIR = path.join(
  REPO_ROOT,
  "content",
  "courses",
  "forward-deployed-ai-engineering"
);
const DEFAULT_REPORT = path.join(LAB_DIR, "quality", "baseline-report.json");
const DRAFT = "2020-12";

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function relative(filePath) {
  return path.relative(REPO_ROOT, filePath).split(path.sep).join("/");
}

function sha256(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function ensure(condition, message) {
  if (!condition) throw new Error(message);
}

function unique(values) {
  return new Set(values).size === values.length;
}

function regularFile(filePath) {
  const stat = fs.lstatSync(filePath);
  ensure(stat.isFile() && !stat.isSymbolicLink(), `${relative(filePath)} must be a regular non-symlink file`);
  return stat;
}

function listFiles(root) {
  const files = [];
  const visit = (directory) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const entryPath = path.join(directory, entry.name);
      if (entry.isSymbolicLink()) throw new Error(`${relative(entryPath)} must not be a symlink`);
      if (entry.isDirectory()) visit(entryPath);
      else if (entry.isFile()) files.push(entryPath);
      else throw new Error(`${relative(entryPath)} must be a regular file or directory`);
    }
  };
  visit(root);
  return files;
}

export function validateDraft202012(schema, instance) {
  ensure(schema.$schema === "https://json-schema.org/draft/2020-12/schema", "schema must declare Draft 2020-12");
  const result = new Validator(schema, DRAFT, false).validate(instance);
  return result.errors.map(
    (error) => `${error.instanceLocation} ${error.keyword}: ${error.error}`
  );
}

function courseInventoryCheck() {
  const course = readJson(path.join(COURSE_DIR, "course.json"));
  const moduleRoot = path.join(COURSE_DIR, "modules");
  const moduleDirectories = fs
    .readdirSync(moduleRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  const modules = moduleDirectories.map((directory) => ({
    directory,
    value: readJson(path.join(moduleRoot, directory, "module.json")),
  }));

  ensure(course.id === "forward-deployed-ai-engineering", "course id drifted");
  ensure(course.comingSoon === true, "course must remain comingSoon during cumulative build");
  ensure(course.accessStatus === "catalog-metadata-only", "course access status drifted");
  ensure(modules.length === 12, `expected 12 modules, found ${modules.length}`);
  ensure(modules.every(({ directory, value }) => value.slug === directory && value.id === directory), "module directory/id/slug mismatch");
  ensure(modules.every(({ value }, index) => value.order === index), "module ordering must be contiguous from zero");
  ensure(
    modules.every(({ value }, index) =>
      index === 0
        ? value.prerequisiteModules.length === 0
        : JSON.stringify(value.prerequisiteModules) === JSON.stringify([modules[index - 1].value.id])
    ),
    "module prerequisites must form the declared linear chain"
  );

  return { modules: modules.length, firstOrder: modules[0].value.order, lastOrder: modules.at(-1).value.order };
}

function schemaCheck() {
  const contracts = [
    ["harbourcare-v1", "data/harbourcare-v1.schema.json", "data/harbourcare-v1.json"],
    ["evidence-manifest", "evidence/manifest.schema.json", "evidence/manifest.json"],
    ["fixture-profile", "profiles/profile.schema.json", "profiles/fixture.json"],
    ["cpu-low-resource-profile", "profiles/profile.schema.json", "profiles/cpu-low-resource.json"],
  ];
  for (const [name, schemaPath, instancePath] of contracts) {
    const errors = validateDraft202012(
      readJson(path.join(LAB_DIR, schemaPath)),
      readJson(path.join(LAB_DIR, instancePath))
    );
    ensure(errors.length === 0, `${name} failed Draft 2020-12 validation: ${errors.join("; ")}`);
  }
  return { draft: DRAFT, validatedInstances: contracts.length };
}

function fixtureIntegrityCheck() {
  const fixturePath = path.join(LAB_DIR, "data", "harbourcare-v1.json");
  const fixture = readJson(fixturePath);
  const ids = (records) => records.map((record) => record.id);
  const tenantIds = ids(fixture.tenants);
  const personaIds = ids(fixture.personas);
  const documentIds = ids(fixture.documents);
  const erpIds = ids(fixture.erpRecords);
  const goldenIds = ids(fixture.goldenSet.cases);

  for (const [name, values] of Object.entries({ tenantIds, personaIds, documentIds, erpIds, goldenIds })) {
    ensure(unique(values), `${name} must be unique`);
  }
  ensure(fixture.fictional === true && fixture.containsRealPersonalData === false, "fixture must remain explicitly synthetic");
  ensure(fixture.personas.every((persona) => tenantIds.includes(persona.tenantId)), "persona references unknown tenant");
  ensure(fixture.documents.every((document) => tenantIds.includes(document.tenantId)), "document references unknown tenant");
  ensure(fixture.erpRecords.every((record) => tenantIds.includes(record.tenantId)), "ERP record references unknown tenant");
  ensure(fixture.erpRecords.every((record) => !record.duplicateOf || erpIds.includes(record.duplicateOf)), "ERP duplicate reference is unresolved");
  for (const testCase of fixture.goldenSet.cases) {
    ensure(personaIds.includes(testCase.actorId), `${testCase.id} references unknown actor`);
    ensure(testCase.expected.documentIds.every((id) => documentIds.includes(id)), `${testCase.id} references unknown document`);
    ensure(testCase.expected.mustExcludeTenantIds.every((id) => tenantIds.includes(id)), `${testCase.id} references unknown excluded tenant`);
  }
  ensure(fixture.personas.every((persona) => persona.email.endsWith("@harbourcare.invalid")), "all fixture email addresses must use .invalid");

  return {
    datasetId: fixture.datasetId,
    sha256: sha256(fixturePath),
    tenants: tenantIds.length,
    personas: personaIds.length,
    documents: documentIds.length,
    erpRecords: erpIds.length,
    goldenCases: goldenIds.length,
  };
}

function evidenceReferenceCheck() {
  const manifest = readJson(path.join(LAB_DIR, "evidence", "manifest.json"));
  const evidenceRoot = path.join(LAB_DIR, "evidence");
  for (const template of manifest.templates) {
    ensure(!template.path.includes(".."), `${template.id} path traverses outside evidence root`);
    const templatePath = path.resolve(evidenceRoot, template.path);
    ensure(templatePath.startsWith(`${evidenceRoot}${path.sep}`), `${template.id} path escapes evidence root`);
    regularFile(templatePath);
    ensure(sha256(templatePath) === template.sha256, `${template.id} digest mismatch`);
    ensure(manifest.requiredDirectories.includes(template.outputDirectory), `${template.id} output directory is undeclared`);
  }
  for (const profileName of ["fixture", "cpu-low-resource"]) {
    const profile = readJson(path.join(LAB_DIR, "profiles", `${profileName}.json`));
    for (const reference of [profile.fixturePath, profile.evidenceManifestPath]) {
      const resolved = path.resolve(LAB_DIR, reference);
      ensure(resolved.startsWith(`${LAB_DIR}${path.sep}`), `${profileName} reference escapes lab root`);
      regularFile(resolved);
    }
  }
  return { templates: manifest.templates.length, profiles: 2, authenticatedReferences: manifest.templates.length + 4 };
}

function sourceFiles() {
  return [...listFiles(COURSE_DIR), ...listFiles(LAB_DIR)]
    .filter((filePath) => filePath !== DEFAULT_REPORT)
    .sort((a, b) => relative(a).localeCompare(relative(b)));
}

function placeholderCheck() {
  const fragments = ["TO" + "DO", "T" + "BD", "FIX" + "ME", "CHANGE" + "ME", "Lorem" + " ipsum"];
  const marker = new RegExp(`\\b(?:${fragments.join("|")})\\b|\\{\\{[^}]+\\}\\}`, "i");
  const matches = [];
  for (const filePath of sourceFiles()) {
    const content = fs.readFileSync(filePath, "utf8");
    if (marker.test(content)) matches.push(relative(filePath));
  }
  ensure(matches.length === 0, `placeholder markers found in: ${matches.join(", ")}`);
  return { filesScanned: sourceFiles().length, matches: 0 };
}

function credentialSignatureCheck() {
  const signatures = [
    new RegExp("-----BEGIN " + "(?:RSA |EC |OPENSSH )?PRIVATE KEY-----"),
    /\bsk-[A-Za-z0-9]{20,}\b/,
    /\bgh[pousr]_[A-Za-z0-9]{20,}\b/,
    /\bAKIA[0-9A-Z]{16}\b/,
    /\bBearer\s+[A-Za-z0-9._~-]{20,}\b/i,
  ];
  const matches = [];
  for (const filePath of sourceFiles()) {
    const content = fs.readFileSync(filePath, "utf8");
    if (signatures.some((signature) => signature.test(content))) matches.push(relative(filePath));
  }
  ensure(matches.length === 0, `credential signatures found in: ${matches.join(", ")}`);
  return { filesScanned: sourceFiles().length, matches: 0 };
}

function runCheck(id, operation) {
  try {
    return { id, status: "pass", details: operation() };
  } catch (error) {
    return { id, status: "fail", error: error instanceof Error ? error.message : String(error) };
  }
}

export function buildBaselineReport() {
  const checks = [
    runCheck("course-inventory", courseInventoryCheck),
    runCheck("draft-2020-12-schemas", schemaCheck),
    runCheck("fixture-integrity", fixtureIntegrityCheck),
    runCheck("evidence-references", evidenceReferenceCheck),
    runCheck("zero-placeholders", placeholderCheck),
    runCheck("credential-signatures", credentialSignatureCheck),
  ];
  const failed = checks.filter((check) => check.status === "fail").length;
  return {
    contractVersion: "1.0.0",
    courseId: "forward-deployed-ai-engineering",
    bddScenarios: ["FDE-20", "FDE-21"],
    checks,
    summary: { status: failed === 0 ? "pass" : "fail", passed: checks.length - failed, failed },
  };
}

function serialise(report) {
  return `${JSON.stringify(report, null, 2)}\n`;
}

function writeAtomic(reportPath, bytes) {
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  if (fs.existsSync(reportPath)) {
    const current = fs.lstatSync(reportPath);
    ensure(current.isFile() && !current.isSymbolicLink() && current.nlink === 1, "report target must be a single-link regular file");
  }
  const temporaryPath = path.join(path.dirname(reportPath), `.${path.basename(reportPath)}.tmp-${process.pid}`);
  let descriptor;
  try {
    descriptor = fs.openSync(temporaryPath, fs.constants.O_WRONLY | fs.constants.O_CREAT | fs.constants.O_EXCL | fs.constants.O_NOFOLLOW, 0o600);
    fs.writeFileSync(descriptor, bytes, "utf8");
    fs.fsyncSync(descriptor);
    fs.closeSync(descriptor);
    descriptor = undefined;
    fs.renameSync(temporaryPath, reportPath);
  } finally {
    if (descriptor !== undefined) fs.closeSync(descriptor);
    if (fs.existsSync(temporaryPath)) fs.unlinkSync(temporaryPath);
  }
}

function parseArgs(argv) {
  const [command, ...rest] = argv;
  ensure(command === "generate" || command === "check", "Usage: baseline-quality.mjs <generate|check> [--report PATH]");
  let reportPath = DEFAULT_REPORT;
  for (let index = 0; index < rest.length; index += 1) {
    ensure(rest[index] === "--report" && rest[index + 1], `Unknown argument: ${rest[index]}`);
    reportPath = path.resolve(rest[index + 1]);
    index += 1;
  }
  return { command, reportPath };
}

function main() {
  const { command, reportPath } = parseArgs(process.argv.slice(2));
  const report = buildBaselineReport();
  ensure(report.summary.failed === 0, report.checks.filter((check) => check.status === "fail").map((check) => `${check.id}: ${check.error}`).join("\n"));
  const expected = serialise(report);
  if (command === "generate") {
    writeAtomic(reportPath, expected);
    process.stdout.write(`${JSON.stringify({ status: "generated", report: reportPath, checks: report.summary.passed })}\n`);
    return;
  }
  regularFile(reportPath);
  ensure(fs.readFileSync(reportPath, "utf8") === expected, "baseline report is stale; run generate and review the diff");
  process.stdout.write(`${JSON.stringify({ status: "pass", report: reportPath, checks: report.summary.passed })}\n`);
}

if (path.resolve(process.argv[1] ?? "") === SCRIPT_PATH) {
  try {
    main();
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}
