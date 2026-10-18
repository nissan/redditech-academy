import { describe, expect, it } from "vitest";
import { gradeStructured } from "@/lib/structured-grader";
import realChallenge from "@/content/courses/spiced-sales-framework/challenges/spiced-01-mission.json";
import mission02 from "@/content/courses/spiced-sales-framework/challenges/spiced-02-mission.json";
import mission03 from "@/content/courses/spiced-sales-framework/challenges/spiced-03-mission.json";
import mission04 from "@/content/courses/spiced-sales-framework/challenges/spiced-04-mission.json";
import mission05 from "@/content/courses/spiced-sales-framework/challenges/spiced-05-mission.json";
import mission06 from "@/content/courses/spiced-sales-framework/challenges/spiced-06-mission.json";
import mission07 from "@/content/courses/spiced-sales-framework/challenges/spiced-07-mission.json";
import mission08 from "@/content/courses/spiced-sales-framework/challenges/spiced-08-mission.json";

const validation = {
  must_have: [
    { field: "submission.summary", non_empty: true },
    { field: "submission.evidence[0].source", non_empty: true },
    { field: "submission.next_verification_action.owner", non_empty: true },
  ],
};

const missionCases = [
  { challenge: realChallenge, focus: "diagnosis", cause: "manual onboarding", effect: "audit exposure", role: "hr-director", target: "audit evidence", keyword: "audit" },
  { challenge: mission02, focus: "situation-pain", cause: "manual re-keying", effect: "payroll errors", role: "payroll-lead", target: "root cause", keyword: "payroll" },
  { challenge: mission03, focus: "impact", cause: "payroll corrections", effect: "clinician start delays", role: "payroll-lead", target: "impact range", keyword: "impact" },
  { challenge: mission04, focus: "critical-event", cause: "missing onboarding evidence", effect: "clinic opening delays", role: "accreditation-lead", target: "reverse timeline", keyword: "accreditation" },
  { challenge: mission05, focus: "decision-dynamics", cause: "incomplete security review", effect: "approval delay", role: "finance-manager", target: "decision process", keyword: "decision" },
  { challenge: mission06, focus: "evidence-hygiene", cause: "disputed hours estimate", effect: "low confidence", role: "security-lead", target: "source contradiction", keyword: "evidence" },
  { challenge: mission07, focus: "method-handoff", cause: "method handoff gap", effect: "deal-control risk", role: "sales-manager", target: "method mapping", keyword: "handoff" },
  { challenge: mission08, focus: "manager-capstone", cause: "incomplete security review", effect: "forecast risk", role: "security-lead", target: "pilot criteria", keyword: "forecast" },
] as const;

type MissionCase = (typeof missionCases)[number];

function validMissionSubmission(testCase: MissionCase): Record<string, unknown> {
  const submission: Record<string, unknown> = {
    analysis: {
      module_focus: testCase.focus,
      cause: testCase.cause,
      effect: testCase.effect,
    },
    summary: `${testCase.cause} creates ${testCase.effect} for Northstar Health.`,
    evidence: [{
      claim: `${testCase.cause} causes ${testCase.effect} for Northstar Health.`,
      source: `Morgan Lee, ${testCase.role.replace(/-/g, " ")}`,
      source_role: testCase.role,
      observed_at: "2026-07-27",
      status: "buyer-verified",
      confidence: "high",
    }],
    risks_or_unknowns: [`${testCase.effect} remains unresolved until buyer verification is complete.`],
    next_verification_action: {
      owner: "Avery",
      action: `Confirm ${testCase.target} with Morgan Lee before the review.`,
      verification_target: testCase.target,
      due: "2026-08-10",
    },
  };

  if (testCase.challenge.id === "spiced-08-mission") {
    submission.forecast_risk = {
      level: "high",
      basis: `${testCase.effect} increases forecast risk until buyer evidence is verified.`,
    };
    submission.manager_output = {
      forecast_category: "pipeline",
      coaching_question: `Which buyer evidence will confirm ${testCase.target}?`,
    };
  }

  return submission;
}

