/**
 * capture-screenshots.ts
 *
 * Playwright script that captures all 7 scenes for the Solana Academy demo video.
 * Produces numbered PNGs in demo-video/slides/
 *
 * Usage:
 *   npx tsx demo-video/capture-screenshots.ts
 *
 * Prerequisites:
 *   - App running at BASE_URL (default: http://localhost:3001)
 *   - npx playwright install chromium
 */

import { chromium } from "playwright";
import path from "path";
import fs from "fs";

const BASE_URL = process.env.DEMO_BASE_URL ?? "http://localhost:3001";
const OUT_DIR = path.join(__dirname, "slides");
const WIDTH = 1280;
const HEIGHT = 800;

fs.mkdirSync(OUT_DIR, { recursive: true });

async function screenshot(page: import("playwright").Page, name: string) {
  const dest = path.join(OUT_DIR, `${name}.png`);
  await page.screenshot({ path: dest, fullPage: false });
  console.log(`  ✓ ${name}.png`);
  return dest;
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: WIDTH, height: HEIGHT },
    colorScheme: "dark",
  });
  const page = await context.newPage();

  // Suppress console noise
  page.on("console", () => {});

  console.log(`Capturing screenshots from ${BASE_URL}...\n`);

  // ── Scene 01: Homepage ────────────────────────────────────────────────────
  console.log("Scene 01 — Homepage");
  await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
  await sleep(1000);
  await screenshot(page, "01-homepage");

  // ── Scene 02: Course Overview ─────────────────────────────────────────────
  console.log("Scene 02 — Course overview");
  await page.goto(`${BASE_URL}/courses/solana-academy`, { waitUntil: "networkidle" });
  await sleep(1000);
  await screenshot(page, "02-course-overview");

  // ── Scene 03: Module Overview ─────────────────────────────────────────────
  console.log("Scene 03 — Module overview");
  await page.goto(
    `${BASE_URL}/courses/solana-academy/learn/00-solana-first-principles`,
    { waitUntil: "networkidle" }
  );
  await sleep(1000);
  await screenshot(page, "03-module-overview");

  // ── Scenes 04–06: Interactive Lesson ──────────────────────────────────────
  const interactiveUrl = `${BASE_URL}/courses/solana-academy/learn/00-solana-first-principles/01-mental-models-and-vocabulary/interactive`;

  console.log("Scene 04 — Lesson narrative pane");
  await page.goto(interactiveUrl, { waitUntil: "networkidle" });
  await sleep(1500);
  await screenshot(page, "04-lesson-narrative");

  // Scene 05: Scroll to show the sequence completer (right pane)
  console.log("Scene 05 — Sequence completer (shuffled)");
  // On mobile/narrow: scroll to right pane. On desktop: it's side by side.
  await page.evaluate(() => {
    const rightPane = document.querySelector(".lg\\:w-\\[60\\%\\]");
    if (rightPane) rightPane.scrollIntoView({ behavior: "instant" });
  });
  await sleep(500);
  await screenshot(page, "05-sequence-completer");

  // Scene 06: Submit the correct answer and capture Eli's feedback
  console.log("Scene 06 — Submitting correct order + Eli feedback");
  try {
    // The SequenceCompleter shuffles on mount — we need to set correct order.
    // Approach: click Check Answer (whatever order it's in) to trigger the
    // judge, then re-run with the correct order injected via localStorage reset.

    // Find and click the Check Answer button
    // Use text filter to avoid matching dnd-kit sortable items (also role=button)
    const checkBtn = page.locator("button", { hasText: /check answer/i });
    if (await checkBtn.isVisible()) {
      await checkBtn.click();
      // Wait for Eli's feedback to appear
      await page.waitForSelector("[class*='FeedbackPanel'], [class*='border-lime'], [class*='border-red']", {
        timeout: 30_000,
      });
      await sleep(1000);
      await screenshot(page, "06-eli-feedback");
    } else {
      console.log("  ⚠ Check Answer button not found — capturing current state");
      await screenshot(page, "06-eli-feedback");
    }
  } catch (e) {
    console.log(`  ⚠ Feedback capture error: ${e} — using fallback screenshot`);
    await screenshot(page, "06-eli-feedback");
  }

  // ── Scene 07: Module overview with completion state ───────────────────────
  console.log("Scene 07 — Module overview (post-completion)");
  await page.goto(
    `${BASE_URL}/courses/solana-academy/learn/00-solana-first-principles`,
    { waitUntil: "networkidle" }
  );
  await sleep(1000);
  await screenshot(page, "07-module-complete");

  await browser.close();

  console.log(`\n✅ All scenes captured → ${OUT_DIR}`);
  console.log("Next: run  pnpm demo:tts  then  pnpm demo:render");
})();
