# Python Interview Prep Research Brief
_Archie · 2026-04-18_

## Context
Target companies: Artificial Analysis, OpenAI, Anthropic, Cohere, and similar data-heavy AI teams using Python, pandas, and numpy.

## Confirmed Interview Signals
- **Artificial Analysis works in benchmark-shaped data, not algorithm puzzles.** Their public methodology emphasises quality, performance, and price benchmarking across providers, with metrics like TTFT, output tokens/sec, total response time, blended token pricing, and OpenAI-token standardisation. That implies interview tasks are likely to involve metric calculation, reconciliation across providers, and careful handling of tabular benchmark outputs rather than textbook LeetCode tricks. Source: https://artificialanalysis.ai/methodology
- **The stack is Python-first and table-heavy.** Artificial Analysis explicitly references Python tooling such as `tiktoken` for token standardisation, and the broader interview-prep literature for data roles keeps converging on pandas operations: sorting, duplicate handling, aggregations, merges, calculated fields, datetime operations, and text manipulation. Sources: https://artificialanalysis.ai/methodology, https://www.stratascratch.com/blog/python-pandas-interview-questions-for-data-science
- **Their open roles point directly at benchmark-pipeline work.** Current Artificial Analysis job descriptions mention robust Python solutions for benchmarking, model evaluation, and data analysis, plus operating a Python-based language-model benchmarking pipeline end-to-end: onboarding new models, configuring evaluations, executing runs, debugging anomalies, validating results, and maintaining documentation. That makes file ingestion, metric computation, anomaly investigation, and concise explanation far more plausible interview material than graph algorithms. Sources: https://artificialanalysis.ai/careers/senior-ai-ml-engineer, https://artificialanalysis.ai/careers/solutions-engineer-language-models, https://artificialanalysis.ai/careers
- **CSV ingestion and decomposition are likely screening primitives.** Real Python's interview practice material frames parsing CSV files, computing derived metrics, and discussing trade-offs between the standard `csv` module and pandas as live-coding interview territory. That maps neatly to the reported Artificial Analysis format of receiving a zip with data files and solving in Python while screen-sharing. Source: https://realpython.com/python-interview-problem-parsing-csv-files/
- **Pandas edge cases matter because silent mistakes are common.** The pandas docs call out non-obvious behavior such as `median(skipna=True)` excluding nulls by default, `groupby(dropna=True)` dropping NA groups by default, and `merge()` matching null keys to each other unlike standard SQL behavior. Those are exactly the sort of traps an interviewer can use to test whether a candidate checks assumptions rather than blindly coding. Sources: https://pandas.pydata.org/docs/reference/api/pandas.DataFrame.median.html, https://pandas.pydata.org/docs/reference/api/pandas.DataFrame.groupby.html, https://pandas.pydata.org/docs/reference/api/pandas.merge.html

## Problem Set
Below are **18 high-probability problem types** for a Python-only, data-heavy interview at an LLM benchmarking company.

### 1. Parse a zip of benchmark files into clean DataFrames
Description: The candidate gets a zip containing CSV, JSONL, or TSV benchmark outputs and needs to load them into a consistent in-memory structure. The real test is not `pd.read_csv()` itself, but whether they inspect filenames, delimiters, headers, and bad rows before assuming the data is clean.
- **Key Python concepts tested:** `zipfile`, `pathlib`, `pd.read_csv`, delimiter/header detection, `on_bad_lines`, basic schema inspection
- **Example input data shape:** `runs/latency.csv`, `runs/pricing.csv`, `runs/quality.jsonl`
- **Example output:** `{'latency': df_latency, 'pricing': df_pricing, 'quality': df_quality}` with standardised column names
- **Difficulty:** Beginner
- **Module:** file-parsing

### 2. Audit schema and coerce dtypes safely
Description: The candidate must detect that numeric columns arrived as strings, timestamps are plain text, or IDs have inconsistent formats. Strong candidates check `df.info()`, missingness, and sample values before doing arithmetic.
- **Key Python concepts tested:** `df.info()`, `df.head()`, `pd.to_numeric`, `pd.to_datetime`, null handling, defensive checks
- **Example input data shape:** columns like `ttft_s='1.24'`, `output_tokens='256'`, `timestamp='2026-04-18 08:31:02Z'`
- **Example output:** same rows with numeric and datetime dtypes, plus a short validation summary
- **Difficulty:** Beginner
- **Module:** file-parsing

