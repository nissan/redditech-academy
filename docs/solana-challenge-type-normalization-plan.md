# Solana Challenge Type Normalization Plan

Date: 2026-06-21
Parent issues: #29, #36, #42
Scope: planning only. No Solana JSON, MDX, route, renderer, judge, tutor, provider, or learner-visible content changes.

## Current Inventory

Current `origin/main` after PR #41 has 80 Solana challenge JSON files and 72 unique MDX challenge references.

| Category | Count | Meaning |
| --- | ---: | --- |
| Top-level typed JSON files | 5 | Already have a canonical top-level `type`. |
| Missing top-level `type` | 75 | Count currently reported by the inventory bucket. |
| Referenced missing `type`, safe `json-editor` candidate | 23 | MDX `environment` is `json-editor` and the challenge has JSON-editor-shaped prefill. |
| Referenced missing `type`, safe `sequence-completer` candidate | 1 | MDX `environment` is `sequence-completer` and the challenge has `prefilled.steps` plus `prefilled.correctOrder`. |
| Referenced missing `type`, shape mismatch | 43 | MDX `environment` is `sequence-completer`, but the challenge is JSON-editor-shaped with template/scenario data and no sequence steps/order. |
| Unreferenced missing `type`, legacy JSON-editor-shaped | 8 | Challenge JSON is not currently referenced by active MDX and is safe to classify only as dormant metadata. |
| Existing typed mismatch | 0 | Already typed challenges match their referring MDX environment. |

## Why #36 Needs This Split

Issue #36 originally looks like a metadata-only cleanup: add top-level `type` to Solana challenge JSON. That is safe only when the inferred type matches both the referring MDX `environment` and the JSON shape.

The 43 shape-mismatch cases are different:

- The MDX says `environment: "sequence-completer"`.
- The challenge JSON has JSON-editor-shaped prefill (`prefilled.template`), not `prefilled.steps` and `prefilled.correctOrder`.
- The current interactive page chooses the renderer from MDX `environment`, not from JSON `type`.
- The content-validation test suite only enforces JSON type/environment consistency when a JSON `type` exists.

Therefore, blindly adding `type: "sequence-completer"` to those 43 JSON files would make them canonical sequence challenges without the sequence data that sequence validation expects. Adding `type: "json-editor"` would create explicit MDX environment/type mismatches. Either choice is behavior-significant and needs a separate UI/content fix lane.

## Safe Implementation Sequence

### Lane A - Safe Metadata-Only Type Additions

Create a focused PR for the 31 safe JSON-editor additions and the 1 valid sequence-completer addition:

- 23 referenced JSON-editor-shaped challenges with MDX `environment: "json-editor"`.
- 8 unreferenced legacy JSON-editor-shaped challenges.
- 1 valid referenced sequence-completer challenge: `solana-03-devnet-launch-gate`.

Acceptance criteria:

- Only top-level `type` fields are added to selected Solana challenge JSON files.
- No MDX files change.
- No route, renderer, judge, tutor, provider, or visible task copy changes.
- `missingChallengeJsonType` decreases by 32 if the unreferenced files are included and by 24 if only referenced files are included.
- `environmentCoverageGaps` remains unchanged at 43, because the unsafe mismatch cases are intentionally deferred.
- `pnpm content:inventory`, `pnpm test -- tests/content-validation.test.ts`, `pnpm test -- tests/course-inventory-report.test.ts`, and `git diff --check` pass.
- UI evidence is not required because no visible UI should change.

Recommended owner: Kit.

### Lane B - Sequence-Labeled JSON-Editor Shape Decision

Create a separate issue for the 43 mismatch cases. This is not a metadata-only cleanup.

Decision options:

1. Convert MDX environments from `sequence-completer` to `json-editor` where the current JSON template is the intended learner interaction.
2. Convert challenge JSON into real sequence-completer data by adding `prefilled.steps` and `prefilled.correctOrder`, if ordering is the intended learner interaction.
3. Split by module pattern if some lessons are architecture/adversarial ordering tasks and others are JSON drafting tasks.

Acceptance criteria:

- Each affected lesson/challenge pair is classified before edits.
- Any MDX `environment` change includes UI evidence because it changes the rendered challenge tool.
- Any sequence conversion includes sequence integrity tests.
- Any visible task-copy migration stays out of this lane unless explicitly scoped.

