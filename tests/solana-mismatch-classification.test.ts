import { describe, expect, it } from "vitest";

import { buildReport } from "../scripts/solana-mismatch-classification.mjs";

describe("Solana sequence environment mismatch classification", () => {
  const report = buildReport();

  it("classifies the current #44 mismatch inventory without changing behavior", () => {
    expect(report.issue).toBe(44);
    expect(report.counts).toEqual({
      mismatches: 12,
      keepJsonEditorChangeMdxEnvironment: 12,
      convertToSequenceCompleter: 0,
      holdForContentSpec: 0,
    });

    for (const row of report.rows) {
      expect(row.mdxEnvironment).toBe("sequence-completer");
      expect(row.explicitChallengeType).toBeNull();
      expect(row.effectiveChallengeType).toBe("json-editor");
      expect(row.hasPrefilledTemplate).toBe(true);
      expect(row.hasPrefilledSteps).toBe(false);
      expect(row.hasCorrectOrder).toBe(false);
      expect(row.classification).toBe("keep-json-editor-change-mdx-environment");
    }
  });

  it("keeps implementation batches split by low-overlap module groups", () => {
    expect(report.implementationSplits.map((split) => [split.id, split.count])).toEqual([
      ["solana-validator-json-editor-env-alignment", 12],
    ]);
  });
});
