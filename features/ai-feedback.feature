Feature: AI feedback and judge reliability
  As a learner, I want challenge validation and tutor feedback to be deterministic and safe, so feedback is useful even when providers or inputs fail.

  Scenario: Happy path - deterministic validators cover supported challenge types
    Given a challenge has canonical type metadata
    When the judge validates a correct or incorrect learner response
    Then validation follows deterministic rules for that challenge type
    And tests cover JSON editor and sequence-completer behavior

  Scenario: Edge case - malformed learner input receives a safe fallback
    Given the learner submits malformed JSON, missing fields, or unsupported data
    When the judge or tutor handles the submission
    Then the response is actionable and safe
    And provider calls are not required to prove the fallback behavior

  Scenario: Bug guard - provider or network dependence makes tests unsafe
    Given local tests run without API keys or external provider access
    When judge and tutor tests execute
    Then network-dependent cases are mocked, skipped with explicit reason, or isolated in integration tests
    And unit tests remain deterministic
