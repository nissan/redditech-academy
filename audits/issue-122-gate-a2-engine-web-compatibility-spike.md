# Issue #122 Gate A2 — engine/web compatibility spike (blocked)

_Observed 2026-10-20 AEDT. Gate A2 did not pass. This report records a mandatory Unity licensing blocker and the bounded evidence gathered before the stop condition fired; it does not authorise Gate A3 or course-content work._

## Outcome

**BLOCKED — Unity Edit Mode and Play Mode acceptance could not run because this host has no valid Unity Editor licence/`com.unity.editor.headless` entitlement.** The exact Unity editor launched in batch mode and exited `198` before package resolution, compilation, or tests. It wrote no test-results XML. Play Mode was not attempted after the mandatory Edit Mode stop.

The repository-owned `companion/agentic-game-development/v1/bundle.lock.json` was deliberately **not created**: publishing a downstream lock while the required Unity package/API compatibility and both browser binaries remain unverified would make an incomplete Gate A2 result look consumable. A fresh A2 run must create that file only after every mandatory row passes.

Partial evidence is not a substitute for the failed gate:

- Godot 4.7.2 stable standard/universal: archive integrity matched the publisher digest and the headless Signal Relay parity fixture passed.
- TypeScript 5.9.3: fixture compilation passed.
- Vitest 4.1.4: Signal Relay unit fixture passed.
- Playwright 1.59.1: dependency resolved, but Chromium/Firefox acquisition was stopped when the Unity blocker fired; neither browser was claimed or locked.
- Unity 6000.3.26f1 arm64: download integrity/signature and editor version passed; Edit/Play tests, Unity Test Framework resolution, and `.NET Standard 2.1` compatibility remain unproved.

## Immutable repository preflight

After a fresh `git fetch --prune origin`, the worktree was clean and unchanged from accepted Gate A1:

| Identity | Value |
| --- | --- |
| Worktree | `/Users/loki/redditech-academy-game-dev-122` |
| Branch | `feat/122-agentic-game-development` |
| Pre-A2 `HEAD` | `2b6eefa27d91fceb5e580b7ac6ef176de625ead6` |
| Pre-A2 tree | `132246de2520a5f045ae6c6ac26aa1dc975bbab9` |
| Upstream branch head | `2b6eefa27d91fceb5e580b7ac6ef176de625ead6` |
| Fetched `origin/main` / merge base | `88f977c5a142ec2878efe9d3e8d0b34e62e08bc7` |
| Ahead/behind (`origin/main...HEAD`) | ahead 2, behind 0 |
| PR #123 at preflight | open, draft, mergeable, `CLEAN`; both checks successful |

No rebase, merge, reset, deployment, publication, PR-state change, issue-label change, or PR #100 mutation occurred.

## Tested host

| Property | Observed value |
| --- | --- |
| Host | Apple-silicon Mac mini, arm64 (not Rosetta) |
| OS | macOS 27.0.1 (build 26A434), Darwin 27.0.0 |
| Memory reported by Unity | 24,576 MB |
| Free disk before engine downloads | 45 GiB |
| Node | 26.12.0 arm64 |
| pnpm | 10.9.0 |

Only this host/OS was exercised. Windows 11 x64 and Linux remain untested; no cross-platform support claim is made.

## Engine and archive evidence

### Unity — blocker

First-party Unity Release API query:

`https://services.api.unity.com/unity/editor/release/v1/releases?limit=25&offset=0&order=RELEASE_DATE_DESC&version=6000.3&stream=LTS`

The newest returned Unity 6.3 LTS patch was:

| Field | Observed value |
| --- | --- |
| Editor | Unity `6000.3.26f1` arm64 |
| Revision | `de8167e7440c` |
| Release date | `2026-10-08T13:38:24.193Z` |
| First-party package | `https://download.unity3d.com/download_unity/de8167e7440c/MacEditorInstallerArm64/Unity-6000.3.26f1.pkg` |
| Advertised download/install bytes | 5,189,868,460 / 9,565,870,000 |
| Publisher integrity | `md5-OYM2IlbzPmOOdLJgKKz1iA==` |
| Observed MD5 (base64) | `OYM2IlbzPmOOdLJgKKz1iA==` — match |
| Observed SHA-256 | `f193b01430dfdde6167b15b55cd4d138ff6adb269ee3760690d33363a5777df0` |
| Package signature | Apple-verified Developer ID Installer: Unity Technologies SF (`9QW8UQUTAA`), trusted timestamp |
| Editor `-version` | `6000.3.26f1`, exit `0` |

The disposable fixture requested `com.unity.test-framework` `1.4.6`, the latest version exposed by Unity's first-party package registry at `https://packages.unity.com/com.unity.test-framework` during the spike (registry tarball SHA-1 `5ac417e07314c8f6afba8109738c32b82d391e68`). Because licensing failed before Package Manager resolution, **that package/editor combination is not locked or claimed compatible**. The `.NET Standard 2.1` API target was likewise not verified.

Mandatory Edit Mode invocation (from the repository root):

```text
/tmp/.../Unity.app/Contents/MacOS/Unity \
  -batchmode -nographics \
  -projectPath "$PWD/artifacts/agd-a2-fixtures/unity" \
  -runTests -testPlatform EditMode \
  -testResults /tmp/agd-a2-unity-editmode.xml \
  -logFile /tmp/agd-a2-unity-editmode.log
```

Result: exit `198`; no XML result file. Relevant non-sensitive editor evidence:

