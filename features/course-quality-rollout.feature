Feature: Course quality rollout across academy tracks
  As a learner, I want course media, references, challenges, and content quality gates to be reliable, so lessons do not contain broken assets or ambiguous tasks.

  Scenario: Happy path - inventory gaps are repaired or intentionally retired
    Given the course inventory report identifies missing assets or content gaps
    When a quality task repairs a scoped gap
    Then the affected report bucket decreases
    And regenerated reports match the changed content
    And validation commands pass before merge

  Scenario: Edge case - a missing media asset is intentionally unavailable
    Given a lesson references a media asset that cannot be restored
    When the course quality task handles that reference
    Then the lesson is updated with learner-safe fallback content
    And the broken reference is removed from the inventory report
    And UI evidence is included if visible lesson output changes

  Scenario: Bug guard - report drift returns after a quality repair
    Given a quality PR repairs a reported gap
    When `pnpm content:inventory` is rerun
    Then generated report files have no unexpected drift
    And the original gap does not reappear under another path
