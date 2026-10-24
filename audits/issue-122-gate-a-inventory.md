# Issue #122 Gate A1 — Base and schema inventory

_Observed 2026-10-20 AEST. This is an inventory of the immutable planning head and fetched read-only refs; it does not implement Gate A2 or course content._

## Scope and scenario traceability

This Gate A1 evidence covers `AGD-CORE-001`, `AGD-CORE-024`, `AGD-CORE-029`, `AGD-CORE-030`, and `AGD-SOL-001`. It inventories the course identity/schema, evidence/download surfaces, Academy accessibility baseline, and the core/optional access-separation boundary. No runtime, course, dependency, lock, configuration, companion, or grading implementation was changed.

Sara's non-blocking setup requirement is carried forward: learner-facing setup must name the exact pinned editors, Playwright-managed browser binaries, and packages that must be installed or cached **before disconnecting**. That copy belongs downstream after Gate A2 supplies verified pins; it is not implemented in A1.

## Repository identity and base decision

After `git fetch --prune origin`, the worktree proved:

| Identity | Exact value |
| --- | --- |
| Worktree | `/Users/loki/redditech-academy-game-dev-122` |
| Branch | `feat/122-agentic-game-development` |
| Reviewed pre-A1 `HEAD` | `56b8d95de35e2dee59e0b543eb41fdd821aa3257` |
| Reviewed pre-A1 tree | `0c9022c0743b18f1345fdf0ab776af2a57d356ec` |
| `origin/feat/122-agentic-game-development` | `56b8d95de35e2dee59e0b543eb41fdd821aa3257` |
| Fetched `origin/main` / PR base | `88f977c5a142ec2878efe9d3e8d0b34e62e08bc7` |
| Fetched `origin/main` tree | `f623e320010e63fa550605ea01594819fda9a32e` |
| Merge base (`HEAD`, `origin/main`) | `88f977c5a142ec2878efe9d3e8d0b34e62e08bc7` |
| Ahead/behind (`origin/main...HEAD`) | branch ahead 1, behind 0 |
| Initial worktree state | clean (`git status --porcelain=v1` emitted no paths) |
| Planning approval identity | head `56b8d95de35e2dee59e0b543eb41fdd821aa3257`, tree `0c9022c0743b18f1345fdf0ab776af2a57d356ec`, base `88f977c5a142ec2878efe9d3e8d0b34e62e08bc7` |

`origin/main` has **not moved** from the independently reviewed planning base. No fast-forward, rebase, merge, reset, or clean is required or authorised for A1. A deliberate Loki integration decision is still required if `origin/main` moves or PR #100 lands before a later slice modifies a shared surface listed below; do not silently merge/rebase or overwrite that work.

The workspace project `STATUS.md` was also read as required. It is dated 2026-03-14, describes the separate parked `reddinft/openclaw-academy` deployment, and is not an authoritative status source for this `nissan/redditech-academy` issue worktree. It was not edited.

## Current schema and content inventory

### Data contracts and loaders

| Surface | Current path/behaviour | A1 finding for #122 |
| --- | --- | --- |
| Course metadata | `content/courses/<course>/course.json`; `CourseMetadata` in `lib/content-types.ts`; loaded by `lib/courses.ts` with `JSON.parse(...) as CourseMetadata` | TypeScript cast only; no strict runtime schema or unknown-field rejection. Fields include badge, difficulty, tags, `free`, and optional `comingSoon`. |
| Module metadata | `content/courses/<course>/modules/<module>/module.json`; `ModuleMetadata` in `lib/content-types.ts`; loaded by `lib/content.ts` | TypeScript cast only. Includes objectives, prerequisites, badge, and optional plaintext `requiresPassword`/`password`. |
| Lessons | `.../lessons/<lesson>.mdx`; `LessonFrontmatter` in `lib/content-types.ts`; Gray Matter data cast in `lib/content.ts` | Standard/interactive types and four environment names: `http-request-builder`, `jwt-inspector`, `json-editor`, `sequence-completer`. No strict runtime frontmatter parser. |
| Quiz | `.../quiz.json`; `QuizMetadata`/`QuizQuestion` in `lib/content-types.ts`; loaded by `lib/content.ts` | Indexed `correctAnswer`, passing score, and TypeScript cast only. |
| Challenge | `content/courses/<course>/challenges/<id>.json`; generic `ChallengeSpec` in `lib/challenge-types.ts`; a second route-local interface in `app/api/judge/route.ts` | Generic validation is shallow and permissive. The route scans every course directory for the first matching filename; strict AGD-owned schemas and exact-ID dispatch do not exist. |
| Progress/evidence | `lib/storage.ts` and `lib/mission-state.ts` | Browser `localStorage`, namespaced mainly by course slug. It is convenience progress/attempt/leaderboard state, not authenticated portfolio evidence or badge authority. |

