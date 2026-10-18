#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const COURSE_ID = "forward-deployed-ai-engineering";
const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const LAB_DIR = path.resolve(SCRIPT_DIR, "..");
const PROFILE_FILES = new Map([
  ["fixture", "fixture.json"],
  ["cpu-low-resource", "cpu-low-resource.json"],
]);
const CREDENTIAL_ENV = /^(?:OPENAI|ANTHROPIC|AZURE|GOOGLE|GEMINI|MISTRAL|COHERE|TOGETHER|GROQ).*(?:API_KEY|TOKEN|SECRET)$/i;
const MARKER_FILE = ".fde-lab-state.json";

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

function resolveLabFile(relativePath) {
  if (path.isAbsolute(relativePath) || relativePath.split(/[\\/]/).includes("..")) {
    throw new Error(`Profile path must be confined to the lab: ${relativePath}`);
  }
  const resolved = path.resolve(LAB_DIR, relativePath);
  if (!resolved.startsWith(`${LAB_DIR}${path.sep}`)) {
    throw new Error(`Profile path escapes the lab: ${relativePath}`);
  }
  const stat = fs.lstatSync(resolved);
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
  if (fs.existsSync(resolved) && fs.lstatSync(resolved).isSymbolicLink()) {
    throw new Error(`State directory must not be a symbolic link: ${resolved}`);
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

function setup(profileName, stateDir, profilePath, profile) {
  assertCredentialFreeEnvironment();
  const runtime = expectedRuntime(profileName, profilePath, profile);
  if (fs.existsSync(stateDir)) {
    const entries = fs.readdirSync(stateDir);
    if (entries.length > 0 && !entries.includes(MARKER_FILE)) {
      throw new Error(`Refusing to reuse unmarked state directory: ${stateDir}`);
    }
    if (entries.includes(MARKER_FILE)) {
      const marker = readJson(path.join(stateDir, MARKER_FILE));
      if (marker.courseId !== COURSE_ID || marker.profile !== profileName) {
        throw new Error("State marker does not match the requested course and profile");
      }
      const unexpected = entries.filter((entry) => !new Set([MARKER_FILE, "runtime.json"]).has(entry));
      if (unexpected.length > 0) {
        throw new Error(`Refusing to overwrite unexpected state entries: ${unexpected.sort().join(", ")}`);
      }
    }
  }
  fs.mkdirSync(stateDir, { recursive: true, mode: 0o700 });
  fs.writeFileSync(path.join(stateDir, MARKER_FILE), `${JSON.stringify({ courseId: COURSE_ID, profile: profileName })}\n`, { mode: 0o600 });
  fs.writeFileSync(path.join(stateDir, "runtime.json"), `${JSON.stringify(runtime, null, 2)}\n`, { mode: 0o600 });
  process.stdout.write(`${JSON.stringify({ status: "ready", ...runtime })}\n`);
}

function health(profileName, stateDir, profilePath, profile) {
  assertCredentialFreeEnvironment();
  const runtimePath = path.join(stateDir, "runtime.json");
  const markerPath = path.join(stateDir, MARKER_FILE);
  if (!fs.existsSync(runtimePath) || !fs.existsSync(markerPath)) {
    throw new Error(`Run setup first for profile ${profileName}`);
  }
  const marker = readJson(markerPath);
  if (marker.courseId !== COURSE_ID || marker.profile !== profileName) {
    throw new Error("State marker does not match the requested course and profile");
  }
  const expected = expectedRuntime(profileName, profilePath, profile);
  const actual = readJson(runtimePath);
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error("State authentication failed; run reset and setup again");
  }
  process.stdout.write(`${JSON.stringify({ status: "healthy", ...expected })}\n`);
}

function reset(profileName, stateDir) {
  if (!fs.existsSync(stateDir)) {
    process.stdout.write(`${JSON.stringify({ status: "already-reset", profile: profileName })}\n`);
    return;
  }
  const markerPath = path.join(stateDir, MARKER_FILE);
  if (!fs.existsSync(markerPath)) throw new Error(`Refusing to reset unmarked state directory: ${stateDir}`);
  const marker = readJson(markerPath);
  if (marker.courseId !== COURSE_ID || marker.profile !== profileName) {
    throw new Error("State marker does not match the requested course and profile");
  }
  const unexpected = fs.readdirSync(stateDir).filter((entry) => !new Set([MARKER_FILE, "runtime.json"]).has(entry));
  if (unexpected.length > 0) {
    throw new Error(`Refusing to delete unexpected state entries: ${unexpected.sort().join(", ")}`);
  }
  fs.rmSync(stateDir, { recursive: true });
  process.stdout.write(`${JSON.stringify({ status: "reset", profile: profileName })}\n`);
}

try {
  const options = parseArguments(process.argv.slice(2));
  const stateDir = assertSafeStateDirectory(options.stateDir);
  const { profile, profilePath } = loadProfile(options.profile);
  if (options.command === "setup") setup(options.profile, stateDir, profilePath, profile);
  if (options.command === "health") health(options.profile, stateDir, profilePath, profile);
  if (options.command === "reset") reset(options.profile, stateDir);
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
}
