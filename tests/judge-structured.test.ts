import { describe, expect, it } from "vitest";
import { gradeStructured } from "@/lib/structured-grader";
import mission01 from "@/content/courses/spiced-sales-framework/challenges/spiced-01-mission.json";
import mission02 from "@/content/courses/spiced-sales-framework/challenges/spiced-02-mission.json";
import mission03 from "@/content/courses/spiced-sales-framework/challenges/spiced-03-mission.json";
import mission04 from "@/content/courses/spiced-sales-framework/challenges/spiced-04-mission.json";
import mission05 from "@/content/courses/spiced-sales-framework/challenges/spiced-05-mission.json";
import mission06 from "@/content/courses/spiced-sales-framework/challenges/spiced-06-mission.json";
import mission07 from "@/content/courses/spiced-sales-framework/challenges/spiced-07-mission.json";
import mission08 from "@/content/courses/spiced-sales-framework/challenges/spiced-08-mission.json";

const validation = { must_have: [
  { field: "submission.summary", non_empty: true },
  { field: "submission.evidence[0].source", non_empty: true },
  { field: "submission.next_verification_action.owner", non_empty: true },
] };

type Challenge = typeof mission01;
type MissionRow = [Challenge, string, string, string, string, string, string, string, string, string, string, string];

const missionRows: MissionRow[] = [
  [mission01, "spiced-01-diagnosis", "northstar-internal-audit-01", "northstar-morgan-lee", "northstar-hr-director", "manual-onboarding", "creates", "audit-exposure", "audit-control-unverified", "audit-evidence", "confirm-audit-evidence", "audit"],
  [mission02, "spiced-02-situation-pain", "northstar-payroll-rekey-01", "northstar-riley-patel", "northstar-payroll-lead", "manual-rekeying", "causes", "payroll-errors", "reconciliation-errors-unquantified", "root-cause", "validate-root-cause", "payroll"],
  [mission03, "spiced-03-impact", "northstar-correction-hours-01", "northstar-riley-patel", "northstar-payroll-lead", "payroll-corrections", "delays", "clinician-starts", "impact-range-disputed", "impact-range", "verify-impact-range", "impact"],
  [mission04, "spiced-04-critical-event", "northstar-accreditation-01", "northstar-jordan-kim", "northstar-accreditation-lead", "missing-control-evidence", "threatens", "clinic-openings", "accreditation-deadline", "reverse-timeline", "confirm-reverse-timeline", "accreditation"],
  [mission05, "spiced-05-decision-dynamics", "northstar-approval-chain-01", "northstar-sam-torres", "northstar-security-lead", "incomplete-security-review", "blocks", "coo-approval", "approval-sequence-unclear", "decision-process", "map-decision-process", "decision"],
  [mission06, "spiced-06-evidence-hygiene", "northstar-evidence-conflict-01", "northstar-riley-patel", "northstar-payroll-lead", "disputed-hours-estimate", "reduces", "evidence-confidence", "source-contradiction", "source-contradiction", "resolve-source-contradiction", "evidence"],
  [mission07, "spiced-07-method-handoff", "northstar-method-handoff-01", "northstar-alex-ng", "northstar-sales-manager", "method-handoff-gap", "creates", "deal-control-risk", "qualification-gap", "method-mapping", "validate-method-mapping", "handoff"],
  [mission08, "spiced-08-manager-capstone", "northstar-capstone-risk-01", "northstar-sam-torres", "northstar-security-lead", "incomplete-security-review", "creates", "forecast-risk", "pilot-criteria-vague", "pilot-criteria", "confirm-pilot-criteria", "forecast"],
];

const missionCases = missionRows.map(([challenge, moduleFocusId, evidenceId, personId, roleId, causeId, relationshipId, effectId, riskId, verificationTargetId, actionId, keyword]) => ({
  challenge, moduleFocusId, evidenceId, personId, roleId, causeId, relationshipId, effectId, riskId, verificationTargetId, actionId, keyword,
}));

type MissionCase = (typeof missionCases)[number];

