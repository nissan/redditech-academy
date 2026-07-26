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
    expect(gradeStructured(realChallenge.validation, { json })).toMatchObject({
      pass: true,
      score: 1,
    });
  });
});
