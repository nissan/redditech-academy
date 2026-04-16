#!/usr/bin/env node
import fs from "fs";
import path from "path";
import os from "os";
import crypto from "crypto";
import { spawnSync } from "child_process";

const ROOT = process.cwd();
const COURSES_DIR = path.join(ROOT, "content", "courses");
const PUBLIC_DIR = path.join(ROOT, "public");
const TMP_BASE_DIR = path.join(ROOT, ".tmp-mermaid-base");
const GLOBAL_MANIFEST = path.join(ROOT, ".tmp-mermaid-manifest.json");

const args = new Set(process.argv.slice(2));
const force = args.has("--force");
const useOpenAI = args.has("--openai") || process.env.MERMAID_USE_OPENAI === "1";
const courseArgIndex = process.argv.indexOf("--course");
const onlyCourse = courseArgIndex > -1 ? process.argv[courseArgIndex + 1] : null;

function walk(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walk(full, acc);
    else acc.push(full);
  }
  return acc;
}

function readJson(file, fallback) {
  if (!fs.existsSync(file)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
}

function sha(text) {
  return crypto.createHash("sha256").update(text, "utf8").digest("hex");
}

function extractMermaidBlocks(filePath) {
  const text = fs.readFileSync(filePath, "utf8");
  const blocks = [];
  const re = /```mermaid\s*\n([\s\S]*?)```/g;
  let m;
  let idx = 0;

  while ((m = re.exec(text)) !== null) {
    idx += 1;
    const before = text.slice(0, m.index);
    const startLine = before.split("\n").length;
    const block = m[0];
    const endLine = startLine + block.split("\n").length - 1;
    const mermaid = String(m[1]).trim();
    blocks.push({ index: idx, start_line: startLine, end_line: endLine, mermaid });
  }

  return blocks;
}

function renderWithMmdc(mermaid, outPng) {
  fs.mkdirSync(path.dirname(outPng), { recursive: true });
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "mermaid-sync-"));
  const inMmd = path.join(tmpDir, "diagram.mmd");
  const cfg = path.join(tmpDir, "config.json");

  fs.writeFileSync(inMmd, `${mermaid}\n`, "utf8");
  fs.writeFileSync(
    cfg,
    JSON.stringify(
      {
        theme: "base",
        securityLevel: "loose",
        fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
        flowchart: {
          curve: "basis",
          htmlLabels: true,
        },
        themeVariables: {
          darkMode: true,
          background: "transparent",
          primaryColor: "#312e81",
          primaryBorderColor: "#6366f1",
          primaryTextColor: "#e2e8f0",
          secondaryColor: "#0f766e",
          secondaryBorderColor: "#22d3ee",
          tertiaryColor: "#4c1d95",
          tertiaryBorderColor: "#a78bfa",
          lineColor: "#67e8f9",
          textColor: "#e2e8f0",
          mainBkg: "#0f172a",
          nodeBorder: "#6366f1",
          clusterBkg: "#111827",
          clusterBorder: "#475569",
        },
      },
      null,
      2
    ),
    "utf8"
  );

  const r = spawnSync(
    "mmdc",
    [
      "-i",
      inMmd,
      "-o",
      outPng,
      "-w",
      "2200",
      "-s",
      "3",
      "-b",
      "transparent",
      "-c",
      cfg,
    ],
    { stdio: "pipe", encoding: "utf8" }
  );

  fs.rmSync(tmpDir, { recursive: true, force: true });

  if (r.status !== 0) {
    throw new Error(`mmdc failed: ${r.stderr || r.stdout || "unknown error"}`);
  }
}

