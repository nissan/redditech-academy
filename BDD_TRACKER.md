# BDD Tracker - Redditech Academy
_Last updated: 2026-06-27 by Loki_

## Purpose

This tracker separates the completed consolidation-era scenarios from the active Academy roadmap scenarios. New feature or task implementation should map back to one of the active scenarios below before a Kit implementation PR starts.

## Completed Consolidation Scenarios

Legacy source: `features/consolidation.feature`.

| Scenario | Covered issue/PR | Status | Notes |
| --- | --- | --- | --- |
| Source courses are consolidated into a single catalog | PR #1 | Complete | Catalog consolidation is already merged. |
| Source format mismatch is handled without silent loss | PR #1 | Complete | Import adapter reporting was part of the consolidation lane. |
| Duplicate slugs and broken references are blocked from merge | PR #1 | Complete | This was the original consolidation guardrail. |
| No regression on existing OpenClaw/Auth courses | PR #1 | Complete | Existing-course parity was checked during consolidation. |

## Active Roadmap Scenario Map

| Epic | Feature file | Happy path scenario | Edge case scenario | Bug guard scenario | Blocks |
| --- | --- | --- | --- | --- | --- |
| #6 Backlog governance and BDD guardrails | `features/backlog-governance.feature` | Issues carry acceptance criteria, dependencies, blockers, and evidence rules | Post-merge plan changes create/edit/close follow-up issues | Work starts without mapped scenario coverage | #8, #10, route/auth UI work |
| #7 Course quality rollout | `features/course-quality-rollout.feature` | Course inventory gaps are repaired or explicitly retired | Missing media is replaced with learner-safe fallback content | Reports drift or broken references return after repair | M3 course rollout claims |
| #8 Learner UX and navigation polish | `features/learner-ux.feature` | Catalog, course overview, and lesson routes show clear status and progress | Protected/demo-access states render correctly on desktop and mobile | UI changes merge without screenshots/video evidence | #48, #49, #50, #51 |
| #9 Auth, access, demo, and admin operations | `features/auth-access.feature` | Passwordless, demo, request, and approval flows are covered by tests | External email/service calls are mocked or disabled in tests | Security-sensitive approval or demo reset behavior regresses | #52, #53 |
| #10 AI feedback and judge reliability | `features/ai-feedback.feature` | Deterministic validation covers supported challenge types | Malformed input gets safe judge/tutor fallback behavior | Provider/network dependence makes local tests flaky or unsafe | #54, #55, #56 |
| #11 Release, evidence, and deployment hygiene | `features/release-evidence.feature` | PRs include validation, release notes, and required evidence | UI evidence capture can fall back when bundled browser is unavailable | A PR merges without post-merge plan revalidation | M6 readiness claims |

## Validation Commands

Run the narrowest relevant gate first, then expand before merge.

- Unit/content tests: `pnpm test`
- Type checking: `pnpm type-check`
- Production build: `pnpm build`
- Content inventory: `pnpm content:inventory`
- UI evidence capture: `pnpm ui:evidence -- --issue=<issue> --base-url=<preview-or-local-url>`
- Diff hygiene: `git diff --check origin/main...HEAD` and `git diff --check`

## Operating Rules

1. Every implementation PR should cite the mapped issue and scenario family.
2. Each UI PR must include screenshots or video in a reviewable artifact path or PR attachment.
3. After every merged PR, revisit this tracker and the linked parent issue plan. Add, edit, or close issues if the plan changed.
4. Keep Solana challenge environment/type work separate from #37 slug/frontmatter cleanup unless a later parent issue explicitly combines them.
5. Keep docs/planning PRs free of app behavior changes unless their issue explicitly calls for implementation.