Current filesystem counts at the reviewed head are **10 courses, 119 modules, 307 lessons, 119 quizzes, 307 challenge JSON files, and 155 static download files**. The committed `reports/course-inventory-quality-report.json` is stale for the present tree: it records 9 courses, 111 modules, 291 lessons, 111 quizzes, 299 challenges, and 147 downloads, before `spiced-sales-framework` was added. The supported generator is `scripts/course-inventory-report.mjs` (`pnpm content:inventory`), but the A1 worktree intentionally has no installed dependencies; a direct read-only run stopped with `ERR_MODULE_NOT_FOUND: gray-matter`. A1 did not install packages or regenerate reports.

Current course metadata has no `comingSoon` field on any course (so it is falsy everywhere). Eight course files set `free: true`; `spiced-sales-framework` sets `free: false` and `protected: true`; `python-interview-prep` omits `free`. This exposes existing schema drift that course-owned AGD validation must not copy.

### Judge behaviour

- `app/api/judge/route.ts` deterministically computes sequence score/order, but still constructs and invokes the configured LLM to generate sequence feedback.
- Only `json-editor` challenges whose IDs start with `spiced-` receive special deterministic dispatch through `lib/structured-grader.ts`.
- Other generic challenge paths invoke `createJudgeLLM()`; the caller-supplied `environment` is included in the prompt and is not a trusted dispatch key.
- `tests/judge-sequence.test.ts`, `tests/judge-structured.test.ts`, `tests/judge-route-security.test.ts`, and `tests/integration/judge.integration.test.ts` are the present judge coverage surfaces.
- #122 therefore requires repository-owned, exact-ID, provider-free AGD dispatch in a later authorised phase. A1 adds none.

## Routes, downloads, tests, and access semantics

### Route inventory

Learner pages are `app/page.tsx`, `app/desktop/page.tsx`, and the dynamic route family under `app/courses/[courseSlug]/`: course overview, progress, module overview, lesson, interactive lesson, quiz, and summary. APIs are:

- `GET /api/course-structure?courseSlug=...` — metadata plus module/lesson counts;
- `GET /api/quiz?courseSlug=...&moduleSlug=...` — complete quiz questions, including answer indices from the loaded quiz object;
- `POST /api/judge` — challenge lookup and deterministic/special/generic grading described above;
- `POST /api/tutor` — provider-backed conversational Python tutor.

Static downloads use `public/assets/courses/<course>/downloads/*` and are served at `/assets/courses/<course>/downloads/*`. Seven courses currently have download directories. Large/generated AGD companion archives do not yet exist and must remain outside committed content until the packaging gate authorises them.

### Test inventory

Current repository test entry points are `pnpm test`, `pnpm test:integration`, and `pnpm test:all`. The 12 checked-in test files cover:

- content/challenge/frontmatter/reference validation: `tests/content-validation.test.ts`;
- course inventory generator: `tests/course-inventory-report.test.ts`;
- routes/catalog/access affordances: `tests/route-smoke.test.tsx`;
- judge sequence, structured grading, security, and integration: `tests/judge-*.test.ts`, `tests/integration/judge.integration.test.ts`;
- interactive components: `tests/components/{feedback-panel,json-editor,sequence-completer}.test.tsx`;
- Solana mismatch classification: `tests/solana-mismatch-classification.test.ts`.

