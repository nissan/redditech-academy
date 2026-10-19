# Forward Deployed AI Engineering — Gate A Repository and Schema Inventory

**Date:** 2026-10-18
**Issue:** [#99](https://github.com/nissan/redditech-academy/issues/99)
**Branch:** `feat/99-forward-deployed-ai`
**Verified base:** `origin/main` at `6bb65be0a0b17ca713ca69570974a2785aa85b15`
**Scope:** Gate A only; no course or lab implementation.

## 1. Approved artifact locations

| Artifact | Repository path |
| --- | --- |
| Behaviour contract (21 scenarios) | `features/forward-deployed-ai-engineering.feature` |
| Research brief | `docs/plans/forward-deployed-ai-engineering/research-brief.md` |
| Learning-experience specification | `docs/plans/forward-deployed-ai-engineering/learning-experience-spec.md` |
| Phased build plan | `docs/plans/forward-deployed-ai-engineering/build-plan.md` |

The three prose artifacts are grouped under a course-specific planning directory; executable BDD remains with the repository's existing `features/` contracts. Internal references are relative and resolve inside this checkout.

## 2. Current repository contract

### Course, module, lesson, and quiz

- Course discovery is filesystem-driven from `content/courses/<course-slug>/course.json` through `lib/courses.ts`.
- Required course fields enforced by the inventory are `id`, `slug`, `title`, `description`, `tagline`, `difficulty`, `estimatedHours`, `tags`, `badge`, `author`, and `version`. `free` is typed and controls catalog labels but is not an authorization check on this base.
- Modules live at `content/courses/<course>/modules/<module-slug>/module.json`; required inventory fields are `id`, `slug`, `order`, `title`, `description`, `difficulty`, `estimatedHours`, `badge`, and `learningObjectives`. `prerequisiteModules` is typed.
- Module loading currently follows lexicographically sorted directory names, not the `order` field. FDE must therefore use stable zero-padded module folders `00-...` through `11-...`.
- Lessons are MDX at `modules/<module>/lessons/<lesson>.mdx`. Required frontmatter is `title`, `description`, `slug`, `duration`, and `order`; interactive lessons additionally use `type`, `environment`, `challengeId`, `missionTitle`, and `estimatedMinutes`.
- Quizzes are one `quiz.json` per module. Runtime requires `passingScore` and `questions[]`; each question requires `id`, `question`, `options`, `correctAnswer`, and `explanation`. Existing files may carry extra `id`, `moduleId`, difficulty, and lesson-reference fields.

### Challenges and deterministic grading

- Challenge files live at `content/courses/<course>/challenges/<challenge-id>.json`; the filename and `id` must match.
- Canonical challenge fields are `id`, `spec`, `validation`, optional `hints`, `eli_notes`, `prefilled`, `success_text`, and `type`.
- Supported interactive environments are `json-editor`, `sequence-completer`, `http-request-builder`, and `jwt-inspector`.
- `tests/content-validation.test.ts` checks JSON parseability, required challenge shapes, frontmatter, challenge references, environment/type agreement, sequence integrity, JSON seed parseability, and misleading editable-looking JSON blocks.
- The base judge only computes sequence order deterministically. It still invokes a model for feedback, and JSON-editor submissions are model-graded. Therefore the current base does **not** satisfy the FDE offline/no-provider grading contract.
- The unmerged `feat/97-spiced-course` branch introduces `lib/structured-grader.ts` and judge tests. Gate B must rebase after that change lands or port one compatible, course-agnostic deterministic path deliberately; do not create a second competing grader.

### Downloads, routes, protection, tests, and generation

- Downloadable lesson assets live at `public/assets/courses/<course-slug>/downloads/` and are linked as `/assets/courses/<course-slug>/downloads/<file>`.
- Course, module, lesson, interactive lesson, quiz, summary, and progress routes are dynamic App Router paths under `app/courses/[courseSlug]/...`; `generateStaticParams` enumerates filesystem content.
- `tests/route-smoke.test.tsx` covers catalog, course/module/lesson rendering, APIs, and current Solana mission affordances.
- On this verified base, `lib/auth.ts` is a stub, login/request-access routes are absent, and the route-smoke test asserts that absence. Module `requiresPassword/password` uses a client-side localStorage gate. This is not adequate protection for FDE and a plaintext password must not be added to course JSON.
- The repository has no general course generator. `scripts/openclaw-quality-pass.py` is course-specific; `scripts/mermaid-sync.mjs` generates diagram assets; `scripts/course-inventory-report.mjs` generates inventory reports. Gate B should add an FDE-scoped idempotent generator/check without widening unrelated generators.
- Baseline committed inventory: 9 courses, 111 modules, 291 lessons, 111 quizzes, 299 challenges, and 147 downloads. The inventory's expected slug list and its tests are hard-coded to those 9 courses.

## 3. Reversible lab packaging decision

**Decision for Gate B:** use a **versioned downloadable companion source bundle**, not a lab runtime embedded in the Next.js application.

Proposed seam:

- author runnable source under `companion-labs/forward-deployed-ai-engineering/`;
- publish a reproducible versioned zip/link through `public/assets/courses/forward-deployed-ai-engineering/downloads/` only from that source;
- keep lessons, quizzes, mission contracts, deterministic graders, small synthetic fixtures, evidence templates, and bundle manifest in Academy;
- keep container images, model weights, database volumes, and prepared disconnected image archives out of Git;
- let the companion produce and verify its own offline artifact manifest.

Rationale: the planned FastAPI/PostgreSQL/Keycloak/telemetry/optional-kind stack has a separate runtime and dependency lifecycle. Embedding it into the web app would couple the static Academy build to Python, containers, local model assets, and large offline artifacts. The source-bundle boundary keeps the canonical local path downloadable and inspectable without inflating the Next runtime.

Reversibility: lessons refer to a stable companion manifest/version rather than deployment internals. The bundle may later move to a GitHub Release or hosted lab, or selected small fixtures may move into the Academy tree, without changing assessed contracts or module outcomes.

## 4. Collision and integration risks

1. **Open PR #98 / SPICED branch:** it adds a structured grader and touches the judge route and lesson/module route clients. Rebase before any FDE grader or mission-path work, or expect direct conflicts and duplicated grading logic.
2. **Hard-coded inventory slugs:** adding `forward-deployed-ai-engineering` will be reported as an additional slug and will fail exact expected-slug assertions until both the script and test are intentionally updated.
3. **Mission-path scope:** route smoke currently asserts mission affordances are Solana-only. FDE requires either a generalized capability flag or a tested FDE-specific path; avoid another slug conditional.
4. **Protection gap:** `free: false` is metadata, not enforcement on this base. FDE-01 cannot be claimed until repository auth/access changes are present and tested.
5. **Model-dependent judge:** even deterministic sequence scoring currently calls the model. FDE completion must bypass provider creation for canonical graders and deterministic feedback.
6. **Ordering:** directory sort, metadata `order`, frontmatter `order`, and filename slug can diverge. New FDE content should make all four agree.
7. **Existing compatibility debt:** the inventory currently reports 230 lesson slug/filename mismatches, 12 challenges without JSON `type`, 178 legacy challenge records, and 5 environment gaps. Gate B must keep FDE at zero new entries without expanding into unrelated cleanup.
8. **Build side effects:** `pnpm build` runs `pnpm mermaid:sync` first and may generate assets. Gate A does not run the build; later gates must review generated diffs.
9. **Bundle size and licensing:** do not commit container images, model weights, OCR corpora, or third-party binaries. The companion needs an explicit licence/source/artifact manifest and exact missing-artifact failure.

## 5. Validation commands

### Gate A checkpoint (small and non-destructive)

```bash
git status --short --branch
git diff --check
pnpm exec vitest run tests/content-validation.test.ts tests/course-inventory-report.test.ts
pnpm type-check
rg -n '^  Scenario:' features/forward-deployed-ai-engineering.feature
rg -o '@FDE-[0-9]{2}' features/forward-deployed-ai-engineering.feature
```

Path/count consistency check:

```bash
python3 - <<'PY'
from pathlib import Path
import re

root = Path('.')
feature = root / 'features/forward-deployed-ai-engineering.feature'
spec = root / 'docs/plans/forward-deployed-ai-engineering/learning-experience-spec.md'
plan = root / 'docs/plans/forward-deployed-ai-engineering/build-plan.md'
research = root / 'docs/plans/forward-deployed-ai-engineering/research-brief.md'

for path in (feature, spec, plan, research):
    assert path.is_file(), path

feature_text = feature.read_text()
scenario_ids = re.findall(r'@FDE-(\d{2})', feature_text)
assert scenario_ids == [f'{n:02d}' for n in range(1, 22)], scenario_ids
assert feature_text.count('  Scenario:') == 21
assert '12 ordered modules' in feature_text

spec_text = spec.read_text()
assert len(re.findall(r'^\| (?:[0-9]|1[01])\.', spec_text, re.M)) == 12
assert sum(map(int, re.findall(r'^\| [^|]+ \| (\d+)% \|', spec_text, re.M))) == 100

plan_text = plan.read_text()
for expected in ('12 modules', '24 core lessons', '12 canonical interactive missions', '12 knowledge checks'):
    assert expected in plan_text
for relative in ('research-brief.md', 'learning-experience-spec.md', '../../../features/forward-deployed-ai-engineering.feature'):
    assert relative in plan_text
print('Gate A planning consistency: PASS')
PY
```

### Required later gates (recorded now, not run by Gate A)

```bash
pnpm test
pnpm test:integration
pnpm type-check
pnpm build
pnpm content:inventory
git diff --check
```

FDE-specific Gate B/E checks must additionally cover generator idempotence, exact 12/24/12/12 counts, all download references, protected access, deterministic malformed/placeholder/provenance failures, clean-room companion bootstrap, offline artifact behavior, and secret scanning.

## 6. Gate A conclusion

The content and route conventions can host the course, but the planned lab should remain a separately versioned downloadable companion. Gate B is unblocked for metadata/content contracts, synthetic fixtures, and evidence manifests. Protected-access acceptance and deterministic structured grading require explicit integration with changes not present on this base.
