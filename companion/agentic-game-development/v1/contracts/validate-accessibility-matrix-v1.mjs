export const ALLOWED_EVIDENCE_TYPES = Object.freeze([
  "automated-static",
  "automated-unit",
  "automated-component",
  "automated-e2e",
  "manual-keyboard",
  "manual-visual",
  "manual-screen-reader",
  "manual-gameplay",
  "manual-controller",
  "manual-media-review",
]);

const ALLOWED_SCOPES = new Set(["academy-ui", "learner-game"]);
const ALLOWED_APPLICABILITY = new Set(["required", "conditional"]);
const ALLOWED_LEVELS = new Set(["A", "AA", "AAA", "platform-guidance"]);
const REQUIRED_SCENARIOS = new Set([
  "AGD-CORE-007",
  "AGD-CORE-008",
  "AGD-CORE-029",
]);
const FORBIDDEN_CLAIMS = [
  /wcag(?:\s+2\.2)?\s+(?:aa\s+)?(?:compliant|conformant|certified)/i,
  /platform[- ]certified/i,
  /fully accessible/i,
];

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function nonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function addUnknownFieldErrors(errors, value, allowed, path) {
  if (!isRecord(value)) return;
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) errors.push(`${path}.${key}: unknown field`);
  }
}

export function validateAccessibilityMatrix(matrix) {
  const errors = [];
  if (!isRecord(matrix)) return ["$: expected object"];

  addUnknownFieldErrors(
    errors,
    matrix,
    new Set([
      "schemaVersion",
      "contractId",
      "title",
      "standardTarget",
      "accessedOn",
      "claimBoundary",
      "manualOwnerDirectory",
      "allowedEvidenceTypes",
      "sources",
      "rows",
    ]),
    "$"
  );

  if (matrix.schemaVersion !== "agd-accessibility-matrix-v1") {
    errors.push("$.schemaVersion: expected agd-accessibility-matrix-v1");
  }
  if (matrix.contractId !== "agd-accessibility-matrix-v1") {
    errors.push("$.contractId: expected agd-accessibility-matrix-v1");
  }
  if (matrix.standardTarget !== "WCAG 2.2 Level AA bounded behaviours") {
    errors.push("$.standardTarget: unexpected target wording");
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(matrix.accessedOn ?? "")) {
    errors.push("$.accessedOn: expected YYYY-MM-DD");
  }
  if (!nonEmptyString(matrix.claimBoundary)) {
    errors.push("$.claimBoundary: required");
  } else {
    if (!/does not claim WCAG 2\.2 conformance/i.test(matrix.claimBoundary)) {
      errors.push("$.claimBoundary: must explicitly disclaim WCAG 2.2 conformance");
    }
    if (!/platform certification/i.test(matrix.claimBoundary)) {
      errors.push("$.claimBoundary: must explicitly disclaim platform certification");
    }
  }

  if (
    !Array.isArray(matrix.allowedEvidenceTypes) ||
    matrix.allowedEvidenceTypes.join("|") !== ALLOWED_EVIDENCE_TYPES.join("|")
  ) {
    errors.push("$.allowedEvidenceTypes: must equal the validator allow-list");
  }

  if (!isRecord(matrix.manualOwnerDirectory)) {
    errors.push("$.manualOwnerDirectory: expected object");
  }
  const owners = isRecord(matrix.manualOwnerDirectory)
    ? new Set(Object.keys(matrix.manualOwnerDirectory))
    : new Set();
  for (const [ownerId, owner] of Object.entries(matrix.manualOwnerDirectory ?? {})) {
    if (!isRecord(owner) || !nonEmptyString(owner.role) || !nonEmptyString(owner.responsibility)) {
      errors.push(`$.manualOwnerDirectory.${ownerId}: role and responsibility required`);
    }
  }

  if (!Array.isArray(matrix.sources) || matrix.sources.length === 0) {
    errors.push("$.sources: at least one source required");
  } else {
    const sourceIds = new Set();
    matrix.sources.forEach((source, index) => {
      const path = `$.sources[${index}]`;
      if (!isRecord(source)) return errors.push(`${path}: expected object`);
      if (!nonEmptyString(source.id) || sourceIds.has(source.id)) {
        errors.push(`${path}.id: non-empty and unique ID required`);
      }
      sourceIds.add(source.id);
      if (!/^https:\/\//.test(source.url ?? "")) errors.push(`${path}.url: HTTPS URL required`);
      if (!nonEmptyString(source.version)) errors.push(`${path}.version: required`);
      if (source.accessedOn !== matrix.accessedOn) errors.push(`${path}.accessedOn: must match contract`);
    });
  }

  if (!Array.isArray(matrix.rows) || matrix.rows.length === 0) {
    errors.push("$.rows: at least one row required");
    return errors;
  }

  const rowIds = new Set();
  const mappedScenarios = new Set();
  matrix.rows.forEach((row, rowIndex) => {
    const path = `$.rows[${rowIndex}]`;
    if (!isRecord(row)) return errors.push(`${path}: expected object`);
    addUnknownFieldErrors(
      errors,
      row,
      new Set([
        "id",
        "scope",
        "applicability",
        "condition",
        "required",
        "nonCompensable",
        "scenarioIds",
        "behaviour",
        "wcag",
        "platformControls",
        "evidence",
        "failureRule",
      ]),
      path
    );

    if (!nonEmptyString(row.id) || rowIds.has(row.id)) errors.push(`${path}.id: non-empty and unique ID required`);
    rowIds.add(row.id);
    if (!ALLOWED_SCOPES.has(row.scope)) errors.push(`${path}.scope: invalid`);
    if (!ALLOWED_APPLICABILITY.has(row.applicability)) errors.push(`${path}.applicability: invalid`);
    if (row.applicability === "conditional" && !nonEmptyString(row.condition)) {
      errors.push(`${path}.condition: required for conditional row`);
    }
    if (row.required !== true) errors.push(`${path}.required: required rows must be true`);
    if (row.nonCompensable !== true) errors.push(`${path}.nonCompensable: must be true`);
    if (!nonEmptyString(row.behaviour)) errors.push(`${path}.behaviour: required`);
    if (!nonEmptyString(row.failureRule)) errors.push(`${path}.failureRule: required`);

    if (!Array.isArray(row.scenarioIds) || row.scenarioIds.length === 0) {
      errors.push(`${path}.scenarioIds: at least one scenario required`);
    } else {
      for (const scenarioId of row.scenarioIds) {
        if (!REQUIRED_SCENARIOS.has(scenarioId)) errors.push(`${path}.scenarioIds: unexpected ${scenarioId}`);
        mappedScenarios.add(scenarioId);
      }
    }

    if (!Array.isArray(row.wcag) || row.wcag.length === 0) {
      errors.push(`${path}.wcag: at least one mapping required`);
    } else {
      row.wcag.forEach((criterion, criterionIndex) => {
        const criterionPath = `${path}.wcag[${criterionIndex}]`;
        if (!isRecord(criterion)) return errors.push(`${criterionPath}: expected object`);
        if (!/^\d\.\d\.\d+$/.test(criterion.criterion ?? "")) errors.push(`${criterionPath}.criterion: invalid`);
        if (!ALLOWED_LEVELS.has(criterion.level)) errors.push(`${criterionPath}.level: invalid`);
        if (!nonEmptyString(criterion.name) || !nonEmptyString(criterion.relevance)) {
          errors.push(`${criterionPath}: name and relevance required`);
        }
      });
    }

    if (!Array.isArray(row.platformControls) || row.platformControls.length === 0) {
      errors.push(`${path}.platformControls: at least one mapping required`);
    } else {
      row.platformControls.forEach((control, controlIndex) => {
        const controlPath = `${path}.platformControls[${controlIndex}]`;
        if (!isRecord(control)) return errors.push(`${controlPath}: expected object`);
        if (!nonEmptyString(control.platform) || !nonEmptyString(control.control) || !nonEmptyString(control.expected)) {
          errors.push(`${controlPath}: platform, control, and expected required`);
        }
      });
    }

    if (!Array.isArray(row.evidence) || row.evidence.length === 0) {
      errors.push(`${path}.evidence: at least one evidence requirement required`);
    } else {
      let hasManual = false;
      row.evidence.forEach((evidence, evidenceIndex) => {
        const evidencePath = `${path}.evidence[${evidenceIndex}]`;
        if (!isRecord(evidence)) return errors.push(`${evidencePath}: expected object`);
        if (!ALLOWED_EVIDENCE_TYPES.includes(evidence.type)) errors.push(`${evidencePath}.type: invalid`);
        if (typeof evidence.automated !== "boolean") errors.push(`${evidencePath}.automated: boolean required`);
        if (!nonEmptyString(evidence.proof)) errors.push(`${evidencePath}.proof: required`);
        const manualType = typeof evidence.type === "string" && evidence.type.startsWith("manual-");
        if (manualType) {
          hasManual = true;
          if (evidence.automated !== false) errors.push(`${evidencePath}.automated: manual evidence must be false`);
          if (!nonEmptyString(evidence.owner) || !owners.has(evidence.owner)) {
            errors.push(`${evidencePath}.owner: known manual owner required`);
          }
        } else if (evidence.automated !== true) {
          errors.push(`${evidencePath}.automated: automated evidence must be true`);
        }
      });
      if (!hasManual) errors.push(`${path}.evidence: at least one owned manual check required`);
    }

    const claimText = JSON.stringify(row);
    for (const forbidden of FORBIDDEN_CLAIMS) {
      if (forbidden.test(claimText)) errors.push(`${path}: forbidden conformance/certification wording`);
    }
  });

  for (const scenario of REQUIRED_SCENARIOS) {
    if (!mappedScenarios.has(scenario)) errors.push(`$.rows: missing scenario ${scenario}`);
  }
  return errors;
}

export function assertAccessibilityMatrix(matrix) {
  const errors = validateAccessibilityMatrix(matrix);
  if (errors.length > 0) throw new Error(`Invalid accessibility matrix:\n${errors.join("\n")}`);
  return matrix;
}
