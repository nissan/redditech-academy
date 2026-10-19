export interface FdeDiscoveryChallenge {
  id?: string;
  type?: string;
  grading?: {
    type?: string;
    contractVersion?: string;
  };
}

export interface FdeDiscoveryGrade {
  pass: boolean;
  score: number;
  feedback: string;
}

type Submission = Record<string, unknown>;
type Check = [label: string, passed: boolean];

const TRUSTED_CHALLENGE_ID = "fde-00-discovery-mission";
const TRUSTED_GRADING_TYPE = "fde-discovery-v1";

function parseSubmission(userInput: Record<string, unknown>): Submission | null {
  const candidate = typeof userInput.json === "string"
    ? (() => {
        try {
          return JSON.parse(userInput.json) as unknown;
        } catch {
          return null;
        }
      })()
    : userInput;
  return candidate && typeof candidate === "object" && !Array.isArray(candidate)
    ? candidate as Submission
    : null;
}

function readPath(input: unknown, field: string): unknown {
  return field
    .replace(/\[(\d+)\]/g, ".$1")
    .split(".")
    .reduce<unknown>((value, key) => {
      if (!value || typeof value !== "object") return undefined;
      return (value as Record<string, unknown>)[key];
    }, input);
}

function equals(input: unknown, expected: unknown): boolean {
  return JSON.stringify(input) === JSON.stringify(expected);
}

function exact(path: string, expected: unknown, submission: Submission): Check {
  return [`${path} must match the trusted HarbourCare contract`, equals(readPath(submission, path), expected)];
}

function finish(checks: Check[]): FdeDiscoveryGrade {
  const failures = checks.filter(([, passed]) => !passed).map(([label]) => label);
  const passed = checks.length - failures.length;
  return {
    pass: failures.length === 0,
    score: checks.length === 0 ? 0 : Number((passed / checks.length).toFixed(2)),
    feedback: failures.length === 0
      ? "Discovery evidence satisfies the pilot rubric and preserves the superseded design in append-only history."
      : `Discovery evidence is incomplete: ${failures.join("; ")}.`,
  };
}

export function isTrustedFdeDiscoveryChallenge(challenge: FdeDiscoveryChallenge): boolean {
  return challenge.id === TRUSTED_CHALLENGE_ID &&
    challenge.type === "json-editor" &&
    challenge.grading?.type === TRUSTED_GRADING_TYPE &&
    challenge.grading.contractVersion === TRUSTED_GRADING_TYPE;
}

export function gradeFdeDiscovery(
  challenge: FdeDiscoveryChallenge,
  userInput: Record<string, unknown>
): FdeDiscoveryGrade {
  if (!isTrustedFdeDiscoveryChallenge(challenge)) {
    return { pass: false, score: 0, feedback: "Challenge is outside the trusted FDE discovery grading boundary." };
  }

  const submission = parseSubmission(userInput);
  if (!submission) {
    return { pass: false, score: 0, feedback: "Submission is not valid JSON." };
  }

  const checks: Check[] = [
    exact("contractVersion", TRUSTED_GRADING_TYPE, submission),
    exact("missionId", TRUSTED_CHALLENGE_ID, submission),
    exact("discovery.customerRequestId", "harbourcare-procurement-assistant-v1", submission),

    exact("discovery.assumptions", [{
      id: "assumption-outbound-internet",
      ownerId: "persona-platform-operator",
      state: "unvalidated",
      validationEvidenceId: "evidence-connectivity-workshop",
    }], submission),

    exact("discovery.stakeholders", [
      { id: "persona-north-procurement", decisionRightId: "accept-pilot-outcomes" },
      { id: "persona-north-security", decisionRightId: "accept-security-risk" },
      { id: "persona-platform-operator", decisionRightId: "accept-operability" },
      { id: "role-fde", decisionRightId: "produce-delivery-evidence" },
    ], submission),

    exact("discovery.outcomes", [
      {
        id: "outcome-cited-answer",
        actorId: "persona-north-procurement",
        behaviourId: "locate-cited-policy-answer",
        measureId: "18-of-20-under-120-seconds",
        safetyConditionId: "no-cross-tenant-context",
        evidenceWindowId: "four-week-pilot",
      },
      {
        id: "outcome-draft-only-purchase",
        actorId: "persona-north-procurement",
        behaviourId: "create-draft-purchase-request",
        measureId: "20-of-20-remain-draft",
        safetyConditionId: "independent-approval-required",
        evidenceWindowId: "four-week-pilot",
      },
    ], submission),

    exact("discovery.architecture", {
      insideBoundaryIds: ["local-user-interface", "policy-gateway", "synthetic-document-index"],
      outsideBoundaryIds: ["live-clinical-data", "production-erp-write", "cloud-model-provider"],
      trustBoundaryIds: ["authenticated-user-to-app", "app-to-synthetic-data"],
    }, submission),

    exact("discovery.risks", [
      {
        id: "risk-connectivity-assumption",
        ownerId: "persona-platform-operator",
        responseId: "validate-before-pilot-entry",
        evidenceId: "evidence-connectivity-workshop",
      },
      {
        id: "risk-source-mislabel",
        ownerId: "persona-north-security",
        responseId: "metadata-quality-and-denial-tests",
        evidenceId: "evidence-metadata-quality-report",
      },
    ], submission),

    exact("discovery.nonGoalIds", [
      "no-live-data",
      "no-production-write",
      "no-approval-policy-replacement",
    ], submission),

    exact("discovery.pilotSow", {
      timeboxId: "four-weeks",
      startDate: "2026-11-02",
      endDate: "2026-11-27",
      deliverableIds: [
        "week-1-discovery-baseline",
        "week-2-local-prototype",
        "week-3-adversarial-evaluation",
        "week-4-handoff-decision",
      ],
      entryCriteriaIds: ["synthetic-fixture-verified", "decision-owners-named"],
      exitCriteriaIds: ["outcome-scorecard-reviewed", "residual-risks-owned"],
      acceptanceOwnerIds: [
        "persona-north-procurement",
        "persona-north-security",
        "persona-platform-operator",
      ],
    }, submission),

    exact("revisionHistory", [
      {
        revisionId: "revision-001-connected-proposal",
        previousRevisionId: null,
        assumptionId: "assumption-outbound-internet",
        designId: "design-cloud-dependent-observability",
        status: "superseded",
      },
      {
        revisionId: "revision-002-disconnected-production",
        previousRevisionId: "revision-001-connected-proposal",
        invalidAssumptionId: "assumption-outbound-internet",
        constraintId: "constraint-disconnected-production",
        affectedComponentIds: ["cloud-model-provider", "outbound-observability"],
        selectedAlternativeId: "alternative-local-cpu-fixture-stack",
        remainingRiskId: "risk-local-quality-latency-gap",
        status: "accepted",
      },
    ], submission),
  ];

  return finish(checks);
}
