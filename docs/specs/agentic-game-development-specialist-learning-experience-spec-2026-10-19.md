# Agentic Game Development Specialist — Learning Experience Specification

**Issue:** #122
**Date:** 2026-10-19
**Status:** Final learning-design input for Phase 0b planning
**Authority:** Reconciled against the 42-source market and competency brief and the 37-scenario learning contract
**Scope:** Planning artifact only; no course implementation, publication, deployment, dependency, repository, GitHub, or Plane change

## 1. Course promise and boundaries

Learners take an imperfect original game prototype through the work that separates a demo from a defensible portfolio release: bounded architecture, maintainable Unity/C# gameplay, controls and user interface, accessible interaction, original or compatible CC0 asset integration, systematic debugging, layered tests, target-context profiling, browser delivery, Unity web porting, engine transfer, evidence-led release, and independent maintenance handoff.

Unity and C# are the primary production spine. A genuine browser mechanic, a Unity browser port, and a bounded Godot transfer prove that the learner understands game-system contracts rather than one editor. Coding assistants and agents are permitted, but the learner remains accountable for every accepted change, dependency, behaviour, test, licence, security implication, and release claim.

The mainstream course awards a **Redditech Academy Agentic Game Development Specialist core badge** for portfolio evidence. It is not Unity, Godot, Solana, employer, or industry certification, and it implies no vendor affiliation or endorsement.

The optional Solana blockchain-gaming pathway is separately enrolled, taught, assessed, recorded, and badged. It cannot raise, lower, unlock, or block the mainstream result.

### Non-negotiable operating boundaries

- Deterministic local assessment must work without a paid AI provider, paid asset, cloud account, production credential, or live customer data.
- All accounts, identities, service responses, wallets, assets, balances, and business values are synthetic.
- Required assets are original or redistribution-compatible CC0 assets with preserved provenance.
- Solana assessment stops at localnet and devnet. No mainnet transaction, real funds, token sale, production wallet, custody service, or financial-return claim is permitted.
- Screenshots, filenames, editor state, browser storage, learner-authored pass claims, and pre-authored expected rows are never sole proof of an executable outcome.

**Contract mapping:** AGD-CORE-001, AGD-CORE-024, AGD-CORE-025, AGD-CORE-030; AGD-SOL-001, AGD-SOL-003.

## 2. Audience, entry, and bridge

### Primary audience

- Early-career software or game developers who can write small programs and want production-oriented portfolio evidence.
- Web or generalist developers moving into game development.
- Self-taught Unity users who can prototype but need stronger architecture, debugging, testing, profiling, release, and handoff practice.
- Developers learning assisted-development workflows while retaining code-quality accountability.

Current role evidence supports a production-minded generalist profile: end-to-end feature ownership; readable code; debugging and tests; performance measurement; platform and engine adaptation; collaboration with design, art, quality assurance, and production; technical communication; and independent delivery.

### Required entry skills

- Basic programming: variables, control flow, functions, collections, and simple object-oriented concepts.
- Basic Git: clone, branch, commit, inspect a diff, and recover a local change.
- Ability to install desktop software, use a command line, and read a failing test or error.
- No professional game credit, art expertise, blockchain knowledge, paid AI access, cloud account, or extended-reality experience is required.

### Ungraded bridge

An ungraded bridge introduces the pinned C# profile, Unity editor navigation, source-control hygiene, command execution, and the evidence-packet format. A diagnostic first playable may let experienced learners skip bridge instruction, but never assessed evidence.

**Contract mapping:** AGD-CORE-001, AGD-CORE-002.

## 3. Whole-game narrative: Project Signal Run

The learner joins a fictional small studio preparing **Project Signal Run**, an original compact top-down action-delivery game, for a public showcase. The inherited vertical slice has one rough loop and credible production faults: mixed input and simulation concerns, frame-rate-dependent movement, duplicate lifecycle effects, unreadable feedback, brittle save state, incomplete menus, unlicensed placeholders, weak tests, hidden performance costs, and no trustworthy release procedure.

