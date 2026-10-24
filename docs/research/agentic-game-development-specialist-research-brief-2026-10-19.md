# Agentic Game Development Specialist — Market & Competency Research Brief

**Date:** 2026-10-19
**For:** Redditech Academy issue #122 (research lane)
**Research status:** Complete; 42 distinct public sources, all accessed 2026-10-19
**Scope boundary:** Research and course-outcome recommendations only. No implementation, publication, deployment, spending, PR, or issue mutation.

## Executive summary

The evidence supports the approved shape: a **production-minded game-development generalist** course, with Unity/C# as the main delivery spine, web-game and platform-transfer labs, and a separately assessed optional Solana module.

Across current first-party postings from Unity, Ubisoft, Roblox, Voodoo, Bellota Labs, Partyhat, Playson and PlaySide, the recurring demand is not “know one editor.” It is the ability to own a feature end to end; write maintainable code; debug and test; profile before optimising; move across platforms or engine versions; collaborate with design, art, QA and production; document decisions; and take responsibility for release quality. Current postings show AI entering workflows, but as a collaboration/productivity layer—not as a substitute for engineering judgement or verification [R1–R5, R7–R12].

The durable course centre should be:

1. translate a playable brief into a small, maintainable architecture;
2. implement gameplay, controls, UI and asset integration in C#/Unity;
3. diagnose faults with breakpoints, logs, reproduction cases and test evidence;
4. profile CPU/GPU/memory/loading behaviour on the target build, then justify an optimisation;
5. build and package for at least two delivery contexts, including a browser-facing path;
6. use coding assistants/agents with explicit constraints, review, tests, provenance and learner accountability;
7. collaborate through source control, small reviews, technical notes and a maintenance handoff; and
8. demonstrate engine/SDK transfer rather than memorising one vendor UI.

The optional blockchain unit is justified only as an architecture and risk exercise. It should teach learners to decide what belongs on-chain, distinguish player-controlled from custodial keys, treat transactions as fallible distributed operations, prevent replay/double effects, validate signers/accounts/authorities, use synthetic assets on localnet/devnet, and explain player, security and economic trade-offs. It must not become a token-sales, investment, mainnet, or “put the whole game on-chain” course [S1–S16].

**Overall confidence: high** for the competency pattern (multiple current first-party roles plus primary technical documentation); **medium** for relative labour-market prevalence because this was a purposive role sample, not a census of vacancies.

## Method and evidence base

- **Role sample:** 12 first-party employer/careers sources spanning Australian studio context, engine/platform engineering, Unity/C#, browser games, QA/automation, porting/optimisation and AI-enabled collaboration. Current/live pages were preferred. Expired pages were used only where employer-hosted text remained available and are labelled.
- **Technical standard:** primary Unity, Microsoft, MDN, Solana, GitHub and vendor legal documentation.
- **Interpretation rule:** a competency is durable when it recurs across employers/platforms or is required by primary production guidance. Named products, proprietary engines, internal frameworks and exact SDKs are examples unless an outcome depends on them.
- **Limitations:** postings are snapshots and can disappear; senior roles overstate depth for an entry course; employer wording does not establish vacancy volume. No paid APIs were used.

## 1. Current role and market evidence (2025–2026)

| First-party evidence | Signals relevant to the course | Curriculum implication |
|---|---|---|
| PlaySide careers [R1] and the issue #122 supplied Software Engineer advertisement | Rich communication, collaboration and shipping culture; supplied ad emphasises Unity/C# or web games, assisted-development workflows, debugging generated code, testing, optimisation, adaptability and independent delivery | Anchor the Australian employability story in generalist production evidence, not a single-engine tutorial |
| Unity, Production Verification Software Engineer [R2] | Upgrade real customer games across Unity versions; diagnose migration failures; work with product, consulting and release engineering; shipping experience | Add an engine-version migration/SDK-transfer exercise and compatibility report |
| Ubisoft, Senior Engine Programmer (Switch 2 project) [R3] | Profile on PC/console; diagnose bottlenecks; portable/maintainable code; risks/trade-offs; documentation and partner communication | Assess target-platform profiling, portable abstractions and an architecture decision record |
| Ubisoft, Junior Automation Programmer/SDET [R4] | C# automated tests, API testing, debugging production tools, web services and operational troubleshooting | Treat testing/debugging as engineering work; include a small tool/API test |
| Ubisoft, Junior Gameplay Programmer (expired, retained first-party page) [R5] | Gameplay systems, UI, NPC AI, documentation, small-feature delivery and collaboration | Entry assessments should be scoped features with readable documentation |
| Roblox, Senior QA Engineer—Game Engine [R7] | Validation strategy, automation, release readiness and stability across mobile, console, VR and web | Learners produce a test matrix and release recommendation, not merely “tests passed” |
| Roblox, Creator Collaboration engineering [R8] | End-to-end feature ownership; performance/latency/throughput; creators and AI agents collaborating | Teach agent-assisted work as a reviewable team workflow |
| Voodoo, Technical Artist (AI) [R9] | Unity asset import/optimisation, C# editor tooling and AI-focused production support | Include asset-pipeline budgets and a narrow editor/tool automation task |
| Bellota Labs, WPT Home Full-Stack Engineer [R10] | Unity/C# client plus APIs, real-time state and UX/mini-games | Expose client/service boundaries without making this a backend course |
| Partyhat, Game Developer [R11] | TypeScript/JavaScript and rich animated interactive web experiences | Browser lab should be a genuine web runtime exercise |
| Playson, Game Engine Engineer [R12] | TypeScript/Node, game logic/simulation and modern JavaScript UI | Reinforces transferable game-loop/state/testing skills |

