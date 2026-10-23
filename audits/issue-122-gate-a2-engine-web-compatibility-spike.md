# Issue #122 Gate A2 — engine/web compatibility spike

_Observed 2026-10-24 AEDT on one Apple-silicon Mac mini. This report locks the exact tool/browser compatibility rows exercised by Gate A2; it is not cross-platform certification, course content, deployment, publication, or licence advice._

## Outcome

**PASS.** Every mandatory A2 row passed on the tested host:

- Unity `6000.3.26f1` arm64 revision `de8167e7440c` launched with an eligible Unity Personal entitlement; the official editor package passed publisher MD5, observed SHA-256, and Apple signature checks.
- Unity Test Framework resolved as the editor-builtin `com.unity.test-framework` `1.6.0`; real Edit Mode and Play Mode runs each produced NUnit XML with `1/1` test passed and exit `0`.
- Unity compiled the fixture with C# language version `9.0` and the `.NET Standard 2.1` reference/compatibility profile.
- Godot `4.7.2.stable.official.ed1daf0bf` standard/GDScript passed publisher-digest verification and the headless Signal Relay parity run.
- TypeScript `5.9.3` compiled the web fixture and Vitest `4.1.4` passed its unit test.
- Playwright `1.59.1` installed managed Chromium revision `1217` and Firefox revision `1511`; both exact engines launched headlessly and passed the real E2E Signal Relay smoke.

The repository-owned `companion/agentic-game-development/v1/bundle.lock.json` now records only authenticated mandatory A2 tool/browser rows plus immutable references to the already accepted A4 and A5 outputs. Gate A3 is ready for dispatch; this result does not start A3, A6, or course-content work.

## Immutable repository preflight

After `git fetch origin main feat/122-agentic-game-development --prune` and before any tracked edit:

| Identity | Value |
| --- | --- |
| Worktree / branch | `/Users/loki/redditech-academy-game-dev-122` / `feat/122-agentic-game-development` |
| Pre-A2 `HEAD` | `854cb0d351c33fbb5d200daf541811961cd25f75` |
| Pre-A2 tree | `09ed46162c564bb3de2de1a1510942e079be4a15` |
| Upstream branch head | `854cb0d351c33fbb5d200daf541811961cd25f75` |
| Fetched `origin/main` / merge base | `88f977c5a142ec2878efe9d3e8d0b34e62e08bc7` |
| Ahead / behind | ahead 5, behind 0 |
| PR #123 | open, draft, mergeable, `CLEAN`; Vercel and Preview Comments successful |

`gh auth status` authenticated GitHub user `reddinft` for repository operations. The worktree was clean. No rebase, merge, reset, PR-ready transition, deployment, publication, issue-state mutation, spend, or PR #100 change occurred.

## Tested host and execution boundary

| Property | Observed value |
| --- | --- |
| Host | Apple-silicon Mac mini, arm64, not Rosetta |
| OS | macOS `27.0.1` build `26A434`; Darwin `27.0.0` |
| Memory | 24 GiB |
| Free disk before the rerun | approximately 37 GiB |
| Repository shell Node | `26.12.0` arm64 |
| Browser-installer Node retry | `24.22.1` arm64 |
| pnpm | `10.9.0` |

Only this host/OS was exercised. Windows 11 x64 and Linux remain untested. Every test/smoke command was run with a 60-second tool-call boundary; multi-gigabyte editor and browser acquisition used explicit observed progress and a bounded retry path. Raw editor/browser logs, host identifiers, network identifiers, licence/auth material, caches, and generated outputs were kept out of Git.

## Unity compatibility evidence

### Editor distribution and entitlement probe

Access date for all source/licence URLs in this report: **2026-10-24**.

| Field | Observed value |
| --- | --- |
| Editor | Unity `6000.3.26f1` arm64 |
| Revision | `de8167e7440c` |
| First-party package | <https://download.unity3d.com/download_unity/de8167e7440c/MacEditorInstallerArm64/Unity-6000.3.26f1.pkg> |
| Advertised / observed MD5 | `md5-OYM2IlbzPmOOdLJgKKz1iA==` / `OYM2IlbzPmOOdLJgKKz1iA==` — match |
| Observed package SHA-256 | `f193b01430dfdde6167b15b55cd4d138ff6adb269ee3760690d33363a5777df0` |
| Signature | Apple-verified Developer ID Installer: Unity Technologies SF (`9QW8UQUTAA`), trusted timestamp |
| Editor terms | <https://unity.com/legal/editor-terms-of-service/software> |

The editor was expanded into a mode-`0700` disposable directory. The eligible entitlement file was checked only for existence/permissions/size before launch; its contents were never read, printed, copied, hashed, or committed.

