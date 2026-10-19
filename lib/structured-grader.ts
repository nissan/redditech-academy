export interface StructuredValidation {
  must_have?: Array<{
    field?: string;
    non_empty?: boolean;
    allowed_values?: string[];
  }>;
  must_not_have?: Array<{ field?: string; value?: string }>;
}

export interface StructuredGrade {
  pass: boolean;
  score: number;
  feedback: string;
}

const PLACEHOLDER = /^(?:__FILL_IN__|YYYY-MM-DD|unknown|tbd)$/i;
interface MissionContract {
  moduleFocusId: string;
  evidenceId: string;
  personId: string;
  roleId: string;
  causeId: string;
  relationshipId: string;
  effectId: string;
  riskId: string;
  verificationTargetId: string;
  actionId: string;
  observedAt: string;
  due: string;
}

const MISSION_CONTRACTS: Record<string, MissionContract> = {
  "spiced-01-mission": {
    moduleFocusId: "spiced-01-diagnosis",
    evidenceId: "northstar-internal-audit-01",
    personId: "northstar-morgan-lee",
    roleId: "northstar-hr-director",
    causeId: "manual-onboarding",
    relationshipId: "creates",
    effectId: "audit-exposure",
    riskId: "audit-control-unverified",
    verificationTargetId: "audit-evidence",
    actionId: "confirm-audit-evidence",
    observedAt: "2026-07-27",
    due: "2026-08-10",
  },
  "spiced-02-mission": {
    moduleFocusId: "spiced-02-situation-pain",
    evidenceId: "northstar-payroll-rekey-01",
    personId: "northstar-riley-patel",
    roleId: "northstar-payroll-lead",
    causeId: "manual-rekeying",
    relationshipId: "causes",
    effectId: "payroll-errors",
    riskId: "reconciliation-errors-unquantified",
    verificationTargetId: "root-cause",
    actionId: "validate-root-cause",
    observedAt: "2026-07-27",
    due: "2026-08-10",
  },
  "spiced-03-mission": {
    moduleFocusId: "spiced-03-impact",
    evidenceId: "northstar-correction-hours-01",
    personId: "northstar-riley-patel",
    roleId: "northstar-payroll-lead",
    causeId: "payroll-corrections",
    relationshipId: "delays",
    effectId: "clinician-starts",
    riskId: "impact-range-disputed",
    verificationTargetId: "impact-range",
    actionId: "verify-impact-range",
    observedAt: "2026-07-27",
    due: "2026-08-10",
  },
  "spiced-04-mission": {
    moduleFocusId: "spiced-04-critical-event",
    evidenceId: "northstar-accreditation-01",
    personId: "northstar-jordan-kim",
    roleId: "northstar-accreditation-lead",
    causeId: "missing-control-evidence",
    relationshipId: "threatens",
    effectId: "clinic-openings",
    riskId: "accreditation-deadline",
    verificationTargetId: "reverse-timeline",
    actionId: "confirm-reverse-timeline",
    observedAt: "2026-07-27",
    due: "2026-08-10",
  },
  "spiced-05-mission": {
    moduleFocusId: "spiced-05-decision-dynamics",
    evidenceId: "northstar-approval-chain-01",
    personId: "northstar-sam-torres",
    roleId: "northstar-security-lead",
    causeId: "incomplete-security-review",
    relationshipId: "blocks",
    effectId: "coo-approval",
    riskId: "approval-sequence-unclear",
    verificationTargetId: "decision-process",
    actionId: "map-decision-process",
    observedAt: "2026-07-27",
    due: "2026-08-10",
  },
  "spiced-06-mission": {
    moduleFocusId: "spiced-06-evidence-hygiene",
    evidenceId: "northstar-evidence-conflict-01",
    personId: "northstar-riley-patel",
    roleId: "northstar-payroll-lead",
    causeId: "disputed-hours-estimate",
    relationshipId: "reduces",
    effectId: "evidence-confidence",
    riskId: "source-contradiction",
    verificationTargetId: "source-contradiction",
    actionId: "resolve-source-contradiction",
    observedAt: "2026-07-27",
    due: "2026-08-10",
  },
  "spiced-07-mission": {
    moduleFocusId: "spiced-07-method-handoff",
    evidenceId: "northstar-method-handoff-01",
    personId: "northstar-alex-ng",
    roleId: "northstar-sales-manager",
    causeId: "method-handoff-gap",
    relationshipId: "creates",
    effectId: "deal-control-risk",
    riskId: "qualification-gap",
    verificationTargetId: "method-mapping",
    actionId: "validate-method-mapping",
    observedAt: "2026-07-27",
    due: "2026-08-10",
  },
  "spiced-08-mission": {
    moduleFocusId: "spiced-08-manager-capstone",
    evidenceId: "northstar-capstone-risk-01",
    personId: "northstar-sam-torres",
    roleId: "northstar-security-lead",
    causeId: "incomplete-security-review",
    relationshipId: "creates",
    effectId: "forecast-risk",
    riskId: "pilot-criteria-vague",
    verificationTargetId: "pilot-criteria",
    actionId: "confirm-pilot-criteria",
    observedAt: "2026-07-27",
    due: "2026-08-10",
  },
};

