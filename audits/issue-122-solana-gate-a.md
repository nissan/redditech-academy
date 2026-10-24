# Issue #122 Gate A5 — optional Solana stack and security spike

_Observed 2026-10-20 AEDT on one Apple-silicon Mac mini. This is an isolated optional-stack feasibility result for `AGD-SOL-003`–`AGD-SOL-006`; it is not a production integration, public release, financial system, or complete companion lock._

## Outcome

**PASS.** The Gate A5 candidate locks and exercises a maintained TypeScript client with the approved local first-party baselines:

- Agave/Solana CLI `4.3.2`;
- Surfpool `1.1.1` in `--offline` mode;
- `@solana/kit` `8.5.0`, selected from Anza's current maintainer release and locked with npm integrity, observed tarball SHA-256, and the complete isolated pnpm resolution graph.

The local deterministic acceptance passed with a player-controlled throwaway key and recipient key generated into a mode-`0600` `/tmp` directory outside the repository. The TypeScript harness explicitly signed a synthetic one-lamport **local simulator** transfer, confirmed a one-lamport recipient delta, returned the original terminal result for a duplicate domain operation, and applied one entitlement effect. No secret bytes, seed phrase, or key-file contents entered the repository or command output.

The separately tested offline adapter starts and grants an in-memory entitlement with chain support disabled. Wrong signer, account, mint, recipient, authority, program, and PDA fail before reconciliation, submission, or entitlement mutation. Bounded timeout, retry, duplicate, late confirmation, out-of-order callback, and operation-ID collision tests prove reconcile-before-replace and at-most-once terminal/effect behaviour.

Development-cluster configuration is locked only to `https://api.devnet.solana.com`; no live development-cluster transaction was required or attempted. No production-cluster endpoint is present. No real token, real funds, production identity or wallet, token sale, custody service, financial promotion, paid provider, or production credential was used.

Gate A2 remains blocked on Unity licensing. Therefore the repository-wide `companion/agentic-game-development/v1/bundle.lock.json` remains absent by design. A5 adds only `solana-optional/optional-stack.candidate-lock.json`, whose status and integration precondition explicitly prevent it from being treated as a complete global lock.

## Immutable preflight

After a fresh authenticated fetch and before editing:

| Identity | Value |
| --- | --- |
| Worktree / branch | `/Users/loki/redditech-academy-game-dev-122` / `feat/122-agentic-game-development` |
| Pre-A5 `HEAD` | `4895128c960e13173e8b7d7d99e1283c07f1bc68` |
| Pre-A5 tree | `85bbcdc3f842a9b6500d7be3fad35d368c38be34` |
| Upstream branch | `4895128c960e13173e8b7d7d99e1283c07f1bc68` |
| `origin/main` / PR base | `88f977c5a142ec2878efe9d3e8d0b34e62e08bc7` |
| PR #123 | open, draft, mergeable, `CLEAN`; Vercel and Preview Comments successful |

`gh auth status` authenticated GitHub user `reddinft` for repository operations. The optional package is under the distinct companion path allowed by A1; no shared PR #100 surface, A2/A3/A4 file, root package manifest, root lock, runtime route, course content, or public asset was edited.

## Host and exact stack

| Item | Exact evidence |
| --- | --- |
| Host | macOS `27.0.1` build `26A434`; Darwin `27.0.0`; arm64 |
| Node / pnpm | Node `26.12.0`; repository-selected pnpm `10.9.0` |
| Agave CLI | `solana-cli 4.3.2` (`src:40c914c8`, `client:Agave`); installed binary SHA-256 `577a8decef7ae1b1af0c2f8bd5acb9005024629835319a1a6f00fe6175e37f16` |
| Solana local validator tool | `solana-test-validator 4.3.2` (`src:2bd3da09`, `client:Agave`) |
| Surfpool | `1.1.1`; installed binary SHA-256 `8303bf0764057a3320d16f8ce127ca4d233aa3b774a79a19eb965a392e3688b9` |
| Surfpool official arm64 archive | 34,201,226 bytes; publisher/observed SHA-256 `45c1eedba925b9afc2b23635f920053eab2e6dece10f67aed9d28f98e456dce6` |
| TypeScript client | `@solana/kit` `8.5.0`; npm integrity `sha512-bMnXXADeyZFe3XyqzPhlQAIsmPYRiojaRO4JQxwGOmMwiQ5f13ZQodmsOqnt8W/n40P7r/+/pDqWuqG0TUv+yA==`; observed tarball SHA-256 `8861d1db1d6d9d1f45e1b4a32686fc21e90217e76a9bb41d9cb1f81c4786c337` |
| TypeScript | exact `5.9.3` |

Surfpool reported SVM/API cluster version `3.1.6` and the final clean-run local genesis hash `DTc1yxWkrDeJqgtAga73Uwmb9yiwoka8yxv5namV3xbi`. This local implementation detail is evidence for this run only, not a separate supported-chain pin.

