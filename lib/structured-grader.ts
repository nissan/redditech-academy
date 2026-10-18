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
const PROVENANCE_MARKER = /(?:\b[A-Z][a-z]+\s+[A-Z][a-z]+\b|\b(?:director|lead|manager|officer|buyer|stakeholder|payroll|security|finance|coo|hr)\b)/;

const MISSION_FOCUS: Record<string, RegExp> = {
  "spiced-01-mission": /\b(?:diagnos\w*|evidence|unknown\w*|contradiction\w*|audit|onboarding)\b/i,
  "spiced-02-mission": /\b(?:situation|pain|re-key\w*|system\w*|payroll|friction|error\w*|root cause|onboarding)\b/i,
  "spiced-03-mission": /\b(?:impact|hours?|monthly|delay\w*|audit|clinician\w*|consequence\w*|range)\b/i,
  "spiced-04-mission": /\b(?:critical event|accreditation|november|clinic opening\w*|timeline|milestone\w*|dependenc\w*)\b/i,
  "spiced-05-mission": /\b(?:decision|security|finance|coo|pilot|approval|criteria|payroll|hr)\b/i,
  "spiced-06-mission": /\b(?:discovery|hr director|payroll|disput\w*|security|architecture|evidence|provenance|conversation)\b/i,
  "spiced-07-mission": /\b(?:spin|challenger|meddpicc|handoff|customer success|audit risk|method)\b/i,
  "spiced-08-mission": /\b(?:forecast|risk|security|pilot|signer|impact|event|coaching|manager)\b/i,
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
  return new Set(tokens).size >= Math.min(3, minimumWords);
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

  if (challengeId && MISSION_FOCUS[challengeId]) {
    const qualityChecks: Array<[label: string, ok: boolean]> = [
      ["submission.summary must be a substantive mission-specific statement", substantive(readPath(submission, "submission.summary"), 5)],
      ["submission.evidence[0].claim must explain a substantive causal claim", substantive(readPath(submission, "submission.evidence[0].claim"), 5) && CAUSAL_MARKER.test(asText(readPath(submission, "submission.evidence[0].claim")))],
      ["submission.evidence[0].source must identify a specific provenance source", substantive(readPath(submission, "submission.evidence[0].source"), 2) && PROVENANCE_MARKER.test(asText(readPath(submission, "submission.evidence[0].source"))) && !/^(?:someone|some source|the buyer|customer|meeting|team)$/i.test(asText(readPath(submission, "submission.evidence[0].source")).trim())],
      ["submission.evidence[0].observed_at must be a valid ISO date", validIsoDate(readPath(submission, "submission.evidence[0].observed_at"))],
      ["submission.risks_or_unknowns[0] must describe a substantive risk or unknown", substantive(readPath(submission, "submission.risks_or_unknowns[0]"), 5)],
      ["submission.next_verification_action.owner must name a specific owner", substantive(readPath(submission, "submission.next_verification_action.owner"), 1) && !/^(?:someone|team|owner|sales)$/i.test(asText(readPath(submission, "submission.next_verification_action.owner")).trim())],
      ["submission.next_verification_action.action must be a specific verification action", substantive(readPath(submission, "submission.next_verification_action.action"), 5) && ACTION_MARKER.test(asText(readPath(submission, "submission.next_verification_action.action")))],
      ["submission.next_verification_action.due must be a valid ISO date", validIsoDate(readPath(submission, "submission.next_verification_action.due"))],
      ["submission must address this mission's module focus", MISSION_FOCUS[challengeId].test(asText(submission))],
    ];

    if (challengeId === "spiced-08-mission") {
      qualityChecks.push(
        ["submission.forecast_risk.level must classify forecast risk", ["low", "medium", "high"].includes(asText(readPath(submission, "submission.forecast_risk.level")))],
        ["submission.forecast_risk.basis must explain the forecast risk", substantive(readPath(submission, "submission.forecast_risk.basis"), 5)],
        ["submission.manager_output.forecast_category must be a supported capstone output", ["commit", "best-case", "pipeline", "disqualify"].includes(asText(readPath(submission, "submission.manager_output.forecast_category")))],
        ["submission.manager_output.coaching_question must be a specific capstone coaching question", substantive(readPath(submission, "submission.manager_output.coaching_question"), 5) && /\?$/.test(asText(readPath(submission, "submission.manager_output.coaching_question")).trim())],
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