Recommended owner: Firefly for classification, Kit for implementation after classification, Oli for review.

### Lane C - Validator Tightening

Only after Lane A and Lane B complete:

- Make missing top-level challenge `type` a hard content-validation failure for active challenge JSON.
- Make MDX environment/type mismatches hard failures without legacy skip behavior.
- Decide whether dormant/unreferenced challenge JSON must be typed or can remain legacy until restored/removed.

## Safe Candidate Lists

### Safe JSON-Editor Candidates

- `solana-01-app-builder-brief`
- `solana-01-foundations-implementation`
- `solana-02-tooling-implementation`
- `solana-02-wallet-policy`
- `solana-03-wallets-implementation`
- `solana-04-onchain-implementation`
- `solana-05-frontend-implementation`
- `solana-06-testing-implementation`
- `solana-07-deployment-implementation`
- `solana-09-anchor-escrow-implementation`
- `solana-10-pinocchio-escrow-implementation`
- `solana-11-quasar-escrow-implementation`
- `solana-12-jupiter-implementation`
- `solana-13-orca-implementation`
- `solana-14-chainlink-implementation`
- `solana-15-pyth-implementation`
- `solana-16-vrm-auctions-implementation`
- `solana-17-surfpool-implementation`
- `solana-18-litesvm-implementation`
- `solana-19-validator-arch-implementation`
- `solana-20-validator-ops-implementation`
- `solana-21-client-diversity-implementation`
- `solana-22-validator-launch-implementation`

### Safe Sequence Candidate

- `solana-03-devnet-launch-gate`

### Dormant JSON-Editor-Shaped Candidates

- `solana-09-anchor-escrow`
- `solana-10-pinocchio-escrow`
- `solana-11-quasar-escrow`
- `solana-12-jupiter-defi`
- `solana-13-orca-defi`
- `solana-14-chainlink-oracle`
- `solana-15-pyth-oracle`
- `solana-16-vrm-auctions`

## Deferred Mismatch Group

These 43 challenge IDs are referenced by MDX lessons that currently declare `environment: "sequence-completer"` but their JSON shape is JSON-editor-like. Do not add a canonical type until Lane B classifies and fixes the intended interaction.

- `solana-00-first-principles-launch-gate`
- `solana-01-foundations-adversarial`
- `solana-01-foundations-architecture`
- `solana-02-tooling-adversarial`
- `solana-02-tooling-architecture`
- `solana-03-wallets-adversarial`
- `solana-03-wallets-architecture`
- `solana-04-onchain-adversarial`
- `solana-04-onchain-architecture`
- `solana-05-frontend-adversarial`
- `solana-05-frontend-architecture`
- `solana-06-testing-adversarial`
- `solana-06-testing-architecture`
- `solana-07-deployment-adversarial`
- `solana-07-deployment-architecture`
- `solana-09-anchor-escrow-adversarial`
- `solana-09-anchor-escrow-architecture`
- `solana-10-pinocchio-escrow-adversarial`
- `solana-10-pinocchio-escrow-architecture`
- `solana-11-quasar-escrow-adversarial`
- `solana-11-quasar-escrow-architecture`
- `solana-12-jupiter-adversarial`
- `solana-12-jupiter-architecture`
- `solana-13-orca-adversarial`
- `solana-13-orca-architecture`
- `solana-14-chainlink-adversarial`
- `solana-14-chainlink-architecture`
- `solana-15-pyth-adversarial`
- `solana-15-pyth-architecture`
- `solana-16-vrm-auctions-adversarial`
- `solana-16-vrm-auctions-architecture`
- `solana-17-surfpool-adversarial`
- `solana-17-surfpool-architecture`
- `solana-18-litesvm-adversarial`
- `solana-18-litesvm-architecture`
- `solana-19-validator-arch-adversarial`
- `solana-19-validator-arch-architecture`
- `solana-20-validator-ops-adversarial`
- `solana-20-validator-ops-architecture`
- `solana-21-client-diversity-adversarial`
- `solana-21-client-diversity-architecture`
- `solana-22-validator-launch-adversarial`
- `solana-22-validator-launch-architecture`

## Issue Updates

- Keep #36 open for the safe metadata-only top-level `type` additions after this plan lands.
- Create a follow-up issue for Lane B before touching the 43 mismatch pairs.
- Keep #37 slug/frontmatter mismatch cleanup separate from #36, because slug cleanup affects route assumptions.
