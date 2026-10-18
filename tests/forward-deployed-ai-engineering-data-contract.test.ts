import fs from "fs";
import path from "path";

import { describe, expect, it } from "vitest";

const DATA_DIR = path.join(
  process.cwd(),
  "companion-labs",
  "forward-deployed-ai-engineering",
  "data"
);
const fixture = JSON.parse(
  fs.readFileSync(path.join(DATA_DIR, "harbourcare-v1.json"), "utf8")
);
const schema = JSON.parse(
  fs.readFileSync(path.join(DATA_DIR, "harbourcare-v1.schema.json"), "utf8")
);
const ledger = fs.readFileSync(path.join(DATA_DIR, "SOURCE-LEDGER.md"), "utf8");

function uniqueIds(records: Array<{ id: string }>) {
  return new Set(records.map((record) => record.id));
}

describe("Forward Deployed AI Engineering B2 HarbourCare data contract", () => {
  it("is explicitly synthetic, versioned, and backed by a strict schema and source ledger", () => {
    expect(fixture).toMatchObject({
      contractVersion: "1.0.0",
      datasetId: "harbourcare-synthetic-v1",
      fictional: true,
      containsRealPersonalData: false,
      defaultLicenceRef: "redditech-original-fixture",
    });
    expect(schema.$schema).toBe("https://json-schema.org/draft/2020-12/schema");
    expect(schema.additionalProperties).toBe(false);
    expect(schema.$defs.goldenSet.additionalProperties).toBe(false);
    expect(ledger).toContain("no real patient, employee, customer, or supplier data");
    expect(ledger).toContain("No third-party corpus");
    expect(ledger).toContain("does not imply endorsement or certification");
  });

  it("defines unique, closed references across tenants, personas, documents, ERP records, and golden cases", () => {
    const tenants = uniqueIds(fixture.tenants);
    const personas = uniqueIds(fixture.personas);
    const documents = uniqueIds(fixture.documents);
    const erpRecords = uniqueIds(fixture.erpRecords);
    const goldenCases = uniqueIds(fixture.goldenSet.cases);

    expect(tenants.size).toBe(fixture.tenants.length);
    expect(personas.size).toBe(fixture.personas.length);
    expect(documents.size).toBe(fixture.documents.length);
    expect(erpRecords.size).toBe(fixture.erpRecords.length);
    expect(goldenCases.size).toBe(fixture.goldenSet.cases.length);
    expect(fixture.personas.every((persona: { tenantId: string }) => tenants.has(persona.tenantId))).toBe(true);
    expect(fixture.documents.every((document: { tenantId: string }) => tenants.has(document.tenantId))).toBe(true);
    expect(fixture.erpRecords.every((record: { tenantId: string }) => tenants.has(record.tenantId))).toBe(true);
    expect(
      fixture.erpRecords.every(
        (record: { duplicateOf?: string }) => record.duplicateOf === undefined || erpRecords.has(record.duplicateOf)
      )
    ).toBe(true);
    for (const testCase of fixture.goldenSet.cases) {
      expect(personas.has(testCase.actorId)).toBe(true);
      expect(testCase.expected.documentIds.every((id: string) => documents.has(id))).toBe(true);
      expect(testCase.expected.mustExcludeTenantIds.every((id: string) => tenants.has(id))).toBe(true);
    }
  });

  it("contains the required sensitivity and adversarial evaluation coverage without live identifiers", () => {
    expect(fixture.sensitivityLabels.map((label: { id: string }) => label.id)).toEqual([
      "public",
      "internal",
      "confidential",
      "restricted",
    ]);
    expect(fixture.personas.every((persona: { email: string }) => persona.email.endsWith("@harbourcare.invalid"))).toBe(true);
    expect(fixture.documents.some((document: { classification: string }) => document.classification === "restricted")).toBe(true);
    expect(fixture.documents.some((document: { adversarial?: boolean }) => document.adversarial === true)).toBe(true);
    expect(fixture.erpRecords.some((record: { status: string }) => record.status === "quarantined_duplicate")).toBe(true);
    expect(fixture.goldenSet.cases.map((testCase: { expected: { decision: string } }) => testCase.expected.decision)).toEqual(
      expect.arrayContaining(["answer", "deny", "abstain"])
    );
    expect(JSON.stringify(fixture)).not.toMatch(/example\.com|gmail\.com|api[_-]?key|bearer\s+[a-z0-9]/i);
  });
});
