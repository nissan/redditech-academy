# UI Evidence Harness

Issue: [#17](https://github.com/nissan/redditech-academy/issues/17)

Use this harness when an academy PR changes visible routes or components. It
captures a repeatable set of screenshots into:

```text
artifacts/ui-evidence/<issue>/
```

The output directory is ignored by git. Attach the screenshots and
`manifest.json` to the pull request or PR comment.

## Quick Start

Start the app in one terminal:

```bash
pnpm dev
```

Capture desktop evidence in another terminal:

```bash
pnpm ui:evidence -- --issue=17 --base-url=http://localhost:3000
```

Capture desktop and mobile evidence:

```bash
pnpm ui:evidence -- --issue=17 --base-url=http://localhost:3000 --mobile
```

Preview the capture plan without opening a browser:

```bash
pnpm ui:evidence -- --dry-run --issue=17
```

## Captured Scenarios

The default run captures named screenshots for:

| File prefix | Scenario | Default path |
| --- | --- | --- |
| `01-home` | Home | `/` |
| `02-course-overview` | Course overview | `/courses/solana-academy` |
| `03-module` | Module | `/courses/solana-academy/learn/00-solana-first-principles` |
| `04-lesson` | Lesson | `/courses/solana-academy/learn/00-solana-first-principles/01-mental-models-and-vocabulary` |
| `05-protected-gate` | Protected gate | `/courses/solana-academy/learn/00-solana-first-principles` |
| `06-login-request-access` | Login / request access | `/login` |
| `07-desktop` | Desktop experience | `/desktop` |

The current `origin/main` route set does not include a `/login` route or an
active password-protected module fixture. Until those routes are restored or
added, override `UI_EVIDENCE_PROTECTED_GATE_PATH` and `UI_EVIDENCE_LOGIN_PATH`
when capturing evidence against a branch or deployment that contains them. The
harness still writes named screenshots and records missing expected gate/login
copy in `manifest.json`.

## Route Overrides

Set any of these environment variables to point the harness at a different
course, module, lesson, gate, or deployment-specific login route:

```bash
UI_EVIDENCE_HOME_PATH=/
UI_EVIDENCE_COURSE_PATH=/courses/python-interview-prep
UI_EVIDENCE_MODULE_PATH=/courses/python-interview-prep/learn/00-course-intro
UI_EVIDENCE_LESSON_PATH=/courses/python-interview-prep/learn/00-course-intro/01-interview-game-plan
UI_EVIDENCE_PROTECTED_GATE_PATH=/courses/private-course
UI_EVIDENCE_LOGIN_PATH=/login
UI_EVIDENCE_DESKTOP_PATH=/desktop
```

## Browser Install Policy

Playwright is already a development dependency, but browser binaries are not
installed by CI automatically. Local evidence capture requires an explicit
browser install when Chromium is unavailable:

```bash
pnpm exec playwright install chromium
```

Do not add a mandatory CI browser install unless a future issue explicitly asks
for automated screenshot capture.
