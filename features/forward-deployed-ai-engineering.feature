Feature: Forward Deployed AI Engineering flagship course
  As an engineer or solutions architect delivering AI into a regulated enterprise
  I want to practise the complete path from discovery to operational handoff
  So that I can produce customer-inspectable evidence that a deployment is secure, useful, and supportable

  Background:
    Given HarbourCare is a fictional regulated procurement organisation
    And every identity, document, transaction, credential, and business value is synthetic
    And the core course can run locally without a paid API

  @FDE-01 @happy
  Scenario: Learner follows one bounded customer engagement
    Given the learner has access to the protected Academy course
    When they open the Forward Deployed AI Engineering course
    Then they see 12 ordered modules, prerequisites, effort estimates, the HarbourCare capstone, and an independent-course attribution notice

  @FDE-02 @happy
  Scenario: Learner converts ambiguity into an executable pilot
    Given HarbourCare provides an ambiguous request for an AI procurement assistant
    When the learner completes technical discovery
    Then the evidence repository contains assumptions, stakeholders, measurable outcomes, architecture boundaries, risks, non-goals, and a time-bounded pilot statement of work

  @FDE-03 @edge
  Scenario: Discovery exposes a constraint that invalidates the first design
    Given the initial design assumes outbound internet access
    And HarbourCare later declares a disconnected production environment
    When the learner revises the pilot design
    Then the decision record identifies the invalid assumption, affected components, selected alternative, and remaining risk without silently rewriting history

  @FDE-04 @happy
  Scenario: Identity and authorisation remain tenant-safe end to end
    Given synthetic users have different tenant, role, document, and action permissions
    When an authorised user requests permitted information
    Then the system returns only permitted evidence with traceable policy decisions

  @FDE-05 @bug-guard
  Scenario: Cross-tenant access is denied before retrieval or tool execution
    Given a user presents a valid identity for another HarbourCare business unit
    When they query a restricted document or invoke a restricted action
    Then the request is denied before protected content reaches model context or a downstream tool
    And the audit record contains metadata but no restricted content or raw credential

  @FDE-06 @happy
  Scenario: Learner produces a reproducible private deployment
    Given the reference services and dependencies have been packaged locally
    When the learner deploys the capstone with default-deny egress
    Then health checks, network-policy tests, software inventory, rollback, and restore evidence pass from documented commands

  @FDE-07 @edge
  Scenario: Disconnected deployment uses a prepared artifact bundle
    Given the network is unavailable after the artifact bundle is prepared
    When the learner repeats deployment in the disconnected profile
    Then no undeclared download is attempted and the deployment either succeeds or reports the exact missing artifact without weakening egress policy

  @FDE-08 @happy
  Scenario: Messy legacy records become traceable data products
    Given synthetic scanned invoices and ERP exports contain duplicates, schema drift, and uncertain OCR fields
    When the learner runs ingestion and reconciliation
    Then accepted and quarantined records have lineage, confidence, reconciliation totals, and replay-safe identifiers

  @FDE-09 @bug-guard
  Scenario: Replaying ingestion does not duplicate business records
    Given an ingestion batch has already completed
    When the same batch is retried after an interruption
    Then idempotency tests show no duplicate accepted records and unresolved low-confidence records remain quarantined

  @FDE-10 @happy
  Scenario: Retrieval is grounded and permission-aware
    Given the corpus contains permitted, denied, irrelevant, and adversarial synthetic documents
    When the learner runs the retrieval evaluation suite
    Then permitted answers cite authorised sources, denied content is absent, unsupported questions abstain, and injection text cannot override policy

  @FDE-11 @happy
  Scenario: Legacy tools expose least-privilege contracts
    Given a sandbox ERP offers read operations and a high-impact purchase write
    When the learner invokes its typed tool interface
    Then identity scope, argument schema, rate limits, credential brokering, and idempotency are enforced before the ERP adapter executes

  @FDE-12 @bug-guard
  Scenario: Unsafe tool input and replay are contained
    Given a request contains an undeclared field, excessive amount, stale approval, or repeated idempotency key
    When the request reaches the tool boundary
    Then it is rejected or returns the original terminal result without duplicate side effects
    And no raw credential is exposed to the learner, model, trace, or audit output

  @FDE-13 @happy
  Scenario: Sensitive data policy is measurable
    Given a labelled synthetic test set contains sensitive and non-sensitive values
    When the learner applies classification, minimisation, pseudonymisation, and output checks
    Then the evidence includes precision, recall, bypass results, an audit trace, and documented residual risk

  @FDE-14 @bug-guard
  Scenario: Approval survives retries and worker restarts
    Given a high-impact purchase requires a different manager to approve it
    When the worker restarts and duplicate callbacks arrive before and after a decision
    Then one durable terminal outcome is recorded, separation of duties is preserved, and the write occurs at most once

  @FDE-15 @edge
  Scenario: Local inference remains operable on a CPU-only laptop
    Given no paid model API or GPU is available
    When the learner runs the baseline inference and evaluation profile
    Then deterministic fixtures and the documented CPU-capable local path produce comparable quality, latency, throughput, and resource evidence
    And GPU or hosted-model exercises remain optional extensions

  @FDE-16 @happy
  Scenario: Observability connects reliability to customer value
    Given a request crosses retrieval, policy, model, tool, and approval boundaries
    When the learner inspects telemetry
    Then correlated traces, service-level indicators, cost or resource attribution, alerts, and a defensible customer-value metric are visible without sensitive payload leakage

  @FDE-17 @happy
  Scenario: Customer-specific evaluation supports a release decision
    Given a versioned synthetic golden set and human-labelled sample
    When the learner calibrates automated grading and runs shadow evaluation
    Then the evaluation card reports error categories, grader disagreement, uncertainty, regressions, and an evidence-backed release recommendation

  @FDE-18 @edge
  Scenario: Evaluation disagreement blocks unsupported confidence
    Given human and automated grades diverge beyond the declared threshold
    When the learner prepares the customer review
    Then the release gate remains blocked or explicitly excepted with owner, rationale, expiry, and follow-up evidence

  @FDE-19 @happy
  Scenario: A new operator can take over the system
    Given an operator did not participate in the build
    When they follow the submitted runbook
    Then they can configure, deploy, observe, roll back, back up, restore, and diagnose the capstone within the stated recovery targets

  @FDE-20 @bug-guard
  Scenario: Course materials remain original and vendor-neutral
    Given the course is inspired by Suraj Sharma's 12-stage roadmap
    When content, diagrams, labs, assessments, and marketing copy are reviewed
    Then the source is credited as inspiration, no source prose is reproduced wholesale, no affiliation or certification is implied, and assessed outcomes do not require one proprietary vendor

  @FDE-21 @bug-guard
  Scenario: The Academy build introduces no paid or live-environment dependency
    Given the course content and lab package are ready for review
    When automated and manual release gates run
    Then course inventory, links, schemas, tests, type-check, build, accessibility checks, deterministic grading, clean-room setup, and secret scans pass
    And no production deployment, live customer data, production credential, or paid inference call is used