Each module introduces a **studio signal**: a producer brief, playtest observation, defect report, accessibility finding, profiler capture, platform constraint, asset concern, failed build, or maintainer question. The learner must reproduce or interpret the signal, make a bounded decision, implement or revise one slice, test failure paths, and deposit evidence for the next contributor. New signals can invalidate earlier assumptions, so architecture decision records are revised rather than erased.

The story ends with a release board and an independent maintainer handoff. The browser, Unity web-port, and Godot labs branch from the same mechanic contract; they are not disconnected mini-courses. The optional Solana add-on uses a synthetic entitlement boundary around the same fictional product while preserving an offline core loop.

Project Signal Run must not imitate a commercial game's characters, levels, visual identity, audio, narrative, or distinctive mechanics.

**Contract mapping:** AGD-CORE-003–006, AGD-CORE-011–021, AGD-CORE-026–027; AGD-SOL-002–007.

## 4. Mainstream learning arc

The delivery design uses twelve bounded stages. Phase 0b may group stages into a different number of Academy modules, but it may not remove or weaken mapped outcomes.

| Stage | Studio signal and learner outcome | Portfolio deposit | Scenario IDs |
|---|---|---|---|
| 0. First playable and baseline | Launch the inherited build, reproduce defects, map controls and the core loop, and prove setup/reset/resume on canonical and reduced paths. | Health record, defect baseline, controls map, declared working state. | AGD-CORE-001, 002, 024 |
| 1. Bounded architecture | Separate input, simulation, presentation, configuration, and service concerns; record acceptance criteria, non-goals, ownership, interfaces, risks, and alternatives. | Architecture sketch, decision record, refactor diff. | AGD-CORE-003 |
| 2. Player control and game feel | Implement input, movement, collision, timing, camera, and feedback against a behaviour contract. | Source/build binding, logic and Play Mode tests, tuning record. | AGD-CORE-004, 005 |
| 3. Core loop, state, and recovery | Implement objectives, scoring, hazards, deterministic state, and safe handling of missing, old, partial, and corrupt saves/settings. | State model, fixture matrix, negative/recovery evidence. | AGD-CORE-004–006, 013 |
| 4. UI and accessible play | Deliver menus, pause, settings, readable text, non-colour feedback, volume controls, reduced motion, keyboard navigation, and claimed controller support. | Executable accessibility checks and input-path evidence. | AGD-CORE-007, 008 |
| 5. Asset and audio integration | Replace placeholders with original or compatible CC0 content and test import, readability, package size, and runtime cost. | Asset ledger, preserved licence evidence, import settings, budget checks. | AGD-CORE-009, 010 |
| 6. Debugging, testing, and agent ownership | Reproduce and diagnose handwritten or assisted defects, reject false fixes, test at the correct layers, and defend every material assisted change. | Hypothesis log, debugger/runtime record, failing-then-passing regression, verification matrix, agent packet. | AGD-CORE-011–013, 022, 023 |
| 7. Performance and maintainability | Profile a representative player build, identify the dominant bottleneck, make or reject a bounded change, and compare equivalent captures. | Budget, baseline/after captures, decision, behaviour regression, residual risk. | AGD-CORE-014, 015 |
| 8. Genuine web-game mechanic | Rebuild one bounded mechanic in a browser-native stack and test two current browser engines, lifecycle, input, layout, audio, capability, offline/error, and responsiveness behaviour. | Browser build, cross-browser matrix, console/performance evidence, error-path proof. | AGD-CORE-016, 017 |
| 9. Unity web port | Port the Unity slice deliberately, addressing sandbox, input, resolution, persistence, memory/download budget, API availability, packaging, startup messaging, and limitations. | Port matrix, build transcript, source-bound artefact, smoke tests, evidence-backed no-go where needed. | AGD-CORE-018, 019 |
| 10. Godot engine transfer | Rebuild one engine-neutral mechanic in Godot; isolate or disclose Unity-shaped assumptions and compare lifecycle, input, physics, resources, testing, and packaging. | Behaviour contract, parity and negative checks, transfer memo. | AGD-CORE-020, 021 |
| 11. Release, portfolio, and handoff | Assemble authenticated evidence, decide go/conditional-go/no-go, package the release, and support an independent maintainer task. | Release packet, known issues, recovery notes, decision trace, maintainer report, corrected handoff gap. | AGD-CORE-024–028 |