function validSubmission(c: MissionCase): Record<string, unknown> {
  const submission: Record<string, unknown> = {
    analysis: { module_focus_id: c.moduleFocusId, cause_id: c.causeId, relationship_id: c.relationshipId, effect_id: c.effectId },
    summary: `alpha beta gamma delta ${c.keyword}`,
    evidence: [{
      evidence_id: c.evidenceId, person_id: c.personId, role_id: c.roleId,
      observed_at: "2026-07-27", status: "buyer-verified", confidence: "high",
      claim: "alpha beta gamma cause delta", source: `Alpha Beta, ${c.roleId}`,
    }],
    risk_assessment: { risk_id: c.riskId, evidence_id: c.evidenceId, cause_id: c.causeId, effect_id: c.effectId, note: "alpha beta gamma delta risk" },
    next_verification_action: {
      action_id: c.actionId, verification_target_id: c.verificationTargetId,
      evidence_id: c.evidenceId, risk_id: c.riskId, due: "2026-08-10",
      owner: "ZZ", action: "confirm alpha beta gamma delta",
    },
  };
  if (c.challenge.id === "spiced-08-mission") {
    submission.forecast_risk = { risk_id: c.riskId, evidence_id: c.evidenceId, effect_id: c.effectId, level: "high", basis: "generic five word basis string" };
    submission.manager_output = { forecast_category: "pipeline", action_id: c.actionId, verification_target_id: c.verificationTargetId, risk_id: c.riskId, coaching_question: "generic five word question here?" };
  }
  return submission;
}

function clone(input: Record<string, unknown>): Record<string, any> {
  return JSON.parse(JSON.stringify(input));
}

function setPath(input: Record<string, any>, path: string, value: unknown): void {
  const keys = path.replace(/\[(\d+)\]/g, ".$1").split(".");
  let current = input;
  for (const key of keys.slice(0, -1)) current = current[key];
  current[keys.at(-1)!] = value;
}

function result(c: MissionCase, submission: Record<string, unknown>) {
  return gradeStructured(c.challenge.validation, { json: JSON.stringify({ submission }) }, c.challenge.id);
}

