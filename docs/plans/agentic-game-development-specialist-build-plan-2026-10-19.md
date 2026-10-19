# BUILD_PLAN — Agentic Game Development Specialist
_Author: Firefly | Date: 2026-10-19 | Total estimated effort: ~24h Kit + ~4h Sara/Oli QA_

**Issue:** [Redditech Academy #122](https://github.com/nissan/redditech-academy/issues/122)
**Status:** Phase 0b approved; implementation remains unauthorised until Loki dispatches a phase
**Contract:** `features/agentic-game-development-specialist.feature` — 37 approved scenarios (30 core, 7 optional Solana)
**Scope:** Review-ready Academy course and versioned local companion bundle. No merge, deployment, publication, paid service, mainnet transaction, real funds, or production credentials.

## Deliverable

A review-ready, original Agentic Game Development Specialist course whose mainstream badge takes a learner from a fragile Unity/C# vertical slice through tested web-game, Unity web-porting, Godot transfer, release, and independent handoff evidence, with a separately enrolled, assessed, and badged optional Solana localnet/devnet module; all canonical grading is deterministic, manifest-bound, reproducible, accessible, low-spec/offline capable, and provider-free.

## Success Criteria

1. Every `AGD-CORE-001`–`AGD-CORE-030` and `AGD-SOL-001`–`AGD-SOL-007` clause maps to an executable check or inspectable artefact and passes at the exact reviewed head.
2. The mainstream badge remains earnable with no Solana enrolment, wallet, chain, AI account, paid asset, paid provider, production credential, or network after the prepared bundle is obtained.
3. A versioned companion source bundle contains bounded Unity, Godot, browser, harness, fixtures, and separately isolated optional Solana directories; engine caches, build outputs, package stores, keys, ledgers, and learner evidence never enter the source archive.
4. A strict `agd-evidence-v1` contract binds source revision/dirty state, bundle and fixture digests, exact tools, commands, targets, artefacts, and evidence-file SHA-256 digests. Canonical gates re-run evidence-producing checks and do not trust screenshots, filenames, local browser storage, or learner-authored verdicts.
5. Original/CC0 provenance, game and Academy accessibility, low-spec/offline operation, agent accountability, debugging, layered testing, target-context profiling, release, and independent handoff gates are non-compensable.
6. The optional Solana badge uses synthetic identities/assets only, localnet before devnet, preserves offline core play, and proves fit/no-fit, custody/authority, retries/idempotency, abuse/failure handling, and go/no-go reasoning. It performs no mainnet or financial action.
7. Repository-scoped tests, type-check, production build, inventory, route/API/browser smokes, deterministic package regeneration, dependency audit, diff checks, and secret/provenance scans pass.
8. Sara and Oli independently pass the same exact commit and tree. Any material remediation changes the head and invalidates the affected approval until re-review.
9. The final pull request remains draft/review-only. There is no merge, deployment, publication, or manual preview promotion.

## Risk Flags

- **Editor availability:** Unity and Godot are not currently installed in the issue worktree environment. Gate A must prove a legally usable, reproducible editor pair before companion implementation.
- **Volatile engine/chain tooling:** exact Unity patch, Godot patch, and Solana client package must be locked from verified first-party distributions and checksums in Gate A; no floating installer or package range is allowed.
- **Evidence authenticity:** hashes make evidence tamper-evident, not magically trustworthy. Critical verdicts therefore require deterministic re-execution and independent handoff; Academy browser state is never authoritative.
- **Repository drift:** the issue worktree is currently clean at `88f977c5a142ec2878efe9d3e8d0b34e62e08bc7`, but `origin/main` must be fetched and ancestry rechecked immediately before the first implementation edit.
- **Current schema depth:** course/module/quiz JSON is TypeScript-cast, generic challenge validation is shallow, and the generic judge can call an LLM. Issue #122 needs strict course-owned schemas and repository-owned deterministic dispatch.
- **Access semantics:** `free` is catalog metadata, not access enforcement; module passwords are not a substitute for a protected course. Keep `comingSoon: true` and describe actual access behaviour honestly.
- **Accessibility debt:** `SequenceCompleter` needs a keyboard-equivalent reorder path and editor controls need explicit accessible names/instructions before they may host required missions.
- **Binary/repository size:** generated Unity/Godot caches and packaged builds can be large. Only source, tiny original/CC0 assets, fixtures, contracts, and deterministic packaging scripts belong in Git.
- **Cross-platform evidence:** one local OS cannot prove all targets. Claims must name the tested OS/device and mark untested rows; no universal support claim is permitted.
- **Optional devnet:** devnet is network-dependent and non-canonical for the core. A devnet outage may defer only the optional Solana badge, never the mainstream course.

## Planning Constraint Resolutions and Pinned Defaults

### 1. Engine, language, mechanic, OS, and hardware

- **Unity family:** Unity 6.3 LTS, exact `6000.3.x` editor revision and matching Unity Test Framework package to be locked by A2 after first-party installer/module verification. Use C# with Unity's supported C# 9 subset and `.NET Standard 2.1` API compatibility. Do not begin Unity content against an unpinned patch.
- **Godot family:** Godot 4.x stable standard build with GDScript 2.0; A2 locks the current supported patch and archive SHA-256 after the Unity/Godot compatibility smoke. No .NET Godot build is needed.
- **Transfer mechanic:** the bounded **Signal Relay** state machine: enter pickup zone → acquire synthetic signal → enter delivery zone → award exactly once → cooldown → ready. The shared contract defines input, state, output, delta-time, reset, duplicate-event, and tolerance rules; it does not reproduce the capstone.
- **Authoring targets:** Windows 11 x64 and macOS arm64 are documented authoring targets. Gate A records which one is actually exercised. Linux is best-effort only unless independently run.
- **Reduced reference envelope:** 4 logical CPU cores, 8 GiB RAM, integrated graphics, 1280×720, 30 fps/33.3 ms frame budget, and 10 GiB free disk after editors are installed. Full-quality guidance may recommend 16 GiB, but assessed outcomes cannot require a discrete GPU.

### 2. Standalone web lab and browsers

- Use browser-native Canvas 2D, ES modules, Web Audio only after user activation, `requestAnimationFrame`, Page Visibility, ResizeObserver, local persistence with failure handling, Web Workers only where justified, and Performance APIs.
- Compile with repository-resolved TypeScript **5.9.3**; test with Vitest **4.1.4** and Playwright **1.59.1**. Add no framework or mandatory network runtime.
- The assessed two-engine matrix is Playwright-managed **Chromium and Firefox**. A2 records their exact downloaded revisions in `bundle.lock.json`; WebKit is advisory, not a hidden third requirement.

### 3. Companion and evidence boundary

- Track source at `companion/agentic-game-development/v1/` with `contracts/`, `fixtures/`, `harness/`, `unity/`, `godot/`, `web/`, and `solana-optional/`.
- `solana-optional/` has its own setup, lock, missions, evidence namespace, and badge contract. Core setup and verification never traverses it.
- Exclude Unity `Library/`, `Temp/`, `Logs/`, `UserSettings/`, builds; Godot `.godot/` and exports; web `node_modules/` and `dist/`; Solana keys, test ledgers, `target/`, and validator state; all learner `evidence/` directories.
- Generate `agd-companion-v1.0.0.zip`, a file list, and SHA-256 deterministically into an ignored review-artifact directory. Do not commit generated archives until A3 proves size and repository policy; while `comingSoon`, lessons may reference the source bundle and packaging command rather than a public URL.
- `agd-evidence-v1` uses canonical JSON and SHA-256. Required fields: schema/bundle version, course/scenario IDs, attempt ID, pseudonymous actor ID, source commit and dirty/patch digest, fixture IDs/digests, tools/versions, relative commands and exit codes, UTC start/end, target/build identity, expected/observed result, evidence paths/digests, provenance-ledger digest, and verifier version/result.
- A repository-owned `bundle.lock.json` authenticates trusted fixture/contract/source bytes. The importer rejects unknown fields, absolute/traversal/symlink/hardlink paths, missing files, digest drift, duplicate evidence IDs, wrong scenario/bundle/attempt identity, stale/replayed evidence, pre-authored verdict rows, and learner-supplied trust roots.

### 4. Build, package, CI, and low-spec budgets

- Academy baseline: Node **24.18.0**, pnpm **10.9.0**, Next **16.3.8**, frozen lockfile. The currently active shell Node is not evidence of support; use the documented Node 24 runtime.
- Initial ceilings to prove or tighten in A3: web lab ≤2 MiB transferred; Unity web initial compressed payload ≤50 MiB; desktop player package ≤200 MiB; companion source archive ≤100 MiB; reduced-path peak resident memory ≤1.5 GiB; canonical mechanic 30 fps at 720p on the reduced envelope.
- Canonical CI is repository and browser validation plus deterministic fixture replay. Engine builds run locally with exact editor revisions unless a free, licence-compliant runner is proven. Paid runners are never required.
- Full-quality captures may supplement the reduced path, but reduced assets/captures must exercise the same coding, debugging, testing, profile-reasoning, and evidence contracts.

### 5. Accessibility mapping

- Academy UI targets WCAG 2.2 AA behaviours relevant to the course, especially semantic structure/instructions, non-colour information, contrast/reflow/non-text contrast, keyboard/no trap, no required timing, visible focus, non-drag alternative, labels, and programmatic names/status.
- The learner game contract covers remappable controls where supported, keyboard menus, readable scalable text, non-colour feedback, independent volume, pause, reduced motion/camera shake, and tested controller operation only when claimed.
- This is a bounded behaviour target, not a blanket WCAG or platform-certification claim. A4 produces the exact criterion/control matrix and Sara independently tests it.

### 6. Optional Solana stack and wallet pattern

- Pin the locally available first-party baselines **Agave/Solana CLI 4.3.2** and **Surfpool 1.1.1** for the Gate A spike. A5 locks the maintained TypeScript client package/version and checksums after compatibility/security tests; no floating range is allowed.
- Use a narrow synthetic entitlement adapter, Surfpool/local validator first and devnet second. Core gameplay depends only on an offline in-memory adapter implementing the same interface.
- Teaching implementation uses an explicitly prompted **player-controlled throwaway localnet/devnet keypair** stored outside the repository and bundle. Embedded/managed and server/custodial patterns are compared in the ADR but not implemented as custody services.
- No wallet auto-approval, session-key broad authority, mainnet endpoint, real token, production identity, token sale, or financial-return language. Devnet data has no value and reset/recovery is documented.

## Repository and Schema Inventory

**Inspected baseline:** clean `/Users/loki/redditech-academy-game-dev-122`, branch `feat/122-agentic-game-development`, commit `88f977c5a142ec2878efe9d3e8d0b34e62e08bc7` (2026-10-19). This is an observation, not permission to edit or push.

| Area | Current contract | Issue #122 implication |
|---|---|---|
| Runtime/build | pnpm 10.9.0; Next 16.3.8; TypeScript resolves 5.9.3; Vitest 4.1.4; Playwright 1.59.1 | Reuse the frozen Academy stack; no web framework needed |
| Course | `content/courses/<slug>/course.json`; `CourseMetadata`; `free` and `comingSoon` | Create one mainstream course; keep `comingSoon: true` through review |
| Module | `modules/<slug>/module.json`; objectives, prerequisites, estimate, badge | Core modules share the core badge; optional Solana must be a separate course/enrolment record, not a core prerequisite |
| Lessons | MDX frontmatter supports standard/interactive and four environment types | Use original concept lessons plus deterministic interactive missions; external engine work is companion-driven |
| Quiz | `quiz.json`; indexed answer and passing score | Scenario/trade-off checks must use plausible distractors and not compensate for hard gates |
| Challenges | `challenges/<id>.json`; generic validation is shallow | Add strict `agd-*` schemas and course-owned graders; reject unknown fields |
| Judge route | sequence grading is deterministic; generic paths may invoke a provider; SPICED has special deterministic dispatch | Add repository-owned exact-ID dispatch for AGD; caller `environment` never chooses provider; canonical AGD grading constructs/invokes no LLM |
| Progress | local browser storage records progress/attempts | Treat as convenience only; never as portfolio evidence or badge authority |
| Accessibility | sequence uses drag sensors; editor controls need stronger labels/instructions | B5 is a prerequisite for required Academy missions |
| Downloads | static templates live under `public/assets/courses/<slug>/downloads/` | Keep small templates there; large/generated companion artefacts stay outside content until packaging gate passes |
| Tests | content, inventory, routes, judge security/structured/sequence, components, integration | Extend course-scoped tests and preserve all existing suites |
| Access | module password support exists; `free` is displayed metadata | Do not claim protected enrolment without an actual access contract; separation is enforced by distinct course/result IDs |

## Scenario Coverage Ledger

| Scenario | Primary implementation / gate phases |
|---|---|
| AGD-CORE-001 | B1, C0a, E4 |
| AGD-CORE-002 | A3, B7, C0a–C0b, E3 |
| AGD-CORE-003 | B8, C1a–C1b |
| AGD-CORE-004 | A2, C1b, C2a–C2b |
| AGD-CORE-005 | C2a–C2b |
| AGD-CORE-006 | C3a–C3b |
| AGD-CORE-007 | A4, C2b, C4a–C4b |
| AGD-CORE-008 | A4, C4b, E1, E7 |
| AGD-CORE-009 | B4, C5a–C5b |
| AGD-CORE-010 | B4, C5b, E1, E7 |
| AGD-CORE-011 | C0b, C3b, C6a–C6b |
| AGD-CORE-012 | C3b, C6a–C6b |
| AGD-CORE-013 | A2, C0b, C1b, C3b, C6b |
| AGD-CORE-014 | A3, C7a–C7b |
| AGD-CORE-015 | A3, C7b, E1, E8 |
| AGD-CORE-016 | A2, C8a–C8b |
| AGD-CORE-017 | A2, B7, C8a–C8b, E3 |
| AGD-CORE-018 | A2–A3, C9a–C9b |
| AGD-CORE-019 | A3, C9b, E1 |
| AGD-CORE-020 | A2, C10a–C10b |
| AGD-CORE-021 | A2, C10a–C10b |
| AGD-CORE-022 | B8, C6a–C6b |
| AGD-CORE-023 | B8, C6b, E1, E8 |
| AGD-CORE-024 | A3, B2–B3, C11b, E1 |
| AGD-CORE-025 | A3, B3, C11b, E1, E8 |
| AGD-CORE-026 | B8, C11a–C11b, E1 |
| AGD-CORE-027 | B8, C11a–C11b, E1, E7–E8 |
| AGD-CORE-028 | E1, E7–E8 |
| AGD-CORE-029 | A4, B5, C4b, E4, E7 |
| AGD-CORE-030 | B1–B2, D0a, E2, E4 |
| AGD-SOL-001 | B1–B2, D0a, E2 |
| AGD-SOL-002 | D0a–D0b |
| AGD-SOL-003 | A5, D1a–D1b, D2b, E2–E3 |
| AGD-SOL-004 | A5, D1a–D1b, D3b |
| AGD-SOL-005 | A5, D2a–D2b, D3b |
| AGD-SOL-006 | A5, D3a–D3b |
| AGD-SOL-007 | D3a–D3b, E1–E2, E7–E8 |

## Phase Breakdown

Every Kit slice is independently verifiable and capped at **30 active minutes**. If a slice cannot meet its gate, stop and record the exact blocker; do not hide it in a later phase. Long-running tools receive explicit wall-clock timeouts and captured exit codes.

### Gate A — Identity, Feasibility, and Contract Locks

| Phase | task_type | Inputs | Task | Output | Verify | Est. | Depends on | Scenarios |
|---|---|---|---|---|---|---:|---|---|
| A1 — Base and schema inventory | instruction_following | Approved feature; issue worktree | Fetch read-only refs, prove branch/base/cleanliness, inventory current schemas/routes/tests/download/access semantics, and record overlap with open PRs | `audits/issue-122-gate-a-inventory.md` | Exact branch/head/tree, clean state, schema paths, commands, and collision list recorded | 25m | none | CORE-001, 024, 029–030; SOL-001 |
| A2 — Engine/web compatibility spike | debugging | A1; pinned families above | On throwaway fixture projects, test exact Unity 6.3 LTS patch, Test Framework, `.NET Standard 2.1`, Godot 4.x patch, Signal Relay parity, TS 5.9.3, and Playwright Chromium/Firefox | `companion/.../v1/bundle.lock.json` tool/browser section + spike report | Clean Unity Edit/Play test, Godot headless parity, web unit/E2E smoke; exact versions/checksums captured | 30m | A1 | CORE-004–005, 013–021 |
| A3 — Packaging/budget spike | debugging | A2 fixture projects | Prove source-only archive exclusions, deterministic archive digest, build-size ceilings, reduced-envelope run, and engine-build licensing/runner boundary | `audits/issue-122-packaging-budget-spike.md` | Two package runs are byte-identical or deterministic members are proven; no cache/key/evidence paths; budgets measured | 30m | A2 | CORE-002, 014–019, 024–025 |
| A4 — Accessibility contract spike | schema_generation | Feature; current components | Map required Academy/game behaviours to exact WCAG 2.2 criteria and platform controls; identify automated/manual evidence and no-conformance wording | `contracts/accessibility-matrix-v1.json` | Schema-valid map; keyboard/no-drag/name/focus/status checks named; manual checks have owner | 25m | A1 | CORE-007–008, 029 |
| A5 — Solana stack/security spike | debugging | Research; CLI 4.3.2; Surfpool 1.1.1 | Lock maintained TS client; prove synthetic localnet adapter, explicit-signing key isolation, devnet configuration, authority negatives, timeout/retry/reconcile seam, and offline adapter fallback | `audits/issue-122-solana-gate-a.md` + optional lock section | Local deterministic test passes; no key in repo/log; wrong authority fails before effect; core starts with chain disabled | 30m | A1 | SOL-003–006 |
| A6 — Acceptance skeleton | schema_generation | A1–A5 outputs; 37 scenarios | Add course-owned scenario/evidence coverage schema and failing tests for every stable ID before content exists | Coverage manifest + red test report | 37/37 unique IDs; 30 core/7 optional; missing/duplicate/unmapped IDs fail | 25m | A2–A5 | CORE-001–030; SOL-001–007 |

**Gate A stop condition:** no course-content implementation until A2–A5 pass. A failed engine, budget, accessibility, or Solana choice returns to Firefly/Loki with evidence; Kit must not silently substitute a tool or weaken an outcome.

### Gate B — Shared Academy and Companion Foundations

| Phase | task_type | Inputs | Task | Output | Verify | Est. | Depends on | Scenarios |
|---|---|---|---|---|---|---:|---|---|
| B1 — Course and badge separation scaffold | schema_generation | A6; Academy schemas | Create mainstream course metadata/module shells and a distinct optional Solana course/enrolment/result/badge identity; keep both `comingSoon` | Course/module metadata | Inventory proves no Solana prerequisite/mark in core and no core-score mutation by optional result | 25m | A6 | CORE-001, 030; SOL-001 |
| B2 — Companion source boundary | code_generation | A2–A3 locks | Create `companion/.../v1` source tree, ignore/exclusion rules, version/readme, and independent optional directory | Companion scaffold | Boundary test rejects caches, builds, package stores, keys, validator state, and evidence | 25m | A3 | CORE-002, 024–025, 030; SOL-001, 003 |
| B3 — Evidence manifest and verifier | schema_generation | B2; `agd-evidence-v1` decision | Implement strict schemas, canonicalisation, SHA-256 inventory, trusted lock lookup, path confinement, and verifier CLI | Manifest contracts + verifier + adversarial tests | Valid fixture passes; tamper/replay/wrong-attempt/traversal/symlink/hardlink/unknown-field/pre-authored-result cases fail closed | 30m | B2 | CORE-024–025 |
| B4 — Provenance ledger | schema_generation | Research licence rules; B3 | Add original/CC0 asset/package/source ledger contract, preserved evidence convention, disclaimer, and fixture entries | Ledger schema/template/validator | Missing licence/source/distribution note, “free” only, commercial-copy marker, or unbound file blocks release | 25m | B3 | CORE-009–010 |
| B5 — Required mission accessibility | bug_repair | A4; current environments | Add keyboard reorder alternative, explicit labels/descriptions, visible focus/status semantics, and component tests without redesigning unrelated UI | Accessible mission components/tests | Keyboard-only flow, no pointer-only requirement, name/instruction linkage, focus, and non-colour status pass | 30m | A4 | CORE-029 |
| B6 — Deterministic AGD grading boundary | code_generation | A6; current judge route | Add exact repository-owned AGD dispatch and strict grader registry; caller environment cannot select provider | AGD grader registry/route tests | Trusted AGD IDs grade locally; fabricated ID/environment/unknown fields fail; provider construction/invocation count remains zero | 30m | A6 | CORE-022–025; SOL-001–007 |
| B7 — Offline/low-spec bootstrap | code_generation | A2–A3; B2 | Add setup, health, reset, resume, reduced-content, offline, exact-missing-artifact, and profile-report commands | Harness commands + docs/tests | Commands run twice idempotently on reduced profile; network/provider env absent; missing artefact fails actionably | 30m | B2–B3 | CORE-002, 017; SOL-003 |
| B8 — Shared evidence templates | data_generation | B3–B4 | Add architecture/ADR, defect, test, profile, agent, release, known-issues, handoff, and residual-risk templates without passing rows | Bound template pack | Templates validate but cannot count as completed evidence; each field links to scenario/evidence type | 25m | B3–B4 | CORE-003, 011, 014, 022–027 |

### Gate C — Mainstream Core Course (Unity/C# Production Spine)

Each `a` slice produces one concept/customer-signal lesson and scenario/trade-off check. Each `b` slice produces one applied mission, deterministic grader/tests, companion lab change, and evidence deposit. Later slices reuse Project Signal Run; they do not create disconnected mini-projects.

| Phase | task_type | Inputs | Task | Output | Verify | Est. | Depends on | Scenarios |
|---|---|---|---|---|---|---:|---|---|
| C0a — First playable and setup concepts | data_generation | B1, B7 | Teach course map, baseline play, controls, clean setup, reduced/offline path, and evidence rhythm | Module 0 lesson + quiz | Route/schema/source/quiz tests; no paid/Solana prerequisite | 25m | B7 | CORE-001–002 |
| C0b — Baseline triage mission | code_generation | C0a, B3 | Add inherited-build health/defect mission and deterministic baseline fixture | Mission, grader, baseline deposit | Setup/health/reset/resume and one failing reproduction bind to fixture/revision | 30m | C0a | CORE-002, 011, 013 |
| C1a — Architecture concepts | data_generation | C0b | Teach input/simulation/presentation/config/service boundaries, ownership, non-goals, alternatives, risks | Module 1 lesson + quiz | Plausible trade-off check distinguishes architecture from scene reshuffling | 25m | C0b | CORE-003 |
| C1b — Architecture and Unity foundation mission | code_generation | C1a, A2 | Add bounded refactor/implementation lab and strict architecture decision grader | Unity source slice, mission, tests, ADR | Clean compile; logic and Play Mode checks; explicit ownership/config/failure contract | 30m | C1a | CORE-003–004, 013 |
| C2a — Controls, timing, lifecycle concepts | data_generation | C1b | Teach delta time, fixed/update boundaries, focus/pause, subscriptions, allocations, accessible input | Module 2 lesson + quiz | Changed-frame/lifecycle reasoning assessed without answer cues | 25m | C1b | CORE-004–005, 007 |
| C2b — Player-control fault lab | debugging | C2a | Seed and repair frame-rate, pause, repeated scene, duplicate subscription, hidden allocation, and input-path faults | Unity lab, mission, debugger/test evidence | Variable frame/focus/time-scale/reload tests pass; keyboard path remains usable | 30m | C2a | CORE-004–005, 007, 011–013 |
| C3a — State, save, and recovery concepts | data_generation | C2b | Teach versioned saves/settings, migration, validation, reset, and honest residual limitations | Module 3 lesson + quiz | Valid/old/missing/partial/corrupt outcomes distinguished | 25m | C2b | CORE-006 |
| C3b — Save/recovery adversarial mission | debugging | C3a | Add synthetic fixture matrix, false-fix mutation, migration/reset mission, and evidence binding | Save lab, fixtures, grader/tests | No silent loss; fixture identity/result/limitation bound; symptom-only fix fails | 30m | C3a | CORE-006, 011–013 |
| C4a — Game accessibility concepts | data_generation | C3b, A4 | Teach bounded controls/text/colour/audio/motion/pause/controller claims and testing limits | Module 4 lesson + quiz | Scenarios test behaviour and trade-offs, not checklist recall | 25m | C3b | CORE-007–008 |
| C4b — Accessible interaction mission | code_generation | C4a, B5 | Implement/test required keyboard menu, settings, non-colour, volume, pause, reduced-motion path and claimed controller path | Game accessibility lab/evidence | Executable checks pass; deleting required path trips non-compensable gate | 30m | C4a | CORE-007–008, 029 |
| C5a — Asset/provenance concepts | data_generation | B4, C4b | Teach original/CC0 selection, exact licences, attribution, import/readability/runtime budgets, non-affiliation | Module 5 lesson + quiz | “Free”, marketplace screenshot, copied franchise, and generated-look claims are rejected | 25m | C4b | CORE-009–010 |
| C5b — Content integration mission | code_generation | C5a | Integrate tiny original/CC0 assets and bind ledger/import/package/runtime evidence | Asset lab, ledger, grader/tests | File↔ledger digests match; missing/incompatible provenance blocks release | 30m | C5a | CORE-009–010, 024–025 |
| C6a — Debug/test/agent-accountability concepts | data_generation | C5b, B8 | Teach reproduce-hypothesise-observe-root-cause-fix-regress, layered tests, agent constraints/review/provenance/ownership | Module 6 lesson + quiz | Learner must explain/predict/reject/revise, not recite prompts | 25m | C5b | CORE-011–013, 022–023 |
| C6b — Agent-assisted bug hunt | debugging | C6a | Add handwritten/generated defects, false fix, changed-data mutations, API/tool contract check, and agent evidence packet | Bug-hunt mission, grader, tests | Failing-then-passing regression; changed requirement; unsafe dependency/secret/allocation/resemblance flags; provider absent | 30m | C6a | CORE-011–013, 022–023 |
| C7a — Profiling concepts | data_generation | C6b, A3 | Teach target-player capture, budgets, profiler overhead, comparable workloads, dominant bottleneck, and justified no-change | Module 7 lesson + quiz | Editor-only/deep-profile/no-context claims fail reasoning check | 25m | C6b | CORE-014–015 |
| C7b — Measured optimisation mission | debugging | C7a | Add reproducible target capture, one bounded optimisation/no-change path, comparison and behaviour regression | Profile lab, manifest-bound captures, grader | Same target/settings/workload; before/after quantified; unauthenticated capture fails | 30m | C7a | CORE-014–015, 024–025 |
| C8a — Browser-game concepts | data_generation | A2, C7b | Teach game loop, delta time, visibility/focus, resize/high-DPI, input/audio activation, storage/cache/worker/network failure, measurement | Module 8 lesson + quiz | Two-engine and offline/error trade-offs assessed | 25m | C7b | CORE-016–017 |
| C8b — Genuine web mechanic lab | code_generation | C8a | Implement Signal Relay in TS/Canvas and add Chromium/Firefox, lifecycle, responsiveness, capability, and failure tests | Web source, mission, Playwright/Vitest evidence | Both engines pass; no video/screenshot substitute; console/runaway-delta/main-thread/lost-progress faults fail | 30m | C8a | CORE-016–017, 024–025 |
| C9a — Unity web-port concepts | data_generation | C8b | Teach sandbox/API/persistence/input/aspect/memory/download/startup/package constraints and evidence-backed no-go | Module 9 lesson + quiz | Build success is distinguished from playable port success | 25m | C8b | CORE-018–019 |
| C9b — Unity browser port lab | debugging | C9a, A2–A3 | Build/smoke the Unity web target against the same core-loop contract and source revision | Port matrix, build transcript, smoke evidence | Input/layout/persistence/API/package/startup checks; unsupported/no-go path is honest and bound | 30m | C9a | CORE-018–019, 024–025 |
| C10a — Engine-transfer concepts | data_generation | C9b | Teach engine-neutral contracts and Unity↔Godot lifecycle/input/physics/resource/test/package differences | Module 10 lesson + quiz | Visual/syntax similarity cannot satisfy behaviour parity | 25m | C9b | CORE-020–021 |
| C10b — Godot Signal Relay lab | code_generation | C10a, A2 | Implement only Signal Relay in pinned Godot and run shared parity/negative fixtures | Godot source, parity runner, transfer memo | State/output/timing/reset/duplicate cases match tolerances; engine-shaped assumptions named | 30m | C10a | CORE-020–021, 024–025 |
| C11a — Release/handoff concepts | data_generation | C10b, B8 | Teach dev/release separation, traceable go/conditional/no-go, known issues, recovery, maintainership, hard gates | Module 11 lesson + quiz | Release decision cites evidence; aggregate score cannot mask hard-gate failure | 25m | C10b | CORE-026–028 |
| C11b — Capstone release board and handoff mission | instruction_following | C11a; all core deposits | Assemble release candidate/evidence index; independent maintainer builds/launches/tests/reproduces/changes/reports; learner repairs one gap | Core capstone, release board, handoff record | Exact revision; all evidence digests; no diagnostics in release; maintainer task succeeds or badge remains withheld | 30m | C11a | CORE-024–028 |

### Gate D — Separately Optional Solana Module

Gate D is dispatched only after core architecture foundations exist. Its content, routes, progress, evidence, and badge stay in the optional course identity. A learner may skip all of Gate D and still complete the mainstream badge.

| Phase | task_type | Inputs | Task | Output | Verify | Est. | Depends on | Scenarios |
|---|---|---|---|---|---|---:|---|---|
| D0a — Enrolment and fit concepts | data_generation | B1, core architecture | Teach separate prerequisites/result, conventional/client/chain boundaries, beneficiaries/risk bearers, permanence/publicity/latency/fees/usability/moderation | Optional Module 0 lesson + quiz | No optional mark mutates core; defensible fit and no-fit answers can pass | 25m | C1b | CORE-030; SOL-001–002 |
| D0b — Fit/no-fit ADR mission | schema_generation | D0a, B8 | Add synthetic entitlement architecture decision with explicit datum/action classifications and alternatives | ADR mission, grader, template | Complete trade-offs pass; slogan/token-first or unreasoned chain use fails | 25m | D0a | SOL-002 |
| D1a — Adapter, custody, authority concepts | data_generation | A5, D0b | Teach offline adapter seam, connection vs permission, player/managed/custodial comparison, key holder/recovery/revocation/scope/expiry/rate/loss | Optional Module 1 lesson + quiz | Least privilege and player communication assessed; no auto-approval advice | 25m | D0b | SOL-003–004 |
| D1b — Synthetic localnet adapter mission | code_generation | D1a, A5 | Implement in-memory + localnet entitlement adapters, synthetic identities/assets, explicit signing, authority negatives, reset | Localnet lab, mission, tests | Local tests first; wrong signer/account/mint/recipient/authority/program/PDA fails before effect; core offline works | 30m | D1a | SOL-003–004 |
| D2a — Transaction/retry concepts | data_generation | D1b | Teach atomic effects vs fees, blockhash expiry, commitment, pending/failed/expired UI, operation ID vs signature, reconcile-before-replace | Optional Module 2 lesson + quiz | Retry and reconciliation choices are assessed under ambiguous outcomes | 25m | D1b | SOL-005 |
| D2b — Devnet retry/idempotency mission | debugging | D2a | Run synthetic devnet check after local pass; inject reject/drop/expiry/late-confirm/duplicate callback and prove at-most-once effect | Devnet lab, reconciliation record, tests | Durable operation ID; original terminal result returned; devnet outage blocks only optional evidence | 30m | D2a | SOL-003, 005 |
| D3a — Abuse/failure/go-no-go concepts | data_generation | D2b | Teach forged score/replay/rate/clock/metadata/mint/simulation drift, authority compromise, player/economic/usability/ops harm | Optional Module 3 lesson + quiz | Ship/redesign/reject reasoning and residual ownership assessed | 25m | D2b | SOL-006–007 |
| D3b — Threat suite and optional release board | debugging | D3a | Execute abuse/distributed-failure suite and evidence-backed go/no-go; enforce optional non-compensable gates | Threat report, mission, badge verdict | All specified failures covered; missing authority/idempotency/custody/localnet-devnet/go-no-go evidence withholds only optional badge | 30m | D3a | SOL-004–007 |

### Gate E — Integration, Validation, and Independent Exact-Head Review

| Phase | task_type | Inputs | Task | Output | Verify | Est. | Depends on | Scenarios |
|---|---|---|---|---|---|---:|---|---|
| E1 — Core hard-gate integration | schema_repair | C0–C11 | Aggregate core result from evidence, never from browser score; wire named remediation for each non-compensable gate | Core verdict engine/tests | Each hard-gate mutation withholds core despite passing numeric score | 30m | C11b | CORE-008, 010, 015, 019, 023–028 |
| E2 — Optional separation integration | schema_repair | D0–D3, E1 | Prove distinct enrolment/progress/evidence/verdict/badge namespaces and chain-disabled core | Separation test report | Skip/fail/pass optional module leaves core verdict byte-identical; core failure cannot be hidden by optional result | 25m | D3b, E1 | CORE-030; SOL-001, 003, 007 |
| E3 — Clean-room reduced/offline rehearsal | debugging | B7, E1–E2 | From clean temp path and no provider/network credential, unpack/reset/run/resume core on reduced profile; separately demonstrate chain-disabled startup | Rehearsal manifest/transcript | Canonical core commands pass twice; missing optional tool/network is non-blocking; no untracked leak | 30m | E1–E2 | CORE-002, 017, 024–025; SOL-003 |
| E4 — Inventory, route, and accessibility automation | instruction_following | All content; B5 | Validate counts/order/prerequisites/scenario coverage/routes/downloads/labels/keyboard/prose/media alternatives | Inventory/accessibility report | 37/37 mapped; no broken refs; core/optional routes distinct; automated accessibility checks pass | 25m | E3 | CORE-001, 029–030; SOL-001 |
| E5 — Source, originality, and provenance gate | bug_detection | B4; all authored assets/content | Check ledger/file binding, notices, source links/access dates, phrase/asset originality, trademark/non-affiliation/no-certification, synthetic-only data | Provenance/originality report | No missing/incompatible/unbound asset; no copied commercial identity; required notice present | 25m | E4 | CORE-009–010, 022–025; SOL-003 |
| E6a — Course and repository tests | debugging | E4–E5 | Run course-scoped tests, then full non-integration and integration suites with timeouts | Test transcript | All pass with exact command, exit, duration, head/tree; no provider on canonical routes | 30m | E5 | CORE-001–030; SOL-001–007 |
| E6b — Type/build/inventory/smoke | debugging | E6a | Run type-check, production build, inventory, route/API/download/browser smokes, package determinism and engine fixture checks | Build/smoke transcript | All pass; generated cache churn removed; build count and HTTP expectations recorded | 30m | E6a | CORE-001–030; SOL-001–007 |
| E6c — Dependency/secret/diff boundary | bug_detection | E6b | Run frozen install evidence, production audit-high, dependency delta review, `git diff --check`, high-confidence added-line credential/key scan, path/link scans | Boundary report | 0 Critical/High production advisories introduced; no undeclared dependency/key/secret/cache/build/evidence file | 25m | E6b | CORE-009–010, 022–025; SOL-003–006 |
| E7 — Sara exact-head content/accessibility gate | bug_detection | E6c exact SHA/tree | Independently review accuracy, progression, changed-data transfer, source quality, originality/provenance, Academy/game accessibility, low-spec clarity, core/Solana separation, and portfolio usefulness | Sara review report | Same SHA/tree; 0 unresolved Critical/High; all hard-gate learner paths constructible before reveal | 30m | E6c | CORE-001–030; SOL-001–002, 007 |
| E8 — Oli exact-head technical/security gate | bug_detection | Same E6c SHA/tree | Independently attack schemas, manifests, paths, tamper/replay, graders/provider boundary, builds/profiles, authority/retry/idempotency, secrets/dependencies, and separation | Oli review report | Same SHA/tree; 0 unresolved Critical/High; adversarial mutations fail closed | 30m | E6c | CORE-002, 004–028, 030; SOL-001–007 |
| E9 — Finding remediation slices | bug_repair | E7/E8 findings | Fix one finding or tightly coupled root cause per dispatch; run smallest affected tests and invalidate stale review approvals | Remediation commit/evidence | Finding acceptance criteria pass; changed head recorded; affected Sara/Oli gate rerun | ≤30m each | E7–E8 | IDs named by each finding |
| E10 — Final unchanged-head handoff | instruction_following | Passed E7/E8 on same final head | Recheck local/upstream/PR head and tree, worktree cleanliness, evidence links, issue linkage, residual risks, and stop boundary | Review-ready handoff note | Exact heads match; PR remains draft; no merge/deploy/publish action or instruction | 20m | E7–E9 | CORE-001–030; SOL-001–007 |

## Test, Build, Smoke, Secret, and Dependency Gates

Use repository-supported commands discovered in A1; expected baseline commands include:

```text
corepack pnpm install --frozen-lockfile
corepack pnpm test
corepack pnpm test:integration
corepack pnpm type-check
corepack pnpm build
corepack pnpm content:inventory
corepack pnpm audit --prod --audit-level high
git diff --check
```

Issue #122 adds course-scoped commands for coverage, manifest verification, deterministic companion packaging, reduced/offline health/reset/resume, browser unit/E2E, Unity Edit/Play Mode fixture results, Godot headless parity, and optional Solana localnet/devnet/fault suites. Every command records exact version, argv, relative working directory, exit code, timeout, source head/tree, and output digest.

Required smokes:

- Academy catalog, core course/module/lesson/interactive/progress routes, optional course equivalents, downloads, and malformed/valid judge API requests.
- Provider-disabled canonical AGD judging with construction/invocation counters remaining zero.
- Chromium and Firefox lifecycle/input/resize/high-DPI/audio/storage/offline/error/console/responsiveness checks.
- Unity desktop and browser core-loop startup/input/save/failure/package checks on the exact tested target.
- Godot Signal Relay parity/reset/duplicate-event checks.
- Core startup with Solana absent/unavailable; optional localnet first, devnet second; wrong cluster/authority/retry/duplicate/timeout/reset negatives.

Security/boundary scans cover added-line credentials, private keys/keypair arrays, RPC secrets, tokens, production URLs/identities, dependency and lockfile drift, absolute/traversal paths, symlinks/hardlinks, engine caches, package stores, generated builds, test ledgers, learner evidence, and unlicensed files. Scans must report file/line or artefact identity without printing secret values.

## Non-Compensable Gates

The mainstream badge is withheld if any of the following fails, regardless of aggregate score:

1. clean documented setup/build and launchable core loop;
2. critical save/progression/release negative and recovery evidence;
3. comparable target-context performance evidence;
4. compatible, manifest-bound asset provenance;
5. learner explanation/debug/test/revision ownership of agent-assisted work;
6. required game and Academy accessibility path;
7. manifest authenticity/re-execution checks; or
8. independent maintenance handoff.

The optional badge is independently withheld for missing fit/no-fit reasoning, custody/authority explanation and negatives, localnet-before-devnet synthetic boundary, offline-core proof, retry/reconciliation/idempotency evidence, abuse/failure testing, or evidence-backed go/no-go. Its failure never lowers the core result.

## Branch and Pull-Request Strategy

1. Use only `/Users/loki/redditech-academy-game-dev-122` on `feat/122-agentic-game-development`; never commit directly to `main`.
2. Before implementation, fetch `origin/main`, record its exact SHA/tree, inspect overlapping open PRs, and either fast-forward the untouched branch or stop for a deliberate integration decision. Preserve reviewed dependency/security changes.
3. Keep commits slice-bounded: Gate A locks, shared foundations, each module pair, optional-module group, integration, and one finding/root cause per remediation. Do not mix unrelated cleanup.
4. Open one focused **draft** PR linked to #122 only after Gate A locks and the first coherent scaffold validate. The PR description lists scenario coverage, companion boundary, exact commands/evidence, dependency delta, risks, and no-merge/no-deploy/no-publication stop.
5. Sara and Oli review exact commit SHA and tree. A force-push, rebase, merge from main, or remediation invalidates prior exact-head approval until the affected review is rerun.
6. Final handoff may mark the PR review-ready only if Nissan separately authorises that state. This plan never authorises merge, deployment, publication, release asset upload, paid CI, or public course availability.

## Handoff Contracts

| Handoff | Kit delivers | Next owner requires |
|---|---|---|
| Gate A → B | Exact base/tree, collision inventory, locked tool/browser/client versions and checksums, budgets, accessibility matrix, red 37-ID skeleton | No unresolved feasibility blocker and no floating mandatory tool |
| Gate B → C | Separated course identities, source-only companion, strict manifest/verifier, provenance and accessible/deterministic mission foundations, offline bootstrap | Passing adversarial foundation tests and provider-free AGD dispatch |
| Each `a` → matching `b` | Original lesson, sources, scenario/trade-off quiz, named lab contract | Content/schema pass and no answer leakage |
| Each `b` → next module | Executable lab/mission, strict grader, tests, manifest-bound deposit, exact scenario IDs | Smallest affected suite passes; source/fixture identities recorded |
| Core C → D/E | Complete core capstone/release/handoff and hard-gate inputs | Core is independently testable with optional directory absent |
| D → E | Separate optional course, synthetic localnet/devnet lab, threat/retry/go-no-go evidence | No mainnet/real-fund/key leak; core verdict remains unchanged |
| E6 → Sara/Oli | Clean exact SHA/tree, command transcript, manifests, inventory, diff/dependency/secret reports | Both reviewers receive identical immutable head and acceptance matrix |
| QA → Loki/Nissan | Exact-head reports, residual risks, clean worktree, draft PR and evidence links | Human decision only; no implied merge/deploy/publication authority |

## Deferred (Out of Scope for This Build)

- Merge to `main`, production deployment, public publication, marketing launch, release-asset upload, or manual preview promotion.
- Plane issue creation or mutation unless separately requested by Loki/Nissan.
- Mainnet, real tokens/funds/assets, token sales, financial promotion, production wallets/keys, custody service, legal/tax/investment advice, or personal/customer data.
- Mandatory paid AI, paid CI, cloud GPU, commercial asset, hosted RPC, analytics, multiplayer/live-ops/backend, console SDK/certification, AR/VR, Unreal, or full second-engine capstone.
- Blanket WCAG/platform/vendor-certification claims, formal accreditation, job-placement promises, or vendor/studio endorsement.
- Committing engine caches, generated builds, package stores, validator ledgers, private keys, learner evidence, or large offline runtimes.

## Firefly Self-Check

- [x] Nissan approved the 37-scenario contract before this plan.
- [x] All 37 stable IDs map to named phases and evidence.
- [x] Every Kit slice is bounded to 30 active minutes and has inputs, one output, verification, dependencies, and `task_type`.
- [x] All six Phase 0a planning constraints are resolved or converted into explicit bounded Gate A acceptance tasks.
- [x] Unity/C#, genuine web, Unity web port, Godot transfer, evidence authenticity, low-spec/offline, accessibility, provenance, agent accountability, release, and handoff are preserved.
- [x] Optional Solana remains separately enrolled, assessed, badged, synthetic, localnet/devnet-only, offline-core-safe, and non-compensating.
- [x] Sara and Oli exact-head gates, branch/PR strategy, tests/build/smokes, secret/dependency checks, and stop conditions are explicit.
- [x] No implementation, GitHub/Plane mutation, dependency installation, commit, PR, merge, deployment, publication, spending, or paid call was performed to produce this plan.
