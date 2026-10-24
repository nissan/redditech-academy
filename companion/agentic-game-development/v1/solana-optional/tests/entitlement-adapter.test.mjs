import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

import {
  DEVELOPMENT_RPC_URL,
  InMemoryEntitlementAdapter,
  SYNTHETIC_CONTEXT,
  SyntheticChainEntitlementAdapter,
  startCore,
} from "../src/entitlement-adapter.mjs";

/** @typedef {{operationId: string, status: "applied" | "rejected", receipt: string}} TerminalResult */
/** @typedef {{operationId: string, playerAddress: string, signerAddress: string, accountAddress: string, mintAddress: string, recipientAddress: string, authorityAddress: string, programAddress: string, pdaAddress: string}} EntitlementRequest */

const PLAYER = "2S8BtFg91VWpz85pffaxFQiS5yNTVJN3rjtbsuUMYRTz";
const RECIPIENT = "6zgdVjA356iAggsQX7FaEt5qoBCzUbwfuEH43KeeWJtb";
const WRONG = "ComputeBudget111111111111111111111111111111";
const EXPECTED = Object.freeze({
  playerAddress: PLAYER,
  signerAddress: PLAYER,
  accountAddress: PLAYER,
  mintAddress: SYNTHETIC_CONTEXT.mintAddress,
  recipientAddress: RECIPIENT,
  authorityAddress: PLAYER,
  programAddress: SYNTHETIC_CONTEXT.programAddress,
  pdaAddress: SYNTHETIC_CONTEXT.pdaAddress,
});

/** @param {string} [operationId] */
function request(operationId = "agd-op-0001") {
  return { operationId, ...EXPECTED };
}

class ScriptedChain {
  submitCalls = 0;
  reconcileCalls = 0;
  /** @type {Array<TerminalResult | Error>} */
  outcomes;
  /** @type {TerminalResult | null} */
  reconciled = null;

  /** @param {Array<TerminalResult | Error>} outcomes */
  constructor(outcomes) {
    this.outcomes = [...outcomes];
  }

  /** @param {EntitlementRequest} input */
  async submitExplicitlySignedGrant(input) {
    this.submitCalls += 1;
    const outcome = this.outcomes.shift();
    if (outcome instanceof Error) throw outcome;
    return outcome ?? {
      operationId: input.operationId,
      status: "applied",
      receipt: `synthetic:${input.operationId}`,
    };
  }

  async reconcile() {
    this.reconcileCalls += 1;
    return this.reconciled;
  }
}

test("chain-disabled core starts and grants offline without RPC or wallet", async () => {
  const core = startCore({ chainEnabled: false });
  assert.equal(core.chainEnabled, false);
  assert.ok(core.adapter instanceof InMemoryEntitlementAdapter);
  const result = await core.adapter.grant("offline-op-0001", "offline-player");
  assert.equal(result.status, "applied");
  assert.equal(core.adapter.hasEntitlement("offline-player"), true);
});

test("all identity and authority mismatches fail before effect", async () => {
  for (const field of [
    "signerAddress",
    "accountAddress",
    "mintAddress",
    "recipientAddress",
    "authorityAddress",
    "programAddress",
    "pdaAddress",
  ]) {
    const chain = new ScriptedChain([]);
    const adapter = new SyntheticChainEntitlementAdapter({ chain, expected: EXPECTED });
    const invalid = { ...request(`negative-${field}`), [field]: WRONG };
    await assert.rejects(adapter.grant(invalid), new RegExp(field));
    assert.equal(chain.submitCalls, 0, `${field} reached chain submit`);
    assert.equal(chain.reconcileCalls, 0, `${field} reached reconciliation`);
    assert.equal(adapter.effectCount(), 0, `${field} changed entitlement state`);
  }
});

test("timeout retry and duplicate request apply at most once", async () => {
  const chain = new ScriptedChain([new Error("synthetic timeout")]);
  const adapter = new SyntheticChainEntitlementAdapter({
    chain,
    expected: EXPECTED,
    maxAttempts: 2,
    timeoutMs: 100,
  });
  const first = await adapter.grant(request("retry-op-0001"));
  const duplicate = await adapter.grant(request("retry-op-0001"));
  assert.deepEqual(duplicate, first);
  assert.equal(chain.submitCalls, 2);
  assert.equal(adapter.effectCount(), 1);
});

test("bounded timeout does not trust a chain call that ignores abort", async () => {
  const chain = new ScriptedChain([]);
  chain.submitExplicitlySignedGrant = async () => {
    chain.submitCalls += 1;
    return await new Promise(() => {});
  };
  const adapter = new SyntheticChainEntitlementAdapter({
    chain,
    expected: EXPECTED,
    maxAttempts: 1,
    timeoutMs: 10,
  });
  const started = performance.now();
  await assert.rejects(adapter.grant(request("bounded-op-0001")), /bounded timeout/);
  assert.ok(performance.now() - started < 250, "timeout was not bounded");
  assert.equal(adapter.effectCount(), 0);
});

test("late reconciliation wins once and out-of-order callback returns original terminal result", async () => {
  /** @type {TerminalResult} */
  const confirmed = {
    operationId: "late-op-0001",
    status: "applied",
    receipt: "synthetic:confirmed-late",
  };
  const chain = new ScriptedChain([new Error("dropped response")]);
  let reconcileCount = 0;
  chain.reconcile = async () => {
    chain.reconcileCalls += 1;
    reconcileCount += 1;
    return reconcileCount >= 2 ? confirmed : null;
  };
  const adapter = new SyntheticChainEntitlementAdapter({
    chain,
    expected: EXPECTED,
    maxAttempts: 2,
    timeoutMs: 100,
  });
  const result = await adapter.grant(request("late-op-0001"));
  const staleFailure = adapter.acceptCallback({
    operationId: "late-op-0001",
    status: "rejected",
    receipt: "synthetic:stale-failure",
  });
  assert.deepEqual(result, confirmed);
  assert.deepEqual(staleFailure, confirmed);
  assert.equal(chain.submitCalls, 1);
  assert.equal(adapter.effectCount(), 1);
});

test("operation identifiers cannot be replayed with changed authority data", async () => {
  const chain = new ScriptedChain([]);
  const adapter = new SyntheticChainEntitlementAdapter({ chain, expected: EXPECTED });
  await adapter.grant(request("collision-op-0001"));
  await assert.rejects(
    adapter.grant({ ...request("collision-op-0001"), playerAddress: RECIPIENT }),
    /playerAddress/,
  );
  assert.equal(chain.submitCalls, 1);
  assert.equal(adapter.effectCount(), 1);
});

test("development cluster is configuration-only and no production endpoint is locked", async () => {
  assert.equal(DEVELOPMENT_RPC_URL, "https://api.devnet.solana.com");
  const lock = JSON.parse(
    await readFile(new URL("../optional-stack.candidate-lock.json", import.meta.url), "utf8"),
  );
  assert.equal(lock.clusters.development.rpc, DEVELOPMENT_RPC_URL);
  assert.equal(lock.clusters.development.liveTransactionExecutedForGateA5, false);
  assert.equal(lock.clusters.productionClusterConfigured, false);
  const forbiddenProductionHost = ["api", "mainnet-beta", "solana", "com"].join(".");
  assert.equal(JSON.stringify(lock).includes(forbiddenProductionHost), false);
  assert.equal(lock.futureGlobalLockIntegration.target.endsWith("bundle.lock.json"), true);
  assert.match(lock.futureGlobalLockIntegration.precondition, /Gate A2 passes/);
});
