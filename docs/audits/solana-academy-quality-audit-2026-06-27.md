# Solana Academy Quality Audit

Date: 2026-06-27
Issue: #58
Course: `solana-academy`
Scope: audit-only; no learner-visible content, challenge JSON, generated inventory, or UI evidence artifacts changed.

## Source Baseline

This audit compares the current `origin/main` Solana Academy course against the whole-game and course-quality definition of done.

Primary repo inputs:

- `content/courses/solana-academy/**`
- `reports/course-inventory-quality-report.md`
- `reports/course-inventory-quality-report.json`
- `docs/course-quality-task-template.md`
- `docs/solana-challenge-type-normalization-plan.md`

Workspace planning inputs:

- `/Users/loki/.openclaw/workspace/projects/redditech-academy/WHOLE-GAME-LEARNING-DESIGN-SPEC-2026-04-17.md`
- `/Users/loki/.openclaw/workspace/projects/redditech-academy/WHOLE-GAME-SOLANA-IMPLEMENTATION-PLAN-2026-04-17.md`
- `/Users/loki/.openclaw/workspace/projects/redditech-academy/COURSE-QUALITY-DELIVERY-MASTER-PLAN-2026-04-17.md`
- `/Users/loki/.openclaw/workspace/projects/redditech-academy/COURSE-QUALITY-DELIVERY-EXECUTION-PLAN-2026-04-17.md`
- `/Users/loki/.openclaw/workspace/projects/redditech-academy/delivery-assets/solana-academy/COURSE-AUDIT-UX-SUMMARY.md`
- `/Users/loki/.openclaw/workspace/projects/redditech-academy/SOLANA-HARVARD-CASE-PACK-V1-2026-04-17.md`
- `/Users/loki/.openclaw/workspace/projects/redditech-academy/SOLANA-SOLO-AI-DISCUSSION-PROMPTS-V1-2026-04-17.md`

## Current Inventory Snapshot

From `reports/course-inventory-quality-report.json`:

| Signal | Current value |
| --- | ---: |
| Modules | 24 |
| Lessons | 72 |
| Quizzes | 24 |
| Challenges | 80 |
| Interactive lessons | 72 |
| Diagrams | 67 |
| Downloads | 79 |
| Videos | 16 |
| External dependencies | 52 |
| Missing quizzes | 0 |
| Broken references | 0 |
| Empty lessons | 0 |
| Missing Solana challenge JSON type | 0 |
| Solana environment coverage gaps | 0 |
| Solana sequence integrity gaps | 0 |
| Solana legacy capstone challenge schema gaps | 3 files |
| Solana lesson slug/filename mismatches | 72 files |

The #44/#36/#68/#67/#66 challenge type/environment cleanup is complete in this baseline: Solana has no missing active challenge JSON types, no MDX environment/type coverage gaps, and no sequence integrity gaps. Follow-up recommendations below therefore do not ask for another broad Solana type/environment normalization pass.

## Implementation Plan Mapping

The current course largely matches the Solana whole-game implementation plan's module order.

| Plan step | Current state | Evidence |
| --- | --- | --- |
| Module 0 first-principles entry | Met | `00-solana-first-principles`, order 0, beginner |
| `solana.new` onramp immediately after module 0 | Met | `08-solana-new-app-builder`, order 1, beginner |
| Foundation/tooling/wallet/on-chain/frontend/testing/deployment core sequence | Met | orders 2-8 |
| Escrow labs | Met | orders 9-11 |
| Testing labs before DeFi/oracle/VRM advanced modules | Met | Surfpool order 12, LiteSVM order 13 |
| DeFi/oracle/VRM modules | Met | orders 14-18 |
| Validator modules | Met | orders 19-22 |
| Capstone ladder | Met | `23-capstone-ladder`, order 23 |
| Frontend difficulty should be intermediate | Met | `frontend/module.json` difficulty is `intermediate` |
| Running project narrative in `course.json` | Met | `runningProject.title` is `NFT Marketplace on Solana` |

