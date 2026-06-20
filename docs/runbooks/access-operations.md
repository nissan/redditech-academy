# Redditech Academy Access Operations Runbook

This runbook covers the academy preview access path: shared demo login, named tester login, email magic links, course access approval links, Resend delivery, and libSQL storage. It is intentionally written without live secrets, raw tester codes, or private learner emails.

## Scope And Guardrails

- Use placeholders such as `<tester-code>`, `<learner@example.com>`, `<course-slug>`, and `<preview-url>` in issues, PRs, logs, and docs.
- Never paste `RESEND_API_KEY`, `DATABASE_AUTH_TOKEN`, raw magic-link tokens, approval-link tokens, tester codes, or private learner emails into GitHub.
- Mark any action that changes external state, reaches a hosted service, or reveals a real code as requiring Nissan approval.
- Prefer local verification before touching preview config.

## Implementation Reference

The access implementation is tracked in the academy auth/access history and preview deployment. Relevant surfaces:

- Login and tester entry: `/login` and `POST /api/auth/tester-login`
- Magic-link login: `POST /api/auth/magic-link/request`, `GET/POST /api/auth/magic-link/verify`
- Access requests: `/request-access`, `POST /api/access/request`, `GET/POST /api/access/approve`
- Protected course/API gates: course pages, `/api/course-structure`, `/api/judge`, `/api/tutor`, and `/api/quiz`
- Storage: libSQL via `DATABASE_URL`, defaulting locally to `file:.data/redditech-academy-auth.db`
- Email: Resend via `RESEND_API_KEY` and `RESEND_FROM`

Current `origin/main` may not show every deployed access file directly; validate against the deployed branch/commit before changing operational behavior. This runbook is docs-only and does not change auth code.

## Environment Variables

| Variable | Purpose | Approval / access |
| --- | --- | --- |
| `APP_URL` | Canonical URL used for magic-link, tester-login, and approval redirects. Set to preview URL in preview. | External service access required to change hosted config. |
| `DATABASE_URL` | libSQL storage location. Local default is file-backed SQLite under `.data/`; preview should use the mounted persistent path or a Turso/libSQL URL. | Nissan approval before changing preview/prod storage. |
| `DATABASE_AUTH_TOKEN` | Token for remote libSQL/Turso URLs, if used. Not needed for local `file:` URLs. | Secret; Nissan approval and external service access required. |
| `RESEND_API_KEY` | Sends login and approval emails. | Secret; Nissan approval and Resend access required. |
| `RESEND_FROM` | Sender identity for Resend. Use a verified domain sender when available. | Nissan approval and Resend access required. |
| `ACCESS_APPROVER_EMAIL` | Inbox that receives course approval requests. | Nissan approval before changing approver. |
| `GLOBAL_COURSE_ACCESS_EMAILS` | Comma-separated all-course tester allowlist. | Nissan approval before editing preview/prod. |
| `TESTER_LOGIN_CODE` | Legacy single tester code for globally allowlisted testers. | Secret; rotate after sharing. |
| `TESTER_LOGIN_CODES` | Course-specific tester code map, formatted as `<code>:<course-slug>|<course-slug>,<code2>:*`. | Secret; Nissan approval before issuing or rotating. |
| `DEMO_LOGIN_CODE` | Optional override for shared demo code. If unset, the built-in default demo code is used. | Treat as shareable but still avoid GitHub/log exposure. |
| `DEMO_USER_EMAIL` | Optional override for the shared demo identity. | Use a generic demo identity only. |

## Local Commands

Install and run the app:

```bash
pnpm install
cp .env.local.example .env.local
pnpm dev
```

Use local-only placeholders when testing access behavior:

```bash
cat >> .env.local <<'EOF'
APP_URL=http://localhost:3000
DATABASE_URL=file:.data/redditech-academy-auth.db
RESEND_FROM="Redditech Academy <onboarding@resend.dev>"
GLOBAL_COURSE_ACCESS_EMAILS=<tester@example.com>
TESTER_LOGIN_CODE=<local-tester-code>
TESTER_LOGIN_CODES=<local-course-code>:python-interview-prep
EOF
```

Run focused local validation:

```bash
pnpm test -- tests/auth/auth-flow.test.ts
pnpm test -- tests/auth/api-security.test.ts
pnpm build
git diff --check
```

If the current branch does not include the auth test files, run the available scoped checks instead and record that mismatch in the PR:

```bash
pnpm test -- tests/content-validation.test.ts
git diff --check
```

Inspect the local libSQL file only in development:

```bash
sqlite3 .data/redditech-academy-auth.db '.tables'
sqlite3 .data/redditech-academy-auth.db 'select course_slug, email, status, approved_by, approved_at from course_access;'
sqlite3 .data/redditech-academy-auth.db 'select event_type, email, course_slug, created_at from audit_events order by created_at desc limit 20;'
```

