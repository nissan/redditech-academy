# Forward Deployed AI Engineering — Phased Build Plan

**Date:** 2026-10-18
**Status:** Approved checkpoint; Nissan approved all 21 BDD scenarios on 2026-10-18
**Scope:** Review-ready course and local synthetic capstone; no merge, deployment, publication, paid inference, or live environment change
**Inputs:**

- `research-brief.md`
- `../../../features/forward-deployed-ai-engineering.feature`
- `learning-experience-spec.md`

## 1. Deliverable

A protected, catalog-visible, original 12-module flagship course with a single HarbourCare capstone, 24 core lessons (concept + lab/evidence), 12 short knowledge checks, 12 canonical interactive missions, original downloadable artefacts, a local synthetic lab companion, deterministic acceptance tests, and an independent operator-handoff capstone.

If repository inspection shows that bundling the runnable lab into the Academy app would materially inflate or couple the web deployment, package it as a versioned downloadable companion directory/zip while retaining course content and evidence instructions in Academy. This is an implementation seam, not a change to learning outcomes.

## 2. Guardrails

- Use original explanations, examples, diagrams, code, data, and assessments.
- Include the approved inspiration attribution; imply no endorsement or formal certification.
- Use only synthetic regulated-enterprise data and identities.
- Canonical completion must require no paid API, production credential, GPU, or internet after the prepared bundle exists.
- Never weaken a security control to make a demo pass.
- Preserve current Academy auth, content schemas, routes, and unrelated work.
- Work in a fresh issue branch/worktree from verified `origin/main` after scenario approval.
- Do not merge, deploy, publish, provision hosted infrastructure, or spend money without separate authority.

## 3. Definition of done

1. Every `Then` clause in FDE-01 through FDE-21 has named evidence and passes.
2. Inventory confirms 12 modules, 24 core lessons, 12 missions, 12 knowledge checks, and all referenced downloads.
3. A clean-room CPU-only setup runs canonical tests from documented commands with no provider credential.
4. Security gates prove tenant/document isolation, pre-context filtering, least privilege, secret/PII-safe telemetry, approval separation, and replay safety.
5. Content, originality/attribution, accessibility, security, and technical QA reports pass the exact review head.
6. Repository-native test, type-check, build, link/reference, schema, idempotency, and secret-scan gates pass.
7. The final PR remains review-only until Nissan authorises merge; publication/deployment remains separately gated.

## 4. Acceptance-evidence map

| Scenario | Primary evidence |
|---|---|
| FDE-01 | Course inventory, route generation, metadata/access smoke, attribution snapshot |
| FDE-02 | Rubric-valid discovery brief, context diagram, SOW, risks/non-goals |
| FDE-03 | Append-only ADR showing invalidated assumption and revised disconnected design |
| FDE-04–05 | Access matrix, policy traces, cross-tenant/document/action denial tests, redacted audit output |
| FDE-06–07 | Reproducible setup transcript, default-deny egress test, SBOM/inventory, rollback/restore, offline missing-artifact test |
| FDE-08–09 | Data-quality/lineage/reconciliation reports, quarantine evidence, replay/idempotency test |
| FDE-10 | Permitted/denied retrieval, grounding, abstention, citation, and injection-resistance suite |
| FDE-11–12 | Tool threat model and contracts, schema/rate/replay/idempotency tests, credential scan |
| FDE-13 | Labelled sensitive-data set, precision/recall, bypass suite, residual-risk note |
| FDE-14 | State-transition matrix, restart/duplicate/expiry/rejection tests, at-most-once write proof |
| FDE-15 | Deterministic and CPU-local scorecard; optional paths clearly excluded from canonical grading |
| FDE-16 | Correlated trace, SLI/SLO and alert result, resource/value evidence, payload-leak scan |
| FDE-17–18 | Versioned golden set, calibration/disagreement/uncertainty report, blocked/excepted release-gate test |
| FDE-19 | Independent operator task record, deploy/observe/rollback/backup/restore timings, unresolved risks |
| FDE-20 | Source ledger, originality review, notice check, vendor-neutral outcome review |
| FDE-21 | Full quality-gate transcript, clean-room proof, secret scan, explicit no-deploy/no-paid-call statement |