The test schema checks required challenge fields, sequence integrity, JSON-editor seed parseability, interactive MDX fields, challenge references, and environment/type consistency. It does not provide strict course/module/quiz runtime schemas, AGD evidence authenticity, or AGD scenario coverage.

### Actual access boundary

- `free` is display/report metadata. No route or API authorisation check consumes it.
- `comingSoon` disables catalog/desktop launch affordances, but it is not an access-control contract for direct dynamic routes.
- `lib/auth.ts` is a stub: `getUser()` always returns `null`; sign-in/out throw; `courseAccess` is not enforced.
- Optional module passwords are client-side plaintext metadata checked by `components/password-gate.tsx` and persisted in `localStorage`. No current module sets `requiresPassword` or `password`, and this mechanism is not protection for a separate optional course.
- Progress, quiz attempts, mission points, badges, and leaderboard data are local browser state.

For `AGD-CORE-030` and `AGD-SOL-001`, the future core and optional Solana experiences need distinct course/result/evidence/badge identities. Existing `free`, `comingSoon`, password, and browser-progress fields must not be described as secure enrolment or authoritative separation.

### Accessibility baseline (`AGD-CORE-029`)

`components/environments/SequenceCompleter.tsx` configures pointer and touch sensors and says “Drag to reorder”; it has no keyboard sensor or non-drag reorder controls. `components/environments/JsonEditor.tsx` has a control button but current editor controls/instructions still require explicit accessible naming review. These are later Gate B5 prerequisites for required AGD missions, not A1 edits.

## Open pull-request collision inventory

`gh pr list --state open --limit 100` returned exactly two open PRs after the fetch.

### PR #123 — this draft planning/implementation branch

- URL: <https://github.com/nissan/redditech-academy/pull/123>
- Base: `main` at `88f977c5a142ec2878efe9d3e8d0b34e62e08bc7`
- Reviewed pre-A1 head/tree: `56b8d95de35e2dee59e0b543eb41fdd821aa3257` / `0c9022c0743b18f1345fdf0ab776af2a57d356ec`
- State: draft, mergeable, `mergeStateStatus: CLEAN` at observation time.
- Pre-A1 files: `BDD_TRACKER.md`, the #122 build plan, research brief, learning-experience spec, and feature contract. There were no runtime/schema/route/test/download/access changes at the reviewed planning head.

### PR #100 — overlapping open implementation

- URL: <https://github.com/nissan/redditech-academy/pull/100>
- Title: `Forward Deployed AI Engineering: cumulative course build`
- Base: `main` at `88f977c5a142ec2878efe9d3e8d0b34e62e08bc7`
- Head/tree: `a67e379f2eb1753e3b30a57698f4fe6d935a7305` / `9371fac0f6667914a4f9e1fecf3ec2a3b43bcacd`
- State: draft, mergeable, `mergeStateStatus: CLEAN` at observation time.

Collision list for surfaces #122 is expected to modify later:

| Surface | PR #100 files | Collision/coordination requirement |
| --- | --- | --- |
| Judge dispatch | `app/api/judge/route.ts` plus new FDE grader modules | Direct shared-file collision with future AGD exact-ID dispatch. Reconcile after PR #100 lands or via an explicit Loki sequencing decision. |
| Challenge UI/accessibility | `components/environments/JsonEditor.tsx`; `app/.../interactive/interactive-lesson-client.tsx` | Direct shared-file collision with later accessible mission/editor work. Preserve PR #100 behaviour and tests. |
| Content schema | `lib/content-types.ts` | Direct shared schema collision. Re-inventory before adding AGD fields/contracts. |
| Inventory | `scripts/course-inventory-report.mjs`; `tests/course-inventory-report.test.ts` | Direct shared-file collision and expected-count drift when either course is added. Avoid hard-coded count overwrite. |
| Tests | Four FDE component tests and multiple course/contract/mission tests | Shared test namespace and runtime; no identical filenames, but full-suite coordination is required. |
| Downloads/content | `public/assets/courses/forward-deployed-ai-engineering/downloads/*`; `content/courses/forward-deployed-ai-engineering/*` | Same conventions, distinct slugs/paths. Inventory counts and route/catalog behaviour overlap semantically. |
| Companion/evidence | `companion-labs/forward-deployed-ai-engineering/*`, including evidence schemas and bootstrap/package fixtures | No identical planned AGD path (`companion/agentic-game-development/v1/`), but schemas, exclusion policy, packaging conventions, and evidence terminology overlap. Reuse/reconcile deliberately. |
| Build/config boundary | `.gitignore`; `package.json` | Direct shared-file collisions when AGD later adds exclusions or scripts. Lockfile is unchanged by PR #100 at observation time. |