```text
Unity Editor version: 6000.3.26f1 (de8167e7440c)
Batch mode: YES
Architecture: arm64
Running under Rosetta: NO
[Licensing::Module] Error: 'com.unity.editor.headless' was not found.
No valid Unity Editor license found. Please activate your license.
```

The raw log also contained host/network and licensing-client identifiers and is intentionally not committed. Unity's editor terms apply; review/acceptance and a valid eligible licence must be handled through Unity's official licensing flow: `https://unity.com/legal/editor-terms-of-service/software`.

### Godot — partial pass

| Field | Observed value |
| --- | --- |
| Release | Godot `4.7.2.stable.official.ed1daf0bf`, standard/GDScript build |
| First-party project release | `https://github.com/godotengine/godot/releases/tag/4.7.2-stable` |
| Archive | `Godot_v4.7.2-stable_macos.universal.zip` |
| URL | `https://github.com/godotengine/godot/releases/download/4.7.2-stable/Godot_v4.7.2-stable_macos.universal.zip` |
| Publisher and observed SHA-256 | `c58a24e31d720be9d62f60cb5627c4e695fb72f21b0cfe1bc9ccaa9a3b3ba63e` — match |
| Download size | 170,622,178 bytes |
| Licence | MIT (`https://github.com/godotengine/godot/blob/4.7.2-stable/LICENSE.txt`) |

Headless parity command:

```text
/tmp/.../Godot.app/Contents/MacOS/Godot \
  --headless --path artifacts/agd-a2-fixtures/godot \
  --script res://tests/run.gd
```

Result: exit `0`, marker `AGD_GODOT_SIGNAL_RELAY_PASS`. The fixture proved ready → pickup, duplicate-pickup rejection, delivery, duplicate-delivery rejection, exactly-one award, cooldown/delta progression, ready restoration, and reset.

## Web evidence — partial pass

`pnpm install --frozen-lockfile` exited `0` and did not modify the lockfile. Repository-resolved versions were TypeScript `5.9.3`, Vitest `4.1.4`, and Playwright `1.59.1`.

| Command | Exit/result |
| --- | --- |
| `pnpm exec tsc --version` | `0`; `Version 5.9.3` |
| `pnpm exec tsc -p artifacts/agd-a2-fixtures/web/tsconfig.json` | `0` |
| `pnpm exec vitest --version` | `0`; `vitest/4.1.4 darwin-arm64 node-v26.12.0` |
| `pnpm exec vitest run --root artifacts/agd-a2-fixtures/web --config vitest.config.ts` | `0`; 1 file/1 test passed |

Two earlier Vitest discovery/configuration invocations exited `1` before the bounded fixture config was corrected: `/dev/null` was not a valid config entry, then the repository config's relative setup path was unsuitable under a changed fixture root. Neither was an application failure; the final explicit fixture config passed.

`pnpm exec playwright install chromium firefox` began first-party Playwright-managed acquisition. It identified Chromium revision `1217` / Chrome for Testing `147.0.7727.15`, but Gate A2's Unity stop condition fired before installation completed. The process was interrupted; no `INSTALLATION_COMPLETE` marker existed for Chromium, Firefox was not acquired, no browser executable test ran, and no browser checksum/revision pair is locked. Playwright is Apache-2.0 licensed (`https://github.com/microsoft/playwright/blob/v1.59.1/LICENSE`). TypeScript is Apache-2.0 licensed (`https://github.com/microsoft/TypeScript/blob/v5.9.3/LICENSE.txt`).

## Offline acquisition checklist (not yet final)

Sara's downstream setup requirement cannot be marked satisfied until the blocker is cleared. Before disconnecting for the rerun, the learner/operator environment must have all of the following available and verified:

1. Unity Editor `6000.3.26f1` arm64 (revision `de8167e7440c`) **and an officially activated licence that provides the required headless Editor entitlement**.
2. The exact Unity Test Framework package selected by successful `6000.3.26f1` Package Manager resolution; `1.4.6` is only the unverified registry candidate from this blocked run.
3. Godot standard/GDScript `4.7.2` universal archive with SHA-256 `c58a24e31d720be9d62f60cb5627c4e695fb72f21b0cfe1bc9ccaa9a3b3ba63e`.
4. pnpm `10.9.0` with the repository's frozen package store for TypeScript `5.9.3`, Vitest `4.1.4`, and Playwright `1.59.1`.
5. Both Playwright-managed Chromium and Firefox binaries at the revisions/digests recorded by the successful rerun. Chromium `1217` was only partially acquired here and must not be treated as cached or ready.

No paid service is required. Unity's licensing terms and eligibility still apply; this report does not choose a licence tier or accept terms on anyone's behalf.

## Security, repository scope, and stop boundary

- Disposable fixtures, engine payloads, package caches, browser caches, generated Godot metadata, and raw tool logs remain outside tracked source or under ignored `artifacts/`; none is committed.
- No credential, token, serial, licence file, private key, raw machine identifier, raw IP address, or secret-bearing log is included here.
- The only intended tracked A2 change is this truthful blocker report. No companion lock, course content, runtime code, shared PR #100 surface, package manifest/lockfile, generated archive, build, or learner evidence is added.
- A3 readiness: **blocked**. Rerun A2 after an authorised Unity licence is activated, starting again with a fresh fetch/identity check and completing Edit Mode, Play Mode, `.NET Standard 2.1`, Unity package resolution, Chromium, and Firefox acceptance before creating `bundle.lock.json`.
