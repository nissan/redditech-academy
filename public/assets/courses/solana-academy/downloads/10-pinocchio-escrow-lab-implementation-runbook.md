# Pinocchio Escrow Lab — Implementation Runbook

## Objective
Port escrow to Pinocchio and compare compute footprint, binary size, and low-level control decisions versus Anchor.

## Acceptance Criteria
- Clear account/signer invariants documented.
- Deterministic pass/fail checks implemented on devnet.
- Failure modes produce explicit logs and release blockers.

## Build Steps
1. Define state + instruction boundaries.
2. Encode invariants before implementation.
3. Add integration tests for happy path and edge cases.
4. Run adversarial checks and compile release evidence.

## Launch Gate
- CI green
- Adversarial matrix complete
- Rollback note prepared
- Devnet proof attached
