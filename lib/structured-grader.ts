export interface StructuredValidation {
  must_have?: Array<{ field?: string; non_empty?: boolean }>;
  must_not_have?: Array<{ field?: string; value?: string }>;
}

export interface StructuredGrade {
  pass: boolean;
  score: number;
  feedback: string;
}

const PLACEHOLDER = /^(?:__FILL_IN__|YYYY-MM-DD|unknown|tbd)$/i;

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
  userInput: Record<string, unknown>
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
    const ok = rule.non_empty ? meaningful(value) : value !== undefined && value !== null;
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

  return {
    pass: failures.length === 0,
    score: checks === 0 ? 0 : Number((passed / checks).toFixed(2)),
    feedback: failures.length === 0
      ? "Required evidence fields are complete. Now verify the claims with the buyer."
      : `Complete the evidence record: ${failures.join("; ")}.`,
  };
}