Current module map:

| Order | Module path | Current title | Plan contribution |
| ---: | --- | --- | --- |
| 0 | `00-solana-first-principles` | Start Here: Solana First Principles | Rules of the game |
| 1 | `08-solana-new-app-builder` | Start Here: solana.new Beginner Onramp | Scaffold first marketplace version |
| 2 | `foundations` | Solana + Blockchain Fundamentals | On-chain environment |
| 3 | `tooling` | Developer Tooling + Environments | Build/test tools |
| 4 | `wallets` | Wallet Integration + Signing Flows | Wallet connection and signer policy |
| 5 | `onchain` | On-Chain Program Design | Core program logic |
| 6 | `frontend` | Frontend + RPC Integration | Buyer/seller UI and RPC integration |
| 7 | `testing` | Testing + Quality Gates | Ship-safety gates |
| 8 | `deployment` | Deployment + Mainnet Readiness | Mainnet readiness |
| 9 | `09-anchor-escrow-lab` | Anchor Escrow Lab | Atomic escrow |
| 10 | `10-pinocchio-escrow-lab` | Pinocchio Escrow Lab | Compute-conscious escrow |
| 11 | `11-quasar-escrow-lab` | Quasar Escrow Lab | Advanced escrow patterns |
| 12 | `17-surfpool-testing-lab` | Testing Lab - Surfpool Workflows | Transaction simulation |
| 13 | `18-litesvm-testing-lab` | Testing Lab - LiteSVM In-Process Testing | In-process testing |
| 14 | `12-jupiter-defi-integration` | DeFi Layer 1 - Jupiter Integration | Swap routing |
| 15 | `13-orca-whirlpools-integration` | DeFi Layer 2 - Orca Whirlpools | Liquidity/fee routing |
| 16 | `14-chainlink-oracle-integration` | Oracle Layer 1 - Chainlink Data Feeds | Verified pricing |
| 17 | `15-pyth-oracle-integration` | Oracle Layer 2 - Pyth Integration | Low-latency pricing |
| 18 | `16-verifiable-randomness-auctions` | VRM Lab - Commit-Reveal and Dutch Auction | Fair auction mechanics |
| 19 | `19-validator-architecture-and-consensus` | Advanced Validators - Architecture and Consensus | Network dependency model |
| 20 | `20-running-a-validator-ops-and-economics` | Advanced Validators - Operations and Economics | Validator operations |
| 21 | `21-client-diversity-firedancer-frankendancer` | Advanced Validators - Client Diversity (Agave, Firedancer, Frankendancer) | Network resilience |
| 22 | `22-validator-launch-readiness-mission` | Advanced Validators - Launch Readiness Mission | Validator go-live gate |
| 23 | `23-capstone-ladder` | Capstone - From First Principles to Production | Production-ready capstone |

## Whole-Game DoD Assessment

| DoD expectation | Status | Notes |
| --- | --- | --- |
| At least one beginner-first module | Pass | Two beginner modules: module 0 and `08-solana-new-app-builder`. |
| All lessons interactive | Pass | Inventory reports 72 interactive lessons out of 72. |
| Running project narrative present throughout | Partial pass | `course.json` has `runningProject`; all 24 first lessons include `Your Running Project`; later lessons generally inherit module mission context but do not all restate the running project. |
| Module opener blocks | Pass | First lesson in each of 24 modules includes `Your Running Project`. |
| Course-opening junior game | Pass | Module 0 and solana.new onramp include `The Game` openers and junior-game framing. |
| Lesson order follows L1 play, L2 hard parts, L3 transfer/adversarial | Partial | The 3-lesson rhythm is present, but current headings remain mostly overview/implementation/adversarial. Only 2 lessons include an explicit `The Game`; no lessons use explicit `The Hard Part`; transfer/adversarial language appears in 21 lessons. |
| Standard + mission paths visible | Unknown / needs UI-visible validation | Lesson copy says it is part of the standard + mission-mode flow, but the available UX audit summary covers only 8 modules and does not prove course-wide chooser visibility. |
| Harvard-style cases | Partial | All 72 lessons include case-study language, and a workspace case pack exists. However the repo does not publish a standalone Solana case pack, and many lesson cases are generic rather than sourced case-pack entries. |
| Solo AI prompt pack | Partial | Workspace prompt pack exists; only 8 repo lessons include `Solo AI Discussion Prompts`. |
| Capstone ladder with rubric | Partial | Module 23 has beginner/intermediate/advanced capstone lessons and rubric language, but the three capstone challenge JSON files still use legacy `title`/`description`/`starterCode`/`validationRules` and lack canonical `spec`, `prefilled`, and `validation`. |

