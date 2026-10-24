# Issue #122 — Gate A3 packaging and budget spike

Date: 2026-10-24. **Verdict: BLOCKED (packaging probe passes; mandatory player-build and reduced-envelope budgets remain unproved).** A6 and course-content readiness are not claimed.

## Authenticated starting point

After `git fetch origin --prune`, before edits:

| Identity | Observed value |
| --- | --- |
| Branch | `feat/122-agentic-game-development` |
| Local/upstream/PR #123 head | `7b7a548172966959e5ddfac6233e61762861c282` |
| Tree | `ce78822f1368d0dc8db3c54d1f2572e7d6d9fb6e` |
| Fetched main / PR base | `88f977c5a142ec2878efe9d3e8d0b34e62e08bc7` |
| Worktree | clean |
| PR | open, draft, `CLEAN` |

The approved build plan, A2 audit, and compatibility lock were read. No shared application surface, dependency file, A2 lock, accepted A4/A5 source, or course content changed.

## Source archive proof

Supporting probe: `audits/support/issue-122-package-spike.py`. It uses Python `3.14.3` standard-library ZIP_STORED (no compression-library version dependence), sorted relative names, fixed ZIP timestamp `1980-01-01`, and fixed regular-file mode `0644`. It writes an archive and per-member byte/digest manifest outside the source tree. It is an **A3 probe, not the future learner packaging/bootstrap command or release verifier**.

The exclusion list covers Unity Library/Temp/Logs/UserSettings/builds/PackageCache; Godot `.godot`/exports; web node_modules/dist/package stores; Solana keys/keypairs/test-ledger/ledger/target/validator state; learner evidence; `.git`, environment files and private-key/licence file extensions. Excluded components are case-insensitive at any depth. Nonexcluded symlinks/hardlinks and unknown source file extensions fail closed; an output under the source root and empty source also fail. This filename boundary does not substitute for later content-secret scanning or a provenance ledger.

| Input | Members | ZIP bytes | SHA-256 | Repeat result |
| --- | ---: | ---: | --- | --- |
| Current tracked companion source | 10 | 114,106 | `1637edbb59608ac9f8b1f0ef9aee5e713d16703e7b633ae041fa996ad497f330` | byte-identical |
| Preserved disposable A2 Unity/Godot/web fixture sources | 46 | 68,363 | `1666a1130a0b25414270658a4c2721f8ccc365cd6b1ebadfc40c2888ffc590fd` | byte-identical |

The A2 fixtures and extracted editor were recoverably moved to operator-local Trash after A2; they were located and inspected read-only, not reconstructed or silently treated as tracked course source. Generated ZIPs and manifests are under ignored `artifacts/agd-a3/`; no archive, cache, test result, machine identity, licence/auth file, or fixture source was added to Git.

Commands, repository CWD, exit `0` unless noted; each tool invocation bounded to at most 60 seconds:

```text
python3 audits/support/issue-122-package-spike.py --self-test
python3 audits/support/issue-122-package-spike.py --source companion/agentic-game-development/v1 --output artifacts/agd-a3/first/agd-companion-v1.0.0.zip
python3 audits/support/issue-122-package-spike.py --source companion/agentic-game-development/v1 --output artifacts/agd-a3/second/agd-companion-v1.0.0.zip
cmp artifacts/agd-a3/first/agd-companion-v1.0.0.zip artifacts/agd-a3/second/agd-companion-v1.0.0.zip
python3 audits/support/issue-122-package-spike.py --source <preserved-A2-fixtures> --output artifacts/agd-a3/fixture-first/agd-companion-v1.0.0.zip
python3 audits/support/issue-122-package-spike.py --source <preserved-A2-fixtures> --output artifacts/agd-a3/fixture-second/agd-companion-v1.0.0.zip
cmp artifacts/agd-a3/fixture-first/agd-companion-v1.0.0.zip artifacts/agd-a3/fixture-second/agd-companion-v1.0.0.zip
```

