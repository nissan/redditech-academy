import { describe, expect, it } from "vitest";
import { gradeStructured } from "@/lib/structured-grader";

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
});
