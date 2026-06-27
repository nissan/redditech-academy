Feature: Auth, access, demo, and admin operations
  As an operator, I want authentication, access requests, demo sessions, and approvals to be testable without live external services, so public tester handoff is safe.

  Scenario: Happy path - auth and access regression matrix covers critical flows
    Given the auth test suite runs locally
    When passwordless request, verify, logout, protected gate, request access, approval link, shared demo, and course-specific tester code flows are exercised
    Then each flow has deterministic pass/fail assertions
    And no live email is sent during tests

  Scenario: Edge case - demo reset and request transparency are visible to users
    Given a user enters a demo session or requests access
    When the flow succeeds, expires, or resets
    Then the user sees the current state without exposing private emails, secrets, or admin-only data

  Scenario: Bug guard - scanner-safe approval behavior regresses
    Given an approval link can be scanned by a mail or security tool
    When automated scanners touch the link
    Then approval is not consumed accidentally
    And audit or admin traceability records remain consistent
