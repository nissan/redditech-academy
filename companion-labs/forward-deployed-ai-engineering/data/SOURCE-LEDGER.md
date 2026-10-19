# HarbourCare synthetic dataset source and licence ledger

## Scope

This ledger covers `harbourcare-v1.json` and `harbourcare-v1.schema.json`.

| Reference | Material | Origin | Licence / use | Restrictions |
|---|---|---|---|---|
| `redditech-original-fixture` | Tenant names, role-based personas, `.invalid` email addresses, documents, ERP records, sensitivity labels, evaluation cases, and schema wording | Original Redditech Academy synthetic educational material created for the Forward Deployed AI Engineering course | Repository terms apply; no third-party dataset or model output is incorporated | Review-only until course publication is separately approved |

## Provenance statement

- HarbourCare, its business units, people, suppliers, identifiers, documents, amounts, and incidents are fictional.
- The fixture contains no real patient, employee, customer, or supplier data.
- Reserved `.invalid` addresses are used so the fixture cannot deliver email.
- No third-party corpus, model weight, binary, container image, production credential, or paid API output is included.
- The dataset is vendor-neutral and exists to test transferable contracts: tenant isolation, purpose-aware access, reconciliation, safe retrieval, redaction, and evaluation.
- Inspiration attribution for the course roadmap remains in `content/courses/forward-deployed-ai-engineering/course.json`; it does not imply endorsement or certification.

## Change control

Any later fixture version must receive a new dataset ID and schema version, retain an explicit source/licence entry, remain synthetic, and preserve old golden-set versions for reproducible grading.