## Course-Quality DoD Assessment

| Quality expectation | Status | Notes |
| --- | --- | --- |
| Source rigor | Partial | Lessons link official Solana and ecosystem docs, but case studies in many lessons are synthetic/generic and should be source-attributed where they make real-world claims. |
| Practical depth | Pass | 80 challenges, 79 downloads, 67 diagrams, and 24 quizzes provide substantial hands-on practice. |
| Assessment quality | Partial | Most challenge schema buckets are clean after #66, but capstone challenge JSON remains legacy and should be canonical before the course is called fully quality-DoD complete. |
| Meme and micro-activity coverage | Pass | 72 lessons include meme opener language; assets include module meme files. |
| Remediation notes recorded | Partial | This audit records current remediation candidates; follow-up issue closure is still required. |
| QA evidence | Partial | Inventory and content validation evidence exists; UX/video QA summary covers only 8 modules, not all 24. |

## Gap Register

### Gap 1 - Whole-game lesson headings and attempts are not explicit across the full course

Evidence:

- `The Game` appears in 2 of 72 lessons.
- `Your Running Project` appears in the first lesson of each of 24 modules.
- `The Hard Part` and `What Just Happened` headings are absent.
- Current core lessons often use `Overview`, `Implementation Lab`, and `Adversarial Gate`, which preserves the learning sequence but does not fully match the locked whole-game template.

Impact:

- A learner can see the mission framing, but the design intent of "attempt first, theory after the attempt" is not consistently visible.

Recommended lane:

- Content-only, module-by-module authoring pass.

### Gap 2 - Solo AI discussion prompt pack is drafted but not broadly wired into lessons

Evidence:

- Workspace prompt pack exists: `SOLANA-SOLO-AI-DISCUSSION-PROMPTS-V1-2026-04-17.md`.
- Repo lesson scan found 8 lessons with `Solo AI Discussion Prompts`.
- The course-quality execution plan still lists "Publish AI prompt pack -> lesson footers" as in progress.

Impact:

- The "learn from the team" whole-game principle is not fully supported for solo learners.

Recommended lane:

- Content-only prompt wiring pass.

### Gap 3 - Case-study coverage exists, but case-pack publication/source rigor is incomplete

Evidence:

- Workspace case pack exists: `SOLANA-HARVARD-CASE-PACK-V1-2026-04-17.md`.
- All 72 lessons include case-study language.
- The execution plan still lists "Publish case pack -> lesson wiring" as in progress.
- Many current cases use generic team/scenario language; capstone cases are more concrete but still not backed by a repo-local case pack.

Impact:

- The course can satisfy "case present" mechanically while falling short of the Harvard-style/source-rigor bar.

Recommended lane:

- Content-only case-pack publication and selected lesson wiring.

### Gap 4 - Capstone is learner-facing, but capstone challenge JSON remains legacy

Evidence:

- Inventory reports three Solana compatibility buckets remaining for:
  - `content/courses/solana-academy/challenges/solana-capstone-beginner-build.json`
  - `content/courses/solana-academy/challenges/solana-capstone-intermediate-architecture.json`
  - `content/courses/solana-academy/challenges/solana-capstone-advanced-adversarial.json`
