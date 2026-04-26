# Python Interview Prep Drill Pack

Use this pack like a real screen-share Python interview: open the files, inspect their shape, write small functions, and compare your output to `expected_outputs/` only after a real attempt.

## Suggested timing

- 10 min: single-file warmups (`sample_results.json`, `batch_outputs.jsonl`)
- 20 min: aggregation drills (`provider_groupby`, `blended_price`)
- 30 min: operational report (`endpoint_logs.csv`)
- 45 min: full mock using multiple files plus a written explanation

## Files

- `fixtures/sample_results.json` — benchmark results with cost, quality, latency, and nullable TTFT.
- `fixtures/batch_outputs.jsonl` — JSONL stream with one malformed line and one blank line.
- `fixtures/endpoint_logs.csv` — provider request logs with success, timeout, rate-limit, and server-error rows.
- `fixtures/model_metadata.json` — model metadata for join/cardinality practice.
- `fixtures/messy_scores.csv` — duplicate rows, missing scores, non-numeric scores, and an outlier.

## Practice rule

Do not look at `solutions/` first. Use the expected outputs as a final check, not as a starting point.
