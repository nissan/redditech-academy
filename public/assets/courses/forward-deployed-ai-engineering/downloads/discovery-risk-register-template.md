# HarbourCare Synthetic Discovery Risk Register

> Synthetic training template only. Do not add live customer data, credentials, provider responses, or production endpoints.

| Risk ID | Assumption/cause | Consequence | Owner | Response | Required evidence | State | Review trigger |
|---|---|---|---|---|---|---|---|
| `risk-connectivity-assumption` | outbound internet has not been validated | connected components may be unusable | `persona-platform-operator` | validate before pilot entry | `evidence-connectivity-workshop` | open | connectivity constraint changes |
| `risk-source-mislabel` | source metadata can be wrong | cross-tenant context may be assembled | `persona-north-security` | metadata-quality and denial tests | `evidence-metadata-quality-report` | open | label or denial-test failure |

## Residual-risk acceptance

For each accepted risk, name the authorised HarbourCare owner, the controls already tested, the remaining exposure, an expiry/review date, and the evidence that would reopen the decision. The learner/FDE records evidence but cannot accept customer risk.
