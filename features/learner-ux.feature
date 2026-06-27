Feature: Learner UX and navigation polish
  As a learner, I want catalog, course, module, and lesson routes to communicate status and next actions clearly, so I can move through the Academy without guessing.

  Scenario: Happy path - catalog and course routes show clear progression state
    Given the learner opens the catalog
    When courses have public, demo, protected, or unavailable states
    Then status, filtering, and progress cues are visible
    And course overview pages expose module progression and next lesson actions

  Scenario: Edge case - protected and demo-access states render predictably
    Given a learner lacks full access to a protected course
    When they view catalog, course, or module routes
    Then the protected gate is clear
    And demo-accessible content remains reachable
    And mobile and desktop layouts preserve the same workflow

  Scenario: Bug guard - visible route polish merges without evidence
    Given a PR changes learner-facing route UI
    When the PR is prepared for review
    Then desktop and mobile screenshots are attached or committed
    And video is included for interaction flows that cannot be proven by static screenshots
