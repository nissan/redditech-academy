import { describe, expect, it } from "vitest";
import { gradeStructured } from "@/lib/structured-grader";
import realChallenge from "@/content/courses/spiced-sales-framework/challenges/spiced-01-mission.json";

const validation = {
  must_have: [
    { field: "submission.summary", non_empty: true },
    { field: "submission.evidence[0].source", non_empty: true },
    { field: "submission.next_verification_action.owner", non_empty: true },
  ],
};

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

  it("passes a complete submission against the real SPICED mission schema", () => {
    const json = JSON.stringify({ submission: {
      summary: "Payroll correction work delays clinic onboarding.",
      evidence: [{
        claim: "Corrections consume 90–140 hours monthly.",
        source: "Morgan Lee, Northstar payroll lead",
        observed_at: "2026-07-27",
        status: "buyer-verified",
        confidence: "high",
      }],
      risks_or_unknowns: ["Security review timing remains unknown."],
      next_verification_action: {
        owner: "Avery",
        action: "Confirm the security review start date with Northstar.",
        due: "2026-08-10",
      },
    } });
    const result = gradeStructured(realChallenge.validation, { json }, realChallenge.id);
    expect(result).toMatchObject({
      pass: true,
      score: 1,
    });
  });

  it.each([
    ["syntactically non-empty nonsense", {
      summary: "blah blah blah blah",
      evidence: [{ claim: "foo foo foo foo", source: "some source", observed_at: "2026-07-27", status: "buyer-verified", confidence: "high" }],
      risks_or_unknowns: ["test test test test"],
      next_verification_action: { owner: "someone", action: "do the thing now please", due: "2026-08-10" },
    }],
    ["impossible ISO dates", {
      summary: "Payroll corrections delay clinic onboarding after the audit.",
      evidence: [{ claim: "Manual corrections cause onboarding delays each month.", source: "Morgan Lee, payroll lead", observed_at: "2026-02-30", status: "buyer-verified", confidence: "high" }],
      risks_or_unknowns: ["Audit evidence remains unverified by the buyer."],
      next_verification_action: { owner: "Avery Chen", action: "Confirm the audit evidence with Morgan Lee.", due: "2026-13-10" },
    }],
    ["vague provenance and action", {
      summary: "Payroll corrections delay clinic onboarding after the audit.",
      evidence: [{ claim: "Manual corrections cause onboarding delays each month.", source: "someone", observed_at: "2026-07-27", status: "buyer-verified", confidence: "high" }],
      risks_or_unknowns: ["Audit evidence remains unverified by the buyer."],
      next_verification_action: { owner: "team", action: "Follow up on it soon.", due: "2026-08-10" },
    }],
    ["plausible-looking but non-specific provenance", {
      summary: "Payroll corrections delay clinic onboarding after the audit.",
      evidence: [{ claim: "Manual corrections cause onboarding delays each month.", source: "purple elephant", observed_at: "2026-07-27", status: "buyer-verified", confidence: "high" }],
      risks_or_unknowns: ["Audit evidence remains unverified by the buyer."],
      next_verification_action: { owner: "Avery", action: "Confirm the audit evidence with Morgan Lee.", due: "2026-08-10" },
    }],
    ["content from the wrong module", {
      summary: "MEDDPICC handoff improves customer success collaboration.",
      evidence: [{ claim: "A Challenger insight causes a stronger method handoff.", source: "Morgan Lee, payroll lead", observed_at: "2026-07-27", status: "buyer-verified", confidence: "high" }],
      risks_or_unknowns: ["Customer success ownership remains unclear after handoff."],
      next_verification_action: { owner: "Avery Chen", action: "Confirm the handoff owner with Morgan Lee.", due: "2026-08-10" },
    }],
  ])("rejects %s", (_label, submission) => {
    const result = gradeStructured(realChallenge.validation, { json: JSON.stringify({ submission }) }, realChallenge.id);
    expect(result?.pass).toBe(false);
  });

  it("requires forecast risk and manager outputs for the capstone", async () => {
    const capstone = (await import("@/content/courses/spiced-sales-framework/challenges/spiced-08-mission.json")).default;
    const json = JSON.stringify({ submission: {
      summary: "Security gaps create forecast risk before the fixed event.",
      evidence: [{
        claim: "Incomplete security review may delay the pilot decision.",
        source: "Morgan Lee, payroll lead",
        observed_at: "2026-07-27",
        status: "buyer-verified",
        confidence: "high",
      }],
      risks_or_unknowns: ["Pilot success criteria remain unverified by the buyer."],
      next_verification_action: {
        owner: "Avery Chen",
        action: "Confirm pilot success criteria with the buyer.",
        due: "2026-08-10",
      },
    } });

    const result = gradeStructured(capstone.validation, { json }, capstone.id);
    expect(result?.pass).toBe(false);
    expect(result?.feedback).toContain("forecast_risk");
    expect(result?.feedback).toContain("manager_output");
  });

  it("passes a complete capstone with forecast risk and manager outputs", async () => {
    const capstone = (await import("@/content/courses/spiced-sales-framework/challenges/spiced-08-mission.json")).default;
    const json = JSON.stringify({ submission: {
      summary: "Security gaps create material forecast risk before the fixed event.",
      evidence: [{
        claim: "Incomplete security review may delay the pilot decision.",
        source: "Morgan Lee, payroll lead",
        observed_at: "2026-07-27",
        status: "buyer-verified",
        confidence: "high",
      }],
      risks_or_unknowns: ["Pilot success criteria remain unverified by the buyer."],
      next_verification_action: {
        owner: "Avery",
        action: "Confirm pilot success criteria with the buyer.",
        due: "2026-08-10",
      },
      forecast_risk: {
        level: "high",
        basis: "Security approval and pilot criteria remain incomplete.",
      },
      manager_output: {
        forecast_category: "pipeline",
        coaching_question: "Which buyer evidence would resolve the security risk?",
      },
    } });

    expect(gradeStructured(capstone.validation, { json }, capstone.id)).toMatchObject({
      pass: true,
      score: 1,
    });
  });
});
