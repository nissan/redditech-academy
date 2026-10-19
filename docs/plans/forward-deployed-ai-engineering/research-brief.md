# Forward Deployed Engineering Course — Research Brief

**Date:** 2026-10-18
**Status:** Approved research input; no implementation or publication
**Requested reference:** [Suraj Sharma's X post](https://x.com/suraj_sharma14/status/2111064620610044039)

## 1. What the framework actually is

The linked post is a **12-stage learning roadmap for modern Forward Deployed Engineering (FDE)**, especially the work of moving an AI prototype into a customer's real enterprise environment. Each stage uses the same instructional pattern:

1. a capability to learn;
2. a practical build exercise; and
3. a commercial or operational reason the capability matters.

Its stages cover, in order: enterprise identity and access; private/air-gapped deployment; legacy-data ingestion; permission-aware retrieval; MCP and legacy-system integration; AI guardrails and PII handling; human approval workflows; local/on-prem inference; observability and customer value; customer-specific evaluations; technical discovery and scoping; and operational handoff/self-service.

**Important provenance finding:** this is best described as **Suraj Sharma's proposed FDE roadmap**, not a named industry standard or a formal certification framework. The post is the primary source for the 12-stage sequence. The underlying technologies and practices have separate standards and first-party documentation, listed below.

## 2. Recommended Academy positioning

**Working title:** *Forward Deployed AI Engineering: From Prototype to Enterprise Production*

**Promise:** Learners take one fictional enterprise AI assistant from discovery through secure deployment, customer-data evaluation, production operations, and handoff.

**Positioning:** An applied systems-integration course, not a collection of isolated tool tutorials. The learner repeatedly makes evidence-backed trade-offs across security, deployment, data, reliability, value, and adoption.

### Audience

- Mid-level software, platform, data, ML, or solutions engineers moving into customer-facing AI delivery.
- Technical founders and solutions architects responsible for enterprise pilots.
- Strong junior engineers may participate with a preparatory track.

### Prerequisites

- Comfortable with one backend language, HTTP/REST, SQL, Git, Docker, and basic cloud networking.
- Able to read YAML/JSON and use a command line.
- Familiarity with LLM APIs and embeddings is helpful but not sufficient on its own.
- Recommended pre-course primer: authentication basics, relational data modelling, containers, and threat modelling.

### Learning outcomes

By the end, a learner should be able to:

1. Turn an ambiguous enterprise AI request into a bounded architecture, statement of work, success metrics, and risk register.
2. Enforce tenant, role, document, and action-level authorization end to end.
3. Package and deploy an AI workload into a private, egress-controlled environment using reproducible infrastructure.
4. Reconcile messy enterprise data into traceable relational and retrieval stores.
5. Integrate models with legacy systems without exposing raw credentials or granting unsafe write authority.
6. Add deterministic safety controls, PII handling, audit evidence, human approvals, and failure recovery.
7. Operate local inference and quantify latency, quality, cost, and capacity trade-offs.
8. Instrument product health and prove value with customer-specific, calibrated evaluations.
9. Hand the system to customer operators with runbooks, admin controls, onboarding, and resilience tests.

## 3. Proposed module sequence

Use a single fictional customer throughout: **HarbourCare**, a regulated healthcare procurement organisation with multiple business units, scanned supplier records, a legacy ERP, sensitive staff data, and an on-prem requirement. All data, identities, and systems should be synthetic.

| # | Module | Core instruction | Applied lab | Assessment evidence |
|---|---|---|---|---|
| 0 | FDE operating model and discovery | Role boundaries, stakeholder mapping, constraints, architecture decisions, measurable outcomes | Convert a vague executive request into an assumptions log, context diagram, risk register, and four-week pilot SOW | Discovery brief scored for scope, measurable outcomes, risks, and explicit non-goals |
| 1 | Enterprise identity and tenant isolation | OAuth 2.0, OIDC, SAML concepts, SCIM lifecycle, RBAC/ABAC, PostgreSQL row security, service identities | Connect a mock identity provider; provision/deprovision users; prove cross-tenant queries fail | Adversarial authorization tests plus access-control matrix |
| 2 | Private and disconnected deployment | Kubernetes primitives, Helm packaging, Terraform modules, private registries, network policy, dependency mirroring, egress denial | Deploy the course stack into a simulated private VPC, then repeat from an offline artifact bundle | Reproducible deployment, zero-egress test, rollback evidence, software-bill-of-materials inventory |
| 3 | Legacy data ingestion and reconciliation | OCR confidence, parsing, schema contracts, orchestration, transformations, lineage, reconciliation and quarantine | Ingest synthetic scanned invoices and ERP exports; reconcile totals and quarantine low-confidence records | Data-quality report, lineage map, reconciliation thresholds, replay/idempotency test |
| 4 | Authorization-aware retrieval | Hybrid retrieval, metadata design, document/chunk authorization, citations, abstention, prompt-injection boundaries | Build retrieval that applies authorization before model context assembly and returns traceable citations | Leak-resistance suite, groundedness checks, denied-document tests, abstention cases |
| 5 | Safe tools, MCP, and legacy integration | MCP architecture, tool contracts, REST/SOAP adapters, credential brokering, least privilege, rate limits, idempotent writes | Expose a sandbox ERP through read and guarded-write tools; require scoped identity and validate arguments | Tool threat model, contract tests, replay/rate-limit tests, credential-exposure scan |
| 6 | Guardrails, sensitive-data handling, and audit | Data classification, deterministic detectors, NER limitations, tokenisation/pseudonymisation, input/output validation, immutable audit metadata | Build a policy proxy that detects, replaces, and safely restores synthetic sensitive fields | Precision/recall test set, bypass tests, audit trace, documented residual risks |
| 7 | Durable human approval workflows | State machines, durable execution, retries, compensation, webhooks, approval policy, separation of duties | Pause a high-value purchase action for manager approval; survive worker restart and duplicate callbacks | State-transition tests, timeout/rejection paths, replay safety, auditable approver identity |
| 8 | On-prem and edge inference | Model formats, quantisation, serving with vLLM/Ollama, GPU/CPU sizing, batching, isolation, model licensing | Serve a small open model locally and benchmark two quantisation/serving configurations | Quality/latency/throughput/cost scorecard plus deployment decision memo |
| 9 | Observability and customer health | OpenTelemetry traces/metrics/logs, SLOs, model/tool spans, usage attribution, cost and value telemetry | Instrument one request across retrieval, model, tools, and approval; build a customer-health dashboard | Trace completeness, alert exercise, unit economics, defensible value metric |
| 10 | Customer-data evaluation and shadowing | Golden sets, rubric design, trajectory/tool grading, judge calibration, error taxonomy, shadow tests, release gates | Build a synthetic historical-ticket set, calibrate automated grading against human labels, and run shadow mode | Evaluation card with confidence intervals, disagreement analysis, release recommendation |
| 11 | Handoff, self-service, and resilience | Runbooks, admin permissions, configuration versioning, onboarding, incident drills, chaos tests, knowledge transfer | Add a scoped admin console; execute backup/restore and operator handoff drills | Operator task test, recovery-time evidence, runbook review, unresolved-risk register |

### Sequence adjustment from the source

The source places discovery/scoping near the end. For instruction, it should become **Module 0** because every later design decision needs a customer problem, constraints, and success measures. The remaining technical sequence preserves the source's dependency chain. Handoff remains last.

## 4. Course mechanics, labs, and assessment

### Whole-course project

Every module advances the HarbourCare deployment. Learners maintain an evidence repository containing architecture decision records, policies, tests, dashboards, evaluation results, and runbooks. This makes the course assess delivery competence rather than vocabulary recall.

### Suggested assessment mix

- **12 short knowledge checks (15%)** — terminology, standards, and design trade-offs.
- **Module lab evidence (45%)** — executable tests and operational artefacts, not screenshots alone.
- **Two customer review simulations (15%)** — security review after Module 6; value/release review after Module 10.
- **Final handoff capstone (25%)** — another learner or assessor operates and recovers the system from the submitted runbook.

### Capstone acceptance gates

- Cross-tenant and unauthorised-document leakage tests pass.
- Default-deny egress and least-privilege tool policies are demonstrated.
- High-impact writes cannot execute without the required approval.
- No raw synthetic secrets or sensitive values appear in model traces or audit output.
- Failure/retry/replay paths are deterministic and recoverable.
- Customer-specific evaluation results include human calibration and stated uncertainty.
- An operator unfamiliar with the build can deploy, observe, roll back, and restore it.

### Delivery shape

- Recommended: 12–14 weeks, 8–10 hours/week, or an accelerated six-week cohort for experienced platform engineers.
- Each module: scenario first, design decision, build lab, adversarial test, customer-facing explanation, and retrospective.
- Provide a local Docker/Kubernetes simulation by default; cloud, commercial IdP, proprietary ERP, paid model, and GPU paths should be optional extensions.

## 5. Original-teaching and IP boundary

Redditech can safely create an original course **about the underlying engineering practices** while crediting the post as inspiration for the high-level roadmap.

### Safe to create originally

- Original explanations of public standards and documented technologies.
- A distinct course narrative, architecture, synthetic datasets, diagrams, source code, labs, rubrics, quizzes, and assessment criteria.
- Redditech's own sequencing decision, threat models, operational gates, design reviews, and cross-module capstone.
- Short factual labels for technologies and capabilities, with links to official specifications.

### Avoid or obtain permission for

- Reproducing the post's full prose, its repeated “Learn / Practice / Why” copy, distinctive metaphors, or its 12 descriptions verbatim.
- Presenting the roadmap as a Redditech invention or as an official Palantir/Suraj Sharma certification.
- Copying vendor tutorials, diagrams, courseware, customer data, product screenshots, or proprietary ERP/identity-system content.
- Using production credentials, real patient/employee data, licensed models without compatible terms, or third-party trademarks in a way that suggests endorsement.

**Recommended attribution:** “Inspired by Suraj Sharma's 12-stage Forward Deployed Engineering roadmap; curriculum, labs, examples, and assessments are original Redditech Academy material.” This should receive normal editorial/legal review before publication.

## 6. Primary and first-party source map

The source post establishes the proposed sequence; the references below should anchor technical accuracy. Vendor-specific examples should be treated as implementations, not universal requirements.

| Course area | Primary / first-party sources | Teaching use |
|---|---|---|
| Roadmap provenance | [Original X post](https://x.com/suraj_sharma14/status/2111064620610044039) | Credit the 12-stage inspiration; do not copy its prose wholesale |
| Identity and provisioning | [OAuth 2.0 — RFC 6749](https://www.rfc-editor.org/rfc/rfc6749), [OpenID Connect Core 1.0](https://openid.net/specs/openid-connect-core-1_0.html), [SCIM Protocol — RFC 7644](https://www.rfc-editor.org/rfc/rfc7644), [SAML 2.0 Core](https://docs.oasis-open.org/security/saml/v2.0/saml-core-2.0-os.pdf), [PostgreSQL row security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html) | Separate authentication, delegated authorization, provisioning, federation, and data-plane enforcement |
| Private deployment | [Kubernetes NetworkPolicy](https://kubernetes.io/docs/concepts/services-networking/network-policies/), [Helm chart best practices](https://helm.sh/docs/chart_best_practices/), [Terraform modules](https://developer.hashicorp.com/terraform/language/modules) | Build reproducible, default-deny deployments and explain what each layer does |
| Data pipelines | [Apache Airflow core concepts](https://airflow.apache.org/docs/apache-airflow/stable/core-concepts/index.html), [dbt Developer Hub](https://docs.getdbt.com/), [Tesseract OCR](https://github.com/tesseract-ocr/tesseract) | Teach orchestration, transformation/testing, OCR uncertainty, lineage, and reconciliation |
| Retrieval and AI threats | [NIST AI RMF 1.0](https://www.nist.gov/itl/ai-risk-management-framework), [OWASP Top 10 for LLM Applications](https://genai.owasp.org/llm-top-10/) | Frame retrieval leakage, prompt injection, excessive agency, validation, monitoring, and residual risk |
| MCP and tool integration | [Model Context Protocol specification](https://modelcontextprotocol.io/specification/latest) | Teach protocol roles and security boundaries from the maintained specification |
| Sensitive information | [NIST SP 800-122: Protecting PII](https://csrc.nist.gov/pubs/sp/800/122/final) | Ground classification, minimisation, protection, incident response, and limitations of redaction |
| Durable workflows | [Temporal durable execution](https://docs.temporal.io/temporal), [Temporal human-in-the-loop pattern](https://docs.temporal.io/ai-cookbook/human-in-the-loop-python) | Explain replay-safe workflows and approval waits without tying the concept to a chat product |
| Local inference | [vLLM documentation](https://docs.vllm.ai/), [Ollama documentation](https://docs.ollama.com/), [NVIDIA MIG user guide](https://docs.nvidia.com/datacenter/tesla/mig-user-guide/) | Compare serving, quantisation, throughput, isolation, and hardware constraints |
| Observability and reliability | [OpenTelemetry documentation](https://opentelemetry.io/docs/), [Google SRE: Monitoring Distributed Systems](https://sre.google/sre-book/monitoring-distributed-systems/) | Define signals, traces, SLOs, alert quality, and customer-level cost/value attribution |
| Evaluations | [OpenAI evaluation best practices](https://platform.openai.com/docs/guides/evaluation-best-practices), [NIST AI RMF Playbook](https://airc.nist.gov/airmf-resources/playbook/) | Teach task-specific datasets, human calibration, uncertainty, release gates, and continuous monitoring |
| Handoff and resilience | [Google SRE Workbook](https://sre.google/workbook/table-of-contents/), [Principles of Chaos Engineering](https://principlesofchaos.org/) | Design runbooks, incident exercises, recovery evidence, and controlled resilience experiments |

## 7. Key research conclusions

1. The strongest course thesis is **enterprise AI delivery under real constraints**, not “learn twelve fashionable tools.”
2. Security must be end-to-end: identity claims alone do not prevent data or tool leakage; enforcement needs to survive retrieval, model context, tool calls, databases, and audit paths.
3. Each module should end in testable evidence that a customer security, operations, or business stakeholder could inspect.
4. Discovery belongs first, while customer-specific evaluation and operational handoff form the final proof that the deployment is valuable and transferable.
5. A synthetic, local-first environment is essential for accessibility, privacy, repeatability, and avoiding mandatory paid services.
6. The source's specific products are useful examples, but learning outcomes should be vendor-neutral and assessed through transferable principles.

## 8. Unresolved product decisions

1. **Course level:** one advanced flagship course, or a foundations course plus an advanced deployment practicum?
2. **Primary learner:** hands-on engineer, solutions architect, technical founder, or mixed cohort? This changes prerequisite depth and assessment style.
3. **Reference stack:** TypeScript or Python; PostgreSQL plus which retrieval layer; Kubernetes distribution; workflow engine; local model runtime.
4. **Environment target:** laptop-only simulation, hosted lab, or optional customer-style VPC/GPU tier? Hosted/GPU options create cost and operations commitments.
5. **Identity simulation:** open-source local IdP by default, with optional Okta/Azure AD extension, or commercial sandboxes as the main path?
6. **Scope:** include technical discovery as Module 0 (recommended) or preserve the source order exactly?
7. **Credential:** completion certificate, assessed micro-credential, or portfolio capstone only? Avoid “certification” claims without a formal standard and governance process.
8. **Attribution/permission:** is citation to the source post sufficient for the desired marketing treatment, or should Redditech seek the author's permission for close branding around the 12-stage roadmap?
9. **Industry scenario:** keep healthcare procurement, or choose banking/government/supply chain to better match Redditech's target buyers?
10. **Existing-course overlap:** decide which identity, agentic-systems, benchmarking, and OpenClaw materials are reused by reference versus rewritten so the new course is coherent without duplicating content.

## 9. Recommended next step

Approve the audience, delivery format, reference stack, and attribution approach. Then convert this brief into a learning-experience specification and a module-by-module build plan before touching the Academy application.