### Cross-role synthesis

The strongest repeated signals are:

- **End-to-end ownership:** brief → implementation → test → performance evidence → build/release → handoff.
- **Debugging and verification:** reproduce, inspect, isolate, test and document faults. This becomes more important when code is agent-generated.
- **Performance on the target:** profiling and measured bottlenecks precede changes; memory, frame time, loading and platform constraints matter.
- **Transfer and porting:** engine upgrades, multiple platforms, browser delivery and unfamiliar SDKs are normal work.
- **Cross-disciplinary collaboration:** game engineering sits between design, art, QA, production, platform and services.
- **Maintainability:** readable code, bounded architecture, documentation and trade-off explanations recur even where engines differ.
- **AI-assisted workflows:** the evidence supports tool-assisted iteration and AI/creator collaboration, but does not remove human accountability for correctness, security, performance or release quality.

## 2. Durable competencies versus employer-specific tools

| Durable competency to assess | Employer/tool-specific examples to demonstrate, not canonise |
|---|---|
| Decompose a playable outcome into state, input, presentation, data and service boundaries | Unity MonoBehaviours/ScriptableObjects, a studio ECS, Unreal GAS, Roblox services |
| Write idiomatic, readable code with explicit ownership and failure behaviour | C# in Unity; C++ in proprietary/Unreal engines; TypeScript in browser games |
| Reproduce and diagnose defects using logs, breakpoints, assertions, stack traces and minimal cases | Rider/Visual Studio, Unity Console, browser DevTools, proprietary telemetry |
| Design automated checks at appropriate layers | Unity Test Framework Edit/Play Mode, NUnit, browser unit/E2E frameworks, studio suites |
| Profile before optimising on representative hardware/builds | Unity Profiler/Profile Analyzer, browser Performance panel, console profilers |
| Manage frame-time, allocations, loading, asset size, rendering and input constraints | URP/HDRP, Addressables, WebGL/WebGPU, proprietary pipelines |
| Build, package, version and verify release candidates | Unity Build Profiles, CI vendors, distribution portals, internal release tools |
| Port or migrate while identifying platform/API assumptions | Unity-version upgrade, desktop→web, keyboard→gamepad/touch, SDK change |
| Collaborate through source control, reviews, ADRs, issue evidence and handoff | GitHub/GitLab/Perforce/Jira/Linear/Confluence |
| Direct an AI assistant, inspect its diff, test it, record provenance and reject unsafe output | Copilot, Cursor, Claude Code, Unity AI or future studio tooling |

**Assessment principle:** score reasoning and evidence. A tool-specific click sequence may support a task, but is not itself the competency.

## 3. Primary technical documentation and required practices

### 3.1 Unity/C# testing and debugging

- Unity Test Framework supports **Edit Mode, Play Mode and target-platform tests** [U1]. Include fast logic tests, at least one Play Mode integration test, and a target-context test/build run.
- Microsoft’s .NET guidance supports repeatable test projects and command-line execution [U2]. Learners should understand arrange/act/assert, deterministic fixtures, boundaries and failure diagnostics.
- Required evidence: failing test or reproducible defect first; diagnosis notes; corrected code; regression test; and an explanation of any untested boundary.
- Generated code must be stepped through or otherwise inspected where behaviour is uncertain. A green build alone is insufficient.