Do not run these `sqlite3` inspection commands against preview/prod storage without Nissan approval.

## Shared Demo Login

Purpose: let a reviewer try courses without per-person approval.

Behavior:

- The shared demo login uses a generic demo identity.
- Demo sessions last four hours.
- A client-visible `rt_academy_demo_bucket` cookie resets browser-side `rt_academy_*` progress state when the four-hour bucket changes.
- Demo access grants all protected courses without creating per-course approvals.

Local smoke:

```bash
curl -i -sS -X POST http://localhost:3000/api/auth/tester-login \
  -H 'content-type: application/json' \
  --data '{"code":"<demo-code>","next":"/courses/python-interview-prep"}'
```

Expected result:

- HTTP redirect to the requested course.
- `set-cookie` includes `rt_academy_session`.
- Demo flow also sets `rt_academy_demo_bucket`.
- Course page opens without the protected-course request gate.

Operational cautions:

- Do not paste the raw demo code into public GitHub comments.
- If the shared demo code is sent outside the trusted tester group, rotate it through hosted environment config with Nissan approval.

## Named Tester Codes

Purpose: give a named tester course access while email delivery is constrained or while a course-specific review is in progress.

Supported patterns:

- `TESTER_LOGIN_CODE` works with `GLOBAL_COURSE_ACCESS_EMAILS` for global testers.
- `TESTER_LOGIN_CODES` maps codes to courses. Example shape only: `<code-a>:python-interview-prep|agentic-ai-systems-engineering,<code-b>:*`.
- Course-specific codes grant access for the slugs they list. If the target `next` course is one of the mapped slugs, grant only that course for the login path.

Rotate or add a tester code:

1. Get Nissan approval for the tester, course scope, expiration expectation, and delivery channel.
2. Generate a new high-entropy code locally without printing it in shared logs:

   ```bash
   openssl rand -base64 24
   ```

3. Update hosted env config with either `TESTER_LOGIN_CODE` plus `GLOBAL_COURSE_ACCESS_EMAILS`, or `TESTER_LOGIN_CODES` for course-specific access.
4. Redeploy or restart the hosted app if the platform requires it.
5. Send the code only through the approved private channel.
6. Record the action in project status without the code value.

Local smoke:

```bash
curl -i -sS -X POST http://localhost:3000/api/auth/tester-login \
  -H 'content-type: application/json' \
  --data '{"email":"<tester@example.com>","code":"<tester-code>","next":"/courses/<course-slug>"}'
```

Expected result:

- Valid tester and code receive an HTTP redirect to `next`.
- Invalid code redirects to `/login?error=tester-code`.
- Tester email not covered by the global allowlist redirects to `/login?error=tester-email` when using legacy global code behavior.

## Resend Sender And Domain Caveat

Resend test senders can be limited to the verified Resend account recipient. When `RESEND_FROM` is set to a test sender such as `onboarding@resend.dev`, external testers may not receive magic links.

Before inviting external testers by email:

1. Confirm `reddi.tech` or the intended sender domain is verified in Resend. Requires Nissan approval and Resend access.
2. Set `RESEND_FROM` to a verified sender such as `Redditech Academy <academy@reddi.tech>`.
3. Request a magic link to a private test inbox and confirm delivery.
4. Keep named tester-code login available as a fallback until external delivery is confirmed.

Do not treat a successful HTTP response from `/api/auth/magic-link/request` as proof of inbox delivery. Check Resend status and the actual inbox.

## libSQL Storage

The access database stores users, session hashes, magic token hashes, course approvals, access request hashes, and audit events.

Tables created by the app:

- `users`
- `auth_magic_tokens`
- `sessions`
- `course_access`
- `access_requests`
- `audit_events`

Local defaults:

- Test: `file::memory:`
- Development: `file:.data/redditech-academy-auth.db`

Preview/prod requirements:

- Use a persistent file mount for `file:` URLs, or a managed Turso/libSQL URL.
- Do not redeploy with ephemeral storage for preview/prod access workflows.
- Back up or export before changing database location.
- Treat `DATABASE_AUTH_TOKEN` as a secret.

Preview storage checks require external service access and Nissan approval. A safe local equivalent is:

```bash
sqlite3 .data/redditech-academy-auth.db 'select count(*) from course_access;'
```

## Approval-Link Safety

Approval links and magic links are scanner-safe by design:

- `GET /api/auth/magic-link/verify?token=...` renders a no-store confirmation page.
- `POST /api/auth/magic-link/verify` consumes the magic token and creates the session.
- `GET /api/access/approve?token=...` renders a no-store confirmation page.
- `POST /api/access/approve` consumes the approval token and grants access.