## 5. Execution phases

Each implementation slice is timeboxed to **30 minutes or less of Kit time** and ends with a durable commit or a recorded blocker. A slice that cannot meet its evidence gate is not marked complete and is not hidden inside a later phase.

### Gate A — approval and repo readiness (Loki/Firefly, before Kit)

**A1. Scenario approval** — Nissan approves or adjusts `features/forward-deployed-ai-engineering.feature`. This is the mandatory Firefly gate.
**A2. OAD issue and branch** — Loki creates/identifies the GitHub issue and a clean worktree from verified `origin/main`; no app edits before A1.
**A3. Schema inventory (≤20m)** — inspect current course, lesson, quiz, challenge, download, grading, test, and generator conventions. Record exact commands and whether the lab is bundled or downloadable.
**Evidence:** issue link; clean-base SHA; inventory note; selected reversible packaging seam; no implementation divergence from the approved spec.

### Gate B — common course and lab foundations

**B1. Course scaffold (≤25m)** — metadata, protection flag, 12 ordered module shells, prerequisites, objectives, duration, attribution/disclaimer. **BDD:** FDE-01, FDE-20.
**B2. HarbourCare data contract (≤30m)** — synthetic personas, tenants, documents, ERP records, sensitive-data labels, golden-set schema, licences/source ledger. **BDD:** FDE-20, FDE-21.
**B3. Evidence repository contract (≤25m)** — manifest, directory conventions, ADR/risk/runbook/evaluation templates, deterministic evidence index. **BDD:** FDE-02, FDE-19, FDE-21.
**B4. Local lab bootstrap (≤30m)** — minimal service profiles, deterministic fixture mode, setup/reset/health commands, low-resource configuration; choose bundled vs downloadable seam from A3. **BDD:** FDE-15, FDE-21.
**B5. Baseline quality harness (≤30m)** — inventory/schema/reference checks, fixture integrity, zero-placeholder check, secret scan, idempotent generator/check command. **BDD:** FDE-20, FDE-21.
**Evidence:** scaffold inventory; dataset licence/provenance ledger; evidence manifest validation; clean bootstrap/health output; baseline gate transcript.

### Gate C — module slices

Each module has two independently reviewable slices: **C*n*a** creates the concept/customer-signal lesson and knowledge check; **C*n*b** creates the applied mission, deterministic grader/tests, download/evidence template, and lab instructions.

