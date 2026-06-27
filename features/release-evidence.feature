Feature: Release, evidence, and deployment hygiene
  As a maintainer, I want each Academy PR to carry validation, evidence, and post-merge notes, so release readiness claims are backed by reviewable artifacts.

  Scenario: Happy path - PRs include validation and required evidence
    Given a PR is ready for review
    When the PR changes code, content, tests, docs, or UI
    Then the PR body lists relevant validation commands
    And UI changes include screenshots or video when required
    And release or evidence notes point to reviewable artifacts

  Scenario: Edge case - UI evidence harness cannot launch bundled browser
    Given `pnpm ui:evidence` cannot launch the expected browser binary
    When a manual Playwright capture with system Chrome or another approved browser is used
    Then the screenshot or video artifact is still attached or committed
    And the manifest records the fallback path and reason

  Scenario: Bug guard - merge happens without post-merge plan revalidation
    Given a PR has merged
    When linked parent issues or epics depend on its result
    Then parent comments, STATUS.md, and memory are updated
    And follow-up issues are added, edited, or closed if the plan changed