The web-game lab is not satisfied by a video or screenshot. The Unity port is not satisfied by a successful build command. The Godot transfer assesses behavioural parity and adaptation, not full-capstone reproduction.

## 5. Mission rhythm and feedback contract

Every assessed core stage follows one reusable studio rhythm:

1. **Signal** — receive a bounded production need or failure.
2. **Reproduce** — observe it and state a falsifiable acceptance or defect condition.
3. **Decide** — record constraints, assumptions, alternatives, choice, and risk.
4. **Build** — implement or revise one bounded slice.
5. **Break it** — exercise edge, negative, accessibility, performance, platform, and recovery paths relevant to the slice.
6. **Review** — inspect the diff, explain control flow and ownership, and account for assistance.
7. **Deposit** — bind code, tests, logs, profiles, licences, decisions, and builds to the evidence manifest.

A normal stage pairs a concise concept lesson, guided interaction, executable companion lab, adversarial or recovery mission, scenario/trade-off check, and portfolio deposit.

### Mission families

- **Behaviour contract:** implement explicit input/state/output/timing/tolerance rules.
- **Bug hunt:** reproduce, localise, explain, correct, and prevent regression.
- **Adversarial playtest:** vary frame rate, lifecycle, input, resize, capability, save data, asset availability, and state order.
- **Verification matrix:** choose logic, Play Mode, target-context, platform, service-contract, manual, negative, and recovery coverage.
- **Profiler decision:** make an evidence-backed optimisation or no-change decision.
- **Port clinic:** separate shared from platform-specific work, build, smoke-test, and disclose limitations.
- **Engine transfer:** carry an engine-neutral contract across the Unity/Godot boundary.
- **Code-review defence:** explain and safely revise a material assisted change without the assistant transcript.
- **Release board:** trace go, conditional-go, or no-go claims to authenticated evidence.

### Feedback rules

- Canonical pass/fail is deterministic and local where practical; optional model coaching cannot affect the authoritative verdict.
- Starter material scaffolds format but contains neither completed outcomes nor passing evidence.
- Hints identify the weakest unmet dimension, inspection point, and relevant source without supplying finished code or exact answers.
- A plausible symptom-hiding fix must fail changed-data or mutation checks.
- Any worked example revealed after repeated attempts is followed by a changed-data transfer task.
- Ordering missions require named keyboard move controls or an equivalent non-drag path.

**Contract mapping:** AGD-CORE-003–006, AGD-CORE-011–023, AGD-CORE-026, AGD-CORE-029.

## 6. Companion bundle and authenticated evidence

The Academy lesson/module/quiz/interactive layer carries instruction, bounded structured decisions, hints, and result summaries. A separate **versioned downloadable companion source bundle** is the source of truth for executable Unity, C#, browser, Godot, Git, test, profile, build, accessibility, asset, and handoff evidence. Engine caches and large generated builds do not enter the Academy content tree.

The bundle must provide documented setup, health, reset, resume, and evidence-export commands. Its evidence manifest binds:

- bundle/contract version and repository revision;
- clean state or explicitly declared working-state digest;
- fixture identifiers, exact paths, and content digests;
- Unity, C#, Godot, browser, SDK, package, and tool versions;
- literal commands and target context;
- timestamps and attempt identity;
- source and target-build identity;
- expected and observed result;
- every evidence-file digest; and
- the deterministic verdict derived from authenticated artefacts.

Verification fails closed when required fields or files are absent, stale, changed, replayed from another revision/fixture/platform/learner/build/attempt, path-swapped, or digest-invalid. Academy browser storage may preserve learning progress but is never evidence authority.

**Contract mapping:** AGD-CORE-002, AGD-CORE-004, AGD-CORE-013–019, AGD-CORE-024, AGD-CORE-025, AGD-CORE-027.

## 7. Accessibility and low-spec/offline equivalence

### Academy delivery

- Required missions are operable by keyboard and documented alternatives; no task depends on pointer-only drag or timed interaction.
- Controls have explicit accessible names, linked instructions, visible focus, and status that is not colour-only.
- Diagrams include prose; video includes captions/transcripts; audio has visual or text equivalents.
- Reduced-motion preferences are respected and no flashing content is required.
- Commands are copyable and include expected success and failure output.
- Long labs preserve resumable evidence.
- Acronyms and engine terms are expanded on first use.