| Slice | Output (each ≤30m) | BDD / evidence gate |
|---|---|---|
| C0a | Module 0 discovery concepts, role boundary, stakeholder and outcome lesson + check | FDE-02; source links and knowledge-check schema pass |
| C0b | Discovery mission, SOW/risk/ADR downloads, changing-constraint case | FDE-02–03; rubric validates boundaries, non-goals, measurable outcomes, and append-only revision |
| C1a | Module 1 identity, provisioning, tenant/role/document/action policy lesson + check | FDE-04–05; concepts distinguish authentication from enforcement |
| C1b | Access-matrix mission and synthetic policy lab | FDE-04–05; authorised path and pre-context cross-tenant denial tests pass |
| C2a | Module 2 packaging, egress, artifact inventory, rollback lesson + check | FDE-06–07; dependency/egress trade-off questions pass |
| C2b | Private/disconnected deployment mission and evidence templates | FDE-06–07; health, default-deny, rollback, offline and exact-missing-artifact tests pass |
| C3a | Module 3 OCR uncertainty, contracts, lineage, reconciliation lesson + check | FDE-08–09; confidence/quarantine/replay concepts assessed |
| C3b | Invoice/ERP ingestion mission and data-quality downloads | FDE-08–09; totals, lineage, quarantine, duplicate-batch replay pass |
| C4a | Module 4 retrieval filtering, citations, abstention, injection lesson + check | FDE-10; policy-before-context reasoning assessed |
| C4b | Permission-aware retrieval mission and adversarial corpus | FDE-10; leak, grounding, denial, abstention, citation and injection suite pass |
| C5a | Module 5 tool/MCP contracts, brokering, least privilege, rate/idempotency lesson + check | FDE-11–12; tool-boundary threat model assessed |
| C5b | Sandbox ERP read/guarded-write mission | FDE-11–12; contract, malformed input, stale approval, replay, rate and credential-scan tests pass |
| C6a | Module 6 classification, minimisation, pseudonymisation, audit lesson + check | FDE-13; detector limits and residual risk assessed |
| C6b | Sensitive-data policy mission and labelled set | FDE-13; precision/recall, bypass, restoration-authority and audit-redaction evidence pass |
| C7a | Module 7 durable state, retries, approvals, separation-of-duties lesson + check | FDE-14; state/identity/terminal-outcome reasoning assessed |
| C7b | High-value purchase approval mission | FDE-14; restart, duplicate callback, timeout, rejection and at-most-once tests pass |
| C8a | Module 8 local model formats, quantisation, capacity/licensing lesson + check | FDE-15; deployment trade-offs assessed without vendor lock-in |
| C8b | Deterministic baseline + optional Ollama CPU comparison mission | FDE-15; canonical offline path and quality/latency/throughput/resource scorecard pass |
| C9a | Module 9 OpenTelemetry, SLI/SLO, alerts, value attribution lesson + check | FDE-16; signal and value-metric reasoning assessed |
| C9b | End-to-end trace/customer-health mission | FDE-16; correlation, alert drill, resource/value evidence and payload-leak scan pass |
| C10a | Module 10 golden sets, trajectory grading, calibration, uncertainty lesson + check | FDE-17–18; evaluation/release reasoning assessed |
| C10b | Shadow-evaluation mission and evaluation-card download | FDE-17–18; versioning, disagreement, uncertainty, regression, block/exception logic pass |
| C11a | Module 11 configuration, runbooks, self-service, resilience lesson + check | FDE-19; handoff/recovery responsibilities assessed |
| C11b | Independent operator handoff mission | FDE-19; configure/deploy/observe/rollback/backup/restore task record meets targets |

### Gate D — cross-course integration

**D1. Capstone assembly (≤30m)** — link all module evidence into one learner and assessor journey; add entry/exit criteria and non-compensable gates. **BDD:** FDE-02–19.
**D2. Deterministic grading integration (≤30m)** — verify mission graders reject malformed, placeholder, fabricated, missing-provenance, and unsupported-pass submissions without provider calls. **BDD:** FDE-03, FDE-05, FDE-09, FDE-12–15, FDE-18, FDE-21.
**D3. Clean-room/offline rehearsal (≤30m setup + bounded run)** — run documented bootstrap from a clean location/profile with network/provider credentials absent; capture failures honestly. **BDD:** FDE-07, FDE-15, FDE-21.
**D4. Course inventory and route gate (≤20m)** — assert counts, ordering, cross-references, assets, downloads, protected access, and generated routes. **BDD:** FDE-01, FDE-21.
**D5. Accessibility and low-resource pass (≤30m)** — prose equivalents, headings, labels, keyboard path, non-colour semantics, expected command outputs, reset/recovery path. **BDD:** FDE-01, FDE-15, FDE-21.
**D6. Attribution/originality pass (≤25m)** — source ledger, notice, phrase/asset review, no endorsement/certification, vendor-neutral assessment. **BDD:** FDE-20.
**Evidence:** capstone manifest; grader negative tests; clean-room transcript; inventory report; accessibility checklist; originality/source review.

### Gate E — validation and independent review

