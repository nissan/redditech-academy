# Forward Deployed AI Engineering — Learning Experience Specification

**Date:** 2026-10-18
**Status:** Approved checkpoint; Nissan approved all 21 BDD scenarios on 2026-10-18
**Research input:** `research-brief.md`
**Behaviour contract:** `../../../features/forward-deployed-ai-engineering.feature`

## 1. Course promise

**Working title:** *Forward Deployed AI Engineering: From Prototype to Enterprise Production*

An advanced flagship course for engineers and solutions architects who must move an AI prototype into a regulated enterprise. Learners take one fictional customer engagement from technical discovery through identity, private deployment, messy data, safe retrieval and tools, durable approvals, local inference, observability, evaluation, and operator handoff.

The course measures delivery competence through inspectable artefacts and executable tests. It does not claim a formal certification and does not require a paid API.

## 2. Audience, prerequisites, and completion outcome

### Primary audience

- Mid-level software, platform, data, or ML engineers moving into customer-facing delivery.
- Solutions architects and technical founders accountable for enterprise pilots.
- Strong junior engineers may use a preparatory path, but the flagship does not reteach basic programming.

### Prerequisites

- One backend language, HTTP/REST, SQL, Git, Docker, and basic networking.
- Ability to read JSON/YAML, run command-line tests, and interpret logs.
- Basic familiarity with identity, containers, LLM applications, and threat modelling.

### Completion outcome

A successful learner can hand a synthetic regulated-enterprise AI system to a new operator together with the evidence needed for security, operations, and value reviews. Completion is a portfolio outcome, not an accredited or vendor certification.

## 3. Whole-course case: HarbourCare

HarbourCare is a fictional healthcare procurement organisation with separate business units, scanned supplier records, a legacy ERP, sensitive staff data, and a disconnected production requirement. The learner is the forward deployed engineer for a bounded procurement-assistant pilot.

All names, identities, documents, financial figures, credentials, incidents, and evaluation labels are synthetic. The scenario contains no real patient or employee data. Each module changes the same system and appends evidence to a versioned `evidence/` repository rather than producing disconnected demos.

### Persistent learner roles

- **Learner/FDE:** proposes designs, implements controls, and explains trade-offs.
- **Security lead:** inspects identity, data, tool, and audit boundaries.
- **Procurement owner:** validates business outcomes and approval policies.
- **Platform operator:** tests deployment, telemetry, rollback, and recovery.
- **Assessor/peer:** independently executes the final handoff runbook.

## 4. Learning architecture

Every module uses the same six-part loop:

1. **Customer signal** — a new request, constraint, failure, or stakeholder concern.
2. **Design decision** — learner records assumptions, alternatives, and safeguards.
3. **Build slice** — a small local change or configuration exercise.
4. **Adversarial check** — a denial, replay, outage, leakage, or ambiguity test.
5. **Customer explanation** — a concise, non-jargon summary of value and residual risk.
6. **Evidence deposit** — tests, reports, diagrams, or runbooks saved for the capstone.

The learner is never rewarded for screenshots alone. Claims must point to commands, structured results, decision records, or an independent operator task.

## 5. Twelve-module arc

Discovery is taught first even though it appears near the end of the source roadmap; later engineering choices require known constraints and success measures.

| Module | Learner decision and build | Required evidence | BDD |
|---|---|---|---|
| 0. FDE operating model and discovery | Bound the pilot, stakeholders, constraints, outcomes, architecture, and non-goals | Discovery brief, context diagram, assumptions/decision log, risk register, four-week pilot SOW | FDE-02, FDE-03 |
| 1. Enterprise identity and isolation | Separate authentication, provisioning, tenant/role/document/action authorisation, and service identities | Access matrix, policy trace, cross-tenant denial tests | FDE-04, FDE-05 |
| 2. Private and disconnected deployment | Package a reproducible default-deny deployment and offline bundle | Deployment transcript, network test, inventory/SBOM, rollback and missing-artifact evidence | FDE-06, FDE-07 |
| 3. Legacy data ingestion and reconciliation | Parse uncertain records, reconcile totals, quarantine ambiguity, and make replay safe | Data-quality report, lineage map, reconciliation result, idempotency test | FDE-08, FDE-09 |
| 4. Authorisation-aware retrieval | Filter before context assembly, cite sources, abstain, and resist document injection | Leak-resistance, denied-document, groundedness, abstention, and injection suite | FDE-10 |
| 5. Safe tools and legacy integration | Define typed, least-privilege read/write contracts around a sandbox ERP | Tool threat model, contract tests, rate/replay tests, credential scan | FDE-11, FDE-12 |
| 6. Sensitive-data guardrails and audit | Classify, minimise, pseudonymise, restore only where authorised, and audit metadata | Labelled set, precision/recall, bypass suite, residual-risk note | FDE-13 |
| 7. Durable human approval | Model separation of duties, waits, retries, timeouts, compensation, and terminal states | State-transition, duplicate-callback, restart, reject, expiry, and at-most-once tests | FDE-14 |
| 8. Local and edge inference | Compare deterministic baseline and CPU-local inference; reason about optional acceleration | Quality/latency/throughput/resource scorecard and decision memo | FDE-15 |
| 9. Observability and customer health | Trace one request end to end and connect technical signals to value | Correlated trace, SLI/SLO, alert drill, resource/cost attribution, value metric | FDE-16 |
| 10. Customer-specific evaluation | Version a golden set, calibrate grading, run shadow mode, and make a release decision | Evaluation card, disagreement analysis, uncertainty, regression report, release gate | FDE-17, FDE-18 |
| 11. Handoff, self-service, and resilience | Transfer configuration and operations to a new operator | Admin-task test, runbook, backup/restore, rollback, recovery-time, unresolved-risk register | FDE-19 |

