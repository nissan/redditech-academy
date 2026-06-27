# Solana Academy Case Pack: Source-Rigor Teaching Cases

This pack is repo-owned course content derived from the workspace planning artifact `SOLANA-HARVARD-CASE-PACK-V1-2026-04-17.md`.

## Provenance Policy

- These are synthetic teaching cases, not claims about a specific production incident.
- Real tools and protocols are referenced only to anchor the learner's research path.
- Do not copy third-party diagrams, screenshots, postmortems, or proprietary text into learner submissions. Use links, short citations, and your own analysis.

## Case 1: Escrow Release Deadlock

**Label:** Synthetic teaching case.

**Scenario:** A marketplace escrow flow stalls because signer authority, PDA ownership, and timeout paths were specified too loosely. Buyers see locked funds, sellers see no settlement, and support cannot tell whether the issue is a UI bug, program invariant failure, or missing fallback.

**Decision tension:** Patch the release path quickly, add manual operations, or redesign the state machine before more trades enter escrow.

**Learner decision memo:** Define the authority model, enumerate state transitions, list rollback owners, and name the invariant that blocks launch.

**Provenance notes:** Based on repo-owned course planning. Use the Anchor account-constraints and testing docs as technical grounding:

- https://www.anchor-lang.com/docs/references/account-constraints
- https://www.anchor-lang.com/docs/testing

## Case 2: Oracle Drift and Unsafe Execution

**Label:** Synthetic teaching case.

**Scenario:** Volatile market conditions make a price feed stale enough that auction or liquidation logic could execute against the wrong price. The protocol is technically live, but confidence intervals and freshness windows no longer match the product's risk promise.

**Decision tension:** Keep execution open, halt risky actions, widen safety bounds, or switch to a fallback data policy.

**Learner decision memo:** Set freshness limits, confidence thresholds, fallback rules, incident communication triggers, and go/no-go criteria.

**Provenance notes:** Based on repo-owned course planning. Use Pyth's price-feed and Solana pull-integration docs as the source path for implementation details:

- https://docs.pyth.network/price-feeds/core/price-feeds
- https://docs.pyth.network/price-feeds/core/use-real-time-data/pull-integration/solana

## Case 3: Launch Sequence Failure Despite Green Tests

**Label:** Synthetic teaching case.

**Scenario:** A team passes local and devnet tests, but a production configuration mismatch appears during rollout because ordered launch gates were treated as guidance instead of release blockers.

**Decision tension:** Preserve the launch date, ship a partial release, or enforce a hard gate with rollback proof before promotion.

**Learner decision memo:** Create the promotion checklist, assign owners for each gate, document rollback evidence, and state which failed check stops launch.

**Provenance notes:** Based on repo-owned course planning. Use Solana security, RPC, and fee documentation as the source path for launch-risk research:

- https://solana.com/docs/security
- https://solana.com/docs/rpc
- https://solana.com/docs/core/fees

## Case 4: Validator Ops Incident and Slow Recovery

**Label:** Synthetic teaching case.

**Scenario:** A validator operation has unstable nodes, noisy alerts, and unclear failover ownership. The team keeps tuning in place while the recovery window stretches.

**Decision tension:** Stay online with degraded signals, fail over early and investigate, or reduce services until the runbook is proven.

**Learner decision memo:** Set uptime, latency, hardware, alert, cost, failover, and postmortem standards before launch.

**Provenance notes:** Based on repo-owned course planning. Use Anza validator operations docs as the source path for requirements and setup:

- https://docs.anza.xyz/operations/requirements
- https://docs.anza.xyz/operations/setup-a-validator
- https://docs.anza.xyz/operations/guides/validator-start

## Case 5: DeFi Integration Slippage and User Trust

**Label:** Synthetic teaching case.

**Scenario:** A marketplace adds token swap routing so buyers can pay with more assets, but volatile pools produce outcomes outside user expectations. The team must decide whether better previews, stricter slippage controls, or route restrictions are release blockers.

**Decision tension:** Maximize conversion throughput or protect users with explicit default constraints.

**Learner decision memo:** Define route-policy constraints, slippage ceilings, preview requirements, failure copy, and the user-protection rule that blocks execution.

**Provenance notes:** Based on repo-owned course planning. Use Jupiter's developer docs as the source path for quote/build/order integration research:

- https://developers.jup.ag/docs/get-started
- https://developers.jup.ag/docs/guides