No other open PR overlaps these surfaces. Because `origin/main` remains the reviewed base, this A1 documentation-only commit can proceed without integration. Before A2+ changes any shared file above—or immediately after PR #100 merges—Loki must choose sequencing/rebase/merge strategy and the implementing agent must fetch and re-prove head/base/tree. This audit does not make that decision.

## Issue label state (record only)

Issue #122 currently has `type:feature`, `area:content`, `area:learning-ux`, `lane:content`, and stale `status:needs-spec-refresh`.

The repository label taxonomy observed with `gh label list --limit 200` is:

- defaults: `bug`, `documentation`, `duplicate`, `enhancement`, `good first issue`, `help wanted`, `invalid`, `question`, `wontfix`;
- type: `type:epic`, `type:feature`, `type:task`;
- area: `area:content`, `area:ai-feedback`, `area:auth-access`, `area:learning-ux`, `area:ops`, `area:qa`, `area:demo`, `area:desktop`;
- lane: `lane:api`, `lane:content`, `lane:ui`, `lane:ops`, `lane:tests`, `lane:docs`;
- risk: `risk:low-overlap`, `risk:merge-conflict`, `risk:external-service`, `risk:security`;
- evidence: `evidence:ui-required`, `evidence:video-required`, `evidence:screenshots-required`;
- status: `status:blocked`, `status:ready-for-kit`, `status:needs-spec-refresh`, `status:ready-for-review`.

Given the approved specification/planning package and active implementation dispatch, the correct next status label is `status:ready-for-kit` (replacing `status:needs-spec-refresh`). A1 does **not** mutate issue labels.

## Evidence commands and outcomes

All commands ran from `/Users/loki/redditech-academy-game-dev-122` unless stated otherwise.

```text
git fetch --prune origin
git branch --show-current
git rev-parse HEAD
git rev-parse HEAD^{tree}
git rev-parse origin/main
git rev-parse origin/main^{tree}
git merge-base HEAD origin/main
git rev-list --left-right --count origin/main...HEAD
git status --porcelain=v1
git status --short --branch
```

Result: exact identities in the first table; branch ahead 1/behind 0; clean worktree before A1 edits.

```text
gh pr list --repo nissan/redditech-academy --state open --limit 100 --json ...
gh pr view 100 --repo nissan/redditech-academy --json ...
gh pr view 123 --repo nissan/redditech-academy --json ...
gh api --paginate repos/nissan/redditech-academy/pulls/{100,123}/files ...
gh issue view 122 --repo nissan/redditech-academy --json ...
gh label list --repo nissan/redditech-academy --limit 200 --json ...
```

Result: two open PRs, identities and collision list above; issue-label state recorded without mutation.

```text
rg --files app components content lib public scripts tests types
find content/courses ...
find app -type f
find tests -type f
find public/assets/courses -type f -path '*/downloads/*'
rg -n 'comingSoon|free|requiresPassword|password|PasswordGate|getUser|courseAccess|localStorage' ...
rg -n 'useSensor|KeyboardSensor|PointerSensor|TouchSensor|aria-|reorder' components/environments/...
```

Result: schema, route, test, download, access, and accessibility inventories above. No files were changed by discovery.

## A1 stop boundary

Gate A1 ends with this audit. Gate A2 and every course-content/runtime phase remain untouched. No dependencies were installed; no locks/config/runtime/course/companion files were changed; no issue label, PR state, deployment, publication, release, Plane record, credential, or production system was mutated.
