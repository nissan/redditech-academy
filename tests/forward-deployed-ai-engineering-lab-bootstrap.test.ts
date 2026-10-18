import crypto from "crypto";
import fs from "fs";
import os from "os";
import path from "path";
import { spawnSync } from "child_process";
import { pathToFileURL } from "url";

import { afterEach, describe, expect, it } from "vitest";

const LAB_DIR = path.join(
  process.cwd(),
  "companion-labs",
  "forward-deployed-ai-engineering"
);
const CLI = path.join(LAB_DIR, "scripts", "lab-bootstrap.mjs");
const PROFILE_DIR = path.join(LAB_DIR, "profiles");
const temporaryDirectories: string[] = [];

function sha256(filePath: string) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function run(command: string, profile: string, stateDir: string) {
  return spawnSync(
    process.execPath,
    [CLI, command, "--profile", profile, "--state-dir", stateDir],
    {
      cwd: LAB_DIR,
      encoding: "utf8",
      env: { PATH: process.env.PATH ?? "", NODE_ENV: "test" },
    }
  );
}

function newStateDirectory() {
  const parent = fs.mkdtempSync(path.join(os.tmpdir(), "fde-lab-bootstrap-"));
  temporaryDirectories.push(parent);
  return path.join(parent, "state");
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

describe("Forward Deployed AI Engineering B4 local lab bootstrap", () => {
  it("defines strict deterministic-fixture and low-resource CPU profiles", () => {
    const schema = JSON.parse(
      fs.readFileSync(path.join(PROFILE_DIR, "profile.schema.json"), "utf8")
    );
    const fixture = JSON.parse(
      fs.readFileSync(path.join(PROFILE_DIR, "fixture.json"), "utf8")
    );
    const cpu = JSON.parse(
      fs.readFileSync(path.join(PROFILE_DIR, "cpu-low-resource.json"), "utf8")
    );

    expect(schema.$schema).toBe("https://json-schema.org/draft/2020-12/schema");
    expect(schema.additionalProperties).toBe(false);
    for (const profile of [fixture, cpu]) {
      expect(profile).toMatchObject({
        contractVersion: "1.0.0",
        courseId: "forward-deployed-ai-engineering",
        networkEgress: "deny",
        paidProviderCalls: false,
        liveCustomerData: false,
        fixturePath: "data/harbourcare-v1.json",
      });
      expect(profile.resources.cpuWorkers).toBe(1);
      expect(profile.resources.memoryMb).toBeLessThanOrEqual(1024);
      expect(profile.resources.gpuRequired).toBe(false);
      expect(profile.services.every((service: { bind: string }) => service.bind === "none" || service.bind === "127.0.0.1")).toBe(true);
    }
    expect(fixture.mode).toBe("deterministic-fixture");
    expect(cpu.mode).toBe("cpu-local");
    expect(cpu.optionalExtensions).toContain("local-model-runtime");
  });

  it("sets up idempotently, reports deterministic health, and resets only marked state", () => {
    const stateDir = newStateDirectory();
    const firstSetup = run("setup", "fixture", stateDir);
    const secondSetup = run("setup", "fixture", stateDir);
    const health = run("health", "fixture", stateDir);

    expect(firstSetup.status, firstSetup.stderr).toBe(0);
    expect(secondSetup.status, secondSetup.stderr).toBe(0);
    expect(health.status, health.stderr).toBe(0);
    const report = JSON.parse(health.stdout);
    expect(report).toMatchObject({
      status: "healthy",
      profile: "fixture",
      mode: "deterministic-fixture",
      networkEgress: "deny",
      paidProviderCalls: false,
    });
    expect(report.fixtureSha256).toBe(
      sha256(path.join(LAB_DIR, "data", "harbourcare-v1.json"))
    );

    const reset = run("reset", "fixture", stateDir);
    expect(reset.status, reset.stderr).toBe(0);
    expect(fs.existsSync(stateDir)).toBe(false);

    expect(run("setup", "fixture", stateDir).status).toBe(0);
    fs.writeFileSync(path.join(stateDir, "unexpected.txt"), "keep me\n");
    const markedButUnsafeReset = run("reset", "fixture", stateDir);
    expect(markedButUnsafeReset.status).not.toBe(0);
    expect(fs.readFileSync(path.join(stateDir, "unexpected.txt"), "utf8")).toBe("keep me\n");
    fs.rmSync(stateDir, { recursive: true });

    fs.mkdirSync(stateDir);
    fs.writeFileSync(path.join(stateDir, "unrelated.txt"), "keep me\n");
    const unsafeReset = run("reset", "fixture", stateDir);
    expect(unsafeReset.status).not.toBe(0);
    expect(fs.readFileSync(path.join(stateDir, "unrelated.txt"), "utf8")).toBe("keep me\n");
  });

  it("fails closed for unknown profiles, missing state, and provider-shaped environment variables", () => {
    const stateDir = newStateDirectory();
    const unknown = run("setup", "unknown", stateDir);
    const missing = run("health", "fixture", stateDir);
    const providerEnv = spawnSync(
      process.execPath,
      [CLI, "setup", "--profile", "fixture", "--state-dir", stateDir],
      {
        cwd: LAB_DIR,
        encoding: "utf8",
        env: {
          PATH: process.env.PATH ?? "",
          NODE_ENV: "test",
          OPENAI_API_KEY: "not-a-real-secret",
        },
      }
    );

    expect(unknown.status).not.toBe(0);
    expect(unknown.stderr).toContain("Unknown profile");
    expect(missing.status).not.toBe(0);
    expect(missing.stderr).toContain("Run setup first");
    expect(providerEnv.status).not.toBe(0);
    expect(providerEnv.stderr).toContain("Provider credentials are not permitted");
    expect(fs.existsSync(stateDir)).toBe(false);
  });

  it("rejects marker and runtime symlinks without touching their targets", () => {
    const markerState = newStateDirectory();
    const markerTarget = path.join(path.dirname(markerState), "marker-target.json");
    fs.mkdirSync(markerState);
    fs.writeFileSync(markerTarget, '{"outside":true}\n');
    fs.symlinkSync(markerTarget, path.join(markerState, ".fde-lab-state.json"));

    const markerSetup = run("setup", "fixture", markerState);
    expect(markerSetup.status).not.toBe(0);
    expect(markerSetup.stderr).toContain("regular non-symlink file");
    expect(fs.readFileSync(markerTarget, "utf8")).toBe('{"outside":true}\n');

    const runtimeState = newStateDirectory();
    expect(run("setup", "fixture", runtimeState).status).toBe(0);
    const runtimeTarget = path.join(path.dirname(runtimeState), "runtime-target.json");
    fs.writeFileSync(runtimeTarget, '{"outside":true}\n');
    fs.unlinkSync(path.join(runtimeState, "runtime.json"));
    fs.symlinkSync(runtimeTarget, path.join(runtimeState, "runtime.json"));

    const runtimeSetup = run("setup", "fixture", runtimeState);
    const runtimeHealth = run("health", "fixture", runtimeState);
    expect(runtimeSetup.status).not.toBe(0);
    expect(runtimeHealth.status).not.toBe(0);
    expect(runtimeSetup.stderr).toContain("regular non-symlink file");
    expect(runtimeHealth.stderr).toContain("regular non-symlink file");
    expect(fs.readFileSync(runtimeTarget, "utf8")).toBe('{"outside":true}\n');
  });

  it("rejects non-regular marker and runtime entries", () => {
    const markerState = newStateDirectory();
    fs.mkdirSync(path.join(markerState, ".fde-lab-state.json"), { recursive: true });
    const markerSetup = run("setup", "fixture", markerState);
    expect(markerSetup.status).not.toBe(0);
    expect(markerSetup.stderr).toContain("regular non-symlink file");

    const runtimeState = newStateDirectory();
    expect(run("setup", "fixture", runtimeState).status).toBe(0);
    fs.unlinkSync(path.join(runtimeState, "runtime.json"));
    fs.mkdirSync(path.join(runtimeState, "runtime.json"));
    const runtimeSetup = run("setup", "fixture", runtimeState);
    const runtimeHealth = run("health", "fixture", runtimeState);
    expect(runtimeSetup.status).not.toBe(0);
    expect(runtimeHealth.status).not.toBe(0);
    expect(runtimeSetup.stderr).toContain("regular non-symlink file");
    expect(runtimeHealth.stderr).toContain("regular non-symlink file");
  });

  it("quarantines but never deletes a swapped replacement directory", async () => {
    const stateDir = newStateDirectory();
    expect(run("setup", "fixture", stateDir).status).toBe(0);
    const originalDir = `${stateDir}-authenticated-original`;
    const cliModule = await import(pathToFileURL(CLI).href);

    expect(() =>
      cliModule.resetAuthenticatedState("fixture", stateDir, {
        beforeQuarantine() {
          fs.renameSync(stateDir, originalDir);
          fs.mkdirSync(stateDir, { mode: 0o700 });
          fs.copyFileSync(
            path.join(originalDir, ".fde-lab-state.json"),
            path.join(stateDir, ".fde-lab-state.json")
          );
          fs.copyFileSync(
            path.join(originalDir, "runtime.json"),
            path.join(stateDir, "runtime.json")
          );
        },
      })
    ).toThrow("identity changed before quarantine; no files were deleted");

    expect(fs.existsSync(path.join(originalDir, ".fde-lab-state.json"))).toBe(true);
    expect(fs.existsSync(path.join(originalDir, "runtime.json"))).toBe(true);
    const quarantines = fs
      .readdirSync(path.dirname(stateDir))
      .filter((entry) => entry.startsWith(`.${path.basename(stateDir)}.fde-quarantine-`));
    expect(quarantines).toHaveLength(1);
    expect(fs.existsSync(path.join(path.dirname(stateDir), quarantines[0], "state", ".fde-lab-state.json"))).toBe(true);
    expect(fs.existsSync(path.join(path.dirname(stateDir), quarantines[0], "state", "runtime.json"))).toBe(true);
  });
});