async function openAiEnhance(basePng, finalPng, mermaid, key) {
  const form = new FormData();
  form.append("model", "gpt-image-1");
  form.append(
    "prompt",
    [
      "Enhance this technical diagram into a crisp, high-resolution, presentation-quality image.",
      "Keep labels, node names, and relationships faithful to the source.",
      "Use clean typography, strong contrast, and professional visual hierarchy.",
      "Do not add extra concepts not present in the source diagram.",
      "Mermaid source:",
      mermaid,
    ].join("\n")
  );
  form.append("size", "1536x1024");
  form.append("background", "transparent");
  const bytes = fs.readFileSync(basePng);
  form.append("image", new Blob([bytes], { type: "image/png" }), path.basename(basePng));

  const res = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
    },
    body: form,
  });

  if (!res.ok) {
    throw new Error(`OpenAI images edit failed: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  const b64 = data?.data?.[0]?.b64_json;
  const url = data?.data?.[0]?.url;

  fs.mkdirSync(path.dirname(finalPng), { recursive: true });

  if (b64) {
    fs.writeFileSync(finalPng, Buffer.from(b64, "base64"));
    return;
  }

  if (url) {
    const img = await fetch(url);
    if (!img.ok) throw new Error(`OpenAI image URL fetch failed: ${img.status}`);
    fs.writeFileSync(finalPng, Buffer.from(await img.arrayBuffer()));
    return;
  }

  throw new Error("OpenAI response did not include b64_json or url");
}

function relativeCourseParts(filePath) {
  const rel = path.relative(COURSES_DIR, filePath);
  const parts = rel.split(path.sep);
  const course = parts[0];
  const module = parts[2];
  const lesson = parts[4]?.replace(/\.mdx$/, "");
  return { course, module, lesson };
}

async function run() {
  const mdxFiles = walk(COURSES_DIR).filter((f) => f.endsWith(".mdx"));
  const files = onlyCourse
    ? mdxFiles.filter((f) => relativeCourseParts(f).course === onlyCourse)
    : mdxFiles;

  const byCourse = new Map();

  for (const filePath of files) {
    const { course, module, lesson } = relativeCourseParts(filePath);
    if (!course || !module || !lesson) continue;

    const blocks = extractMermaidBlocks(filePath);
    if (!blocks.length) continue;

    if (!byCourse.has(course)) byCourse.set(course, []);

    for (const b of blocks) {
      const outRel = `public/assets/courses/${course}/diagrams/${module}-${lesson}-d${b.index}.png`;
      const basePng = path.join(TMP_BASE_DIR, course, "diagrams", `${module}-${lesson}-d${b.index}.png`);
      const finalPng = path.join(PUBLIC_DIR, "assets", "courses", course, "diagrams", `${module}-${lesson}-d${b.index}.png`);

      byCourse.get(course).push({
        file: filePath,
        course,
        module,
        lesson,
        index: b.index,
        start_line: b.start_line,
        end_line: b.end_line,
        mermaid: b.mermaid,
        out: outRel,
        base_png: basePng,
        final_png: finalPng,
        source_hash: sha(b.mermaid),
      });
    }
  }

  const openAiKey = process.env.OPENAI_API_KEY || "";
  const enableOpenAI = useOpenAI && !!openAiKey;

  const globalEntries = [];
  let rendered = 0;
  let enhanced = 0;
  let skipped = 0;

  for (const [course, entries] of byCourse.entries()) {
    const manifestPath = path.join(ROOT, `.tmp-mermaid-${course}.json`);
    const prev = readJson(manifestPath, []);
    const prevMap = new Map(prev.map((e) => [`${e.file}#${e.index}`, e]));

    const next = [];

    for (const entry of entries) {
      const key = `${entry.file}#${entry.index}`;
      const old = prevMap.get(key);
      const hashChanged = old?.source_hash !== entry.source_hash;
      const needBase = force || hashChanged || !fs.existsSync(entry.base_png);
      const needFinal = force || hashChanged || !fs.existsSync(entry.final_png);

      try {
        if (needBase) {
          renderWithMmdc(entry.mermaid, entry.base_png);
          rendered += 1;
        }

        if (needFinal) {
          if (enableOpenAI) {
            try {
              await openAiEnhance(entry.base_png, entry.final_png, entry.mermaid, openAiKey);
              entry.provider = "openai";
              enhanced += 1;
            } catch (e) {
              fs.mkdirSync(path.dirname(entry.final_png), { recursive: true });
              fs.copyFileSync(entry.base_png, entry.final_png);
              entry.provider = "mmdc-fallback";
              entry.error = String(e?.message || e);
            }
          } else {
            fs.mkdirSync(path.dirname(entry.final_png), { recursive: true });
            fs.copyFileSync(entry.base_png, entry.final_png);
            entry.provider = "mmdc";
          }
        } else {
          skipped += 1;
          entry.provider = old?.provider || (enableOpenAI ? "openai" : "mmdc");
        }

        entry.rendered_at = new Date().toISOString();
      } catch (e) {
        entry.provider = "error";
        entry.error = String(e?.message || e);
      }

      next.push(entry);
      globalEntries.push({
        file: entry.file,
        course: entry.course,
        module: entry.module,
        lesson: entry.lesson,
        index: entry.index,
        start_line: entry.start_line,
        end_line: entry.end_line,
        mermaid: entry.mermaid,
        out: entry.out,
      });
    }

    fs.writeFileSync(manifestPath, JSON.stringify(next, null, 2) + "\n", "utf8");
  }

  globalEntries.sort((a, b) => a.file.localeCompare(b.file) || a.index - b.index);
  fs.writeFileSync(GLOBAL_MANIFEST, JSON.stringify(globalEntries, null, 2) + "\n", "utf8");

  console.log(`Mermaid sync complete. rendered=${rendered} enhanced=${enhanced} skipped=${skipped} courses=${byCourse.size}`);
  if (useOpenAI && !enableOpenAI) {
    console.log("MERMAID_USE_OPENAI requested but OPENAI_API_KEY not set; used local mmdc output only.");
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