### 3. De-duplicate repeated benchmark runs
Description: Benchmark pipelines often emit retried or repeated runs for the same `(provider, model, prompt_id)` key. The task is to identify duplicates and choose a policy, usually keep latest timestamp or keep only successful rows.
- **Key Python concepts tested:** `duplicated`, `drop_duplicates`, sort-by-then-keep, key selection, business-rule reasoning
- **Example input data shape:** columns `provider, model, prompt_id, run_id, created_at, status`
- **Example output:** one canonical row per logical run, with duplicate count reported
- **Difficulty:** Intermediate
- **Module:** edge-cases

### 4. Compute latency metrics from raw token events
Description: Given prompt send time, first-token time, final-token time, and token counts, compute TTFT, output speed, and end-to-end time. The problem checks whether the candidate can define formulas clearly before coding them.
- **Key Python concepts tested:** datetime arithmetic, derived columns, units, division safety, naming conventions
- **Example input data shape:** `sent_at`, `first_token_at`, `completed_at`, `output_tokens`
- **Example output:** columns `ttft_s`, `tokens_per_s`, `end_to_end_s`
- **Difficulty:** Intermediate
- **Module:** metrics

### 5. Calculate blended token price across providers
Description: Artificial Analysis publicly uses a blended price assumption based on a 3:1 ratio of input to output tokens. A likely interview exercise is to take separate input/output token pricing and compute a comparable blended cost column.
- **Key Python concepts tested:** formula implementation, unit conversions, column arithmetic, readable constants
- **Example input data shape:** `provider, model, input_price_per_1m, output_price_per_1m`
- **Example output:** `blended_price_per_1m` sorted cheapest to most expensive
- **Difficulty:** Beginner
- **Module:** metrics

### 6. Aggregate model performance by provider or family
Description: The candidate groups benchmark rows to answer questions like "Which provider has the lowest median TTFT?" or "Which model family has the best average quality score?" This is a direct test of `groupby` fluency and of whether they choose mean vs median thoughtfully.
- **Key Python concepts tested:** `groupby`, `agg`, `as_index`, mean vs median, sorting ranked outputs
- **Example input data shape:** `provider, model_family, quality_score, ttft_s, tokens_per_s`
- **Example output:** ranked summary table by provider or family
- **Difficulty:** Intermediate
- **Module:** aggregation

### 7. Join benchmark results with model metadata
Description: One file contains measurements, another contains metadata like provider, release date, model size, or pricing tier. The candidate must merge them without creating accidental row explosions.
- **Key Python concepts tested:** `merge`, join keys, `validate`, `indicator`, null-key caution
- **Example input data shape:** `results(model_id, prompt_id, score)` plus `models(model_id, provider, release_date)`
- **Example output:** enriched results DataFrame with confirmed one-to-many or many-to-one join
- **Difficulty:** Intermediate
- **Module:** aggregation

### 8. Build a leaderboard with tie-breaking rules
Description: The candidate needs to rank models by a primary score and then break ties with secondary metrics such as TTFT or price. This checks whether they can encode business logic cleanly instead of hand-waving about sorting.
- **Key Python concepts tested:** `sort_values`, multiple sort keys, stable ranking, presentation columns
- **Example input data shape:** `model, quality_score, ttft_s, blended_price`
- **Example output:** leaderboard table with rank 1..N and deterministic tie handling
- **Difficulty:** Intermediate
- **Module:** output-formatting

### 9. Pivot long benchmark data into a model-by-task matrix
Description: Interviews often ask candidates to turn event-level rows into a wide summary suitable for quick comparison. The test is whether they know when to use `pivot_table` and how to handle missing cells.
- **Key Python concepts tested:** `pivot`, `pivot_table`, fill values, index/columns/value selection
- **Example input data shape:** `model, benchmark_name, score`
- **Example output:** rows=model, columns=benchmark, values=score
- **Difficulty:** Intermediate
- **Module:** aggregation

### 10. Identify anomalies or suspicious runs
Description: The candidate is given benchmark runs and asked to flag likely bad data, such as TTFT of zero, negative prices, or abrupt speed spikes relative to a provider's normal range. The important part is not fancy statistics; it is building a sensible anomaly rule and explaining it.
- **Key Python concepts tested:** boolean masks, quantiles or z-score style reasoning, grouped thresholds, debugging mindset
- **Example input data shape:** `provider, model, ttft_s, tokens_per_s, price_per_1m`
- **Example output:** subset of suspicious rows with a `reason` column
- **Difficulty:** Hard
- **Module:** edge-cases