Operational rules:

- Do not approve from email preview panes, link expanders, chat unfurls, or security scanner traces.
- Open the approval page intentionally, verify requester/course/reason in the email body, then click the confirmation button.
- Approval links expire after seven days and are one-time use.
- If a link is expired or suspected exposed, ask the learner to request access again.
- Never paste raw approval URLs into tickets or PRs.

## Request Access Flow

Learner path:

1. Learner signs in by magic link or tester code.
2. Learner opens a protected course.
3. If access is missing, learner submits `/request-access`.
4. Server uses the logged-in session email, not a caller-supplied email body.
5. Approver receives an email with requester, course, reason, and approval link.
6. Approver confirms via the scanner-safe approval page.
7. Learner signs in again or refreshes and can open the course.

Smoke locally:

```bash
# Anonymous protected API should be blocked.
curl -i -sS 'http://localhost:3000/api/course-structure?courseSlug=python-interview-prep'

# Request access requires a logged-in session cookie.
curl -i -sS -X POST http://localhost:3000/api/access/request \
  -H 'content-type: application/json' \
  --data '{"courseSlug":"python-interview-prep","reason":"pilot review"}'
```

Expected result:

- Anonymous protected API returns `401` with a login-required error.
- Request access without a session returns `401`.

## Preview Smoke Steps

These steps touch the hosted preview and require external service access. Get Nissan approval before running any step that uses real tester emails, real codes, hosted env edits, or approval links.

Use placeholders in command history:

```bash
PREVIEW_URL=<preview-url>
COURSE=python-interview-prep
```

Anonymous gate:

```bash
curl -i -sS "$PREVIEW_URL/api/course-structure?courseSlug=$COURSE"
```

Expected:

- `401`
- Body indicates login is required.

Shared demo smoke:

```bash
curl -i -sS -X POST "$PREVIEW_URL/api/auth/tester-login" \
  -H 'content-type: application/json' \
  --data '{"code":"<demo-code>","next":"/courses/python-interview-prep"}'
```

Expected:

- `303` redirect to `/courses/python-interview-prep`.
- `set-cookie` includes `rt_academy_session`.
- Demo deployments also set `rt_academy_demo_bucket`.

Named tester smoke:

```bash
curl -i -sS -X POST "$PREVIEW_URL/api/auth/tester-login" \
  -H 'content-type: application/json' \
  --data '{"email":"<tester@example.com>","code":"<tester-code>","next":"/courses/<course-slug>"}'
```

Expected:

- Valid tester flow redirects to the requested course.
- The course opens without the protected-course gate when using the returned cookies in a browser.

Email delivery smoke:

```bash
curl -i -sS -X POST "$PREVIEW_URL/api/auth/magic-link/request" \
  -H 'content-type: application/json' \
  --data '{"email":"<tester@example.com>","next":"/courses/python-interview-prep"}'
```

Expected:

- API returns success or redirects to sent state.
- The inbox actually receives the email.
- `GET` on the magic link shows a confirmation page; only `POST` consumes it.

Approval smoke:

1. Sign in as a test learner.
2. Submit request access for one course.
3. Confirm the approver inbox receives the request.
4. Open the approval link and verify the confirmation page appears without consuming the token.
5. Click the confirmation button to approve.
6. Reopen the course as the learner and verify the protected gate is gone.

## Troubleshooting

| Symptom | Likely cause | Check |
| --- | --- | --- |
| Magic-link request returns success but tester gets no email | Resend test sender/domain limitation | Verify `RESEND_FROM` domain and Resend event log. |
| Link redirects to localhost | `APP_URL` missing or wrong in hosted env | Set `APP_URL=<preview-url>` and redeploy/restart. |
| Magic link or approval link is invalid immediately | Link scanner/prefetch consumed an older non-scanner-safe link, token expired, or token already used | Use current GET confirmation flow and request a fresh link. |
| Tester code redirects to login error | Wrong code, email not allowlisted, course not in `TESTER_LOGIN_CODES`, or stale deployment env | Check env config privately; do not paste values. |
| Access disappears after redeploy | `DATABASE_URL` points to ephemeral file storage | Confirm persistent volume or managed libSQL/Turso. |
| Approval succeeds but course still gated | Learner has stale/no session or approval written for different email/course slug | Re-login and inspect `course_access` privately. |

## Rotation Checklist

Use this when a code or link may have been shared too broadly:

1. Get Nissan approval for rotation scope.
2. Replace the affected env value with a new generated value.
3. Redeploy/restart preview if needed.
4. Smoke with placeholder-safe commands.
5. Privately send the new code or link only to intended testers.
6. Log that rotation happened without recording the secret value.
