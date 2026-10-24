Feature: Agentic Game Development Specialist learning contract
  As an early-career software or game developer
  I want to take an original game from fragile prototype to evidence-backed release
  So that I can demonstrate accountable, transferable game-production practice

  Background:
    Given "Project Signal Run" is a fictional original top-down action-delivery vertical slice
    And Unity and C# are the primary production spine
    And every account, identity, service response, wallet, asset, and business value is synthetic
    And required work uses original or redistribution-compatible CC0 assets with recorded provenance
    And deterministic local assessment works without a paid provider, paid asset, cloud account, or production credential
    And completion is Redditech Academy portfolio evidence rather than vendor certification or endorsement

  @AGD-CORE-001 @core @happy
  Scenario: Learner enters the mainstream production pathway
    Given the learner has basic programming, Git, command-line, and failing-test literacy
    When they open the Agentic Game Development Specialist core
    Then the course presents the Unity and C# vertical slice, web-game lab, Unity web-porting lab, Godot engine-transfer lab, capstone evidence, and expected effort
    And blockchain knowledge, professional game credits, art expertise, extended-reality experience, and paid AI access are not prerequisites

  @AGD-CORE-002 @core @edge @offline @low-spec
  Scenario: Learner can start and recover on a low-spec or disconnected path
    Given the learner has no discrete GPU, no paid assistant, and no network after obtaining the versioned course bundle
    When they follow the documented setup, health, reset, and resume procedures
    Then they can run the canonical reduced-content path and deterministic checks locally
    And reduced assets or captures preserve the same programming, debugging, testing, profiling-reasoning, and evidence outcomes
    And every unavailable optional enhancement is identified without blocking core completion

  @AGD-CORE-003 @core @happy @architecture
  Scenario: Learner converts a playable brief into bounded architecture
    Given the inherited prototype mixes input, simulation, presentation, configuration, and service concerns
    When the learner plans the vertical slice
    Then acceptance criteria, non-goals, state ownership, interfaces, platform assumptions, risks, and at least two alternatives are recorded
    And the selected design keeps gameplay logic reviewable outside unstructured scene state

  @AGD-CORE-004 @core @happy @unity @csharp
  Scenario: Learner implements maintainable Unity and C# gameplay
    Given a behaviour contract defines input, movement, collision, objective, scoring, and feedback
    When the learner implements the bounded feature in Unity and C#
    Then readable code, explicit ownership, configuration separation, failure behaviour, and the playable core loop satisfy the contract
    And automated logic and Play Mode checks bind the result to the submitted source and build identity

  @AGD-CORE-005 @core @bug-guard @unity @timing
  Scenario: Frame rate and lifecycle changes do not corrupt gameplay
    Given movement and cooldown code appears correct at the author's usual frame rate
    When tests vary frame rate, pause and resume, time scale, focus, and repeated scene lifecycle events
    Then simulation remains within the behaviour tolerances
    And duplicate subscriptions, multiplied effects, hidden allocations, and frame-dependent movement fail the assessment

  @AGD-CORE-006 @core @edge @state @recovery
  Scenario: Save and configuration failures recover safely
    Given the game has valid, old-version, missing, partial, and corrupt synthetic save or settings fixtures
    When the learner loads, migrates, resets, or rejects each fixture
    Then progression and settings follow the documented compatibility policy without silent data loss
    And recovery evidence names the fixture, expected result, observed result, and residual limitation

  @AGD-CORE-007 @core @happy @accessibility
  Scenario: The playable slice provides tested accessible interaction
    Given the game uses menus, gameplay input, text, motion, colour, and audio feedback
    When the learner tests the required accessibility path
    Then keyboard menu navigation, remappable controls where supported, readable text, non-colour feedback, volume control, pause behaviour, and reduced-motion or camera-shake control work as specified
    And controller operation is tested when controller support is claimed

  @AGD-CORE-008 @core @bug-guard @accessibility @non-compensable
  Scenario: Inaccessible required paths cannot be compensated by other marks
    Given a required menu, mission, or core-loop action is unusable by its documented keyboard or alternative input path
    When the learner requests core completion
    Then the completion gate fails even if the aggregate score would otherwise pass
    And a checklist or screenshot cannot substitute for an executable accessibility test

  @AGD-CORE-009 @core @happy @assets @provenance
  Scenario: Learner integrates original or compatible CC0 assets responsibly
    Given placeholders must be replaced without purchasing assets
    When the learner imports and configures visual and audio content
    Then each non-original item records description, creator when known, source URL, retrieval date, exact licence, local path, modifications, attribution, and distribution note
    And readability, import settings, package size, and runtime cost are tested

  @AGD-CORE-010 @core @bug-guard @assets @non-compensable
  Scenario: Missing or incompatible provenance blocks release
    Given an asset is merely labelled free, copied from a commercial game, unlicensed, or missing preserved licence evidence
    When the release board checks the asset ledger and packaged files
    Then the release and core completion fail until the asset is removed or compatible rights are evidenced
    And artistic polish, generated appearance, or a marketplace screenshot cannot compensate for the failure

  @AGD-CORE-011 @core @happy @debugging @evidence
  Scenario: Learner diagnoses a defect before changing code
    Given a reproducible defect exists in handwritten or agent-assisted code
    When the learner investigates it with a minimal case, logs, breakpoints, assertions, stack traces, or runtime inspection
    Then the evidence records reproduction, hypotheses, observations, root cause, bounded correction, failing-then-passing regression, and untested boundaries
    And the learner can explain the relevant control flow and state ownership without an assistant transcript

  @AGD-CORE-012 @core @bug-guard @debugging
  Scenario: A plausible but false fix is rejected
    Given a change hides the visible symptom without correcting the seeded timing, lifecycle, state, or error-path defect
    When changed-data and mutation cases exercise the underlying fault
    Then at least one canonical check still fails with a diagnostic inspection point
    And the learner must revise the explanation and regression rather than assert that a green build proves correctness

  @AGD-CORE-013 @core @happy @testing
  Scenario: Learner tests at appropriate layers
    Given the vertical slice contains deterministic logic, Unity integration, platform behaviour, and a bounded service contract
    When the learner executes the verification matrix
    Then it includes fast C# logic tests, at least one Play Mode integration test, a target-build or target-context run, negative and recovery cases, and a small tool or API contract check where applicable
    And remaining manual coverage and residual gaps are explicit

  @AGD-CORE-014 @core @happy @profiling
  Scenario: Learner makes a measured optimisation decision
    Given a representative player build and device profile have a stated frame-time, memory, rendering, loading, allocation, or responsiveness budget
    When the learner captures a baseline, identifies the dominant bottleneck, and makes one bounded change
    Then equivalent before and after captures quantify the effect and preserve gameplay behaviour
    And choosing no change can pass when the measurements show that optimisation is unjustified

  @AGD-CORE-015 @core @bug-guard @profiling @non-compensable
  Scenario: An unauthenticated performance claim is rejected
    Given an Editor-only screenshot, deep-profile capture without overhead disclosure, or learner-authored summary claims an improvement
    When no comparable target-context baseline and after capture can be reproduced
    Then the performance gate fails regardless of visual polish or aggregate score
    And feedback identifies the missing build, device, settings, workload, budget, or capture identity

  @AGD-CORE-016 @core @happy @web-game
  Scenario: Learner delivers a genuine assessed web-game mechanic
    Given a browser implementation has the same bounded mechanic contract as the reference feature
    When the learner runs it in current versions of two browser engines
    Then input, delta-time, resize and high-DPI layout, focus and visibility pause, audio-start restrictions, loading, console errors, and startup or frame responsiveness are verified
    And the implementation uses browser-native lifecycle and measurement evidence rather than merely embedding a video or exported screenshot

  @AGD-CORE-017 @core @edge @web-game @offline
  Scenario: The web mechanic degrades safely across capability and network failures
    Given alternate input, browser storage, cache, worker, audio, or network capability is absent or interrupted
    When the web lab exercises capability detection and its offline or error path
    Then the game preserves the local mechanic where feasible or presents an actionable bounded failure
    And main-thread blocking, lost progress, runaway delta-time, and unhandled console errors fail the relevant checks

  @AGD-CORE-018 @core @happy @unity-web-port
  Scenario: Learner ports the Unity slice to the web deliberately
    Given the desktop Unity build passes its core-loop contract
    When the learner creates the assessed Unity browser build
    Then the port matrix addresses browser sandbox limits, input, resolution and aspect ratio, persistence, memory and download budget, API availability, packaging, startup messaging, and known limitations
    And the build transcript and smoke tests bind the web artefact to the same source revision

  @AGD-CORE-019 @core @bug-guard @unity-web-port
  Scenario: A successful build command does not prove a successful port
    Given the Unity web build command exits successfully
    When smoke tests expose a broken input path, unsupported API, failed persistence, excessive package budget, or unreadable layout
    Then the port assessment fails or records an evidence-backed no-go
    And a build-success screenshot cannot satisfy platform delivery evidence

  @AGD-CORE-020 @core @happy @godot @engine-transfer
  Scenario: Learner transfers one bounded mechanic to Godot
    Given the mechanic has engine-neutral input, state, output, timing, and tolerance rules
    When the learner rebuilds only that mechanic in the prescribed Godot comparison environment
    Then parity checks cover the shared behaviour and negative cases
    And the transfer memo identifies changed lifecycle, input, physics, resource, testing, and packaging assumptions without reproducing the full capstone

  @AGD-CORE-021 @core @edge @godot @engine-transfer
  Scenario: Engine-shaped assumptions are exposed by the transfer
    Given the Unity implementation depends on scene callbacks, frame timing, serialisation, or APIs unavailable in Godot
    When the learner attempts the parity contract
    Then the mismatch is isolated behind a revised boundary or explicitly accepted as a documented limitation
    And copying syntax or claiming visual similarity cannot pass behavioural transfer

  @AGD-CORE-022 @core @happy @agent-accountability
  Scenario: Learner owns each material agent-assisted change
    Given a coding assistant or agent proposes a material code, test, configuration, or asset change
    When the learner decides whether to use it
    Then the agent evidence packet records task and constraints, context supplied and withheld, affected diff, assumptions, provenance or licence concerns, tests and runtime inspection, accepted and rejected suggestions, and rationale
    And the learner predicts changed-input behaviour and revises the change under a new requirement

  @AGD-CORE-023 @core @bug-guard @agent-accountability @non-compensable
  Scenario: Unverified generated output cannot earn core completion
    Given generated code builds or appears to satisfy the happy path
    When the learner cannot explain, step through, test, and safely revise its control flow and failure behaviour
    Then the agent-accountability gate fails regardless of prompt volume, speed, or aggregate score
    And possible resemblance, unsafe dependency, secret exposure, hidden allocation, and misleading-comment risks remain unresolved until inspected

  @AGD-CORE-024 @core @happy @evidence-authenticity
  Scenario: Evidence is bound to the artefact that produced it
    Given the companion bundle generates test, debug, profile, build, asset, accessibility, and agent evidence
    When an assessment packet is deposited
    Then a versioned manifest binds repository revision, clean or declared working state, fixture identifiers and digests, tool and engine versions, commands, timestamps, target build identity, expected and observed results, and evidence-file digests
    And deterministic checks derive verdicts from authenticated artefacts rather than learner-authored pass claims

  @AGD-CORE-025 @core @bug-guard @evidence-authenticity
  Scenario: Stale, forged, or replayed evidence fails closed
    Given evidence is copied from another revision, fixture, platform, learner, build, or prior attempt
    When a digest, manifest field, command result, provenance record, or bound artefact is changed or missing
    Then verification rejects the packet without awarding the associated outcome
    And screenshots, filenames, editor state, local browser storage, and pre-authored expected rows are not accepted as sole proof

  @AGD-CORE-026 @core @happy @release
  Scenario: Learner makes an evidence-led release decision
    Given the release candidate has source, manifests, tests, defect evidence, profiles, port evidence, licence records, accessibility results, known issues, and recovery notes
    When the learner conducts the release board
    Then the go, conditional-go, or no-go decision traces every critical claim to inspectable evidence
    And development diagnostics are separated from the release package

  @AGD-CORE-027 @core @edge @handoff @non-compensable
  Scenario: Independent maintenance handoff proves supportability
    Given a peer or assessor receives only the repository, release, and maintenance handoff
    When they build or launch it, run canonical tests, reproduce one seeded failure, and make one bounded configuration or behaviour change
    Then their report is bound to the attempted revision and the learner corrects one discovered handoff gap
    And core completion fails if the maintainer cannot complete the task from the documented clean setup

  @AGD-CORE-028 @core @bug-guard @non-compensable
  Scenario: Core non-compensable gates override aggregate scoring
    Given numeric weighting would otherwise produce a passing total
    When any required clean build, launchable core loop, critical save or release test, reproducible profile, compatible asset provenance, agent ownership, accessibility path, or maintenance handoff gate fails
    Then the mainstream core badge is withheld
    And the result names the failed gate and remediation evidence required

  @AGD-CORE-029 @core @happy @course-accessibility
  Scenario: Academy missions are operable without pointer-only or timed interaction
    Given a required mission uses an editor, ordering task, diagram, command, audio, or video
    When the learner completes it by keyboard and with documented alternatives
    Then controls have explicit names and linked instructions, focus is visible, status is not colour-only, ordering has non-drag controls, diagrams have prose, and media has captions, transcripts, or text equivalents
    And long labs preserve resumable evidence without a timed-assessment requirement

  @AGD-CORE-030 @core @bug-guard @separation
  Scenario: Mainstream completion remains independent of the optional chain module
    Given the learner does not enrol in the optional Solana blockchain-gaming module
    When they complete every mainstream core outcome and non-compensable gate
    Then they can earn the Agentic Game Development Specialist core badge and capstone completion
    And no wallet, token, chain availability, blockchain terminology, or optional-module mark appears in a core prerequisite or required verdict

  @AGD-SOL-001 @optional-solana @happy @separate-enrolment
  Scenario: Learner enrols in a separately badged Solana module
    Given the learner has access to the completed or independently satisfied mainstream architecture prerequisites
    When they separately enrol in the optional Solana blockchain-gaming module
    Then it presents its own prerequisites, estimate, missions, assessment, completion record, and badge
    And its result cannot raise or lower the mainstream core result

  @AGD-SOL-002 @optional-solana @happy @fit-no-fit
  Scenario: Learner decides whether an on-chain boundary is justified
    Given a synthetic entitlement or collectible can be implemented with a conventional service, client storage, or Solana
    When the learner writes the architecture decision record
    Then each datum and action is classified on-chain or off-chain with beneficiaries, risk bearers, public visibility, permanence, latency, fee, usability, moderation, and operational trade-offs
    And a well-evidenced no-fit decision passes this decision gate while the separate bounded synthetic localnet and devnet lab remains required for the optional badge

  @AGD-SOL-003 @optional-solana @happy @localnet @devnet @offline-core
  Scenario: A narrow synthetic Solana adapter preserves offline gameplay
    Given only synthetic identities, keys, assets, balances, and operation identifiers are used
    When the learner tests a bounded entitlement adapter on localnet first and devnet second
    Then the adapter is isolated behind an interface and deterministic local tests pass before the devnet check
    And unavailable wallet, RPC, or chain state cannot prevent the mainstream core loop from starting or completing offline
    And no mainnet transaction, real funds, token sale, production wallet, or financial-return claim occurs

  @AGD-SOL-004 @optional-solana @edge @custody @authority
  Scenario: Custody and authority remain explicit and least-privileged
    Given player-controlled, embedded or managed, and server or custodial wallet patterns have different risk
    When the learner models connection, signing, minting, update, freeze, burn, fee payment, recovery, revocation, and session authority
    Then the record names the key holder, consent boundary, allowed program and instruction scope, expiry, rate limit, loss impact, and player communication
    And negative tests reject wrong signer, account, mint, recipient, authority, program identifier, and program-derived-address seeds before value changes

  @AGD-SOL-005 @optional-solana @bug-guard @retry @idempotency
  Scenario: Retries cannot duplicate a grant or charge
    Given a synthetic operation may be rejected, dropped, expired, confirmed late, or receive duplicate callbacks
    When timeout and retry tests use a durable domain operation identifier distinct from the transaction signature
    Then reconciliation occurs before replacement and an already-applied operation returns its original terminal result
    And atomic deduplication proves that reward, entitlement, mint, transfer, or charge takes effect at most once

  @AGD-SOL-006 @optional-solana @bug-guard @abuse @failure
  Scenario: Abuse and distributed failure paths are assessed
    Given a client may forge a score, replay a reward, manipulate its clock, exceed rate limits, substitute metadata, select an unexpected mint, or exploit simulation and execution drift
    When the learner runs the threat and failure suite
    Then trusted program or service rules reject unauthorised effects and preserve an auditable synthetic outcome
    And tests also cover signature rejection, insufficient balance, wrong cluster, RPC timeout, expired blockhash, program error, authority compromise, and state reset

  @AGD-SOL-007 @optional-solana @edge @go-no-go @non-compensable
  Scenario: Optional-module completion requires an evidence-backed go or no-go
    Given fit, custody, authority, retry, idempotency, abuse, failure, player-harm, economic, usability, and operational evidence is available
    When the learner recommends ship, redesign, or reject
    Then the recommendation identifies residual risks, owners, mitigations, offline-core impact, and conditions for reconsideration
    And the optional badge is withheld if authority negatives, retry and idempotency proof, custody explanation, synthetic localnet or devnet boundaries, or go or no-go reasoning are missing