### 11. Handle missing values in summary statistics
Description: A dataset has partial failures, so some quality or latency fields are null. The candidate must compute summaries while being explicit about what happens to missing values and whether missing groups should appear in output.
- **Key Python concepts tested:** `isna`, `fillna`, `dropna`, `skipna`, groupby `dropna=False`
- **Example input data shape:** rows with `quality_score = NaN` or `provider = NaN`
- **Example output:** summary table plus a note such as "median excludes NaN by default"
- **Difficulty:** Intermediate
- **Module:** edge-cases

### 12. Parse and bucket timestamps by day or hour
Description: The candidate receives run timestamps and must summarise throughput or failures over time. This tests whether they can correctly parse dates, manage time zones, and group by time windows.
- **Key Python concepts tested:** `pd.to_datetime`, timezone awareness, `.dt` accessors, resampling or date bucketing
- **Example input data shape:** `created_at`, `status`, `provider`
- **Example output:** daily counts of completed vs failed runs
- **Difficulty:** Intermediate
- **Module:** aggregation

### 13. Compare two models head-to-head on shared prompts
Description: Two models answered overlapping but not perfectly identical prompt sets, and the candidate must compare only matched prompts. This forces careful joining, denominator control, and explicit handling of unmatched rows.
- **Key Python concepts tested:** filtered merge, suffixes, coverage checks, delta columns
- **Example input data shape:** `prompt_id, model, score, ttft_s`
- **Example output:** matched comparison table with `score_delta` and `ttft_delta`
- **Difficulty:** Hard
- **Module:** metrics

### 14. Produce a provider report from raw endpoint logs
Description: The task is to derive counts of successes, timeouts, and error codes from request-level logs. This resembles the operational side of a benchmarking pipeline more than a textbook data-science problem.
- **Key Python concepts tested:** filtering, grouping, status-code classification, rate calculation
- **Example input data shape:** `request_id, provider, status_code, latency_ms, error_type`
- **Example output:** report like `success_rate`, `timeout_rate`, `p95_latency_ms` per provider
- **Difficulty:** Intermediate
- **Module:** mock

### 15. Format a clean summary table for a human reviewer
Description: After the numerical work is done, the candidate must print or return a readable table with renamed columns, rounded metrics, and sensible ordering. This sounds trivial until candidates dump an unreadable DataFrame and call it finished.
- **Key Python concepts tested:** column renaming, rounding, string formatting, `to_string`, display-oriented thinking
- **Example input data shape:** aggregated summary DataFrame
- **Example output:** clean table with columns like `Model | Median TTFT (s) | Output tok/s | Blended $/1M`
- **Difficulty:** Beginner
- **Module:** output-formatting

### 16. Write a reusable function for benchmark summarisation
Description: Rather than one giant notebook cell, the candidate is asked to package logic into a function like `summarise_runs(df)`. This tests decomposition, argument naming, return values, and code hygiene under time pressure.
- **Key Python concepts tested:** functions, docstrings or comments, small helpers, separation of concerns
- **Example input data shape:** DataFrame with raw run rows
- **Example output:** a summary DataFrame or dict of derived metrics
- **Difficulty:** Beginner
- **Module:** mock

### 17. Explain and implement a fallback when pandas is overkill
Description: Some interviewers may hand over a small CSV and ask for a simple answer where the standard library is enough. Real Python explicitly frames the trade-off between `csv` and pandas, so a strong candidate should know when plain Python is perfectly adequate.
- **Key Python concepts tested:** `csv.DictReader`, generator thinking, trade-off explanation, minimalism
- **Example input data shape:** small single CSV file with <100 rows
- **Example output:** one computed answer plus a brief justification for tool choice
- **Difficulty:** Intermediate
- **Module:** file-parsing

