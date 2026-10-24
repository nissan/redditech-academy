import { createHash } from "node:crypto";

export const SYNTHETIC_CONTEXT = Object.freeze({
  mintAddress: "So11111111111111111111111111111111111111112",
  programAddress: "11111111111111111111111111111111",
  pdaAddress: "8P8dZMp1GHQrTsnUtbMeUKGqtxdjkA3FHaoHSPqhnPDR",
});

export const DEVELOPMENT_RPC_URL = "https://api.devnet.solana.com";

/**
 * @typedef {Readonly<{
 *   operationId: string,
 *   playerAddress: string,
 *   signerAddress: string,
 *   accountAddress: string,
 *   mintAddress: string,
 *   recipientAddress: string,
 *   authorityAddress: string,
 *   programAddress: string,
 *   pdaAddress: string,
 * }>} EntitlementRequest
 */

/**
 * @typedef {Readonly<{
 *   operationId: string,
 *   status: "applied" | "rejected",
 *   receipt: string,
 * }>} TerminalResult
 */

/**
 * @typedef {{
 *   submitExplicitlySignedGrant(request: EntitlementRequest, signal: AbortSignal): Promise<TerminalResult>,
 *   reconcile(operationId: string, signal: AbortSignal): Promise<TerminalResult | null>,
 * }} ExplicitSigningChainPort
 */

/** @typedef {Omit<EntitlementRequest, "operationId">} ExpectedAuthority */
/** @typedef {{ fingerprint: string, terminal: TerminalResult | null }} OperationState */

/** @param {EntitlementRequest} request */
function fingerprint(request) {
  return createHash("sha256")
    .update(JSON.stringify(request))
    .digest("hex");
}

/** @param {string} operationId */
function requireNonEmptyOperationId(operationId) {
  if (!/^[a-z0-9][a-z0-9._:-]{7,127}$/i.test(operationId)) {
    throw new Error("invalid operation identifier");
  }
}

/** @param {EntitlementRequest} request @param {ExpectedAuthority} expected */
function validateAuthority(request, expected) {
  requireNonEmptyOperationId(request.operationId);
  /** @type {Array<keyof ExpectedAuthority>} */
  const authorityFields = [
    "playerAddress",
    "signerAddress",
    "accountAddress",
    "mintAddress",
    "recipientAddress",
    "authorityAddress",
    "programAddress",
    "pdaAddress",
  ];
  for (const field of authorityFields) {
    if (request[field] !== expected[field]) {
      throw new Error(`authority validation failed: ${field}`);
    }
  }
  if (request.signerAddress !== request.playerAddress) {
    throw new Error("authority validation failed: player must explicitly sign");
  }
}

/**
 * @template T
 * @param {number} timeoutMs
 * @param {(signal: AbortSignal) => Promise<T>} action
 * @returns {Promise<T>}
 */
async function withTimeout(timeoutMs, action) {
  const controller = new AbortController();
  /** @type {NodeJS.Timeout | undefined} */
  let timer;
  const timeout = new Promise((_resolve, reject) => {
    timer = setTimeout(() => {
      const error = new Error("bounded timeout");
      controller.abort(error);
      reject(error);
    }, timeoutMs);
  });
  try {
    return await Promise.race([action(controller.signal), timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export class SyntheticChainEntitlementAdapter {
  /** @type {ExplicitSigningChainPort} */
  #chain;
  /** @type {ExpectedAuthority} */
  #expected;
  /** @type {number} */
  #timeoutMs;
  /** @type {number} */
  #maxAttempts;
  /** @type {Map<string, OperationState>} */
  #operations = new Map();
  /** @type {Set<string>} */
  #entitledPlayers = new Set();

  /**
   * @param {{chain: ExplicitSigningChainPort, expected: ExpectedAuthority, timeoutMs?: number, maxAttempts?: number}} config
   */
  constructor(config) {
    this.#chain = config.chain;
    this.#expected = config.expected;
    this.#timeoutMs = config.timeoutMs ?? 2_000;
    this.#maxAttempts = config.maxAttempts ?? 2;
    if (this.#timeoutMs < 1 || this.#timeoutMs > 30_000) {
      throw new Error("timeout must be between 1 and 30000 ms");
    }
    if (this.#maxAttempts < 1 || this.#maxAttempts > 3) {
      throw new Error("attempt count must be between 1 and 3");
    }
  }

  /** @param {string} playerAddress */
  hasEntitlement(playerAddress) {
    return this.#entitledPlayers.has(playerAddress);
  }

  effectCount() {
    return this.#entitledPlayers.size;
  }

  /** @param {TerminalResult} result @returns {TerminalResult} */
  acceptCallback(result) {
    const state = this.#operations.get(result.operationId);
    if (!state) throw new Error("callback for unknown operation");
    if (state.terminal) return state.terminal;
    state.terminal = result;
    if (result.status === "applied") {
      this.#entitledPlayers.add(this.#expected.playerAddress);
    }
    return result;
  }

  /** @param {EntitlementRequest} request @returns {Promise<TerminalResult>} */
  async grant(request) {
    // All identity and authority checks occur before operation state or chain effects.
    validateAuthority(request, this.#expected);
    const requestFingerprint = fingerprint(request);
    const existing = this.#operations.get(request.operationId);
    if (existing) {
      if (existing.fingerprint !== requestFingerprint) {
        throw new Error("operation identifier reused with different request");
      }
      if (existing.terminal) return existing.terminal;
    } else {
      this.#operations.set(request.operationId, {
        fingerprint: requestFingerprint,
        terminal: null,
      });
    }

    /** @type {unknown} */
    let lastError;
    for (let attempt = 0; attempt < this.#maxAttempts; attempt += 1) {
      try {
        const reconciled = await withTimeout(this.#timeoutMs, (signal) =>
          this.#chain.reconcile(request.operationId, signal),
        );
        if (reconciled) return this.acceptCallback(reconciled);

        const submitted = await withTimeout(this.#timeoutMs, (signal) =>
          this.#chain.submitExplicitlySignedGrant(request, signal),
        );
        return this.acceptCallback(submitted);
      } catch (error) {
        lastError = error;
      }
    }

    const finalReconciliation = await withTimeout(this.#timeoutMs, (signal) =>
      this.#chain.reconcile(request.operationId, signal),
    );
    if (finalReconciliation) return this.acceptCallback(finalReconciliation);
    throw lastError instanceof Error ? lastError : new Error("grant failed");
  }
}

export class InMemoryEntitlementAdapter {
  /** @type {Map<string, TerminalResult>} */
  #operations = new Map();
  /** @type {Set<string>} */
  #entitledPlayers = new Set();

  /** @param {string} operationId @param {string} playerAddress */
  async grant(operationId, playerAddress) {
    requireNonEmptyOperationId(operationId);
    const existing = this.#operations.get(operationId);
    if (existing) return existing;
    /** @type {TerminalResult} */
    const result = {
      operationId,
      status: "applied",
      receipt: `memory:${operationId}`,
    };
    this.#operations.set(operationId, result);
    this.#entitledPlayers.add(playerAddress);
    return result;
  }

  /** @param {string} playerAddress */
  hasEntitlement(playerAddress) {
    return this.#entitledPlayers.has(playerAddress);
  }
}

/** @param {{chainEnabled: boolean}} config */
export function startCore(config) {
  if (config.chainEnabled) {
    throw new Error("Gate A5 core bootstrap accepts chain-disabled mode only");
  }
  return { adapter: new InMemoryEntitlementAdapter(), chainEnabled: false };
}
