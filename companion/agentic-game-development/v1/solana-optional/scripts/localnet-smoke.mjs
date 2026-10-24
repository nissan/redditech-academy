import assert from "node:assert/strict";
import { lstat, readFile, realpath } from "node:fs/promises";
import path from "node:path";

import {
  AccountRole,
  address,
  appendTransactionMessageInstruction,
  createKeyPairSignerFromBytes,
  createSolanaRpc,
  createTransactionMessage,
  getBase64EncodedWireTransaction,
  getSignatureFromTransaction,
  pipe,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  signTransactionMessageWithSigners,
} from "@solana/kit";

import {
  SYNTHETIC_CONTEXT,
  SyntheticChainEntitlementAdapter,
} from "../src/entitlement-adapter.mjs";

/** @typedef {{operationId: string, status: "applied" | "rejected", receipt: string}} TerminalResult */

const repositoryRoot = path.resolve(import.meta.dirname, "../../../../../..");
const rpcUrl = process.env.AGD_LOCAL_RPC_URL ?? "http://127.0.0.1:18999";
const playerKeyPath = process.env.AGD_PLAYER_KEYPAIR;
const recipientKeyPath = process.env.AGD_RECIPIENT_KEYPAIR;

/** @param {string} label @param {string | undefined} keyPath */
async function loadExternalSigner(label, keyPath) {
  if (!keyPath) throw new Error(`${label} key path is required`);
  const resolved = await realpath(keyPath);
  const relative = path.relative(repositoryRoot, resolved);
  if (relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative))) {
    throw new Error(`${label} key must be outside the repository`);
  }
  const mode = (await lstat(resolved)).mode & 0o777;
  if ((mode & 0o077) !== 0) throw new Error(`${label} key permissions must be 0600 or stricter`);
  const bytes = Uint8Array.from(JSON.parse(await readFile(resolved, "utf8")));
  return createKeyPairSignerFromBytes(bytes);
}

class SurfpoolChainPort {
  #rpc = createSolanaRpc(rpcUrl);
  /** @type {Awaited<ReturnType<typeof createKeyPairSignerFromBytes>>} */
  #player;
  /** @type {import("@solana/kit").Address} */
  #recipient;
  /** @type {Map<string, import("@solana/kit").Signature>} */
  #signatures = new Map();

  /**
   * @param {Awaited<ReturnType<typeof createKeyPairSignerFromBytes>>} player
   * @param {import("@solana/kit").Address} recipient
   */
  constructor(player, recipient) {
    this.#player = player;
    this.#recipient = recipient;
  }

  /**
   * @param {{operationId: string}} request
   * @param {AbortSignal} signal
   * @returns {Promise<TerminalResult>}
   */
  async submitExplicitlySignedGrant(request, signal) {
    const latestBlockhash = (
      await this.#rpc.getLatestBlockhash({ commitment: "confirmed" }).send({ abortSignal: signal })
    ).value;
    const instructionData = new Uint8Array(12);
    const instructionView = new DataView(instructionData.buffer);
    instructionView.setUint32(0, 2, true);
    instructionView.setBigUint64(4, BigInt(1), true);

    const message = pipe(
      createTransactionMessage({ version: 0 }),
      (next) => setTransactionMessageFeePayerSigner(this.#player, next),
      (next) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, next),
      (next) =>
        appendTransactionMessageInstruction(
          {
            programAddress: address(SYNTHETIC_CONTEXT.programAddress),
            accounts: [
              {
                address: this.#player.address,
                role: AccountRole.WRITABLE_SIGNER,
                signer: this.#player,
              },
              { address: this.#recipient, role: AccountRole.WRITABLE },
            ],
            data: instructionData,
          },
          next,
        ),
    );
    const signed = await signTransactionMessageWithSigners(message);
    const signature = getSignatureFromTransaction(signed);
    const submitted = await this.#rpc
      .sendTransaction(getBase64EncodedWireTransaction(signed), {
        encoding: "base64",
        preflightCommitment: "confirmed",
        skipPreflight: false,
      })
      .send({ abortSignal: signal });
    assert.equal(submitted, signature, "RPC returned a different transaction signature");
    this.#signatures.set(request.operationId, signature);

    for (let poll = 0; poll < 50; poll += 1) {
      const status = (await this.#rpc.getSignatureStatuses([signature]).send({ abortSignal: signal }))
        .value[0];
      if (status?.err) throw new Error("local transaction failed");
      if (status?.confirmationStatus) {
        return {
          operationId: request.operationId,
          status: "applied",
          receipt: `local:${signature}`,
        };
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    throw new Error("local confirmation timeout");
  }

  /** @param {string} operationId @param {AbortSignal} signal @returns {Promise<TerminalResult | null>} */
  async reconcile(operationId, signal) {
    const signature = this.#signatures.get(operationId);
    if (!signature) return null;
    const status = (await this.#rpc.getSignatureStatuses([signature]).send({ abortSignal: signal }))
      .value[0];
    if (!status?.confirmationStatus || status.err) return null;
    return { operationId, status: "applied", receipt: `local:${signature}` };
  }
}

const player = await loadExternalSigner("player", playerKeyPath);
const recipient = await loadExternalSigner("recipient", recipientKeyPath);
assert.notEqual(player.address, recipient.address);

const rpc = createSolanaRpc(rpcUrl);
const genesisHash = await rpc.getGenesisHash().send({ abortSignal: AbortSignal.timeout(2_000) });
const before = (
  await rpc.getBalance(recipient.address, { commitment: "confirmed" }).send({
    abortSignal: AbortSignal.timeout(2_000),
  })
).value;

const expected = {
  playerAddress: player.address,
  signerAddress: player.address,
  accountAddress: player.address,
  mintAddress: SYNTHETIC_CONTEXT.mintAddress,
  recipientAddress: recipient.address,
  authorityAddress: player.address,
  programAddress: SYNTHETIC_CONTEXT.programAddress,
  pdaAddress: SYNTHETIC_CONTEXT.pdaAddress,
};
const adapter = new SyntheticChainEntitlementAdapter({
  chain: new SurfpoolChainPort(player, recipient.address),
  expected,
  maxAttempts: 2,
  timeoutMs: 10_000,
});
const operation = { operationId: "localnet-smoke-0001", ...expected };
const first = await adapter.grant(operation);
const duplicate = await adapter.grant(operation);
const after = (
  await rpc.getBalance(recipient.address, { commitment: "confirmed" }).send({
    abortSignal: AbortSignal.timeout(2_000),
  })
).value;

assert.deepEqual(duplicate, first);
assert.equal(after, before + BigInt(1));
assert.equal(adapter.effectCount(), 1);

// Deliberately emit only non-secret booleans/counts and a public local genesis hash.
console.log(
  JSON.stringify({
    marker: "AGD_SOLANA_LOCALNET_PASS",
    explicitSigning: true,
    externalKeyFiles: true,
    localGenesisHash: genesisHash,
    recipientDeltaLamports: String(after - before),
    duplicateReturnedOriginalResult: duplicate.receipt === first.receipt,
    entitlementEffects: adapter.effectCount(),
  }),
);