### 18. Debug a subtly wrong result under screen-share conditions
Description: The interviewer gives a nearly correct solution that produces the wrong answer because of a bad join, dropped NA group, or string-sorted numeric column. This is highly plausible for a benchmarking company because operating the pipeline reliably involves noticing discrepancies, not merely writing fresh code.
- **Key Python concepts tested:** debugging, reproducing assumptions, sanity checks, print-based inspection, incremental verification
- **Example input data shape:** any of the above, but with one hidden issue such as duplicated keys or object-typed numbers
- **Example output:** corrected code plus a clear explanation of the root cause
- **Difficulty:** Hard
- **Module:** mock

## Common Failure Patterns
These are the **10 most useful Socratic teaching moments** for this course.

| Failure pattern | Why it hurts in interview | Socratic teaching move |
|---|---|---|
| 1. Coding before inspecting the data | Candidates jump straight into groupby logic without checking columns, dtypes, or missingness, so they solve the wrong problem elegantly. | "Before we compute anything, what do you know about the shape, columns, and dtypes?" |
| 2. Assuming join keys are unique | A merge silently duplicates rows and all downstream metrics become fiction. | "What cardinality do you expect here, and how would you verify it before trusting the merge?" |
| 3. Ignoring null semantics | Median, groupby, and merge all have defaults that can hide or distort data. | "Which rows disappear by default here, and is that what you want?" |
| 4. Using the wrong denominator or units | Candidates mix milliseconds with seconds, per-token with per-million-token pricing, or total time with post-first-token speed. | "Can you define the metric in words before you write the formula?" |
| 5. Row-wise loops for table operations | `for _, row in df.iterrows()` appears where a vectorised expression or groupby would be simpler and clearer. | "What would this look like if you let pandas operate on the whole column at once?" |
| 6. Hard-coding happy-path assumptions | A solution breaks when a file has a different delimiter, a missing column, or one malformed row. | "What is the smallest guardrail you can add so the code fails usefully instead of mysteriously?" |
| 7. Over-formatting before validating correctness | Candidates spend time polishing output before checking whether counts and aggregates reconcile. | "What single sanity check would convince you the numbers are plausible?" |
| 8. Treating duplicates as obviously bad or obviously safe | In benchmark pipelines, duplicates can mean retries, shadow runs, or legitimate repeated measurements. | "What duplicate policy matches the business meaning of this dataset?" |
| 9. Going silent while stuck | Under screen-share conditions, silence looks like confusion rather than careful thought. | "Say out loud what you are testing next and why." |
| 10. Not decomposing the task | Candidates try to solve parsing, cleaning, metrics, and formatting in one uninterrupted block. | "Can you break this into the next two concrete steps instead of the full solution?" |

## Mini Tutorial Topics
These are the **12 quick-reference topics** most worth turning into short lessons or cheatsheets.

### 1. `read_csv` knobs that matter under interview pressure
- `sep`, `header`, `names`, `dtype`, `parse_dates`, `usecols`, and `on_bad_lines` are the ones that prevent the most avoidable pain.
- Teach students to say, "I want to inspect a few rows first rather than assume the parser got everything right."

### 2. Fast schema triage: `head()`, `info()`, `isna().sum()`, `nunique()`
- The first minute should establish shape, dtypes, null counts, and suspiciously low-cardinality fields.
- This turns vague "exploration" into a repeatable checklist.

### 3. When to use `defaultdict` vs `dict.setdefault` vs pandas
- `defaultdict(list)` or `defaultdict(int)` is excellent for small pure-Python aggregation tasks.
- If the task is naturally row-table shaped and headed toward grouping/filtering, pandas is usually cleaner.

### 4. `to_numeric` and `to_datetime` without self-sabotage
- Show `errors='coerce'` and explain when converting bad values to `NaN`/`NaT` is helpful versus dangerous.
- Include the interview phrase: "I'm coercing here so I can surface malformed values explicitly."

### 5. Mean vs median, especially with `NaN`
- pandas `median(skipna=True)` excludes nulls by default.
- Teach why median is often better for latency-like metrics and why the candidate should still report missing-row counts.

### 6. `groupby` defaults that bite
- `as_index=True` changes output shape, and `dropna=True` can hide NA groups.
- Students should know when to use `dropna=False` to make missing categories visible.

### 7. Safe joins with `merge(validate=..., indicator=True)`
- This is one of the highest-value habits for data interviews.
- It turns "I hope this merge is right" into an explicit testable claim.

### 8. Duplicate detection and policy design
- `duplicated(subset=...)` is only the first step; the real question is what to keep and why.
- Use examples like retries, reruns, and latest-success wins.

