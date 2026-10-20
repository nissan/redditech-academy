import { describe, expect, it } from "vitest";

import matrix from "../companion/agentic-game-development/v1/contracts/accessibility-matrix-v1.json";
import {
  ALLOWED_EVIDENCE_TYPES,
  validateAccessibilityMatrix,
} from "../companion/agentic-game-development/v1/contracts/validate-accessibility-matrix-v1.mjs";

type Matrix = typeof matrix;

function changed(mutator: (copy: Matrix) => void): Matrix {
  const copy = structuredClone(matrix);
  mutator(copy);
  return copy;
}

describe("AGD accessibility matrix v1", () => {
  it("passes the deterministic contract validator", () => {
    expect(validateAccessibilityMatrix(matrix)).toEqual([]);
  });

  it("covers every approved accessibility scenario and required behaviour family", () => {
    const scenarios = new Set(matrix.rows.flatMap((row) => row.scenarioIds));
    expect(scenarios).toEqual(
      new Set(["AGD-CORE-007", "AGD-CORE-008", "AGD-CORE-029"])
    );

    const rowIds = new Set(matrix.rows.map((row) => row.id));
    for (const requiredRow of [
      "academy-semantic-structure-and-instructions",
      "academy-non-colour-information-and-status",
      "academy-contrast-resize-and-reflow",
      "academy-non-text-contrast-and-visible-focus",
      "academy-keyboard-order-and-no-trap",
      "academy-no-required-timing-and-resume",
      "academy-non-drag-alternative",
      "academy-programmatic-names-values-and-status",
      "game-remappable-controls-where-supported",
      "game-keyboard-menu-operation",
      "game-readable-scalable-text",
      "game-non-colour-feedback",
      "game-independent-volume-control",
      "game-pause-behaviour",
      "game-reduced-motion-and-camera-shake",
      "game-controller-operation-only-when-claimed",
    ]) {
      expect(rowIds, requiredRow).toContain(requiredRow);
    }

    const wcagCriteria = new Set(
      matrix.rows.flatMap((row) => row.wcag.map((mapping) => mapping.criterion))
    );
    for (const criterion of [
      "1.3.1", "1.3.3", "1.4.1", "1.4.3", "1.4.4", "1.4.10", "1.4.11",
      "2.1.1", "2.1.2", "2.2.1", "2.2.2", "2.4.3", "2.4.7", "2.4.11",
      "2.5.7", "3.3.2", "4.1.2", "4.1.3",
    ]) {
      expect(wcagCriteria, criterion).toContain(criterion);
    }
  });

  it("rejects duplicate row and source IDs", () => {
    const duplicateRow = changed((copy) => {
      copy.rows[1].id = copy.rows[0].id;
    });
    expect(validateAccessibilityMatrix(duplicateRow)).toContain(
      "$.rows[1].id: non-empty and unique ID required"
    );

    const duplicateSource = changed((copy) => {
      copy.sources[1].id = copy.sources[0].id;
    });
    expect(validateAccessibilityMatrix(duplicateSource)).toContain(
      "$.sources[1].id: non-empty and unique ID required"
    );
  });

  it("rejects unknown evidence types and manual checks without a known owner", () => {
    const unknownType = changed((copy) => {
      copy.rows[0].evidence[0].type = "screenshot" as never;
    });
    expect(validateAccessibilityMatrix(unknownType)).toContain(
      "$.rows[0].evidence[0].type: invalid"
    );

    const missingOwner = changed((copy) => {
      delete (copy.rows[0].evidence[1] as { owner?: string }).owner;
    });
    expect(validateAccessibilityMatrix(missingOwner)).toContain(
      "$.rows[0].evidence[1].owner: known manual owner required"
    );

    expect(matrix.allowedEvidenceTypes).toEqual(ALLOWED_EVIDENCE_TYPES);
  });

  it("rejects rows without platform controls or non-compensable status", () => {
    const missingControl = changed((copy) => {
      copy.rows[0].platformControls = [];
    });
    expect(validateAccessibilityMatrix(missingControl)).toContain(
      "$.rows[0].platformControls: at least one mapping required"
    );

    const compensable = changed((copy) => {
      copy.rows[0].nonCompensable = false;
    });
    expect(validateAccessibilityMatrix(compensable)).toContain(
      "$.rows[0].nonCompensable: must be true"
    );
  });

  it("rejects missing scenario coverage and unbounded conformance wording", () => {
    const missingScenario = changed((copy) => {
      for (const row of copy.rows) {
        row.scenarioIds = row.scenarioIds.filter(
          (scenario) => scenario !== "AGD-CORE-008"
        ) as typeof row.scenarioIds;
      }
    });
    expect(validateAccessibilityMatrix(missingScenario)).toContain(
      "$.rows: missing scenario AGD-CORE-008"
    );

    const forbiddenClaim = changed((copy) => {
      copy.rows[0].behaviour = "The required Academy UI is WCAG 2.2 AA compliant.";
    });
    expect(validateAccessibilityMatrix(forbiddenClaim)).toContain(
      "$.rows[0]: forbidden conformance/certification wording"
    );
  });

  it("requires conditions for conditional remapping/controller claims", () => {
    const controllerIndex = matrix.rows.findIndex(
      (row) => row.id === "game-controller-operation-only-when-claimed"
    );
    const missingCondition = changed((copy) => {
      delete (copy.rows[controllerIndex] as { condition?: string }).condition;
    });
    expect(validateAccessibilityMatrix(missingCondition)).toContain(
      `$.rows[${controllerIndex}].condition: required for conditional row`
    );
  });
});