- Each file has `type: "json-editor"`, but still uses `title`, `description`, `starterCode`, and `validationRules`, and lacks canonical `spec`, `prefilled`, and `validation`.

Impact:

- The capstone ladder cannot be considered fully aligned with the current challenge schema DoD.

Recommended lane:

- Content-only challenge schema migration, with UI evidence only if rendered challenge behavior or visible task copy changes materially.

### Gap 5 - Standard vs mission path visibility is not proven course-wide

Evidence:

- The available `COURSE-AUDIT-UX-SUMMARY.md` covers 8 modules: `08-solana-new-app-builder`, `deployment`, `foundations`, `frontend`, `onchain`, `testing`, `tooling`, and `wallets`.
- Current Solana has 24 modules, so the UX evidence does not cover advanced escrow, DeFi, oracle, VRM, validator, or capstone modules.
- The execution plan still lists "UX QA - standard vs mission path chooser" as in progress.

Impact:

- Course-quality DoD cannot yet claim that standard and gamified mission paths are both visible and navigable across the full Solana Academy.

Recommended lane:

- UI-visible route/UX QA pass; no content changes required unless the chooser is absent or unclear.

### Gap 6 - Slug/filename mismatch remains, but belongs to #37

Evidence:

- Inventory reports 72 Solana `lessonSlugFilenameMismatch` findings.
- Project status explicitly says #37 remains separate from type/environment cleanup and route assumptions.

Impact:

- This is real inventory noise, but not a #58 remediation lane unless #37 is rescoped.

Recommended lane:

- Do not open a new #58 child for this unless #37 is closed without resolving Solana slug/frontmatter cleanup.

## Proposed Follow-Up Issue Candidates

These candidates intentionally use the #59 template language and separate audit-only, content-only, and UI-visible work.

### Candidate A - Content-only: Align Solana lesson openings to whole-game L1/L2/L3 language

Parent epic: #7
Source template: `docs/course-quality-task-template.md`
Related audit: `docs/audits/solana-academy-quality-audit-2026-06-27.md`

Course Scope:

- Course slug: `solana-academy`
- Course title: Solana Developer Academy
- Work type: Content-only

Allowed File Paths:

- `content/courses/solana-academy/modules/**/lessons/*.mdx`
- `reports/course-inventory-quality-report.*` only if regenerated because inventory output changes

Out of scope:

- Challenge JSON schema/type/environment edits
- App/router/component changes
- Slug/filename cleanup owned by #37
- Generated UI evidence artifacts unless rendered content changes are material enough to require screenshots

Required Work:

- Update selected Solana lessons so module lesson 1 makes the mini-mission attempt explicit before theory.
- Add or normalize whole-game section language where appropriate: `The Game`, `What Just Happened`, `The Hard Part`, and transfer/adversarial framing.
- Preserve existing challenge IDs, routes, and `environment` values.
- Keep changes module-scoped and reviewable; split into batches if touching many lessons.

Acceptance Criteria:

- Every edited module still has one first lesson with `Your Running Project`.
- The edited L1 lessons show the attempt-before-theory pattern.
- L2/L3 lesson copy clearly separates hard-part practice from transfer/adversarial pressure.
- No Solana challenge JSON type/environment cleanup is bundled.
- Inventory impact is unchanged or regenerated and explained.

Validation:

- `pnpm content:inventory`
- `pnpm test -- tests/course-inventory-report.test.ts`
- `pnpm test -- tests/content-validation.test.ts`
- `git diff --check origin/main...HEAD`
- `git diff --check`

### Candidate B - Content-only: Publish and wire Solana case pack with source-rigor notes

Parent epic: #7
Source template: `docs/course-quality-task-template.md`
Related audit: `docs/audits/solana-academy-quality-audit-2026-06-27.md`

Course Scope:

- Course slug: `solana-academy`
- Course title: Solana Developer Academy
- Work type: Content-only