### 9. Vectorised operations vs `iterrows()`
- Students do not need to worship vectorisation, but they should recognise when a row loop is needless friction.
- A good heuristic: if the operation is column arithmetic or grouped aggregation, pandas probably already has the shape.

### 10. Formatting tables without `tabulate`
- Show `rename`, `round`, column ordering, f-strings, and `to_string(index=False)`.
- In these interviews, readable output is part of the solution, not post-processing vanity.

### 11. Building benchmark metrics from raw columns
- TTFT, output tokens/sec, end-to-end latency, success rate, and blended cost should each have plain-English definitions.
- Students should practise stating the formula before coding it.

### 12. Small-function decomposition for live coding
- Turn monolithic notebook behaviour into helpers like `load_runs`, `clean_schema`, `compute_metrics`, `summarise_provider`.
- This reduces panic and makes debugging much less theatrical.

## Narration Patterns
These are **8 strong phrases candidates should say aloud while coding**.

| Phrase | Why it works |
|---|---|
| "Let me inspect the shape, columns, and dtypes first so I know what I'm actually working with." | Signals discipline and prevents blind coding. |
| "I'll define the metric in words before I implement the formula, just to avoid a units mistake." | Shows mathematical care, which matters in benchmarking work. |
| "I'm going to check whether this key is unique before I trust the merge." | Demonstrates mature data-engineering instincts. |
| "I see missing values here, so I'll decide explicitly whether they should be excluded, filled, or surfaced." | Shows awareness of silent pandas defaults. |
| "I'll solve this in two passes: first get the correct intermediate table, then format the final output." | Communicates decomposition and keeps the interviewer oriented. |
| "For a small file I could use the standard library, but since we want grouped summaries quickly, pandas is the cleaner choice here." | Shows tool-choice judgment rather than cargo-culting pandas. |
| "I'm adding a quick sanity check so I can verify the aggregate matches the underlying rows." | Signals reliability, not just code production. |
| "If I were hardening this beyond the interview, I'd add join validation and a couple of edge-case tests, but I'll keep the live version focused." | Shows production awareness without disappearing into over-engineering. |

## Recommended Course Framing
The data shows this course should be framed as **Python data investigation under ambiguity**. The target candidate is not being asked to invent a novel algorithm; they are being asked to open unfamiliar files, inspect shape and types quickly, compute reliable benchmark metrics, explain trade-offs aloud, and avoid silent analytical errors.

A sensible course arc is:
1. ingest messy files,
2. inspect and validate schema,
3. aggregate and compare model/provider metrics,
4. handle missing or duplicate rows safely,
5. format outputs clearly for a human reviewer,
6. narrate decisions while coding.

That is, bluntly, much closer to a compressed take-home analysis task done live than to a competitive-programming round.

## Sources
- Artificial Analysis, "Language Model Benchmarking Methodology" — https://artificialanalysis.ai/methodology
- Artificial Analysis Careers — https://artificialanalysis.ai/careers
- Artificial Analysis, "Senior AI / ML Engineer" — https://artificialanalysis.ai/careers/senior-ai-ml-engineer
- Artificial Analysis, "Solutions Engineer — Language Models" — https://artificialanalysis.ai/careers/solutions-engineer-language-models
- Real Python, "Python Practice Problems: Parsing CSV Files" — https://realpython.com/python-interview-problem-parsing-csv-files/
- StrataScratch, "Python Pandas Interview Questions for Data Science" — https://www.stratascratch.com/blog/python-pandas-interview-questions-for-data-science
- pandas docs, `read_csv` — https://pandas.pydata.org/docs/reference/api/pandas.read_csv.html
- pandas docs, `DataFrame.groupby` — https://pandas.pydata.org/docs/reference/api/pandas.DataFrame.groupby.html
- pandas docs, `DataFrame.duplicated` — https://pandas.pydata.org/docs/reference/api/pandas.DataFrame.duplicated.html
- pandas docs, `to_datetime` — https://pandas.pydata.org/docs/reference/api/pandas.to_datetime.html
- pandas docs, `DataFrame.median` — https://pandas.pydata.org/docs/reference/api/pandas.DataFrame.median.html
- pandas docs, `merge` — https://pandas.pydata.org/docs/reference/api/pandas.merge.html
- Brief from Loki on confirmed interview format, 2026-04-18
