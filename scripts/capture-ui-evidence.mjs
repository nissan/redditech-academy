#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const DEFAULT_ISSUE = process.env.UI_EVIDENCE_ISSUE ?? "manual";
const DEFAULT_BASE_URL =
  process.env.UI_EVIDENCE_BASE_URL ?? process.env.BASE_URL ?? "http://localhost:3000";
const DEFAULT_OUTPUT_ROOT = process.env.UI_EVIDENCE_OUTPUT_ROOT ?? "artifacts/ui-evidence";
const DEFAULT_TIMEOUT_MS = Number(process.env.UI_EVIDENCE_TIMEOUT_MS ?? 30_000);

const VIEWPORTS = {
  desktop: { width: 1440, height: 960 },
  mobile: { width: 390, height: 844, isMobile: true },
};

const DEFAULT_SCENARIOS = [
  {
    name: "home",
    label: "Home",
    path: envPath("UI_EVIDENCE_HOME_PATH", "/"),
    expected: [/Redditech Academy/i, /Available Courses/i],
  },
  {
    name: "course-overview",
    label: "Course overview",
    path: envPath("UI_EVIDENCE_COURSE_PATH", "/courses/solana-academy"),
    expected: [/Solana/i],
  },
  {
    name: "module",
    label: "Module",
    path: envPath(
      "UI_EVIDENCE_MODULE_PATH",
      "/courses/solana-academy/learn/00-solana-first-principles",
    ),
    expected: [/First Principles|Mental Models|Solana/i],
  },
  {
    name: "lesson",
    label: "Lesson",
    path: envPath(
      "UI_EVIDENCE_LESSON_PATH",
      "/courses/solana-academy/learn/00-solana-first-principles/01-mental-models-and-vocabulary",
    ),
    expected: [/Mental Models|Vocabulary|Solana/i],
  },
  {
    name: "protected-gate",
    label: "Protected gate",
    path: envPath(
      "UI_EVIDENCE_PROTECTED_GATE_PATH",
      "/courses/solana-academy/learn/00-solana-first-principles",
    ),
    expected: [/Password Required|Protected course|Request access|Need access/i],
    optionalExpectation: true,
  },
  {
    name: "login-request-access",
    label: "Login / request access",
    path: envPath("UI_EVIDENCE_LOGIN_PATH", "/login"),
    expected: [/login|sign in|request access|tester|magic link/i],
    optionalExpectation: true,
  },
  {
    name: "desktop",
    label: "Desktop experience",
    path: envPath("UI_EVIDENCE_DESKTOP_PATH", "/desktop"),
    expected: [/Desktop|Redditech|Academy/i],
    optional: true,
  },
];

function envPath(name, fallback) {
  const value = process.env[name];
  return value && value.trim() ? value.trim() : fallback;
}

