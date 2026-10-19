# HarbourCare Synthetic Disconnected-production ADR

> Synthetic training template only. Do not add live customer data, credentials, provider responses, or production endpoints.

## Revision 001 — connected proposal

- Revision ID: `revision-001-connected-proposal`
- Prior assumption: `assumption-outbound-internet`
- Initial design: `design-cloud-dependent-observability`
- Status: `superseded`
- Original reasoning and evidence:

Keep this revision. Do not replace it with the later answer.

## Revision 002 — disconnected production

- Revision ID: `revision-002-disconnected-production`
- Previous revision: `revision-001-connected-proposal`
- Invalid assumption: `assumption-outbound-internet`
- New constraint: `constraint-disconnected-production`
- Affected components: `cloud-model-provider`, `outbound-observability`
- Selected alternative: `alternative-local-cpu-fixture-stack`
- Remaining risk: `risk-local-quality-latency-gap`
- Status: `accepted`
- Decision owner and evidence:

## Append-only revision rule

Append a new revision when evidence changes. Preserve the prior context, options, and reasoning so a reviewer can see what became invalid, what changed, and which risk remains.