# Research reconciliation recorded for Phase 0a:
# - The current role and primary-document evidence confirms an early-career production-generalist core, Unity/C# spine, genuine browser work, target-platform porting, bounded Godot transfer, and learner-owned agent verification.
# - The proposed 12-step learning arc is useful design input but is not a research fact; this contract fixes outcomes and gates, while Phase 0b may choose module grouping, sequence, duration, and numeric weighting without weakening them.
# - Primary Unity and MDN guidance resolves required testing layers, target-build profiling, build manifests, browser lifecycle, and cross-browser evidence.
# - Primary Solana guidance resolves local-first then devnet testing, synthetic-only assets and identities, custody/authority analysis, transaction expiry and reconciliation, durable idempotency, abuse negatives, and the prohibition on mainnet or real funds.
# - Licensing research resolves original expression, compatible recorded licences, preserved notices, descriptive trademarks, non-affiliation, and no vendor-certification claim; jurisdiction-specific advice remains outside course scope.

# Planning constraints still unresolved for Phase 0b:
# - Select and pin a supported Unity long-term-support release, C# profile, Godot release, exact transfer mechanic, operating systems, and minimum/reduced hardware envelope after repository and CI feasibility checks.
# - Select the standalone web-lab stack and exact two-browser support matrix while retaining the browser-native outcomes in AGD-CORE-016 and AGD-CORE-017.
# - Define the companion-bundle boundary and cryptographic manifest/import contract that can authenticate Unity, Godot, browser, Git, test, profile, build, and handoff evidence without storing engine caches or trusting Academy browser state.
# - Establish reproducible CI/build targets, package and download budgets, representative profiling devices, and quantified low-spec thresholds; these values must not require paid infrastructure or weaken the canonical outcomes.
# - Map the bounded accessibility behaviours to current primary standards and platform guidance before any conformance claim; independent accessibility testing remains required.
# - Select maintained Solana SDK/local runner and optional devnet client versions plus the teaching wallet pattern after technical/security review; the fixed localnet/devnet, synthetic-only, offline-core, authority, retry/idempotency, abuse, and no-mainnet boundaries cannot be relaxed.