**E1. Smallest gates (≤30m)** — content/schema/fixture/link checks and course-scoped tests.
**E2. Repository gates (bounded commands)** — full test, type-check, build, `git diff --check`, generator idempotency, and secret scan. Long-running commands may exceed the planning timebox but must be recorded as one validation gate, not hidden implementation.
**E3. Sara content QA** — accuracy, teaching sequence, clarity, originality, accessibility, source quality, and customer usefulness against FDE-01–03, FDE-13, FDE-15–21.
**E4. Oli technical/security QA** — exact-head review of schemas, routes, graders, clean-room repeatability, authorisation, tools, PII/audit, workflow replay, telemetry, and tests against FDE-04–21.
**E5. Remediation slices** — one finding per ≤30m change, rerun the smallest affected gate, then re-run exact-head reviews where material.
**Evidence:** command transcript with exit codes; exact reviewed SHA; content and technical/security reports; zero unresolved Critical/Major findings; explicit residual risks.

### Gate F — review handoff

**F1. Review-ready commit/PR (≤20m)** — focused branch, linked issue/specs, inventory, validation commands, evidence paths, attribution, limitations, and guardrails.
**F2. Final state check (≤15m)** — clean/synchronised worktree, exact-head checks visible, automatic preview status reported if created by the repo, and no manual deployment.
**Stop:** await Nissan's merge decision. Production publication, hosted labs, GPU capacity, paid services, formal credentials, and co-branded marketing remain out of scope.

## 6. Dependency order

```text
Scenario approval
  -> repo/schema inventory
  -> common synthetic data + evidence + lab foundations
  -> Module 0 discovery
  -> Modules 1–7 security/data/action chain
  -> Module 8 inference
  -> Modules 9–10 observability/evaluation
  -> Module 11 handoff
  -> integrated capstone and clean-room rehearsal
  -> content + technical/security QA
  -> review-ready PR
```

Modules should normally remain in dependency order. After Gate B, concept-content slices can be drafted in parallel only if Loki prevents overlapping files and each applied slice still validates against the latest shared contracts.

## 7. Risks and planned responses

| Risk | Response / evidence |
|---|---|
| Lab stack is too heavy for learner laptops | Deterministic fixture mode is canonical; CPU/low-resource profile and reset path are required; GPU is optional |
| Kubernetes/Keycloak/telemetry images break offline use | Produce an explicit artifact manifest and disconnected test; fail with exact missing artifact, never by opening egress |
| Vendor choices overwhelm transferable concepts | Assess contracts, policy, evidence, and trade-offs; label defaults as replaceable reference implementations |
| Synthetic data feels unrealistic | Include drift, duplicates, OCR uncertainty, adversarial documents, approvals, and measurable but fictional business outcomes |
| Grading becomes dependent on an LLM | Deterministic canonical graders; optional AI coaching cannot change pass/fail |
| Security is asserted rather than proven | Negative tests at retrieval, data, tool, workflow, telemetry, and operator boundaries |
| Source roadmap is copied or overclaimed | Original wording/assets, source ledger, explicit inspiration notice, no endorsement/certification |
| Existing Academy changes are overwritten | Fresh worktree, verified base SHA, issue-scoped diffs, no unrelated cleanup |

## 8. Deferred scope

- Hosted multi-tenant labs or customer VPCs.
- Commercial IdP, ERP, observability, or model-provider accounts.
- GPU provisioning and mandatory vLLM exercises.
- Production Academy deployment or public launch.
- Formal certification, assessed micro-credential governance, or external accreditation.
- Real regulated/customer data or production penetration testing.
- Close co-branding with Suraj Sharma's roadmap beyond factual inspiration attribution.

## 9. Decisions requiring Nissan

Only **BDD scenario approval** is required to begin implementation with the documented defaults. Nissan must separately decide later if Redditech wants any deferred hosted/GPU/paid tier, a formal credential, production publication, or close source-roadmap co-branding/permission. Those decisions do not block a local review-ready course.

## 10. Firefly self-check

- [x] BDD scenarios written before the build plan and marked draft pending approval.
- [x] Every scenario maps to named implementation and evidence gates.
- [x] Each implementation slice is no more than 30 minutes; long validation commands are isolated.
- [x] Dependencies, risks, stop conditions, and deferred scope are explicit.
- [x] Reference-stack choices are explicit and reversible.
- [x] “Done” requires deterministic, inspectable evidence rather than screenshots or claims.