### 3.2 Profiling and optimisation

- Unity Profiler records resource use across CPU, memory, rendering, audio and other modules [U3]. Build Profile profiler settings require a Development Build and deep profiling adds overhead [U4].
- Profile the player/build and representative device, not only the Editor. Define a budget, capture a baseline, identify one dominant bottleneck, make one bounded change, and compare equivalent captures.
- Reject “optimised” claims without before/after measurements and context. Reward recognising when no change is justified.

### 3.3 Build and release

- Unity Build Profiles store platform-specific configurations and support separate development/release setups [U5]. Require a versioned manifest: engine version, target, profile, options, known issues and reproducible build instructions.
- Separate development diagnostics from the release candidate. Verify clean startup, input, save/state restoration, error paths and package contents.
- Force one meaningful port constraint—browser sandbox, input modality, aspect ratio, memory/download budget, API availability or engine/package version—and require documented assumptions and trade-offs.

### 3.4 Web-game practices

- MDN’s game-development material covers Canvas/WebGL, gamepad, pointer lock, audio, IndexedDB, WebSockets and Workers [W1]. A browser lab must address capability detection, input, lifecycle and delivery—not merely compilation.
- Drive visual updates with `requestAnimationFrame`; callbacks follow display refresh and are generally paused in background tabs, so delta-time and pause/resume behaviour must be intentional [W2].
- Move suitable CPU-heavy work from the main UI thread with Web Workers and message passing [W3].
- Use the Performance API/PerformanceObserver and browser tools for repeatable, high-resolution measurements and custom marks [W4].
- Required checks: current versions of at least two browser engines; keyboard plus alternate input where applicable; resize/high-DPI; focus/visibility pause; loading/cache failures; network interruption if networked; audio-start restrictions; accessibility basics; console errors; and measured startup/frame responsiveness.

## 4. Responsible agent-assisted workflow

GitHub’s current AI terms state that output may be inaccurate, incomplete, non-functional, resemble third-party code, contain vulnerabilities or attract IP claims, and place review, testing and validation responsibility on the user [A1].

Require an **agent evidence packet**:

1. task statement and constraints;
2. relevant context supplied and sensitive context withheld;
3. generated proposal/diff, with licence/provenance concerns flagged;
4. learner review notes identifying assumptions/risks;
5. test, debug and profile evidence;
6. accepted/rejected changes and rationale; and
7. disclosure in the maintenance handoff.

No credit should be awarded for prompt volume or speed. Credit belongs to framing, review quality, verification and ownership.

## 5. Optional specialist module: blockchain gaming on Solana

### 5.1 Decision gate: should this be on-chain?

Solana guides describe wallets for authentication, tokens/NFTs for assets or payments and program accounts for state [S1–S5]. These are capabilities, not a requirement to decentralise every subsystem.

Require an ADR classifying each datum/action:

- **Keep off-chain/client or authoritative service:** high-frequency movement/combat, frame-state, queues, private anti-cheat signals, mutable balance data, large media and personal data.
- **Candidate for on-chain:** scarce player-controlled assets, auditable ownership/settlement, portable achievements, tournament payout rules, or small state whose public verifiability justifies latency, fees and permanence.
- **Do not proceed** where a normal database/account system meets the need with less player friction and risk.

This split is an architectural inference from transaction/account limits, public state and wallet signing [S1–S10], not a Solana rule.

### 5.2 Wallets, custody and consent

- A wallet authorises changes through signatures; token accounts have an owner and hold one mint [S5]. Connection is not blanket permission: wallet UI remains an authentication/authorisation boundary [S6].
- Compare **player-controlled**, **embedded/managed** and **server/custodial** wallets. Document key holder, recovery, consent, fee payer, revocation, age/jurisdiction implications and loss impact.
- Never place a mainnet key in Unity, a browser bundle, repository, log or course download. Production guidance calls for separate devnet/mainnet keys and secure signing infrastructure [S7].
- Session keys or backend fee payers expand authority and abuse surface; scope programs/instructions, expire access, rate-limit and preserve player intent [S8].

### 5.3 Assets and state

- SPL tokens, token accounts, Token-2022 extensions and metadata are core primitives [S5]. Game guides show fungible/NFT items and metadata-loaded content [S3].
- Model mint/update/freeze/burn authorities, supply, metadata mutability, URI/content availability, ownership versus licence, and out-of-game transfers.
- Program-derived accounts can hold program-owned player state, but size/cost, public visibility and upgrade authority must be explicit [S4]. Never trust a client to award itself value; validate signers, addresses, seeds, authorities and expected programs [S9].