### Learner-built game

The vertical slice must prove keyboard menu navigation, remappable controls where supported, readable text, non-colour feedback, volume control, pause behaviour, and reduced-motion or camera-shake control. Controller operation is tested whenever controller support is claimed. These are executable behaviours, not checklist claims.

### Reduced-resource and disconnected path

After one acquisition of the versioned bundle, a learner without a discrete GPU, paid assistant, or network connection can run a reduced-content path and deterministic checks locally. Reduced textures, scenes, captures, and representative fixtures may shorten downloads and build/profile cycles, but must preserve the same programming, debugging, testing, profiling-reasoning, accessibility, and evidence outcomes. Optional enhancements are named and cannot block completion. Setup, health, reset, resume, and recovery are documented for both canonical and reduced paths.

No conformance claim is made until the pinned implementation has independent accessibility testing against current standards and platform guidance.

**Contract mapping:** AGD-CORE-002, AGD-CORE-007, AGD-CORE-008, AGD-CORE-029.

## 8. Originality, asset provenance, and non-affiliation

1. Course narrative, explanations, diagrams, code examples, user-interface examples, sound cues, and teaching assets are original by default.
2. Required third-party project assets must be redistribution-compatible; CC0 is preferred. Paid assets cannot be required.
3. Every non-original item records description, creator where known, source URL, retrieval date, exact licence/version, local path, modifications, attribution, permitted use, and distribution note. Licence evidence and notices are preserved with the bundle.
4. “Free,” a marketplace screenshot, or public repository visibility is not a licence.
5. Commercial-game assets, copied levels, protected characters, substantial third-party tutorials, and unlicensed music/art/code are excluded.
6. Generated assets and code are treated as untrusted contributions. Learners record tool use, resemblance and provenance checks, rights concerns, secrets/security review, and final disposition. Imitation of a living artist, named studio, protected character, or franchise style is not requested.
7. Assessment scores integration, readability, runtime cost, provenance, and distribution readiness—not artistic polish or purchasing power.
8. Unity, Godot, Solana, employers, and product names are descriptive only. The course and badges use no vendor logo or certification claim without permission.

Required notice: “Redditech Academy is independent and is not affiliated with, endorsed by, sponsored by, or certified by Unity Technologies, Solana Foundation, PlaySide Studios, Ubisoft, Roblox, or any other referenced employer or tool vendor. All trademarks are the property of their respective owners.”

The course provides education, not jurisdiction-specific legal advice.

**Contract mapping:** AGD-CORE-009, AGD-CORE-010, AGD-CORE-022, AGD-CORE-023, AGD-CORE-026.

## 9. Agent-assisted development accountability

For each material assisted code, test, configuration, dependency, or asset change, the learner deposits an agent evidence packet containing:

- task, intent, constraints, and acceptance conditions;
- context supplied and sensitive context withheld;
- affected files and diff;
- assumptions, unfamiliar APIs, provenance/licence/security concerns;
- tests, debugger/runtime inspection, and profile checks before and after where relevant;
- accepted, rejected, and revised suggestions with rationale; and
- a learner-authored explanation and disclosure for the maintenance handoff.

The learner must independently **explain** control flow and state ownership, **predict** changed-input behaviour, **debug** the code, **test** a plausible defect, **review** complexity/dependencies/allocations/lifecycle/comments, and **revise** the change under a new requirement. Prompt volume, speed, a green build, or an assistant transcript earns no credit.

Core completion is withheld when the learner cannot explain, step through, test, and safely revise a material generated change or has not resolved resemblance, unsafe dependency, secret exposure, hidden allocation, or misleading-comment risk.

**Contract mapping:** AGD-CORE-011, AGD-CORE-012, AGD-CORE-022, AGD-CORE-023, AGD-CORE-028.

## 10. Assessment and portfolio evidence

### Evidence rules