Allowed File Paths:

- `content/courses/solana-academy/**`
- `public/assets/courses/solana-academy/**` only for repo-owned/source-attributed case-pack assets
- `reports/course-inventory-quality-report.*` only if regenerated because inventory output changes

Required Work:

- Bring the Solana Harvard-style case pack into the repo in a discoverable course-owned path or wire selected case-pack entries into relevant lessons.
- Add source/provenance notes for any real-world case claims.
- Replace generic case placeholders only where the case-pack source improves the lesson; do not rewrite unrelated lesson content.

Acceptance Criteria:

- At least 5 Solana case studies are published or clearly linked from course content.
- Each published case has source/provenance notes or is explicitly marked as a synthetic teaching case.
- Updated lessons preserve routes, challenge IDs, and challenge behavior.
- No third-party diagrams/screenshots/text are copied into the repo without license/provenance approval.

Validation:

- `pnpm content:inventory`
- `pnpm test -- tests/content-validation.test.ts`
- `git diff --check origin/main...HEAD`
- `git diff --check`

### Candidate C - Content-only: Wire Solana solo AI discussion prompts across the course

Parent epic: #7
Source template: `docs/course-quality-task-template.md`
Related audit: `docs/audits/solana-academy-quality-audit-2026-06-27.md`

Course Scope:

- Course slug: `solana-academy`
- Course title: Solana Developer Academy
- Work type: Content-only

Allowed File Paths:

- `content/courses/solana-academy/modules/**/lessons/*.mdx`
- Optional prompt-pack markdown under a course-owned docs or asset path if the repo needs one canonical pack

Required Work:

- Use the drafted workspace prompt pack as source context.
- Add concise solo AI prompts to module footers or selected lessons where they support review, red-team, rubric feedback, or roleplay decision-board practice.
- Keep prompts hint-first and course-safe; do not encourage answer dumping.

Acceptance Criteria:

- Every module has at least one visible solo AI discussion prompt, or the issue documents a deliberate exception.
- Prompts are role-specific and tied to the module's Solana skill, not generic chatbot instructions.
- Updated lessons preserve routes, challenge IDs, and challenge behavior.

Validation:

- `pnpm content:inventory`
- `pnpm test -- tests/content-validation.test.ts`
- `git diff --check origin/main...HEAD`
- `git diff --check`

### Candidate D - Content-only: Migrate Solana capstone challenges to canonical JSON-editor schema

Parent epic: #7
Source template: `docs/course-quality-task-template.md`
Related audit: `docs/audits/solana-academy-quality-audit-2026-06-27.md`

Course Scope:

- Course slug: `solana-academy`
- Course title: Solana Developer Academy
- Work type: Content-only, with UI evidence required only if visible rendered task copy or behavior changes materially

Allowed File Paths:

- `content/courses/solana-academy/challenges/solana-capstone-beginner-build.json`
- `content/courses/solana-academy/challenges/solana-capstone-intermediate-architecture.json`
- `content/courses/solana-academy/challenges/solana-capstone-advanced-adversarial.json`
- `content/courses/solana-academy/modules/23-capstone-ladder/**` only if needed to keep lesson/challenge copy consistent
- `reports/course-inventory-quality-report.*` when regenerated
- `tests/**` only if existing validation expectations require update

Required Work:

- Replace legacy `title`/`description`/`starterCode`/`validationRules` fields with canonical `spec`, `prefilled`, and `validation` fields.
- Preserve `type: "json-editor"` and the three existing challenge IDs.
- Keep capstone lesson routes and challenge IDs stable.

Acceptance Criteria:

- Solana `legacyTitleDescription`, `legacyStarterCode`, `legacyValidationRules`, and `missingVisibleSpec` buckets decrease from 3 to 0.
- Capstone challenge JSON remains parseable and aligned with MDX `environment: "json-editor"`.
- No unrelated Solana challenge JSON files change.
- UI evidence is attached if the rendered capstone interactive route changes materially; otherwise the PR states why evidence is not required.