### 5.4 Transaction failure, retries and reconciliation

- Solana transactions are atomic for state changes, but fees are charged on failure; recent blockhashes expire, and confirmation/landing is not a synchronous local call [S10].
- Use preflight/simulation, track validity windows, confirm at an intentional commitment level, expose pending/failed/expired states, and retry only with an idempotency strategy [S11].
- Persist a domain operation ID separately from the transaction signature. On timeout, reconcile before replacement. A fresh blockhash creates a new signature; application deduplication prevents duplicate grant/charge [S12].
- Fault cases: rejected signature; insufficient balance; wrong cluster; RPC timeout; dropped transaction; expired blockhash; program error; already-applied operation; duplicate callback; confirmation after UI timeout.

### 5.5 Security and abuse

- Validate every signer, writable account, mint, recipient, authority and program ID; constrain PDAs with expected seeds/bump; enforce rules in trusted program/service code [S9].
- Treat replay/idempotency as security controls. Solana guidance recommends durable consumed identifiers, atomic verify/consume, idempotency keys and returning the original result on legitimate retries [S13].
- Abuse tests: duplicate reward claim, forged score, bot/rate abuse, client-clock manipulation, authority compromise, metadata substitution, unexpected mint and simulation/execution drift.
- Keep personal data, private telemetry and moderation signals off-chain where public permanence harms players or abuse controls.

### 5.6 Local, devnet and release testing

- Start with LiteSVM/Anchor tests or a local validator; Solana documents local tests as the fastest feedback loop and provides Surfpool/local-validator tooling [S14–S15].
- Use devnet after deterministic local tests. Devnet tokens have no financial value [S16]. Use synthetic assets and separate keys/config.
- Assessment stops at localnet/devnet and includes program/unit tests, client integration, failure injection, authority negatives, retry/idempotency and state-reset procedure. **No mainnet deployment, real token sale, custody of learner/customer funds or financial promotion.**

## 6. Licensing, copyright and non-affiliation boundaries

1. **Original expression:** use original explanations, diagrams, code and fictional scenarios. Link to documentation; do not reproduce substantial tutorials, ads, game characters, screenshots, music, art or levels unless licence and attribution are recorded.
2. **Asset ledger:** every asset/package needs source URL, creator, licence/version, permitted use, attribution and modification notes. “Free” is not a licence. Unity Asset Store items remain under the Asset Store EULA or provider-specific licence [L1].
3. **Code licences:** public availability does not grant reuse. GitHub notes that without a licence, default copyright applies [L2]. Preserve notices and distinguish course-content from software/asset licensing.
4. **AI output:** treat generated code/assets as untrusted contributions; review resemblance/provenance, licences, secrets, security and correctness [A1]. Do not request imitation of living artists or named commercial games.
5. **Trademarks/non-affiliation:** use Unity, Solana, studio and product names descriptively. Unity prohibits uses implying affiliation or endorsement [L3]. Solana Foundation reserves its marks/logo use [L4–L5].
6. **Required notice:** “Redditech Academy is independent and is not affiliated with, endorsed by, sponsored by, or certified by Unity Technologies, Solana Foundation, PlaySide Studios, Ubisoft, Roblox, or any other referenced employer or tool vendor. All trademarks are the property of their respective owners.”
7. **No certification claim:** completion evidences Redditech Academy outcomes, not vendor certification. Do not use vendor logos in title/badge without permission.
8. **Fictionalisation:** capstone studio, client, telemetry, accounts, wallets and assets must be synthetic.

## 7. Proposed evidence-backed course outcomes

A learner should be able to:

1. **Plan a vertical slice:** convert a brief into bounded gameplay, controls, UI, asset and platform requirements with risks/acceptance criteria.
2. **Implement maintainable Unity/C#:** deliver clear state/ownership boundaries, readable C#, sensible data separation and documented trade-offs.
3. **Integrate game feel/presentation:** controls, camera, feedback, UI and licensed assets without hiding logic in an unreviewable scene.
4. **Debug systematically:** reproduce/isolate defects using logs, breakpoints, stacks and minimal cases, including agent-generated code.
5. **Test at multiple layers:** deterministic logic tests, Play Mode/integration checks and cross-platform/manual matrix with residual gaps.
6. **Profile and optimise:** capture representative evidence, identify the dominant issue, implement and quantify one justified improvement.
7. **Build and release:** produce reproducible development/release builds, version/package them, smoke-test and decide readiness.
8. **Port and transfer:** adapt a feature/build to a second constraint and complete an unfamiliar-engine/SDK transfer with an ADR.
9. **Deliver a web game responsibly:** browser lifecycle, input, measurement, loading/network errors and basic accessibility across two engines.
10. **Use agents responsibly:** constrain, inspect, verify, disclose and retain accountability.
11. **Collaborate:** source control, small reviews, defect evidence, concise technical communication and maintenance handoff.
12. **Optional—evaluate blockchain fit:** justify a split; implement a synthetic localnet/devnet Solana interaction with consent, authority checks, failure/retry reconciliation and abuse tests; explain custody/economic risks.