- Every claim resolves to inspectable, manifest-bound artefacts: source diff, automated test, debugger record, build transcript, profile capture, configuration, asset ledger, playable build, or maintainer task.
- Evidence records tool/version, exact command or reproduction steps, expected and observed results, date, attempt, revision, fixture, platform, and build identity.
- Negative and recovery evidence is mandatory for saves, lifecycle, builds, network/capability paths, and material assisted changes.
- Equivalent target-context baseline and after captures are required for performance claims; a justified no-change decision can pass.
- Structured scenario/trade-off checks support the executable work but cannot compensate for a failed hard gate.

### Required core portfolio package

| Portfolio evidence | Scenario IDs |
|---|---|
| Bounded architecture brief, interfaces, non-goals, risks, alternatives, and decision records | AGD-CORE-003 |
| Source-bound playable Unity/C# loop with readable ownership and layered tests | AGD-CORE-004, 005, 013 |
| Save/configuration compatibility, corruption, reset, and residual-limit evidence | AGD-CORE-006 |
| Tested game and Academy accessibility paths | AGD-CORE-007, 008, 029 |
| Original/CC0 asset ledger, licence evidence, import and runtime/package checks | AGD-CORE-009, 010 |
| Reproducible diagnosis, root cause, correction, mutation/changed-data check, and regression | AGD-CORE-011, 012 |
| Representative performance budget, baseline/after captures, decision, and preserved behaviour | AGD-CORE-014, 015 |
| Genuine two-browser mechanic with capability, lifecycle, offline/error, console, and responsiveness evidence | AGD-CORE-016, 017 |
| Unity browser port matrix, source-bound build, smoke evidence, and known limits/no-go | AGD-CORE-018, 019 |
| Godot mechanic parity checks and transfer memo | AGD-CORE-020, 021 |
| Agent-use packets and learner ownership statement | AGD-CORE-022, 023 |
| Authenticated companion manifest and stale/forged/replay rejection evidence | AGD-CORE-024, 025 |
| Release board, playable package, known issues, recovery notes, and diagnostics separation | AGD-CORE-026 |
| Independent maintainer report and corrected handoff gap | AGD-CORE-027 |

### Independent handoff

A peer or assessor receives only the repository, release, and maintenance handoff. They must build or launch it from the documented clean setup, run canonical tests, reproduce one seeded failure, make one bounded configuration or behaviour change, and return a revision-bound maintainability report. The learner corrects one discovered handoff gap.

### Core non-compensable gates

The core badge is withheld if any required clean build, launchable core loop, critical save/release test, reproducible profile, compatible asset provenance, agent ownership demonstration, accessible path, or independent maintenance handoff fails. Each failure names the gate and required remediation evidence. Numeric weighting cannot override these gates.

**Contract mapping:** AGD-CORE-024–030.

## 11. Optional Solana blockchain-gaming specialist badge

The optional pathway appears as a separate enrolment, not a compulsory final core module. It has its own prerequisites, estimate, missions, evidence packet, completion record, hard gates, and badge. Learners may enter after completing or independently satisfying the mainstream architecture prerequisites. Its result has no effect on the core result.

### Optional arc

| Stage | Outcome and evidence | Scenario IDs |
|---|---|---|
| 1. Separate enrolment | Confirm prerequisites, scope, effort, synthetic-only data, localnet/devnet boundary, and independent badge. | AGD-SOL-001 |
| 2. Fit/no-fit decision | Compare client storage, conventional service, and Solana; classify every datum/action on-chain or off-chain; identify beneficiaries, risk bearers, visibility, permanence, latency, fees, usability, moderation, and operations. A well-evidenced no-fit can pass this gate. | AGD-SOL-002 |
| 3. Narrow adapter | Put one synthetic entitlement/collectible boundary behind an interface; pass deterministic local tests before a bounded devnet check; keep the mainstream loop fully operable offline. | AGD-SOL-003 |
| 4. Custody and authority | Model player-controlled, embedded/managed, and custodial patterns; record key holder, consent, instruction/program scope, expiry, rate limit, recovery, revocation, fees, loss impact, and communication; reject wrong authority inputs before effects. | AGD-SOL-004 |
| 5. Retry and idempotency | Use a durable domain operation identifier distinct from transaction signature; reconcile before replacement; return the original terminal result; prove at-most-once grant/charge semantics. | AGD-SOL-005 |
| 6. Abuse and distributed failure | Test forged scores, replay, client-clock manipulation, rate abuse, metadata/mint substitution, simulation/execution drift, signature rejection, insufficient balance, wrong cluster, RPC timeout, expired blockhash, program error, authority compromise, and reset. | AGD-SOL-006 |
| 7. Go/no-go board | Recommend ship, redesign, or reject from fit, custody, authority, retry, idempotency, abuse, player-harm, economic, usability, operational, and offline-core evidence; name residual risks, owners, mitigations, and reconsideration conditions. | AGD-SOL-007 |