function readPath(input: unknown, field: string): unknown {
  const keys = field.replace(/\[(\d+)\]/g, ".$1").split(".");
  return keys.reduce<unknown>((value, key) => {
    if (!value || typeof value !== "object") return undefined;
    return (value as Record<string, unknown>)[key];
  }, input);
}

function meaningful(value: unknown): boolean {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 && !PLACEHOLDER.test(trimmed);
  }
  if (Array.isArray(value)) return value.length > 0 && value.every(meaningful);
  if (value && typeof value === "object") {
    const values = Object.values(value as Record<string, unknown>);
    return values.length > 0 && values.every(meaningful);
  }
  return value !== undefined && value !== null;
}

function validIsoDate(value: unknown): boolean {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day;
}

function parseSubmission(userInput: Record<string, unknown>): unknown {
  if (typeof userInput.json !== "string") return userInput;
  try {
    return JSON.parse(userInput.json);
  } catch {
    return null;
  }
}

export function gradeStructured(
  validation: StructuredValidation,
  userInput: Record<string, unknown>,
  challengeId?: string
): StructuredGrade | null {
  const required = validation.must_have ?? [];
  const forbidden = validation.must_not_have ?? [];
  if (required.length === 0 && forbidden.length === 0) return null;

  const submission = parseSubmission(userInput);
  if (!submission) return { pass: false, score: 0, feedback: "Submission is not valid JSON." };

  const failures: string[] = [];
  let checks = 0;
  let passed = 0;

  for (const rule of required) {
    if (!rule.field) continue;
    checks++;
    const value = readPath(submission, rule.field);
    const present = rule.non_empty ? meaningful(value) : value !== undefined && value !== null;
    const allowed = !rule.allowed_values ||
      (typeof value === "string" && rule.allowed_values.includes(value));
    const ok = present && allowed;
    if (ok) passed++;
    else failures.push(`${rule.field} is missing, empty, or still contains a placeholder`);
  }

  for (const rule of forbidden) {
    if (!rule.field) continue;
    checks++;
    const value = readPath(submission, rule.field);
    const ok = rule.value === undefined ? value === undefined : value !== rule.value;
    if (ok) passed++;
    else failures.push(`${rule.field} contains a forbidden value`);
  }

  const missionContract = challengeId ? MISSION_CONTRACTS[challengeId] : undefined;
  const evidence = readPath(submission, "submission.evidence");
  if (!missionContract && Array.isArray(evidence)) {
    for (const [index, item] of evidence.entries()) {
      if (!item || typeof item !== "object") continue;
      const record = item as Record<string, unknown>;
      if (
        record.status === "buyer-verified" &&
        typeof record.source === "string" &&
        /\b(?:seller|sales rep|account executive|nimbushr|our team|we inferred)\b/i.test(record.source)
      ) {
        checks++;
        failures.push(`submission.evidence[${index}] cannot be buyer-verified from a seller-authored source`);
      }
    }
  }

  if (missionContract) {
    const contractChecks: Array<[path: string, expected: string]> = [
      ["submission.analysis.module_focus_id", missionContract.moduleFocusId],
      ["submission.analysis.cause_id", missionContract.causeId],
      ["submission.analysis.relationship_id", missionContract.relationshipId],
      ["submission.analysis.effect_id", missionContract.effectId],
      ["submission.evidence[0].evidence_id", missionContract.evidenceId],
      ["submission.evidence[0].person_id", missionContract.personId],
      ["submission.evidence[0].role_id", missionContract.roleId],
      ["submission.evidence[0].observed_at", missionContract.observedAt],
      ["submission.evidence[0].status", "buyer-verified"],
      ["submission.evidence[0].confidence", "high"],
      ["submission.risk_assessment.risk_id", missionContract.riskId],
      ["submission.risk_assessment.evidence_id", missionContract.evidenceId],
      ["submission.risk_assessment.cause_id", missionContract.causeId],
      ["submission.risk_assessment.effect_id", missionContract.effectId],
      ["submission.next_verification_action.action_id", missionContract.actionId],
      ["submission.next_verification_action.verification_target_id", missionContract.verificationTargetId],
      ["submission.next_verification_action.evidence_id", missionContract.evidenceId],
      ["submission.next_verification_action.risk_id", missionContract.riskId],
      ["submission.next_verification_action.due", missionContract.due],
    ];

    const qualityChecks: Array<[label: string, ok: boolean]> = contractChecks.map(
      ([path, expected]) => [`${path} must match the trusted mission contract`, readPath(submission, path) === expected]
    );
    qualityChecks.push(
      ["submission.evidence[0].observed_at must be a valid ISO date", validIsoDate(readPath(submission, "submission.evidence[0].observed_at"))],
      ["submission.next_verification_action.due must be a valid ISO date", validIsoDate(readPath(submission, "submission.next_verification_action.due"))],
    );

    if (challengeId === "spiced-08-mission") {
      qualityChecks.push(
        ["submission.forecast_risk.risk_id must reference the trusted risk", readPath(submission, "submission.forecast_risk.risk_id") === missionContract.riskId],
        ["submission.forecast_risk.evidence_id must reference the trusted evidence", readPath(submission, "submission.forecast_risk.evidence_id") === missionContract.evidenceId],
        ["submission.forecast_risk.effect_id must reference the trusted effect", readPath(submission, "submission.forecast_risk.effect_id") === missionContract.effectId],
        ["submission.forecast_risk.level must match the capstone contract", readPath(submission, "submission.forecast_risk.level") === "high"],
        ["submission.manager_output.forecast_category must match the capstone contract", readPath(submission, "submission.manager_output.forecast_category") === "pipeline"],
        ["submission.manager_output.action_id must reference the trusted action", readPath(submission, "submission.manager_output.action_id") === missionContract.actionId],
        ["submission.manager_output.verification_target_id must reference the trusted target", readPath(submission, "submission.manager_output.verification_target_id") === missionContract.verificationTargetId],
        ["submission.manager_output.risk_id must reference the trusted risk", readPath(submission, "submission.manager_output.risk_id") === missionContract.riskId],
      );
    }

    for (const [label, ok] of qualityChecks) {
      checks++;
      if (ok) passed++;
      else failures.push(label);
    }
  }

  return {
    pass: failures.length === 0,
    score: checks === 0 ? 0 : Number((passed / checks).toFixed(2)),
    feedback: failures.length === 0
      ? "Required evidence fields are complete. Now verify the claims with the buyer."
      : `Complete the evidence record: ${failures.join("; ")}.`,
  };
}