### Recommended capstone evidence bundle

- polished vertical slice and source repository;
- design/architecture brief plus at least two ADRs;
- automated test output, defect record and cross-platform test matrix;
- baseline/after performance captures;
- two build/port artefacts with manifests and smoke evidence;
- agent evidence packet and dependency/asset licence ledger;
- release-readiness note and maintenance handoff;
- optional Solana package assessed separately on synthetic localnet/devnet assets.

## 8. Explicit non-goals

The course is **not**:

- a promise of employment, studio placement or vendor certification;
- exhaustive Unity training, advanced engine internals, AAA graphics specialisation or every platform SDK;
- Unreal, Godot, Roblox, C++ or TypeScript mastery (these may be transfer contexts);
- “vibe coding” where generated output passes without learner review/evidence;
- a production backend, multiplayer netcode, live-ops, monetisation or console-certification programme;
- an art/animation/sound/game-design degree;
- a course in copying commercial games, characters, branding or job-ad text;
- a blockchain prerequisite, investment/tokenomics course, NFT sales funnel, custody service, legal advice or mainnet exercise;
- a claim that blockchain improves games by default or all state should be on-chain;
- permission to handle real funds, secrets, personal data or unlicensed content.

## 9. Curriculum implications and suggested gating

1. **Core first:** Unity/C#, gameplay/UI, debugging/testing, profiling, build/release and collaboration.
2. **Transfer second:** browser delivery/platform port plus a short unfamiliar engine/SDK exercise.
3. **Agent accountability throughout:** assisted workflows in every phase with progressively stronger evidence.
4. **Optional Solana last and separately graded:** only after ordinary client/service architecture competence.
5. **Hard gates:** no capstone pass without reproducible build, test/debug evidence, measured profile and licence ledger. No chain-module pass without negative authority tests, retry/idempotency evidence and custody explanation.

## 10. Risks, gaps and confidence

- **High:** testing, profiling, maintainability, cross-platform delivery and collaboration are recurrent durable competencies.
- **High:** human review/testing of AI output is required by role framing and tool terms.
- **High:** Solana introduces authority, expiry, retry, idempotency and custody concerns.
- **Medium:** market frequency; this is a purposive sample, not a vacancy census.
- **Medium:** browser-game breadth; fewer current first-party browser roles were found than engine/platform roles.
- **Change risk:** postings/docs are volatile. Preserve access dates and re-check before publication.
- **Legal gap:** this is research, not legal advice. Public naming, badges, bundled assets and licences need owner/legal review where material.

## Sources (42 distinct URLs; accessed 2026-10-19)

### Current roles and employer evidence

- **[R1]** PlaySide Studios, “Careers.” https://playsidestudios.com/careers
- **[R2]** Unity Careers, “Software Engineer, Production Verification.” https://boards.greenhouse.io/unity3d/jobs/7669656
- **[R3]** Ubisoft, “Senior Engine Programmer [New Project on Switch2].” https://jobs.smartrecruiters.com/Ubisoft2/744000112075664-senior-engine-programmer-new-project-on-switch2-
- **[R4]** Ubisoft, “Junior Automation Programmer.” https://jobs.smartrecruiters.com/Ubisoft2/744000127623719-junior-automation-programmer
- **[R5]** Ubisoft, “Junior Gameplay Programmer” (expired at access). https://jobs.smartrecruiters.com/Ubisoft2/744000128425099-junior-gameplay-programmer
- **[R7]** Roblox, “Senior QA Engineer, Game Engine.” https://careers.roblox.com/jobs/7412400
- **[R8]** Roblox, “Senior Software Engineer—Creator Collaboration.” https://careers.roblox.com/jobs/7948192
- **[R9]** Voodoo, “Technical Artist (AI)—Portfolio Games Team.” https://jobs.ashbyhq.com/voodoo/13968523-e0f2-4cdb-81a1-4ac338bd5e0a
- **[R10]** Bellota Labs, “Senior Software Engineer—WPT Home.” https://jobs.lever.co/bellotalabs/c33b1129-5acb-47b0-8496-ff253e3ad895
- **[R11]** Partyhat, “Game Developer.” https://jobs.ashbyhq.com/partyhat/e63125ad-53fc-4dc7-b6bc-869ae0fb3c52
- **[R12]** Playson, “Senior Software Engineer (Game Engine).” https://jobs.ashbyhq.com/playson/61e033b9-d71a-4eaa-9165-f8d306900710