describe("gradeStructured", () => {
  it("returns null without deterministic rules", () => {
    expect(gradeStructured({}, { json: "{}" })).toBeNull();
  });

  it("rejects malformed JSON", () => {
    expect(gradeStructured(validation, { json: "{" })?.feedback).toContain("not valid JSON");
  });

  it("rejects unchanged placeholders recursively", () => {
    const json = JSON.stringify({ submission: {
      summary: "__FILL_IN__",
      evidence: [{ claim: "__FILL_IN__" }],
      next_verification_action: { owner: "__FILL_IN__", due: "YYYY-MM-DD" },
    } });
    expect(gradeStructured(validation, { json })?.pass).toBe(false);
  });

  it("scores partial work deterministically", () => {
    const json = JSON.stringify({ submission: {
      summary: "Payroll corrections delay clinic onboarding.",
      evidence: [],
      next_verification_action: { owner: "Avery", due: "2026-08-10" },
    } });
    expect(gradeStructured(validation, { json })?.score).toBe(0.67);
  });

  it("resolves indexed array paths used by SPICED provenance rules", () => {
    const json = JSON.stringify({ submission: {
      summary: "Payroll corrections delay clinic onboarding.",
      evidence: [{ source: "Payroll lead" }],
      next_verification_action: { owner: "Avery" },
    } });
    expect(gradeStructured(validation, { json })?.pass).toBe(true);
  });

  it("passes complete meaningful evidence", () => {
    const json = JSON.stringify({ submission: {
      summary: "Payroll corrections delay clinic onboarding.",
      evidence: [{ claim: "90–140 hours monthly", source: "Payroll lead", observed_at: "2026-07-27" }],
      next_verification_action: { owner: "Avery", action: "Confirm range", due: "2026-08-10" },
    } });
    expect(gradeStructured(validation, { json })).toMatchObject({ pass: true, score: 1 });
  });

  it("rejects seller-authored certainty presented as buyer verified", () => {
    const indexedValidation = { must_have: [
      { field: "submission.evidence[0].source", non_empty: true },
      {
        field: "submission.evidence[0].status",
        non_empty: true,
        allowed_values: ["hypothesis", "buyer-verified", "multi-party-verified", "changed"],
      },
    ] };
    const json = JSON.stringify({ submission: { evidence: [{
      source: "NimbusHR account executive",
      status: "buyer-verified",
    }] } });
    expect(gradeStructured(indexedValidation, { json })?.feedback).toContain("seller-authored");
  });

  it.each(missionCases)("passes legitimate relational evidence for $challenge.id", (testCase) => {
    const json = JSON.stringify({ submission: validMissionSubmission(testCase) });
    expect(gradeStructured(testCase.challenge.validation, { json }, testCase.challenge.id)).toMatchObject({
      pass: true,
      score: 1,
    });
  });

  it.each(missionCases)("keeps the $challenge.id editor template aligned with its relational contract", (testCase) => {
    const template = JSON.parse(testCase.challenge.prefilled.template);
    expect(template.submission.analysis).toMatchObject({
      module_focus: testCase.focus,
      cause: "__FILL_IN__",
      effect: "__FILL_IN__",
    });
    expect(template.submission.evidence[0].source_role).toContain(testCase.role);
    expect(template.submission.next_verification_action.verification_target).toBe("__FILL_IN__");
  });

  it.each(missionCases)("rejects the reviewer's keyword-stuffed word salad for $challenge.id", (testCase) => {
    const submission = {
      analysis: {
        module_focus: testCase.focus,
        cause: `${testCase.cause} alpha beta`,
        effect: `${testCase.effect} gamma delta`,
      },
      summary: `alpha beta gamma delta ${testCase.keyword}`,
      evidence: [{
        claim: `alpha beta gamma cause delta ${testCase.keyword}`,
        source: "Finance manager",
        source_role: testCase.role,
        observed_at: "2026-07-27",
        status: "buyer-verified",
        confidence: "high",
      }],
      risks_or_unknowns: [`alpha beta gamma delta ${testCase.effect}`],
      next_verification_action: {
        owner: "X",
        action: `confirm alpha beta gamma delta ${testCase.target}`,
        verification_target: testCase.target,
        due: "2026-08-10",
      },
      forecast_risk: {
        level: "high",
        basis: "alpha beta gamma delta forecast",
      },
      manager_output: {
        forecast_category: "pipeline",
        coaching_question: "alpha beta gamma delta question?",
      },
    };

    expect(gradeStructured(
      testCase.challenge.validation,
      { json: JSON.stringify({ submission }) },
      testCase.challenge.id
    )?.pass).toBe(false);
  });

  it.each(missionCases)("rejects disconnected cause/effect ordering for $challenge.id", (testCase) => {
    const submission = validMissionSubmission(testCase) as Record<string, any>;
    submission.evidence[0].claim = `${testCase.effect} causes ${testCase.cause}.`;
    expect(gradeStructured(
      testCase.challenge.validation,
      { json: JSON.stringify({ submission }) },
      testCase.challenge.id
    )?.pass).toBe(false);
  });

  it.each(missionCases)("rejects repeated-token mutations for $challenge.id", (testCase) => {
    const submission = validMissionSubmission(testCase) as Record<string, any>;
    const repeatedCause = `${testCase.cause} ${testCase.cause}`;
    submission.analysis.cause = repeatedCause;
    submission.summary = `${repeatedCause} creates ${testCase.effect} for Northstar Health.`;
    submission.evidence[0].claim = `${repeatedCause} causes ${testCase.effect} for Northstar Health.`;
    expect(gradeStructured(
      testCase.challenge.validation,
      { json: JSON.stringify({ submission }) },
      testCase.challenge.id
    )?.pass).toBe(false);
  });

  it.each(missionCases)("rejects one-character owners for $challenge.id", (testCase) => {
    const submission = validMissionSubmission(testCase) as Record<string, any>;
    submission.next_verification_action.owner = "X";
    expect(gradeStructured(
      testCase.challenge.validation,
      { json: JSON.stringify({ submission }) },
      testCase.challenge.id
    )?.pass).toBe(false);
  });

  it.each(missionCases)("rejects generic role-only provenance for $challenge.id", (testCase) => {
    const submission = validMissionSubmission(testCase) as Record<string, any>;
    submission.evidence[0].source = testCase.role.replace(/-/g, " ");
    expect(gradeStructured(
      testCase.challenge.validation,
      { json: JSON.stringify({ submission }) },
      testCase.challenge.id
    )?.pass).toBe(false);
  });

  it("rejects impossible or reverse-chronology dates", () => {
    const testCase = missionCases[0];
    const impossible = validMissionSubmission(testCase) as Record<string, any>;
    impossible.evidence[0].observed_at = "2026-02-30";
    const reverse = validMissionSubmission(testCase) as Record<string, any>;
    reverse.next_verification_action.due = "2026-07-01";
    expect(gradeStructured(testCase.challenge.validation, { json: JSON.stringify({ submission: impossible }) }, testCase.challenge.id)?.pass).toBe(false);
    expect(gradeStructured(testCase.challenge.validation, { json: JSON.stringify({ submission: reverse }) }, testCase.challenge.id)?.pass).toBe(false);
  });

  it("requires relational forecast risk and manager outputs for the capstone", () => {
    const testCase = missionCases[7];
    const missing = validMissionSubmission(testCase) as Record<string, any>;
    delete missing.forecast_risk;
    delete missing.manager_output;
    const generic = validMissionSubmission(testCase) as Record<string, any>;
    generic.forecast_risk.basis = "alpha beta gamma delta forecast";
    generic.manager_output.coaching_question = "alpha beta gamma delta question?";

    const missingResult = gradeStructured(testCase.challenge.validation, { json: JSON.stringify({ submission: missing }) }, testCase.challenge.id);
    const genericResult = gradeStructured(testCase.challenge.validation, { json: JSON.stringify({ submission: generic }) }, testCase.challenge.id);
    expect(missingResult?.pass).toBe(false);
    expect(missingResult?.feedback).toContain("forecast_risk");
    expect(missingResult?.feedback).toContain("manager_output");
    expect(genericResult?.pass).toBe(false);
  });
});