Self-tests: **3/3 PASS**, including injected excluded cache/build/evidence/key filenames, symlink rejection, hardlink rejection, output containment, unknown binary rejection, and byte-identical archives after source mtime/mode changes. Independent ZIP inspection passed CRC, relative/nontraversal names, no symlink members, and fixed timestamps for both archive sets. Initial real-source packaging exited `1` because pnpm cache symlinks were checked before their excluded directory components; ordering was corrected to omit excluded components first and reject links on candidate source paths. The nonexcluded-link negatives still pass.

## Mandatory budget matrix

| Budget | Measurement / evidence | Status |
| --- | --- | --- |
| Companion source ZIP ≤100 MiB | 114,106-byte current source probe; 68,363-byte A2 source fixture probe | PASS for these exact inputs only; not a completed course bundle |
| Web lab transferred ≤2 MiB | A2 compiled state-machine module is 661 bytes on disk, but is not a complete served/rendered lab or measured HTTP transfer | UNPROVED; do not equate module bytes with transferred playable payload |
| Unity web initial compressed payload ≤50 MiB | Extracted editor `PlaybackEngines` contains only `MacStandaloneSupport`; WebGL build support is absent | BLOCKED; no web build or compressed transfer measurement |
| Desktop player package ≤200 MiB | A2 has runtime/test assemblies but no `.unity` scene or configured playable build fixture | UNPROVED; no desktop player package produced |
| Reduced-path peak resident memory ≤1.5 GiB | No target player/capture workload exists in A2 | UNPROVED; no substituted editor/test-runner memory measurement |
| 30 fps / 33.3 ms at 1280×720 on reduced envelope | A2 proves a state machine, not a rendered canonical mechanic; host has 10 logical CPUs and 24 GiB RAM | UNPROVED; neither viewport alone nor browser CPU throttle proves a 4-core/8-GiB hardware envelope |

Host free disk at inspection was 19,017,696 KiB (about 18.1 GiB), exceeding the plan's 10-GiB free-disk prerequisite. This does not satisfy its CPU, RAM, integrated-graphics, target-player, or frame-time requirements. There is no fake low-spec success row or fabricated performance capture.

## Engine-build licensing and runner boundary

A2 authenticated Unity `6000.3.26f1` revision `de8167e7440c` arm64 and an active eligible host-local Personal entitlement, with real Edit/Play XML. A3 does not re-open, inspect, copy, hash, export, or commit licence/auth payloads. Personal eligibility and editor/module terms remain operator responsibilities. The accepted official editor terms are <https://unity.com/legal/editor-terms-of-service/software> (accessed 2026-10-24).

The available local macOS module is **not** proof of WebGL availability, Windows/Linux output, redistribution permission for an editor, or an unattended transferable CI entitlement. Canonical engine builds therefore remain exact-editor, eligible-licence local runs. No free remote licence-compliant engine runner was proved; no paid runner/service, licence workaround, cloud signup, or new spending was used. Browser/repository CI cannot stand in for Unity player builds or real reduced-target captures.

## Required continuation and stop boundary

Return this evidence to Loki/Firefly as required by Gate A's failed-budget stop condition. A bounded A3 remediation must provide:

1. The exact official matching Unity WebGL support module, authenticated source/digest and operator-local install, without distributing editor/licence payloads.
2. A small **rendered and buildable** Signal Relay fixture on desktop and web with the same behavioural contract, not merely the A2 test assembly; measured complete player package and initial compressed transfer.
3. A documented actual reduced-reference machine or explicitly reviewed faithful resource-control method, target-player workload, peak RSS and comparable 720p frame-time capture. Do not relabel this 24-GiB host as an 8-GiB test.
4. A rerun of all mandatory budget rows, preserving source determinism and exclusions, before accepting A3 or dispatching its dependent A6/B/content work.

No ceiling was weakened, no alternative engine substituted, and no capstone/content work started. This slice preserves its successful probe while explicitly leaving **Gate A3 blocked**. No merge, deployment, publication, release upload, preview promotion, or PR-ready transition occurred.
