Feature: Academy backlog governance and BDD guardrails
  As an operator, I want every active Academy work item mapped to scenarios and evidence requirements, so autonomous agents can work in parallel without losing the plan.

  Scenario: Happy path - feature and task issues carry implementation-ready metadata
    Given an active Academy epic has planned child work
    When a feature or task issue is created or refreshed
    Then the issue describes the work clearly
    And it lists acceptance criteria
    And it lists dependencies and blockers
    And it states whether UI screenshots or video are required

  Scenario: Edge case - post-merge plan revalidation changes the issue graph
    Given a PR has merged and changed the current plan
    When the post-merge checklist is run
    Then parent issue comments and STATUS.md are updated
    And any needed follow-up issues are created or edited
    And stale issues are closed or marked blocked with a clear reason

  Scenario: Bug guard - implementation starts without mapped scenario coverage
    Given a non-trivial implementation issue is ready for Kit
    When no BDD tracker row or feature scenario covers it
    Then implementation is paused for a spec refresh
    And the missing scenario coverage is added before app code changes begin