The optional badge is withheld if authority negatives, retry/idempotency proof, custody explanation, synthetic localnet/devnet boundaries, or evidence-backed go/no-go reasoning is missing. No mainnet transaction, real funds, production wallet, token sale, custody of learner/customer funds, or financial promotion is permitted.

**Core-separation mapping:** AGD-CORE-030; AGD-SOL-001–007.

## 12. Scenario traceability summary

| Design element | Contract coverage |
|---|---|
| Course entry and production-generalist promise | AGD-CORE-001 |
| Low-spec, disconnected, reset, and resume path | AGD-CORE-002 |
| Architecture and Unity/C# production | AGD-CORE-003–006 |
| Playable accessibility and hard gate | AGD-CORE-007–008 |
| Asset provenance and release block | AGD-CORE-009–010 |
| Debugging, false-fix rejection, and layered testing | AGD-CORE-011–013 |
| Target-context profiling and authenticated claims | AGD-CORE-014–015 |
| Genuine browser mechanic and offline/capability failure | AGD-CORE-016–017 |
| Unity browser port and build-success rejection | AGD-CORE-018–019 |
| Godot transfer and engine-assumption exposure | AGD-CORE-020–021 |
| Agent accountability and hard gate | AGD-CORE-022–023 |
| Companion manifest and fail-closed evidence | AGD-CORE-024–025 |
| Release board, handoff, and aggregate-score override | AGD-CORE-026–028 |
| Academy mission accessibility | AGD-CORE-029 |
| Core badge independence | AGD-CORE-030 |
| Separate Solana enrolment and badge | AGD-SOL-001 |
| Solana fit, adapter, authority, retry, abuse, and decision | AGD-SOL-002–007 |

## 13. Phase 0b blockers and required decisions

These are implementation-planning blockers, not open learning-outcome questions:

1. Pin a supported Unity long-term-support release, C# profile, Godot release, transfer mechanic, operating systems, and canonical/reduced hardware envelope after repository and continuous-integration feasibility checks.
2. Select the standalone browser-lab stack and exact two-browser matrix while preserving AGD-CORE-016 and AGD-CORE-017.
3. Specify the companion bundle's cryptographic manifest/import contract, path confinement, reset model, artefact retention, and Academy summary interface without trusting browser state or storing engine caches.
4. Establish reproducible local/CI build targets, package/download budgets, representative profiling devices, and quantified low-spec thresholds without paid infrastructure.
5. Map the fixed accessibility behaviours to current primary standards and platform guidance, then require independent accessibility testing before any conformance claim.
6. Pin maintained Solana local runner, SDK/client, optional devnet tooling, and teaching wallet pattern after technical/security review without relaxing synthetic-only, local-first, offline-core, authority, idempotency, abuse, no-paid-provider, or no-mainnet boundaries.

## 14. Definition of learning-design done

This specification is complete because:

- all 30 mainstream and 7 optional Solana scenarios are mapped;
- the learning arc, Project Signal Run narrative, mission rhythm, evidence deposits, accessibility, low-spec/offline equivalence, companion-bundle authority, provenance, and agent accountability are explicit;
- core and optional Solana enrolment, assessment, completion records, and badges are independent;
- deterministic no-paid-provider and Solana no-mainnet/no-real-funds boundaries are fixed;
- every hard gate names executable or authenticated evidence; and
- remaining unknowns are bounded Phase 0b technical decisions rather than unresolved learning-design claims.

No implementation, branch, commit, pull request, GitHub/Plane mutation, dependency change, publication, deployment, paid-provider call, or spend is authorised by this specification.