## Client selection and source/licence evidence

Access date for every row: **2026-10-20**.

| Component | Maintainer / distribution evidence | Licence evidence |
| --- | --- | --- |
| Agave `4.3.2` | Anza release: <https://github.com/anza-xyz/agave/releases/tag/v4.3.2>; published 2026-10-15. Homebrew's source archive record resolves `v4.3.2` to SHA-256 `e23ce28d4fbcbfdb1dfc2a6b5f8b4da2fbc3597d8a8c067d3914fca60227b395`. | Apache-2.0: <https://github.com/anza-xyz/agave/blob/v4.3.2/LICENSE>; observed licence SHA-256 `048838ecab23173fe6db9b3a4f5d9e2f5480b8692dfca556fed4aa039ca06bc8`. |
| Surfpool `1.1.1` | Solana Foundation release: <https://github.com/solana-foundation/surfpool/releases/tag/v1.1.1>; published 2026-03-06. Release API supplies the darwin-arm64 digest matched above. | Apache-2.0: <https://github.com/solana-foundation/surfpool/blob/v1.1.1/LICENSE>; observed licence SHA-256 `c71d239df91726fc519c6eb72d318ec65820627232b2f796219e87dcf35d0ab4`. |
| `@solana/kit` `8.5.0` | Anza release: <https://github.com/anza-xyz/kit/releases/tag/v8.5.0>; published 2026-10-13; tag commit `f35eab56d68a4d4421a5dbf018ad3cf6c3423d62`. npm exact package: <https://registry.npmjs.org/@solana/kit/-/kit-8.5.0.tgz>. It declares Node `>=20.18.0` and optional TypeScript peer `>=5.4.0`, compatible with the tested host and exact TypeScript `5.9.3`. | MIT: <https://github.com/anza-xyz/kit/blob/v8.5.0/LICENSE>; observed licence SHA-256 `c181f3e6911f515d2b5d18513f8e24fba252c36856978fa80b01249fa813453f`. |

`@solana/kit` was selected instead of the legacy-shaped alternative because its current stable package and release are maintained by Anza, its release was newer than the tested Agave baseline by only two days, it provides typed RPC, keypair signer, transaction-message, signing, and wire-encoding APIs needed by the narrow seam, and its declared runtime/TypeScript ranges fit the Academy toolchain. The spike uses no wallet framework, token library, Anchor dependency, paid RPC, or browser wallet adapter.

The isolated `pnpm-lock.yaml` resolves 43 `@solana/*` packages at the same `8.5.0` line plus only `chalk 5.6.2`, `commander 15.0.0`, `ws 8.22.0`, TypeScript/type support, and their `undici-types`. Every resolved package carries registry integrity in the lock. It changes no Academy production dependency or root lock.

## Security and behaviour acceptance

### Key and signing boundary

- `solana-keygen 4.3.2` created player and recipient keys under `/tmp/agd-a5-key.*/`, outside the repository.
- Both files were mode `0600`; the harness resolves the real path and rejects any key within the repository or with group/other permissions.
- `createKeyPairSignerFromBytes` loads the player key in process. The transaction instruction marks that player as `WRITABLE_SIGNER`; `signTransactionMessageWithSigners` performs explicit signing before RPC submission.
- The smoke output prints only booleans/counts and the public local genesis hash. It never prints raw key bytes, JSON key arrays, mnemonic material, or a key-file path.

### Local-first and offline-core result

Surfpool started on loopback with `--offline --no-tui --no-deploy --no-studio`. The CLI and `@solana/kit` both reached only `127.0.0.1`. The signed local simulator transaction transferred one synthetic lamport between throwaway accounts; the recipient balance increased by exactly one. Replaying the same durable domain operation returned the original receipt and did not submit or apply a second entitlement effect.

`startCore({ chainEnabled: false })` constructs only `InMemoryEntitlementAdapter`; its test grants and reads an entitlement without wallet, RPC, network, or chain state. A request to bootstrap this bounded Gate A harness with chain enabled fails explicitly rather than silently coupling the core.

### Pre-effect authority negatives

For each wrong field—signer, account, mint, recipient, authority, program identifier, and PDA—the focused test verifies:

1. an exact named validation error;
2. zero reconciliation calls;
3. zero chain submit calls; and
4. zero entitlement effects.

The player and signer must be the same explicitly consenting throwaway identity. A reused operation ID with changed request data also fails before a second submission/effect.

### Timeout, retry, reconciliation, and ordering

- Timeout is bounded to 1–30,000 ms and uses a promise race plus `AbortSignal`; a test chain that ignores abort still returns control inside the bound.
- Attempts are bounded to 1–3. Each attempt reconciles the durable domain operation ID before any replacement submission.
- A dropped/timeout response followed by retry applies one effect. A duplicate call returns the stored original terminal result.
- A late confirmation recovered during reconciliation becomes the single terminal result. A later out-of-order rejection callback returns that original confirmation instead of overwriting it.
- The domain operation ID is distinct from the transaction signature; signatures are local transport receipts, not deduplication authority.

