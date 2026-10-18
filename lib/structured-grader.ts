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
const NONSENSE = /^(?:foo|bar|baz|blah|test|testing|lorem|ipsum|n\/a|none|something|whatever)$/i;
const CAUSAL_MARKER = /\b(?:because|therefore|caus\w*|lead\w*|result\w*|delay\w*|prevent\w*|block\w*|consume\w*|risk\w*|impact\w*|driv\w*|due to|create\w*|means?)\b/i;
const ACTION_MARKER = /\b(?:ask|confirm|verify|validate|schedule|review|document|obtain|resolve|compare|test|map|interview|align|quantify|inspect|update|measure|agree|record)\w*\b/i;
const PERSON_NAME = /\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/;

interface MissionContract {
  focus: string;
  cause: RegExp;
  effect: RegExp;
  sourceRoles: string[];
  verificationTarget: RegExp;
}

const MISSION_CONTRACTS: Record<string, MissionContract> = {
  "spiced-01-mission": {
    focus: "diagnosis",
    cause: /\b(?:manual onboarding|audit trigger|unverified assumption)\b/i,
    effect: /\b(?:audit exposure|onboarding risk|evidence gap)\b/i,
    sourceRoles: ["hr-director", "operations-lead", "audit-lead"],
    verificationTarget: /\b(?:audit evidence|buyer verification|onboarding process)\b/i,
  },
  "spiced-02-mission": {
    focus: "situation-pain",
    cause: /\b(?:manual re-keying|manual data entry|three systems)\b/i,
    effect: /\b(?:payroll errors?|reconciliation errors?|onboarding friction)\b/i,
    sourceRoles: ["clinic-manager", "payroll-lead", "hr-director"],
    verificationTarget: /\b(?:re-keying evidence|payroll errors?|root cause)\b/i,
  },
  "spiced-03-mission": {
    focus: "impact",
    cause: /\b(?:payroll corrections|correction workload|onboarding errors?)\b/i,
    effect: /\b(?:clinician start delays?|audit findings?|manager workload)\b/i,
    sourceRoles: ["payroll-lead", "clinic-manager", "hr-director"],
    verificationTarget: /\b(?:impact range|correction hours?|clinician delays?)\b/i,
  },
  "spiced-04-mission": {
    focus: "critical-event",
    cause: /\b(?:missing onboarding evidence|uncontrolled onboarding|accreditation gap)\b/i,
    effect: /\b(?:clinic opening delays?|accreditation risk)\b/i,
    sourceRoles: ["accreditation-lead", "operations-lead", "hr-director"],
    verificationTarget: /\b(?:accreditation evidence|reverse timeline|clinic opening dependency)\b/i,
  },
  "spiced-05-mission": {
    focus: "decision-dynamics",
    cause: /\b(?:incomplete security review|unvalidated integration|unclear pilot criteria)\b/i,
    effect: /\b(?:approval delay|coo decision delay|pilot delay)\b/i,
    sourceRoles: ["security-lead", "finance-manager", "payroll-lead", "hr-director", "coo"],
    verificationTarget: /\b(?:security approval|finance approval|pilot criteria|decision process)\b/i,
  },
  "spiced-06-mission": {
    focus: "evidence-hygiene",
    cause: /\b(?:disputed hours estimate|unaccepted architecture|conflicting evidence)\b/i,
    effect: /\b(?:low confidence|forecast risk|evidence gap)\b/i,
    sourceRoles: ["hr-director", "payroll-lead", "security-lead"],
    verificationTarget: /\b(?:hours estimate|security architecture|source contradiction)\b/i,
  },
  "spiced-07-mission": {
    focus: "method-handoff",
    cause: /\b(?:method handoff gap|unmapped qualification gap|incomplete customer handoff)\b/i,
    effect: /\b(?:deal-control risk|customer-success risk|qualification gap)\b/i,
    sourceRoles: ["sales-manager", "customer-success-lead", "account-executive"],
    verificationTarget: /\b(?:method mapping|deal-control gap|customer-success handoff)\b/i,
  },
  "spiced-08-mission": {
    focus: "manager-capstone",
    cause: /\b(?:incomplete security review|disputed impact range|vague pilot criteria)\b/i,
    effect: /\b(?:forecast risk|commit risk|pilot risk)\b/i,
    sourceRoles: ["sales-manager", "security-lead", "hr-director", "coo"],
    verificationTarget: /\b(?:security approval|impact range|pilot criteria)\b/i,
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

function words(value: unknown): string[] {
  if (typeof value !== "string") return [];
  return value.toLowerCase().match(/[a-z0-9]+(?:[-'][a-z0-9]+)*/g) ?? [];
}

function substantive(value: unknown, minimumWords: number): boolean {
  const tokens = words(value);
  if (tokens.length < minimumWords) return false;
  if (tokens.every((token) => NONSENSE.test(token))) return false;
  const unique = new Set(tokens).size;
  if (unique < Math.min(3, minimumWords)) return false;
  return tokens.length < 4 || unique / tokens.length >= 0.6;
}

function validIsoDate(value: unknown): boolean {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day;
}

function asText(value: unknown): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(asText).join(" ");
  if (value && typeof value === "object") return Object.values(value).map(asText).join(" ");
  return "";
}

function normalized(value: unknown): string {
  return asText(value).trim().toLowerCase().replace(/\s+/g, " ");
}

function includesText(container: unknown, expected: unknown): boolean {
  const needle = normalized(expected);
  return needle.length > 0 && normalized(container).includes(needle);
}

function hasOrderedCausalRelation(claim: unknown, cause: unknown, effect: unknown): boolean {
  const text = normalized(claim);
  const causeText = normalized(cause);
  const effectText = normalized(effect);
  if (!causeText || !effectText || causeText === effectText) return false;
  const causeIndex = text.indexOf(causeText);
  const effectIndex = text.indexOf(effectText);
  if (causeIndex < 0 || effectIndex <= causeIndex + causeText.length) return false;
  const relation = text.slice(causeIndex + causeText.length, effectIndex);
  return CAUSAL_MARKER.test(relation);
}

function dateOnOrAfter(later: unknown, earlier: unknown): boolean {
  return validIsoDate(later) && validIsoDate(earlier) && String(later) >= String(earlier);
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

  const evidence = readPath(submission, "submission.evidence");
  if (Array.isArray(evidence)) {
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

  const missionContract = challengeId ? MISSION_CONTRACTS[challengeId] : undefined;
  if (missionContract) {
    const focus = readPath(submission, "submission.analysis.module_focus");
    const cause = readPath(submission, "submission.analysis.cause");
    const effect = readPath(submission, "submission.analysis.effect");
    const claim = readPath(submission, "submission.evidence[0].claim");
    const source = readPath(submission, "submission.evidence[0].source");
    const sourceRole = readPath(submission, "submission.evidence[0].source_role");
    const risk = readPath(submission, "submission.risks_or_unknowns[0]");
    const action = readPath(submission, "submission.next_verification_action.action");
    const target = readPath(submission, "submission.next_verification_action.verification_target");
    const observedAt = readPath(submission, "submission.evidence[0].observed_at");
    const due = readPath(submission, "submission.next_verification_action.due");
    const qualityChecks: Array<[label: string, ok: boolean]> = [
      ["submission.analysis.module_focus must match this mission", focus === missionContract.focus],
      ["submission.analysis.cause must identify the mission's expected cause", substantive(cause, 2) && missionContract.cause.test(asText(cause))],
      ["submission.analysis.effect must identify the mission's expected effect", substantive(effect, 2) && missionContract.effect.test(asText(effect))],
      ["submission.summary must connect the selected cause and effect", substantive(readPath(submission, "submission.summary"), 5) && includesText(readPath(submission, "submission.summary"), cause) && includesText(readPath(submission, "submission.summary"), effect)],
      ["submission.evidence[0].claim must state cause before effect with a causal relationship", substantive(claim, 5) && hasOrderedCausalRelation(claim, cause, effect)],
      ["submission.evidence[0].source_role must be allowed for this mission", typeof sourceRole === "string" && missionContract.sourceRoles.includes(sourceRole)],
      ["submission.evidence[0].source must name a person and match source_role", substantive(source, 3) && PERSON_NAME.test(asText(source)) && includesText(source, String(sourceRole).replace(/-/g, " "))],
      ["submission.evidence[0].observed_at must be a valid ISO date", validIsoDate(observedAt)],
      ["submission.risks_or_unknowns[0] must relate to the selected effect", substantive(risk, 5) && includesText(risk, effect)],
      ["submission.next_verification_action.owner must name a specific owner", substantive(readPath(submission, "submission.next_verification_action.owner"), 1) && normalized(readPath(submission, "submission.next_verification_action.owner")).length >= 2 && !/^(?:someone|team|owner|sales)$/i.test(asText(readPath(submission, "submission.next_verification_action.owner")).trim())],
      ["submission.next_verification_action.verification_target must match this mission", substantive(target, 2) && missionContract.verificationTarget.test(asText(target))],
      ["submission.next_verification_action.action must act on verification_target", substantive(action, 5) && ACTION_MARKER.test(asText(action)) && includesText(action, target)],
      ["submission.next_verification_action.due must be a valid ISO date on or after the evidence date", dateOnOrAfter(due, observedAt)],
    ];

    if (challengeId === "spiced-08-mission") {
      qualityChecks.push(
        ["submission.forecast_risk.level must classify forecast risk", ["low", "medium", "high"].includes(asText(readPath(submission, "submission.forecast_risk.level")))],
        ["submission.forecast_risk.basis must connect the selected effect to forecast risk", substantive(readPath(submission, "submission.forecast_risk.basis"), 5) && includesText(readPath(submission, "submission.forecast_risk.basis"), effect) && /\b(?:forecast|commit|pipeline)\b/i.test(asText(readPath(submission, "submission.forecast_risk.basis")))],
        ["submission.manager_output.forecast_category must be a supported capstone output", ["commit", "best-case", "pipeline", "disqualify"].includes(asText(readPath(submission, "submission.manager_output.forecast_category")))],
        ["submission.manager_output.coaching_question must ask about verification_target", substantive(readPath(submission, "submission.manager_output.coaching_question"), 5) && includesText(readPath(submission, "submission.manager_output.coaching_question"), target) && /\?$/.test(asText(readPath(submission, "submission.manager_output.coaching_question")).trim())],
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