function parseArgs(argv) {
  const options = {
    baseUrl: DEFAULT_BASE_URL,
    issue: DEFAULT_ISSUE,
    outputRoot: DEFAULT_OUTPUT_ROOT,
    timeoutMs: DEFAULT_TIMEOUT_MS,
    dryRun: false,
    help: false,
    viewports: ["desktop"],
  };

  for (const arg of argv) {
    if (arg === "--") {
      continue;
    } else if (arg === "--help" || arg === "-h") {
      options.help = true;
    } else if (arg === "--dry-run") {
      options.dryRun = true;
    } else if (arg.startsWith("--base-url=")) {
      options.baseUrl = arg.slice("--base-url=".length);
    } else if (arg.startsWith("--issue=")) {
      options.issue = arg.slice("--issue=".length);
    } else if (arg.startsWith("--output-root=")) {
      options.outputRoot = arg.slice("--output-root=".length);
    } else if (arg.startsWith("--timeout-ms=")) {
      options.timeoutMs = Number(arg.slice("--timeout-ms=".length));
    } else if (arg === "--mobile") {
      options.viewports = ["desktop", "mobile"];
    } else if (arg.startsWith("--viewports=")) {
      options.viewports = arg
        .slice("--viewports=".length)
        .split(",")
        .map((viewport) => viewport.trim())
        .filter(Boolean);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  for (const viewport of options.viewports) {
    if (!VIEWPORTS[viewport]) {
      throw new Error(
        `Unsupported viewport "${viewport}". Use one of: ${Object.keys(VIEWPORTS).join(", ")}`,
      );
    }
  }

  if (!Number.isFinite(options.timeoutMs) || options.timeoutMs <= 0) {
    throw new Error("--timeout-ms must be a positive number");
  }

  return options;
}

function usage() {
  return `Capture Academy UI evidence screenshots.

Usage:
  pnpm ui:evidence -- --issue=17 --base-url=http://localhost:3000
  pnpm ui:evidence -- --issue=17 --mobile
  pnpm ui:evidence -- --dry-run

Output:
  artifacts/ui-evidence/<issue>/

Options:
  --issue=<id>            Artifact folder name. Defaults to UI_EVIDENCE_ISSUE or "manual".
  --base-url=<url>        Running Academy app URL. Defaults to UI_EVIDENCE_BASE_URL, BASE_URL, or http://localhost:3000.
  --output-root=<path>    Output root. Defaults to artifacts/ui-evidence.
  --mobile               Capture both desktop and mobile viewport sets.
  --viewports=<list>      Comma-separated viewport list: desktop,mobile.
  --timeout-ms=<ms>       Navigation/assertion timeout. Defaults to ${DEFAULT_TIMEOUT_MS}.
  --dry-run               Print planned screenshots without launching a browser.
  --help                  Show this help.

Route overrides:
  UI_EVIDENCE_HOME_PATH
  UI_EVIDENCE_COURSE_PATH
  UI_EVIDENCE_MODULE_PATH
  UI_EVIDENCE_LESSON_PATH
  UI_EVIDENCE_PROTECTED_GATE_PATH
  UI_EVIDENCE_LOGIN_PATH
  UI_EVIDENCE_DESKTOP_PATH
`;
}

function toUrl(baseUrl, scenarioPath) {
  return new URL(scenarioPath, baseUrl).toString();
}

function slugIssue(issue) {
  return issue.replace(/[^a-zA-Z0-9._-]/g, "-");
}

async function captureScenario(page, scenario, url, dest, timeoutMs) {
  const result = {
    name: scenario.name,
    label: scenario.label,
    url,
    file: dest,
    status: null,
    ok: false,
    expectationMatched: null,
    warning: null,
  };

  try {
    const response = await page.goto(url, {
      waitUntil: "networkidle",
      timeout: timeoutMs,
    });

    result.status = response?.status() ?? null;
    result.ok =
      response === null || (response.status() >= 200 && response.status() < 400);
    if (!result.ok) {
      result.warning = `Route returned HTTP ${response?.status()} for ${scenario.name}.`;
    }

    await page.screenshot({ path: dest, fullPage: true });

    if (scenario.expected?.length) {
      const bodyText = await page.locator("body").innerText({ timeout: timeoutMs });
      const matched = scenario.expected.some((pattern) => pattern.test(bodyText));
      result.expectationMatched = matched;
      if (!matched) {
        const expectation = scenario.optionalExpectation ? "Optional" : "Required";
        result.warning = [
          result.warning,
          `${expectation} text expectation was not found for ${scenario.name}.`,
        ]
          .filter(Boolean)
          .join(" ");
      }
    }
  } catch (error) {
    result.warning = error instanceof Error ? error.message : String(error);
    try {
      await page.screenshot({ path: dest, fullPage: true });
    } catch {
      // If navigation failed before a page was renderable, keep the manifest as the evidence.
    }
  }

  return result;
}

async function run() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    console.log(usage());
    return;
  }

  const outDir = path.resolve(
    process.cwd(),
    options.outputRoot,
    slugIssue(options.issue),
  );
  const plan = options.viewports.flatMap((viewport) =>
    DEFAULT_SCENARIOS.map((scenario, index) => ({
      viewport,
      viewportConfig: VIEWPORTS[viewport],
      scenario,
      filename: `${String(index + 1).padStart(2, "0")}-${scenario.name}-${viewport}.png`,
      url: toUrl(options.baseUrl, scenario.path),
    })),
  );

  if (options.dryRun) {
    console.log(`UI evidence dry run for ${options.baseUrl}`);
    console.log(`Output: ${outDir}`);
    for (const item of plan) {
      console.log(`${item.filename} <- ${item.url}`);
    }
    return;
  }

  fs.mkdirSync(outDir, { recursive: true });

  const manifest = {
    issue: options.issue,
    baseUrl: options.baseUrl,
    outputDirectory: outDir,
    createdAt: new Date().toISOString(),
    viewports: options.viewports,
    screenshots: [],
    warnings: [],
  };

  let chromium;
  try {
    ({ chromium } = await import("playwright"));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      [
        "Could not load Playwright from node_modules.",
        "Run `pnpm install` first, then install Chromium explicitly with `pnpm exec playwright install chromium` when local evidence capture is needed.",
        "Use `pnpm ui:evidence -- --dry-run --issue=<issue>` to validate the route plan without browser dependencies.",
        message,
      ].join("\n"),
    );
  }

  let browser;
  try {
    browser = await chromium.launch({ headless: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      [
        "Could not launch Playwright Chromium.",
        "Install browsers explicitly with `pnpm exec playwright install chromium` when local evidence capture is needed.",
        "CI is intentionally not configured to install browsers by default.",
        message,
      ].join("\n"),
    );
  }

  for (const viewport of options.viewports) {
    const context = await browser.newContext({
      viewport: {
        width: VIEWPORTS[viewport].width,
        height: VIEWPORTS[viewport].height,
      },
      isMobile: VIEWPORTS[viewport].isMobile ?? false,
      colorScheme: "dark",
    });
    const page = await context.newPage();
    page.setDefaultTimeout(options.timeoutMs);

    for (const [index, scenario] of DEFAULT_SCENARIOS.entries()) {
      const filename = `${String(index + 1).padStart(2, "0")}-${scenario.name}-${viewport}.png`;
      const dest = path.join(outDir, filename);
      const url = toUrl(options.baseUrl, scenario.path);
      console.log(`${filename} <- ${url}`);
      const result = await captureScenario(page, scenario, url, dest, options.timeoutMs);
      manifest.screenshots.push({ viewport, ...result, file: filename });
      if (result.warning) {
        manifest.warnings.push({
          viewport,
          scenario: scenario.name,
          warning: result.warning,
        });
        console.warn(`  warning: ${result.warning}`);
      }
    }

    await context.close();
  }

  await browser.close();

  const manifestPath = path.join(outDir, "manifest.json");
  fs.writeFileSync(`${manifestPath}.tmp`, `${JSON.stringify(manifest, null, 2)}\n`);
  fs.renameSync(`${manifestPath}.tmp`, manifestPath);

  console.log(`\nUI evidence written to ${outDir}`);
  if (manifest.warnings.length > 0) {
    console.log(
      `Completed with ${manifest.warnings.length} warning(s). Review manifest.json before attaching evidence.`,
    );
  }
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