### Development-cluster limitation

The client and candidate lock contain the official development endpoint solely as configuration and test its exact value. Gate A5 performed no request, airdrop, transaction, balance query, or write against that endpoint. This truthfully proves configuration and isolation seams, not live network availability or deployment compatibility. A later optional-badge lab may run a synthetic development-cluster check only after local acceptance; an outage must affect only optional evidence.

## Commands and results

Commands ran from the repository root unless a working directory is named. Secret-bearing file contents were never echoed.

| Command | Exit / result |
| --- | --- |
| `git fetch origin main feat/122-agentic-game-development --prune` plus local/upstream/PR identity commands | `0`; exact preflight identity above |
| `solana --version`; `solana-test-validator --version`; `solana-keygen --version`; `surfpool --version` | `0`; exact versions above |
| npm metadata queries for `@solana/kit` and maintainer GitHub release/tag queries | `0`; version, integrity, engine, release, and commit locked above |
| Download/hash `@solana/kit` `8.5.0` tarball | `0`; SHA-512 matched npm integrity bytes and SHA-256 matched the candidate lock |
| Download/hash Surfpool `v1.1.1` darwin-arm64 archive | `0`; SHA-256 matched release API digest |
| Download/hash three tag-pinned licence files | `0`; hashes above |
| `pnpm install --ignore-workspace` in `solana-optional/` | `0`; 50 packages, exact isolated lock, pnpm `10.9.0` |
| `pnpm test` | `0`; 7/7 focused tests passed |
| `pnpm type-check` | `0`; TypeScript `5.9.3`, no diagnostics |
| `surfpool start --offline --no-tui --no-deploy --no-studio --port 18999 --ws-port 19000 ...` | running successfully for smoke; genesis airdrop to throwaway player only |
| `AGD_PLAYER_KEYPAIR=... AGD_RECIPIENT_KEYPAIR=... AGD_LOCAL_RPC_URL=http://127.0.0.1:18999 pnpm localnet:smoke` | `0`; marker `AGD_SOLANA_LOCALNET_PASS`, explicit signing, external keys, `1` synthetic-lamport delta, duplicate original result, one effect |
| `solana cluster-version --url http://127.0.0.1:18999` and `solana genesis-hash ...` | `0`; `3.1.6`, local genesis hash above |
| clean temporary copy: `pnpm install --frozen-lockfile`; `pnpm audit --prod --audit-level high --json` | `0`; 49 production dependencies, 0 Critical / 0 High / 0 Moderate / 0 Low |
| `test ! -e companion/agentic-game-development/v1/bundle.lock.json` | `0`; global lock intentionally absent |

Two bounded development corrections preceded the final green run: the first negative-test fixture accidentally reused the expected recipient for that one field, and an initial native-TypeScript layout conflicted with the root compiler's include/module settings. The first combined command therefore reported 5/6 tests and two TS diagnostics. The harness was moved to standards-native `.mjs` with strict `checkJs` under the isolated TypeScript `5.9.3` config, which also keeps the root Academy type-check independent of optional dependency installation; the complete final gates above passed. A one-off prototype transaction also required adding the omitted `.send()` to a status RPC poll after submission; the tracked harness includes the correct bounded call. No acceptance criterion was removed or weakened.

## Files and future integration semantics

Tracked A5 scope:

- `audits/issue-122-solana-gate-a.md`;
- `companion/agentic-game-development/v1/solana-optional/optional-stack.candidate-lock.json`;
- isolated exact `package.json`, `pnpm-lock.yaml`, and `tsconfig.json`;
- `src/entitlement-adapter.mjs`;
- `scripts/localnet-smoke.mjs`;
- `tests/entitlement-adapter.test.mjs`.

The optional candidate lock may be copied as a named section into the future global lock only after Gate A2 passes all mandatory Unity, Godot, TypeScript, Vitest, Chromium, and Firefox rows. At that time the global validator must authenticate this source, harness, candidate lock, and resolved integrity graph. The candidate file must never be renamed or represented as a complete lock on its own.

Generated `node_modules`, simulator logs/state, key files, downloaded archives, temporary audit copies, and raw transaction artefacts are untracked/ignored or outside the repository. No ledger, package store, key, evidence directory, build output, or generated archive is committed.

## Gate boundary

A5 passes only the optional Solana stack/security spike. It does not clear A2, authorise A3/A6, implement the learner-facing D-phase missions, prove a live development-cluster transaction, create a custody service, or authorise merge, deployment, preview promotion, publication, real-value activity, or PR-ready transition. PR #123 must remain draft.