The smallest batch probe reached the official licensing client and reported an active `Unity Personal` licence group. It did not report the former `com.unity.editor.headless`/no-valid-licence failure. The probe then exited `1` because the disposable tests initially lacked an explicit assembly reference to the runtime fixture. This was not a licensing failure. Adding one ignored runtime assembly definition plus explicit Edit/Play references corrected the fixture without touching tracked source.

### Package, C# 9, and .NET Standard 2.1

The fixture manifest requested the prior candidate `com.unity.test-framework` `1.4.6`. Unity `6000.3.26f1` authoritatively resolved the compatible editor-builtin package instead:

| Field | Verified value |
| --- | --- |
| Package | `com.unity.test-framework` `1.6.0` |
| Resolution | `source: builtin`; cache identity `com.unity.test-framework@bd7f943e9647` |
| Dependencies | `com.unity.ext.nunit` `2.0.3`; Unity module dependencies `1.0.0` |
| Package tree SHA-256 | `df4cb771f320c081ab3f810d27468b3b9fe8e9478a8ee4e48753d85f53a42bed` |
| Package source | <https://docs.unity3d.com/Packages/com.unity.test-framework@1.6/manual/index.html> |
| Licence | Unity Companion License; local licence SHA-256 `d3b09e9683afbc8d468a83000308f18e7133eaf7879af870747000a66e3c0693` |
| Licence URL | <https://unity.com/legal/licenses/unity-companion-license> |

Unity's generated compilation data recorded `LanguageVersion: 9.0`, deterministic compilation, and BCL directories under `NetStandard/ref/2.1.0` and `NetStandard/compat/2.1.0`. Both runtime and test assemblies compiled against that profile without diagnostics.

### Real Edit/Play results

| Command | Exit / result |
| --- | --- |
| `Unity -version` | `0`; `6000.3.26f1` |
| `Unity -batchmode -nographics -projectPath <fixture> -runTests -testPlatform EditMode -testResults <tmp>/unity-editmode.xml -logFile <tmp>/unity-editmode.log` | `0`; XML `total=1 passed=1 failed=0 result=Passed` |
| Edit Mode XML SHA-256 | `2120f34979be1c9177bafe4c20dbdb4e9c85bc61fd1bea4d7e0b90094628612c` |
| `Unity -batchmode -nographics -projectPath <fixture> -runTests -testPlatform PlayMode -testResults <tmp>/unity-playmode.xml -logFile <tmp>/unity-playmode.log` | `0`; XML `total=1 passed=1 failed=0 result=Passed` |
| Play Mode XML SHA-256 | `082d04bb2da6dc59b45d9abd5b60e5d132122c01b3a9df589c62b2395754b4fe` |

The tests proved ready → pickup, duplicate-pickup rejection, delivery, duplicate-delivery rejection, exactly-one award, cooldown/ready restoration, and reset.

## Godot compatibility evidence

| Field | Observed value |
| --- | --- |
| Release | Godot `4.7.2.stable.official.ed1daf0bf`, standard/GDScript build |
| Release | <https://github.com/godotengine/godot/releases/tag/4.7.2-stable> |
| Archive | `Godot_v4.7.2-stable_macos.universal.zip`, 170,622,178 bytes |
| Archive URL | <https://github.com/godotengine/godot/releases/download/4.7.2-stable/Godot_v4.7.2-stable_macos.universal.zip> |
| Publisher / observed SHA-256 | `c58a24e31d720be9d62f60cb5627c4e695fb72f21b0cfe1bc9ccaa9a3b3ba63e` — match |
| Licence | MIT; <https://github.com/godotengine/godot/blob/4.7.2-stable/LICENSE.txt> |

`Godot --headless --path <fixture> --script res://tests/run.gd` exited `0` with marker `AGD_GODOT_SIGNAL_RELAY_PASS`. It reran the same pickup, duplicate rejection, exactly-once award, cooldown/delta, ready restoration, and reset contract as Unity and web.

## Web toolchain and browser evidence

### Compile and unit test

| Command | Exit / result |
| --- | --- |
| `corepack pnpm install --frozen-lockfile` | `0`; lockfile unchanged; pnpm `10.9.0` |
| `pnpm exec tsc --version` | `0`; `Version 5.9.3` |
| `pnpm exec tsc -p artifacts/agd-a2-fixtures/web/tsconfig.json` | `0`; no diagnostics |
| `pnpm exec vitest --version` | `0`; `vitest/4.1.4` |
| `pnpm exec vitest run --root artifacts/agd-a2-fixtures/web --config vitest.config.ts` | `0`; 1 file / 1 test passed |

Source/licence evidence: TypeScript `5.9.3` release <https://github.com/microsoft/TypeScript/releases/tag/v5.9.3> and Apache-2.0 licence <https://github.com/microsoft/TypeScript/blob/v5.9.3/LICENSE.txt>; Vitest `4.1.4` release <https://github.com/vitest-dev/vitest/releases/tag/v4.1.4> and MIT licence <https://github.com/vitest-dev/vitest/blob/v4.1.4/LICENSE>.

