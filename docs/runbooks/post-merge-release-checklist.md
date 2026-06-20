# Post-Merge Release And Plan Revalidation Checklist

Use this checklist after each Redditech Academy PR is merged. It keeps release notes, issue state, project planning, BDD coverage, and memory aligned before the next tranche starts.

## Source Links

- Project status: `projects/redditech-academy/STATUS.md`
- BDD tracker: `projects/redditech-academy/BDD_TRACKER.md`
- Current roadmap artifact: `projects/redditech-academy/EPIC-ISSUE-BREAKDOWN-2026-06-20.md`
- GitHub parent epic: link the merged PR back to its parent epic, such as #11 for release/evidence work.
- GitHub linked issue: confirm the issue closed by the PR, or update it manually when the PR did not use a closing keyword.
- Memory task outcome log: append the structured task outcome to `memory/YYYY-MM-DD.md`.

## Merge Confirmation

- [ ] Confirm the PR is merged and record the merge commit:
  - `gh pr view <pr-number> --repo nissan/redditech-academy --json state,mergedAt,mergeCommit,title,url`
- [ ] Confirm the linked issue state, labels, milestone, dependencies, and reverse dependencies:
  - `gh issue view <issue-number> --repo nissan/redditech-academy --json state,labels,milestone,body,url`
- [ ] Confirm the parent epic child map or checklist reflects the merged issue.
- [ ] Record whether deployment, preview smoke, or release-note follow-up is required.

## Release Note

- [ ] Add or prepare a short release note that includes:
  - PR number, linked issue, parent epic, merge commit, and branch.
  - User-visible behavior change, docs-only note, or test-only note.
  - Validation commands and review outcome.
  - Deployment or preview-smoke status, if relevant.
  - UI evidence links or a clear "not applicable" note.
- [ ] If the PR changed release behavior, update the relevant runbook or spec before starting another implementation tranche.

## Project Artifact Revalidation

- [ ] Update `projects/redditech-academy/STATUS.md` with the latest merge, active blockers, and `RESUME FROM HERE`.
- [ ] Update `projects/redditech-academy/BDD_TRACKER.md` when scenarios were implemented, verified, retired, or newly required.
- [ ] Update the linked issue with validation, review, UI evidence status, and any follow-up issues.
- [ ] Update the parent epic with completed child work and newly unblocked work.
- [ ] If the roadmap sequence changed materially, append a revalidation note to the current roadmap artifact or create a successor planning artifact.

## Evidence Handling

- [ ] Decide whether UI evidence should be archived or linked from the PR, issue, parent epic, or project status.
- [ ] For UI PRs, verify screenshot or video evidence covers the changed routes, states, and desktop/mobile breakpoints.
- [ ] Confirm evidence does not expose secrets, credentials, tokens, private learner data, or sensitive environment values.
- [ ] If UI evidence is missing for visible changes, do not mark the lane ready for merge until it is supplied or the scope is explicitly non-UI.

## Tranche Retrospective

- [ ] Record tranche progress: completed PRs, open PRs, blocked work, and work still in review.
- [ ] Capture lessons learned from implementation, review, validation, and deployment.
- [ ] Note plan changes caused by the merge.
- [ ] List added, removed, or modified issues.
- [ ] Recompute dependencies and reverse dependencies.
- [ ] Decide whether the next tranche should be resequenced, kept parallel, or serialized because of shared-file risk.
- [ ] Name the next lanes and their file ownership boundaries.
- [ ] Decide whether a repo-local companion skill or durable lesson is warranted.

## Memory And Logs

- [ ] Append a structured task outcome block to `memory/YYYY-MM-DD.md`.
- [ ] Add a captain's-log insight only if the merge produced a reusable lesson.
- [ ] Keep private data out of public issue comments, PR bodies, evidence, and release notes.