## 6. Assessment design

| Component | Weight | Evidence rule |
|---|---:|---|
| Twelve short knowledge checks | 15% | Scenario/trade-off questions; terminology alone cannot earn full marks |
| Module lab evidence | 45% | Deterministic tests plus decision and residual-risk notes |
| Security review after Module 6 | 10% | Learner defends data flow, authorisation, tools, and audit controls |
| Value/release review after Module 10 | 5% | Learner explains calibrated evidence and release recommendation |
| Independent handoff capstone | 25% | A peer/assessor operates and recovers the system from submitted materials |

### Non-compensable capstone gates

The course cannot pass if any of these fail:

- Cross-tenant or unauthorised-document content reaches model context.
- Default-deny egress or least-privilege tool policy is bypassed.
- A high-impact write executes without a valid independent approval.
- Raw synthetic secrets or sensitive values appear in model traces or audit output.
- Retry/replay behaviour can create duplicate side effects.
- Evaluation omits human calibration or uncertainty.
- A new operator cannot deploy, observe, roll back, back up, and restore from the runbook.

## 7. Feedback and grading

- Structured tasks use deterministic validation before any optional model feedback.
- Each rubric scores: correctness, security boundary, evidence quality, operational recoverability, customer explanation, and residual-risk honesty.
- Hints identify the weakest missing dimension and point to the relevant source; they do not reveal a finished artefact.
- “Pass” requires evidence references. Unsupported confidence and fabricated results are explicit failure modes.
- Optional AI feedback may enhance coaching, but canonical completion remains available offline and without provider credentials.

## 8. Reference stack — explicit and reversible

These choices make one reproducible teaching path. Outcomes are assessed at contracts and evidence boundaries, so alternatives can replace them without rewriting the curriculum.

| Boundary | Default reference | Why this default | Reversible seam / allowed alternative |
|---|---|---|---|
| Learner service | Python 3.12 + FastAPI | Familiar AI/data ecosystem and typed HTTP contracts | OpenAPI contract; a TypeScript service can implement the same endpoints |
| Operational data | PostgreSQL + pgvector | One local database for relational, row-policy, and basic vector exercises | Repository and retrieval interfaces permit SQLite/Qdrant/OpenSearch extensions |
| Local orchestration | Docker Compose | Laptop-first and low setup cost | Deployment descriptors remain portable to kind/k3d/Kubernetes |
| Private-deployment extension | kind + Helm + Kubernetes NetworkPolicy | Local simulation of enterprise packaging and egress controls | Optional profile; Compose remains the baseline |
| Identity simulation | Keycloak local realm | Open-source OIDC/SAML/SCIM-adjacent teaching surface | Identity claims fixture and policy interface allow Authentik or commercial IdP extensions |
| Durable approval | SQL-backed reference state machine | Transparent, credential-free, light enough for local labs | Workflow contract permits an optional Temporal implementation |
| Retrieval | PostgreSQL full text + pgvector | Makes pre-retrieval policy filtering inspectable in one store | Retriever interface permits another engine without changing acceptance tests |
| Model path | Deterministic fixture by default; Ollama CPU profile optional | No paid API and reliable grading on modest hardware | OpenAI-compatible adapter permits vLLM, hosted, or GPU profiles as ungraded extensions |
| Telemetry | OpenTelemetry Collector + Jaeger; file/CLI fallback | Vendor-neutral trace semantics with visible local inspection | OTLP permits Grafana/Tempo, Honeycomb, Datadog, or another backend |
| Policy checks | Application policy layer + PostgreSQL row security | Shows defence in depth at service and data planes | Policy contract permits OPA/Cedar extension |

Before implementation, Kit must confirm the Academy repository can package or link this lab stack without bloating the web application. If not, the capstone lab should be a versioned downloadable companion bundle while Academy hosts lessons, missions, quizzes, and evidence instructions.

## 9. Delivery formats

- **Primary:** 12–14 weeks, 8–10 hours per week, self-paced or cohort-supported.
- **Accelerated:** six weeks for experienced platform engineers; same gates, compressed instruction.
- **Default environment:** laptop-first synthetic lab, deterministic fixtures, no mandatory GPU or cloud account.
- **Optional extensions:** hosted lab, commercial IdP, customer-style VPC, Temporal, GPU/vLLM, and hosted model. These are not required for course completion and must have separate cost/operations approval.

## 10. Accessibility, content, and provenance rules

- Every diagram has a prose equivalent; colour is never the only signal.
- Commands are copyable and include expected success/failure output descriptions.
- Labs provide setup, reset, recovery, and low-resource paths.
- Acronyms are expanded at first use; vendor examples are identified as examples, not universal requirements.
- The narrative avoids stereotypes and uses role labels where identity is irrelevant.
- Required notice: “Inspired by Suraj Sharma's 12-stage Forward Deployed Engineering roadmap; curriculum, labs, examples, and assessments are original Redditech Academy material.”
- No source prose, third-party diagrams, production data, production credentials, or trademark treatment implying endorsement may be reused.

## 11. Definition of learning-design done

- All 21 BDD scenarios have a lesson, lab, assessment, or release-gate owner.
- Each module produces at least one machine-checkable result and one customer-readable artefact.
- The clean-room path works without paid APIs, production credentials, or live customer data.
- The independent operator capstone is executable from the submitted runbook.
- Content, technical, security, accessibility, attribution, and originality reviews pass before any merge or publication.

## 12. Approval gate

Nissan approved all 21 scenarios and this learning design on 2026-10-18. Implementation can proceed with the defaults above; no additional stack decision is blocking because each choice has an explicit seam. Separate approval is required for any hosted/GPU tier, paid service, close co-branding with the source roadmap, production deployment, or formal credential beyond a completion/portfolio record.