### Playwright-managed two-engine smoke

Playwright `1.59.1` browser metadata and `install --dry-run` authenticated the exact first-party Playwright CDN URLs and revisions. Apache-2.0 licence: <https://github.com/microsoft/playwright/blob/v1.59.1/LICENSE>.

| Engine | Managed revision / version | Archive SHA-256 | Executable SHA-256 | Result |
| --- | --- | --- | --- | --- |
| Chromium | `1217` / Chrome for Testing `147.0.7727.15` | `324f68a2c3a03ea5c9de81297ede5f78b333659b2b6594a4cb8071cd171f1404` | `3ae4a8cdc0e8d19f8799d3031eca038459dcb1fb6879b8e28a6f0c4fb5f75fc2` | `AGD_WEB_CHROMIUM_PASS` |
| Firefox | `1511` / Mozilla Firefox `148.0.2` | `64e4552e00bb53f221d552dd66e2ac9fcb98fff31622ca73f8e100ab9979fe09` | `52a5ca3a878eae5628847be27bcc0966d759a2a224aec4c9c5e62ccb5609977a` | `AGD_WEB_FIREFOX_PASS` |

Archive URLs:

- Chromium: <https://cdn.playwright.dev/builds/cft/147.0.7727.15/mac-arm64/chrome-mac-arm64.zip>
- Firefox: <https://cdn.playwright.dev/dbazure/download/playwright/builds/firefox/1511/firefox-mac-arm64.zip>

`INSTALLATION_COMPLETE` markers existed for Chromium `1217`, its matching headless shell, Firefox `1511`, and Playwright FFmpeg `1011`. The Node `24.22.1` managed-install invocation exited `0`. The E2E script imported the compiled fixture in a real page in each engine and verified `[true, false, true, false, 1]` for pickup, duplicate pickup, delivery, duplicate delivery, and exactly-one award.

One bounded acquisition correction is preserved: the first `corepack pnpm exec playwright install chromium firefox` inherited Node `26.12.0`, downloaded Chromium, then made no extraction progress for approximately 4.5 minutes. It was interrupted without claiming success, and its partial cache was moved to Trash. Directly invoking the exact Playwright `1.59.1` CLI with the known-good local Node `24.22.1` runtime completed all managed installs and both real browser tests. No acceptance row was weakened.

## Offline acquisition checklist

Before disconnecting, a learner/operator must install or cache all of the following:

1. Unity Editor `6000.3.26f1` arm64 revision `de8167e7440c`, an eligible officially activated licence, and the editor-builtin Unity Test Framework `1.6.0` package cache.
2. Godot standard/GDScript `4.7.2` universal archive with SHA-256 `c58a24e31d720be9d62f60cb5627c4e695fb72f21b0cfe1bc9ccaa9a3b3ba63e`.
3. pnpm `10.9.0` plus the frozen repository package store for TypeScript `5.9.3`, Vitest `4.1.4`, and Playwright `1.59.1`.
4. Playwright-managed Chromium `1217`, Chromium headless shell `1217`, Firefox `1511`, and FFmpeg `1011`, including their `INSTALLATION_COMPLETE` markers.
5. The companion source, fixture, and future package outputs that A3 will authenticate; A2 does not yet claim a distributable offline archive.

No paid service is required. Unity licence eligibility and terms remain the operator's responsibility; no licence or auth payload belongs in the companion bundle.

## Accepted A4/A5 references

The new global lock references, rather than duplicates or broadens, the already accepted independent Gate A outputs:

- A4 commit `4895128c960e13173e8b7d7d99e1283c07f1bc68`, tree `85bbcdc3f842a9b6500d7be3fad35d368c38be34`, with current SHA-256 values for the accessibility matrix, validator, and adversarial tests.
- A5 commit `854cb0d351c33fbb5d200daf541811961cd25f75`, tree `09ed46162c564bb3de2de1a1510942e079be4a15`, with current SHA-256 values for the Solana audit, isolated candidate lock, package/lock/config, harness, smoke, and tests.

The optional candidate lock remains explicitly optional. Referencing it does not turn Solana into a core prerequisite or claim a live devnet transaction.

## Repository scope and gate boundary

Tracked A2 scope is exactly:

- `audits/issue-122-gate-a2-engine-web-compatibility-spike.md`;
- `companion/agentic-game-development/v1/bundle.lock.json`.

Disposable Unity/Godot/web projects, editor payloads, package/browser caches, downloaded archives, licence/auth files, raw logs, test XML, generated metadata, build output, and machine/network identifiers remain ignored or outside the repository and are removed after evidence capture. The entitlement file was never read, copied, hashed, modified, or committed.

Gate A2 passes. **A3 readiness: ready for dispatch.** A3, A6, and course-content implementation remain unstarted; PR #123 remains draft, and merge/deploy/public-release gates remain closed.