describe("gradeStructured", () => {
  it("returns null without deterministic rules", () => expect(gradeStructured({}, { json: "{}" })).toBeNull());
  it("rejects malformed JSON", () => expect(gradeStructured(validation, { json: "{" })?.feedback).toContain("not valid JSON"));

  it("rejects unchanged placeholders recursively", () => {
    const json = JSON.stringify({ submission: { summary: "__FILL_IN__", evidence: [{ source: "__FILL_IN__" }], next_verification_action: { owner: "__FILL_IN__" } } });
    expect(gradeStructured(validation, { json })?.pass).toBe(false);
  });

  it("scores partial work deterministically", () => {
    const json = JSON.stringify({ submission: { summary: "Payroll corrections delay clinic onboarding.", evidence: [], next_verification_action: { owner: "Avery" } } });
    expect(gradeStructured(validation, { json })?.score).toBe(0.67);
  });

  it("resolves indexed array paths", () => {
    const json = JSON.stringify({ submission: { summary: "Payroll corrections delay clinic onboarding.", evidence: [{ source: "Payroll lead" }], next_verification_action: { owner: "Avery" } } });
    expect(gradeStructured(validation, { json })?.pass).toBe(true);
  });

  it("rejects seller-authored certainty presented as buyer verified", () => {
    const rules = { must_have: [
      { field: "submission.evidence[0].source", non_empty: true },
      { field: "submission.evidence[0].status", non_empty: true, allowed_values: ["hypothesis", "buyer-verified"] },
    ] };
    const json = JSON.stringify({ submission: { evidence: [{ source: "NimbusHR account executive", status: "buyer-verified" }] } });
    expect(gradeStructured(rules, { json })?.feedback).toContain("seller-authored");
  });

  it.each(missionCases)("passes exact trusted IDs for $challenge.id despite supplemental word salad", (c) => {
    expect(result(c, validSubmission(c))).toMatchObject({ pass: true, score: 1 });
  });

  it.each(missionCases)("aligns trusted options and editor template for $challenge.id", (c) => {
    const options = c.challenge.prefilled.trusted_options;
    const template = JSON.parse(c.challenge.prefilled.template);
    expect(options).toEqual({
      module_focus_ids: [c.moduleFocusId], evidence_ids: [c.evidenceId], person_ids: [c.personId], role_ids: [c.roleId],
      cause_ids: [c.causeId], relationship_ids: [c.relationshipId], effect_ids: [c.effectId], risk_ids: [c.riskId],
      verification_target_ids: [c.verificationTargetId], action_ids: [c.actionId],
    });
    expect(template.trusted_options).toEqual(options);
    expect(template.submission.analysis.module_focus_id).toBe("SELECT_FROM_TRUSTED_OPTIONS");
    expect(template.submission.evidence[0].evidence_id).toBe("SELECT_FROM_TRUSTED_OPTIONS");
    expect(template.submission.next_verification_action.action_id).toBe("SELECT_FROM_TRUSTED_OPTIONS");
  });

  it.each(missionCases)("rejects the adapted lexical bypass for $challenge.id without trusted IDs", (c) => {
    const submission = {
      analysis: { module_focus: c.keyword, cause: `${c.causeId} alpha beta`, relationship: c.relationshipId, effect: `${c.effectId} gamma delta` },
      summary: `alpha beta gamma delta ${c.keyword}`,
      evidence: [{ claim: "alpha beta gamma cause delta", source: `Alpha Beta, ${c.roleId}`, source_role: c.roleId, observed_at: "2026-07-27", status: "buyer-verified", confidence: "high" }],
      risks_or_unknowns: [`alpha beta gamma delta ${c.keyword}`],
      next_verification_action: { owner: "ZZ", action: "confirm alpha beta gamma delta", verification_target: c.verificationTargetId, due: "2026-08-10" },
      forecast_risk: { level: "high", basis: "generic five word basis string" },
      manager_output: { forecast_category: "pipeline", coaching_question: "generic five word question here?" },
    };
    expect(result(c, submission)!.pass).toBe(false);
  });

  it.each(missionCases)("rejects every fabricated identifier for $challenge.id", (c) => {
    for (const path of [
      "analysis.module_focus_id", "analysis.cause_id", "analysis.relationship_id", "analysis.effect_id",
      "evidence[0].evidence_id", "evidence[0].person_id", "evidence[0].role_id",
      "risk_assessment.risk_id", "risk_assessment.evidence_id", "risk_assessment.cause_id", "risk_assessment.effect_id",
      "next_verification_action.action_id", "next_verification_action.verification_target_id",
      "next_verification_action.evidence_id", "next_verification_action.risk_id",
    ]) {
      const submission = clone(validSubmission(c));
      setPath(submission, path, `fabricated-${path.replace(/[^a-z]+/gi, "-")}`);
      expect(result(c, submission)!.pass, path).toBe(false);
    }
  });

  it.each(missionCases)("rejects cross-mission records for $challenge.id", (c) => {
    const other = missionCases[(missionCases.indexOf(c) + 1) % missionCases.length];
    expect(result(c, validSubmission(other))!.pass).toBe(false);
  });

  it.each(missionCases)("rejects mismatched relationship tuples for $challenge.id", (c) => {
    const other = missionCases.find((candidate) => candidate.relationshipId !== c.relationshipId)!;
    for (const [path, value] of [
      ["analysis.cause_id", other.causeId], ["analysis.effect_id", other.effectId],
      ["analysis.relationship_id", other.relationshipId], ["risk_assessment.cause_id", other.causeId],
      ["risk_assessment.effect_id", other.effectId],
    ]) {
      const submission = clone(validSubmission(c));
      setPath(submission, path, value);
      expect(result(c, submission)!.pass, path).toBe(false);
    }
  });

  it.each(missionCases)("rejects invalid or unbound dates for $challenge.id", (c) => {
    for (const [path, value] of [
      ["evidence[0].observed_at", "2026-02-30"], ["evidence[0].observed_at", "2026-07-28"],
      ["next_verification_action.due", "not-a-date"], ["next_verification_action.due", "2026-08-11"],
    ]) {
      const submission = clone(validSubmission(c));
      setPath(submission, path, value);
      expect(result(c, submission)!.pass, path).toBe(false);
    }
  });

  it("requires capstone outputs to reference trusted IDs", () => {
    const c = missionCases[7];
    for (const path of [
      "forecast_risk.risk_id", "forecast_risk.evidence_id", "forecast_risk.effect_id",
      "manager_output.action_id", "manager_output.verification_target_id", "manager_output.risk_id",
    ]) {
      const submission = clone(validSubmission(c));
      setPath(submission, path, "fabricated-capstone-reference");
      expect(result(c, submission)!.pass, path).toBe(false);
    }
  });
});
