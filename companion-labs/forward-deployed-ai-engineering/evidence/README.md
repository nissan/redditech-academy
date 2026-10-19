# HarbourCare evidence repository contract

This directory defines the versioned evidence layout used by the Forward Deployed AI Engineering companion lab. It is a local, synthetic learning contract. **Templates are not completed evidence** and must never be presented as proof that a control, deployment, evaluation, or recovery exercise passed.

## Directory convention

`manifest.json` is the deterministic index. Its `templates` array is ordered by the zero-based `index` field and then by the stable template ID. Every indexed template is authenticated by a SHA-256 digest of its exact bytes.

Learner-created evidence is written beneath these declared directories:

- `discovery/` — discovery briefs and bounded pilot statements of work.
- `decisions/` — append-only architecture decision records; supersede a record, never silently rewrite history.
- `risks/` — risk registers and accepted residual-risk records.
- `runbooks/` — operator procedures and independent task records.
- `evaluations/` — versioned evaluation cards and release decisions.
- `tests/` — structured test results and command transcripts.
- `reports/` — generated summaries that point back to primary evidence.

Output filenames use lowercase ASCII kebab-case plus an explicit version or date, for example `decisions/adr-0002-disconnected-production-v1.md`. Paths must be relative, remain inside this repository, and must not contain `..`, absolute roots, or URLs. Indexed artifacts must be regular files rather than symlinks.

## Evidence rules

1. Copy the relevant template to its declared output directory; do not edit the canonical template while completing an exercise.
2. Replace every instruction field with synthetic HarbourCare evidence and preserve the Evidence Metadata and Evidence References sections.
3. Record commands, versions, timestamps, expected results, actual results, and exit status where the claim is executable.
4. Link summaries to primary evidence. Screenshots and prose claims alone are not proof.
5. Keep decision history append-only. A changed assumption creates a dated revision or superseding ADR.
6. Use no production credential, live customer data, raw secret, or provider response.
7. The canonical path uses no paid API and no live environment. Optional extensions cannot change deterministic pass/fail evidence.
8. Failed, blocked, and inconclusive results stay visible; do not relabel them as passed.

## Change control

Changing a template changes its digest and requires a manifest update. Breaking layout or field changes require a new `contractVersion`. Later build slices may add templates or evidence types, but existing IDs remain stable so a capstone index can be reproduced from the manifest.
