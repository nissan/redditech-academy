#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const COURSE_ID = "forward-deployed-ai-engineering";
const SCRIPT_FILE = fileURLToPath(import.meta.url);
const SCRIPT_DIR = path.dirname(SCRIPT_FILE);
const LAB_DIR = path.resolve(SCRIPT_DIR, "..");
const PROFILE_FILES = new Map([
  ["fixture", "fixture.json"],
  ["cpu-low-resource", "cpu-low-resource.json"],
]);
const CREDENTIAL_ENV = /^(?:OPENAI|ANTHROPIC|AZURE|GOOGLE|GEMINI|MISTRAL|COHERE|TOGETHER|GROQ).*(?:API_KEY|TOKEN|SECRET)$/i;
const MARKER_FILE = ".fde-lab-state.json";
const RUNTIME_FILE = "runtime.json";
const EXPECTED_STATE_FILES = new Set([MARKER_FILE, RUNTIME_FILE]);
const { O_CREAT, O_DIRECTORY, O_EXCL, O_NOFOLLOW, O_RDONLY, O_WRONLY } = fs.constants;

function fail(message) {
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
}

function parseArguments(argv) {
  const [command, ...rest] = argv;
  if (!new Set(["setup", "health", "reset"]).has(command)) {
    throw new Error("Usage: lab-bootstrap.mjs <setup|health|reset> --profile <fixture|cpu-low-resource> [--state-dir <path>]");
  }
  const options = { command, profile: "fixture", stateDir: path.join(LAB_DIR, ".lab-state") };
  for (let index = 0; index < rest.length; index += 2) {
    const flag = rest[index];
    const value = rest[index + 1];
    if (!value || !new Set(["--profile", "--state-dir"]).has(flag)) {
      throw new Error(`Unknown or incomplete argument: ${flag ?? "<missing>"}`);
    }
    if (flag === "--profile") options.profile = value;
    if (flag === "--state-dir") options.stateDir = path.resolve(value);
  }
  return options;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function sha256(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function sameIdentity(left, right) {
  return left.dev === right.dev && left.ino === right.ino && left.mode === right.mode;
}

function identityLabel(stat) {
  return `${stat.dev.toString()}:${stat.ino.toString()}:${stat.mode.toString()}`;
}

function lstatBigInt(filePath) {
  return fs.lstatSync(filePath, { bigint: true });
}

function fstatBigInt(fd) {
  return fs.fstatSync(fd, { bigint: true });
}

function openDirectoryNoFollow(directoryPath) {
  const before = lstatBigInt(directoryPath);
  if (before.isSymbolicLink() || !before.isDirectory()) {
    throw new Error(`State path must be a real directory: ${directoryPath}`);
  }
  const fd = fs.openSync(directoryPath, O_RDONLY | O_DIRECTORY | O_NOFOLLOW);
  try {
    const opened = fstatBigInt(fd);
    const after = lstatBigInt(directoryPath);
    if (!opened.isDirectory() || !sameIdentity(before, opened) || !sameIdentity(opened, after)) {
      throw new Error(`State directory identity changed while opening: ${directoryPath}`);
    }
    return { fd, identity: opened };
  } catch (error) {
    fs.closeSync(fd);
    throw error;
  }
}

function assertDirectoryPathIdentity(directoryPath, directory) {
  const descriptor = fstatBigInt(directory.fd);
  const current = lstatBigInt(directoryPath);
  if (!descriptor.isDirectory() || !sameIdentity(descriptor, directory.identity) || !sameIdentity(current, directory.identity)) {
    throw new Error(`State directory identity changed: expected ${identityLabel(directory.identity)}`);
  }
}

function openRegularNoFollow(filePath, label) {
  const before = lstatBigInt(filePath);
  if (before.isSymbolicLink() || !before.isFile()) {
    throw new Error(`${label} must be a regular non-symlink file`);
  }
  const fd = fs.openSync(filePath, O_RDONLY | O_NOFOLLOW);
  try {
    const opened = fstatBigInt(fd);
    const after = lstatBigInt(filePath);
    if (!opened.isFile() || !sameIdentity(before, opened) || !sameIdentity(opened, after) || opened.nlink !== 1n) {
      throw new Error(`${label} identity changed or has an unsafe link count`);
    }
    return { fd, identity: opened };
  } catch (error) {
    fs.closeSync(fd);
    throw error;
  }
}

function readJsonFromRegular(filePath, label) {
  const opened = openRegularNoFollow(filePath, label);
  try {
    return JSON.parse(fs.readFileSync(opened.fd, "utf8"));
  } finally {
    fs.closeSync(opened.fd);
  }
}

function resolveLabFile(relativePath) {
  if (path.isAbsolute(relativePath) || relativePath.split(/[\\/]/).includes("..")) {
    throw new Error(`Profile path must be confined to the lab: ${relativePath}`);
  }
  const resolved = path.resolve(LAB_DIR, relativePath);
  if (!resolved.startsWith(`${LAB_DIR}${path.sep}`)) {
    throw new Error(`Profile path escapes the lab: ${relativePath}`);
  }
  const stat = lstatBigInt(resolved);
  if (stat.isSymbolicLink() || !stat.isFile()) {
    throw new Error(`Profile path must identify a regular file: ${relativePath}`);
  }
  return resolved;
}

function loadProfile(profileName) {
  const filename = PROFILE_FILES.get(profileName);
  if (!filename) throw new Error(`Unknown profile: ${profileName}`);
  const profilePath = path.join(LAB_DIR, "profiles", filename);
  const profile = readJson(profilePath);
  if (
    profile.contractVersion !== "1.0.0" || profile.courseId !== COURSE_ID ||
    profile.profileId !== profileName || profile.networkEgress !== "deny" ||
    profile.paidProviderCalls !== false || profile.liveCustomerData !== false ||
    profile.resources?.cpuWorkers !== 1 || profile.resources?.memoryMb > 1024 ||
    profile.resources?.gpuRequired !== false
  ) {
    throw new Error(`Profile contract is invalid: ${profileName}`);
  }
  for (const service of profile.services ?? []) {
    if (!new Set(["none", "127.0.0.1"]).has(service.bind)) {
      throw new Error(`Service binding is not local-only: ${service.id}`);
    }
  }
  return { profile, profilePath };
}

function assertCredentialFreeEnvironment() {
  const detected = Object.keys(process.env).filter((name) => CREDENTIAL_ENV.test(name));
  if (detected.length > 0) {
    throw new Error(`Provider credentials are not permitted (${detected.sort().join(", ")})`);
  }
}

function assertSafeStateDirectory(stateDir) {
  const resolved = path.resolve(stateDir);
  const forbidden = new Set([path.parse(resolved).root, os.homedir(), LAB_DIR]);
  if (forbidden.has(resolved)) throw new Error(`Unsafe state directory: ${resolved}`);
  if (fs.existsSync(resolved)) {
    const stat = lstatBigInt(resolved);
    if (stat.isSymbolicLink() || !stat.isDirectory()) {
      throw new Error(`State path must be a real directory: ${resolved}`);
    }
  }
  return resolved;
}

function expectedRuntime(profileName, profilePath, profile) {
  const fixturePath = resolveLabFile(profile.fixturePath);
  const evidenceManifestPath = resolveLabFile(profile.evidenceManifestPath);
  return {
    contractVersion: "1.0.0", courseId: COURSE_ID, profile: profileName,
    mode: profile.mode, networkEgress: profile.networkEgress,
    paidProviderCalls: profile.paidProviderCalls, liveCustomerData: profile.liveCustomerData,
    cpuWorkers: profile.resources.cpuWorkers, memoryMb: profile.resources.memoryMb,
    gpuRequired: profile.resources.gpuRequired, fixtureSha256: sha256(fixturePath),
    evidenceManifestSha256: sha256(evidenceManifestPath), profileSha256: sha256(profilePath),
  };
}

function assertExpectedEntries(stateDir) {
  const entries = fs.readdirSync(stateDir);
  const unexpected = entries.filter((entry) => !EXPECTED_STATE_FILES.has(entry));
  if (unexpected.length > 0) {
    throw new Error(`Unexpected state entries: ${unexpected.sort().join(", ")}`);
  }
  return entries;
}

function writeExclusiveTemporary(stateDir, directory, content) {
  assertDirectoryPathIdentity(stateDir, directory);
  const temporaryPath = path.join(stateDir, `.fde-write-${crypto.randomBytes(16).toString("hex")}`);
  const fd = fs.openSync(temporaryPath, O_WRONLY | O_CREAT | O_EXCL | O_NOFOLLOW, 0o600);
  try {
    fs.writeFileSync(fd, content, "utf8");
    fs.fsyncSync(fd);
    const stat = fstatBigInt(fd);
    if (!stat.isFile() || stat.nlink !== 1n) throw new Error("Temporary state file is not a unique regular file");
    assertDirectoryPathIdentity(stateDir, directory);
    return { path: temporaryPath, identity: stat };
  } finally {
    fs.closeSync(fd);
  }
}

function installTemporary(stateDir, directory, temporary, filename) {
  assertDirectoryPathIdentity(stateDir, directory);
  const targetPath = path.join(stateDir, filename);
  if (fs.existsSync(targetPath)) {
    const existing = openRegularNoFollow(targetPath, filename);
    fs.closeSync(existing.fd);
  }
  fs.renameSync(temporary.path, targetPath);
  assertDirectoryPathIdentity(stateDir, directory);
  const installed = openRegularNoFollow(targetPath, filename);
  try {
    if (!sameIdentity(installed.identity, temporary.identity)) {
      throw new Error(`${filename} identity changed during atomic installation`);
    }
  } finally {
    fs.closeSync(installed.fd);
  }
}

function setup(profileName, stateDir, profilePath, profile) {
  assertCredentialFreeEnvironment();
  const runtime = expectedRuntime(profileName, profilePath, profile);
  if (!fs.existsSync(stateDir)) fs.mkdirSync(stateDir, { mode: 0o700 });
  const directory = openDirectoryNoFollow(stateDir);
  const temporaries = [];
  try {
    const entries = assertExpectedEntries(stateDir);
    if (entries.includes(MARKER_FILE)) {
      const marker = readJsonFromRegular(path.join(stateDir, MARKER_FILE), MARKER_FILE);
      if (marker.courseId !== COURSE_ID || marker.profile !== profileName) {
        throw new Error("State marker does not match the requested course and profile");
      }
    }
    if (entries.includes(RUNTIME_FILE)) {
      const runtimeFile = openRegularNoFollow(path.join(stateDir, RUNTIME_FILE), RUNTIME_FILE);
      fs.closeSync(runtimeFile.fd);
    }
    const runtimeTemporary = writeExclusiveTemporary(stateDir, directory, `${JSON.stringify(runtime, null, 2)}\n`);
    temporaries.push(runtimeTemporary);
    const markerTemporary = writeExclusiveTemporary(stateDir, directory, `${JSON.stringify({ courseId: COURSE_ID, profile: profileName })}\n`);
    temporaries.push(markerTemporary);
    installTemporary(stateDir, directory, runtimeTemporary, RUNTIME_FILE);
    temporaries.splice(temporaries.indexOf(runtimeTemporary), 1);
    installTemporary(stateDir, directory, markerTemporary, MARKER_FILE);
    temporaries.splice(temporaries.indexOf(markerTemporary), 1);
    fs.fsyncSync(directory.fd);
    assertDirectoryPathIdentity(stateDir, directory);
  } finally {
    for (const temporary of temporaries) {
      try {
        assertDirectoryPathIdentity(stateDir, directory);
        const current = lstatBigInt(temporary.path);
        if (sameIdentity(current, temporary.identity) && current.isFile() && !current.isSymbolicLink()) {
          fs.unlinkSync(temporary.path);
        }
      } catch {}
    }
    fs.closeSync(directory.fd);
  }
  process.stdout.write(`${JSON.stringify({ status: "ready", ...runtime })}\n`);
}

function health(profileName, stateDir, profilePath, profile) {
  assertCredentialFreeEnvironment();
  if (!fs.existsSync(stateDir)) throw new Error(`Run setup first for profile ${profileName}`);
  const directory = openDirectoryNoFollow(stateDir);
  try {
    const entries = assertExpectedEntries(stateDir);
    if (!entries.includes(MARKER_FILE) || !entries.includes(RUNTIME_FILE)) {
      throw new Error(`Run setup first for profile ${profileName}`);
    }
    const marker = readJsonFromRegular(path.join(stateDir, MARKER_FILE), MARKER_FILE);
    if (marker.courseId !== COURSE_ID || marker.profile !== profileName) {
      throw new Error("State marker does not match the requested course and profile");
    }
    const expected = expectedRuntime(profileName, profilePath, profile);
    const actual = readJsonFromRegular(path.join(stateDir, RUNTIME_FILE), RUNTIME_FILE);
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      throw new Error("State authentication failed; run reset and setup again");
    }
    assertDirectoryPathIdentity(stateDir, directory);
    process.stdout.write(`${JSON.stringify({ status: "healthy", ...expected })}\n`);
  } finally {
    fs.closeSync(directory.fd);
  }
}

function createQuarantine(stateDir) {
  const root = fs.mkdtempSync(path.join(path.dirname(stateDir), `.${path.basename(stateDir)}.fde-quarantine-`));
  fs.chmodSync(root, 0o700);
  return { root, state: path.join(root, "state") };
}

function authenticateResetFiles(directoryPath, profileName) {
  const entries = assertExpectedEntries(directoryPath);
  if (!entries.includes(MARKER_FILE) || !entries.includes(RUNTIME_FILE)) {
    throw new Error(`Refusing to reset incomplete state directory: ${directoryPath}`);
  }
  const markerFile = openRegularNoFollow(path.join(directoryPath, MARKER_FILE), MARKER_FILE);
  let runtimeFile;
  try {
    runtimeFile = openRegularNoFollow(path.join(directoryPath, RUNTIME_FILE), RUNTIME_FILE);
    const marker = JSON.parse(fs.readFileSync(markerFile.fd, "utf8"));
    const runtime = JSON.parse(fs.readFileSync(runtimeFile.fd, "utf8"));
    if (marker.courseId !== COURSE_ID || marker.profile !== profileName || runtime.courseId !== COURSE_ID || runtime.profile !== profileName) {
      throw new Error("State files do not match the requested course and profile");
    }
    return { markerFile, runtimeFile };
  } catch (error) {
    fs.closeSync(markerFile.fd);
    if (runtimeFile) fs.closeSync(runtimeFile.fd);
    throw error;
  }
}

function unlinkAuthenticatedFile(directoryPath, directory, filename, opened) {
  assertDirectoryPathIdentity(directoryPath, directory);
  const sourcePath = path.join(directoryPath, filename);
  const current = lstatBigInt(sourcePath);
  if (!sameIdentity(current, opened.identity) || !current.isFile() || current.isSymbolicLink()) {
    throw new Error(`${filename} changed before deletion`);
  }
  const tombstonePath = path.join(directoryPath, `.fde-delete-${crypto.randomBytes(16).toString("hex")}`);
  fs.renameSync(sourcePath, tombstonePath);
  assertDirectoryPathIdentity(directoryPath, directory);
  const tombstone = lstatBigInt(tombstonePath);
  if (!sameIdentity(tombstone, opened.identity) || !tombstone.isFile() || tombstone.isSymbolicLink()) {
    throw new Error(`${filename} changed during deletion quarantine`);
  }
  fs.unlinkSync(tombstonePath);
}

export function resetAuthenticatedState(profileName, stateDir, hooks = {}) {
  if (!fs.existsSync(stateDir)) {
    process.stdout.write(`${JSON.stringify({ status: "already-reset", profile: profileName })}\n`);
    return;
  }
  const directory = openDirectoryNoFollow(stateDir);
  let files;
  try {
    files = authenticateResetFiles(stateDir, profileName);
    assertDirectoryPathIdentity(stateDir, directory);
    hooks.beforeQuarantine?.();
    const quarantine = createQuarantine(stateDir);
    fs.renameSync(stateDir, quarantine.state);
    const quarantined = lstatBigInt(quarantine.state);
    const descriptor = fstatBigInt(directory.fd);
    if (!sameIdentity(quarantined, directory.identity) || !sameIdentity(descriptor, directory.identity)) {
      throw new Error("State directory identity changed before quarantine; no files were deleted");
    }
    unlinkAuthenticatedFile(quarantine.state, directory, RUNTIME_FILE, files.runtimeFile);
    unlinkAuthenticatedFile(quarantine.state, directory, MARKER_FILE, files.markerFile);
    if (fs.readdirSync(quarantine.state).length !== 0) throw new Error("Quarantined state directory is not empty");
    assertDirectoryPathIdentity(quarantine.state, directory);
    fs.rmdirSync(quarantine.state);
    fs.rmdirSync(quarantine.root);
  } finally {
    if (files) {
      fs.closeSync(files.markerFile.fd);
      fs.closeSync(files.runtimeFile.fd);
    }
    fs.closeSync(directory.fd);
  }
  process.stdout.write(`${JSON.stringify({ status: "reset", profile: profileName })}\n`);
}

function runCli() {
  const options = parseArguments(process.argv.slice(2));
  const stateDir = assertSafeStateDirectory(options.stateDir);
  const { profile, profilePath } = loadProfile(options.profile);
  if (options.command === "setup") setup(options.profile, stateDir, profilePath, profile);
  if (options.command === "health") health(options.profile, stateDir, profilePath, profile);
  if (options.command === "reset") resetAuthenticatedState(options.profile, stateDir);
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_FILE) {
  try {
    runCli();
  } catch (error) {
    fail(error instanceof Error ? error.message : String(error));
  }
}