Validation:

- `pnpm content:inventory`
- `pnpm test -- tests/course-inventory-report.test.ts`
- `pnpm test -- tests/content-validation.test.ts`
- `git diff --check origin/main...HEAD`
- `git diff --check`

### Candidate E - UI-visible: Verify Solana standard and mission path visibility across all modules

Parent epic: #7
Source template: `docs/course-quality-task-template.md`
Related audit: `docs/audits/solana-academy-quality-audit-2026-06-27.md`

Course Scope:

- Course slug: `solana-academy`
- Course title: Solana Developer Academy
- Work type: UI-visible

Allowed File Paths:

- App/component/test files explicitly needed for the route/path chooser, if gaps are found
- `content/courses/solana-academy/**` only if route labels or per-module content are needed to surface existing standard/mission path choices
- `artifacts/ui-evidence/<issue>/` for screenshots or video evidence
- `reports/course-inventory-quality-report.*` only if regenerated because content changes affect inventory

Required Work:

- Audit course overview and representative lesson/interactive routes for all 24 Solana modules.
- Verify that standard and mission/gamified paths are both visible and navigable.
- Fix only the smallest UI/content surface needed if visibility is missing.
- Capture desktop and mobile evidence for changed states.

Acceptance Criteria:

- Evidence covers at least: course overview, module 0, solana.new onramp, one core module, one escrow lab, one validator module, and capstone.
- If no UI change is needed, produce a route evidence manifest and issue comment.
- If UI changes are made, focused tests and screenshots/video are attached before review.

Validation:

- `pnpm ui:evidence -- --issue=<issue>` or documented focused equivalent
- `pnpm test` or focused route/component tests if UI code changes
- `pnpm type-check` if app/types change
- `git diff --check origin/main...HEAD`
- `git diff --check`

### Candidate F - Audit-only: Add Solana whole-game audit checks to inventory/reporting

Parent epic: #7
Source template: `docs/course-quality-task-template.md`
Related audit: `docs/audits/solana-academy-quality-audit-2026-06-27.md`

Course Scope:

- Course slug: `solana-academy`
- Course title: Solana Developer Academy
- Work type: Audit-only

Allowed File Paths:

- `scripts/**`
- `tests/**`
- `reports/course-inventory-quality-report.*`
- `docs/**`

Required Work:

- Add report-only checks for whole-game markers that are currently manual in this audit: `The Game`, `Your Running Project`, `Hard Part`, transfer/adversarial framing, solo AI prompts, and case-study source/provenance markers.
- Keep checks report-only until course teams agree on hard gates.

Acceptance Criteria:

- `pnpm content:inventory` emits whole-game marker counts per course.
- Tests cover Solana marker counts without making current gaps fail as hard blockers.
- No learner-visible content changes are included.

Validation:

- `pnpm content:inventory`
- `pnpm test -- tests/course-inventory-report.test.ts`
- `pnpm test -- tests/content-validation.test.ts`
- `git diff --check origin/main...HEAD`
- `git diff --check`

## Recommended Sequencing

1. Candidate D first, because it clears the only remaining Solana challenge-schema bucket and is narrow.
2. Candidate E next or in parallel with D, because standard/mission path visibility is a UI evidence gate rather than broad content authorship.
3. Candidate B and C next, using the drafted workspace case and prompt packs.
4. Candidate A last, split into batches if needed, because whole-game lesson-structure edits can touch many lesson files.
5. Candidate F can run anytime as an audit/report lane, but should remain report-only until the content lanes land.

Keep #37 separate for Solana slug/frontmatter mismatch cleanup.

## Residual Risk

- This audit is based on static file and inventory inspection, not live route screenshots.
- It does not fact-check every Solana technical claim or external reference.
- It does not validate the runtime rendering of `json-editor` capstone challenges.
- It assumes the workspace case and prompt packs are acceptable source context but does not import or edit them.