### Unity/C# and web primary documentation

- **[U1]** Unity, “About Unity Test Framework.” https://docs.unity3d.com/Packages/com.unity.test-framework@1.3/manual/index.html
- **[U2]** Microsoft Learn, “Unit testing C# with MSTest and .NET.” https://learn.microsoft.com/en-us/dotnet/core/testing/unit-testing-csharp-with-mstest
- **[U3]** Unity Manual, “Unity Profiler.” https://docs.unity3d.com/Manual/Profiler.html
- **[U4]** Unity Manual, “Build Profiles Profiler settings.” https://docs.unity3d.com/Manual/profiler-build-settings-reference.html
- **[U5]** Unity Manual, “Introduction to build profiles.” https://docs.unity3d.com/Manual/build-profiles.html
- **[W1]** MDN, “Game development.” https://developer.mozilla.org/en-US/docs/Games
- **[W2]** MDN, “Window: requestAnimationFrame().” https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame
- **[W3]** MDN, “Web Workers API.” https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API
- **[W4]** MDN, “Performance APIs.” https://developer.mozilla.org/en-US/docs/Web/API/Performance_API

### AI responsibility and licensing/non-affiliation

- **[A1]** GitHub, “Terms of Service,” section J. https://docs.github.com/en/site-policy/github-terms/github-terms-of-service
- **[L1]** Unity, “Asset Store Terms of Service and EULA.” https://unity.com/legal/as-terms
- **[L2]** GitHub Docs, “Licensing a repository.” https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/licensing-a-repository
- **[L3]** Unity, “Guidelines for Using Unity Trademarks.” https://unity.com/legal/branding-trademarks
- **[L4]** Solana Foundation, “Brand & Marketing.” https://solana.org/branding
- **[L5]** Solana Foundation, “Terms of Service.” https://solana.org/tos

### Solana primary documentation

- **[S1]** Solana, “Getting started with game development.” https://solana.com/developers/guides/games/getting-started-with-game-development
- **[S2]** Solana, “Port Anchor to Unity.” https://solana.com/developers/guides/games/porting-anchor-to-unity
- **[S3]** Solana, “Using NFTs and Digital Assets in Games.” https://solana.com/developers/guides/games/nfts-in-games
- **[S4]** Solana, “Saving game state.” https://solana.com/developers/guides/games/saving-game-state
- **[S5]** Solana, “Tokens, Token Accounts, and Token Extensions.” https://solana.com/docs/tokens
- **[S6]** Solana, “Wallet Connection.” https://solana.com/docs/tools/commerce-kit/quickstart/wallet-connection
- **[S7]** Solana, “Production Readiness.” https://solana.com/docs/tools/production-readiness
- **[S8]** Solana, “How to auto approve transactions.” https://solana.com/developers/guides/advanced/auto-approve
- **[S9]** Solana, “How to interact with tokens in programs.” https://solana.com/developers/guides/games/interact-with-tokens
- **[S10]** Solana, “Transactions.” https://solana.com/docs/core/transactions
- **[S11]** Solana, “Transaction Confirmation & Expiration.” https://solana.com/developers/guides/advanced/confirmation
- **[S12]** Solana Developer Platform, “Payouts and disbursements.” https://docs.platform.solana.com/docs/payments/send-payouts
- **[S13]** Solana, “Build an x402 facilitator.” https://solana.com/developers/guides/getstarted/build-a-x402-facilitator
- **[S14]** Solana, “Build Your First Solana Program.” https://solana.com/docs/intro/quick-start/build-first-program
- **[S15]** Solana, “Surfpool CLI Basics.” https://solana.com/docs/intro/installation/surfpool-cli-basics
- **[S16]** Solana, “Quickstart: create a token with the CLI.” https://solana.com/docs/tokens/quickstart
