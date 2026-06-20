# Challenge Schema Compatibility Matrix

Issue: [#16](https://github.com/nissan/redditech-academy/issues/16)

This document records the challenge formats that the academy currently renders
and validates. It is intentionally descriptive, not a schema migration plan:
judge, tutor, route, and renderer behavior should not change in documentation
PRs.

## Source Of Truth

Challenge wiring currently spans these files:

| Surface | File | What it owns |
| --- | --- | --- |
| Interactive MDX frontmatter | `content/courses/*/modules/*/lessons/*.mdx` | Chooses the renderer with `environment` and links the JSON file with `challengeId` or legacy `challengeid`. |
| Challenge JSON | `content/courses/*/challenges/*.json` | Stores task copy, validation hints, renderer defaults, and judge criteria. |
| Shared TypeScript shape | `lib/challenge-types.ts` | Defines the canonical `ChallengeSpec` and `ChallengeValidation` shape used by the interactive page. |
| Interactive route | `app/courses/[courseSlug]/learn/[moduleSlug]/[lessonSlug]/interactive/page.tsx` | Loads the lesson, accepts `challengeId` and legacy `challengeid`, defaults missing `environment` to `json-editor`, and loads the challenge from the same course folder. |
| Interactive renderer | `app/courses/[courseSlug]/learn/[moduleSlug]/[lessonSlug]/interactive/interactive-lesson-client.tsx` | Selects the environment component and posts normalized `userInput` to `/api/judge`. |
| Judge API | `app/api/judge/route.ts` | Loads challenges by `challengeId` across courses, deterministic-grades only sequence challenges with `prefilled.correctOrder`, and sends all other submissions to the configured judge LLM. |
| Tutor API | `app/api/tutor/route.ts` | Conversational Python tutor. It can receive optional challenge context but does not load or validate challenge JSON. |
| Content validation tests | `tests/content-validation.test.ts` | Guards parseability, IDs, environment names, MDX cross-references, selected sequence/json-editor fields, and known legacy allowances. |
| Sequence judge tests | `tests/judge-sequence.test.ts` | Guards the extracted deterministic sequence scoring behavior. |

## Current Inventory Snapshot

As of `origin/main` at `c84c210`, the repository has 299 challenge JSON files:

| Course | Total | Top-level `json-editor` | Top-level `sequence-completer` | Missing top-level `type` | Legacy `starterCode` + `validationRules` | `prefilled.template` | `prefilled.correctOrder` |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `auth-training` | 63 | 54 | 0 | 9 | 54 | 2 | 2 |
| `churn-modeling-academy` | 7 | 7 | 0 | 0 | 7 | 0 | 0 |
| `genai-ml-academy` | 46 | 34 | 12 | 0 | 35 | 9 | 12 |
| `llm-benchmarking-academy` | 15 | 9 | 3 | 3 | 11 | 3 | 4 |
| `martech-adtech-academy` | 11 | 11 | 0 | 0 | 11 | 0 | 0 |
| `openclaw-academy` | 46 | 35 | 11 | 0 | 46 | 0 | 11 |
| `python-interview-prep` | 17 | 17 | 0 | 0 | 0 | 17 | 0 |
| `sales-spin-meddic` | 14 | 14 | 0 | 0 | 14 | 0 | 0 |
| `solana-academy` | 80 | 3 | 2 | 75 | 3 | 75 | 3 |
| **Total** | **299** | **184** | **28** | **87** | **181** | **106** | **32** |

The `prefilled.correctOrder` count is higher than the top-level
`sequence-completer` count because some legacy challenges omit `type` while
still carrying sequence data and relying on MDX `environment`.

## Compatibility Matrix

| Field or shape | Required for new content? | Rendered by | Posted to judge as | Validator/test coverage | Notes |
| --- | --- | --- | --- | --- | --- |
| JSON filename | Yes | Interactive route | N/A | Must match `id` exactly. | File path must be `content/courses/<course>/challenges/<id>.json`. |
| `id` | Yes | Interactive route, judge route, tutor context | `challengeId` in request body | Required on every challenge and must match filename. | Judge lookup searches every course by filename. Avoid duplicate IDs across courses. |
| `type` | Yes for new content | Consistency tests only | N/A | If present, must match MDX `environment`. | Legacy no-type JSON is allowed today. New JSON should include the renderer type. |
| `spec` | Yes for new content | Shown in the "Your Task" panel and sent to judge | N/A | Required unless legacy `title` + `description` exists. | Legacy challenges with only `title` + `description` can pass tests but render no task copy because the client reads `challenge.spec`. |
| `title` + `description` | Legacy only | Not used by current interactive task panel | N/A | Accepted as a legacy substitute for missing `spec`. | Do not use for new challenges except when preserving old content. |
| `validation` | Yes for new content | Not rendered directly | Included in judge prompt for non-sequence challenges | Required unless legacy `validationRules` exists. | Currently interpreted by the LLM judge for non-sequence challenges, not by deterministic code. |
| `validation.must_have[].field` | Recommended | Not rendered directly | Included in judge prompt | Shape is typed but semantics are LLM-evaluated. | Use stable field names that match the submitted JSON/body shape. |
| `validation.must_have[].value` | Optional | Not rendered directly | Included in judge prompt | Shape is typed but semantics are LLM-evaluated. | Useful for exact required values. |
| `validation.must_have[].present` | Optional | Not rendered directly | Included in judge prompt | Shape is typed but semantics are LLM-evaluated. | Use for presence checks. |
| `validation.must_have[].non_empty` | Optional | Not rendered directly | Included in judge prompt | Shape is typed but semantics are LLM-evaluated. | Use for required non-empty fields. |
| `validation.must_have[].must_contain` | Optional | Not rendered directly | Included in judge prompt | Shape is typed but semantics are LLM-evaluated. | Use array values for required phrases/items. |
| `validation.must_have[].order_independent` | Optional | Not rendered directly | Included in judge prompt | Shape is typed but semantics are LLM-evaluated. | Does not affect deterministic sequence scoring. |
| `validation.must_have[].position` | Optional | Not rendered directly | Included in judge prompt | Shape is typed but semantics are LLM-evaluated. | Use for LLM-judged positional expectations only. |
| `validation.must_have[].step` | Optional | Not rendered directly | Included in judge prompt | Shape is typed but semantics are LLM-evaluated. | Useful for workflow descriptions. |
| `validation.must_have[].finding_present` | Optional | Not rendered directly | Included in judge prompt | Shape is typed but semantics are LLM-evaluated. | Used by audit-style prompts. |
| `validation.must_have[].acceptable_descriptions` | Optional | Not rendered directly | Included in judge prompt | Shape is typed but semantics are LLM-evaluated. | Use to tolerate equivalent prose. |
| `validation.must_not_have[]` | Optional | Not rendered directly | Included in judge prompt | Shape is typed but semantics are LLM-evaluated. | Non-sequence rejection depends on the LLM. Sequence challenges ignore this for scoring. |
| `validation.ordering_tolerance` | Optional | Not rendered directly | Included in judge prompt | Shape is typed but semantics are LLM-evaluated. | Does not change deterministic `correctOrder` behavior. |
| `validationRules` | Legacy only | Not rendered directly | Not used as judge criteria by the current route when `validation` is missing | Accepted as legacy substitute for missing `validation`. | Current deterministic code does not implement these rules, and the LLM prompt reads canonical `validation`. New content should use `validation`. |
| `starterCode` | Legacy only | Not read by the current JSON editor renderer | N/A | Accepted by tests as a legacy substitute for missing `prefilled.template`. | New content should use `prefilled.template`; otherwise the editor can render `{}` even though tests pass. |
| `prefilled.template` | Yes for `json-editor` new content | `JsonEditor` initial text | `userInput.json` string | Must parse as JSON for top-level `type: "json-editor"`. | This is the safest renderer seed. Use `"__FILL_IN__"` values when authors want fill-in prompts. |
| `prefilled.scenario_json` | Legacy/fallback | `JsonEditor` fallback if `prefilled.template` is missing | `userInput.json` string | No direct test coverage found. | Client stringifies it. Prefer `prefilled.template` for new content. |
| `prefilled.steps[]` | Yes for `sequence-completer` | `SequenceCompleter` draggable items | N/A | Required indirectly when `correctOrder` is present; steps need non-empty `id` and `label`. | Step list is shuffled on render. |
| `prefilled.steps[].id` | Yes for `sequence-completer` | Drag/drop item ID | `userInput.order[]` after submit | `correctOrder` may only contain these IDs. | IDs should be stable strings. |
| `prefilled.steps[].label` | Yes for `sequence-completer` | Drag/drop item text and judge feedback labels | N/A | Non-empty label required for sequence challenges. | Labels are displayed to learners. |
| `prefilled.correctOrder[]` | Yes for deterministic sequence grading | Used for locked-state correctness highlights | `gradeSequence` compares against `userInput.order[]` | Length, membership, and duplicates are tested for sequence challenges. | Position-based score; pass threshold is 0.8. |
| `prefilled.method` | Yes for `http-request-builder` when not `GET` | `HttpRequestBuilder` method selector | `userInput.method` | No environment-specific content test found. | Client supports only `GET` and `POST`. Defaults to `GET`. |
| `prefilled.endpoint` | Recommended for `http-request-builder` | Endpoint input | `userInput.endpoint` | No environment-specific content test found. | Defaults to empty string. |
| `prefilled.params` | Optional | Locked query parameter rows | `userInput.params` | No environment-specific content test found. | Values are locked in the UI. |
| `prefilled.body` | Optional | Locked POST body rows | `userInput.body` | No environment-specific content test found. | Values are locked in the UI. |
| `prefilled.headers` | Optional | Locked header rows | `userInput.headers` | No environment-specific content test found. | Values are locked in the UI. |
| `prefilled.jwt` | Recommended for `jwt-inspector` audit mode | JWT textarea initial value | `userInput.token`, decoded `header`, decoded `payload` | No environment-specific content test found. | Audit mode makes the token read-only. |
| `prefilled.mode` | Optional for `jwt-inspector` | Inspector mode | Affects submitted `findings` only in audit mode | No environment-specific content test found. | Supported values are `decode` and `audit`; client defaults to `audit`. |
| `hints[]` | Optional | `HintAccordion`; judge failure response includes hints | Response only, not request | Not required. | Hints are attached by `/api/judge` when `pass` is false. |
| `eli_notes` | Optional | Not rendered directly | Included in judge prompt | Not required. | Useful for model-judged nuance. |
| `environment` in JSON | Optional | Not read by renderer | Included in judge prompt only if present in challenge object | No specific coverage. | The route uses MDX `environment`, not JSON `environment`. |
| `success_text` | Optional | Not currently rendered in interactive client | N/A | Not required. | Present in the shared type but unused by current renderer. |
| `socratic_mode` | Optional | Not rendered directly | Switches judge prompt to 3-strike Socratic mode | Not required. | Separate from `/api/tutor`; this affects `/api/judge` feedback. |
| `max_strikes_before_reveal` | Optional | Not rendered by current client | Loaded by judge type only | Not required. | Present in judge route type but not used in the route logic today. |

## Renderer And Validator Support By Environment

| MDX `environment` | Renderer component | Required challenge fields | Required `prefilled` fields | Client submission shape | Current judge behavior | Deterministic? |
| --- | --- | --- | --- | --- | --- | --- |
| `json-editor` | `JsonEditor` | `id`, `type`, `spec`, `validation`, `prefilled.template` | `template` containing parseable JSON | `{ "json": "<edited JSON string>" }` | Sends `validation`, `spec`, `eli_notes`, environment, and submission to LLM judge. | No |
| `sequence-completer` | `SequenceCompleter` | `id`, `type`, `spec`, `validation`, `prefilled.steps`, `prefilled.correctOrder` | `steps[]`, `correctOrder[]` | `{ "order": ["step-id", "..."] }` | Calculates position score from `correctOrder`, then asks LLM only for feedback text while enforcing score/pass afterward. | Score/pass yes; feedback no |
| `http-request-builder` | `HttpRequestBuilder` | `id`, `type`, `spec`, `validation` | `method`, `endpoint`, `params`, `body`, and `headers` as needed | `{ "method", "endpoint", "params", "body", "headers" }` | Sends submission to LLM judge. | No |
| `jwt-inspector` | `JwtInspector` | `id`, `type`, `spec`, `validation` | `jwt`; optional `mode` | `{ "token", "header", "payload", "findings?" }` | Sends decoded/audit submission to LLM judge. | No |

## Known Legacy Exceptions

- MDX may use lowercase `challengeid`; the interactive page and content tests normalize it to canonical `challengeId`.
- Challenge JSON may omit top-level `type`; this is accepted for legacy content. If `type` exists, tests require it to match MDX `environment`.
- Challenge JSON may use `title` + `description` instead of `spec`; tests accept this, but the current task panel reads only `spec`.
- Challenge JSON may use `validationRules` instead of `validation`; tests accept this, but route-level deterministic validators do not execute those rules and the current LLM judge prompt reads canonical `validation`.
- Challenge JSON may use `starterCode` instead of `prefilled.template`; tests accept this for `json-editor`, but the current renderer reads `prefilled.template` or `prefilled.scenario_json`, not `starterCode`.
- Several Solana challenges omit `type` while using `prefilled.template`; their MDX environment drives rendering.
- Some no-type challenges carry `prefilled.correctOrder`; deterministic judge scoring still works when `correctOrder` exists because `/api/judge` checks the loaded challenge data, not the top-level `type`.
- Python Interview Prep challenges may use `socratic_mode: true`; this changes `/api/judge` feedback behavior and the client also shows `TutorChat` only for the `python-interview-prep` course.

## Adding A New Challenge Safely

1. Add `content/courses/<courseSlug>/challenges/<challengeId>.json`.
2. Set `id` equal to the filename without `.json`.
3. Include top-level `type` matching the intended MDX `environment`.
4. Prefer the canonical fields: `spec`, `validation`, `hints`, and `prefilled`.
5. For `json-editor`, add `prefilled.template` as a valid JSON string. Do not rely on `starterCode` for new content.
6. For `sequence-completer`, add `prefilled.steps[]` with stable `id` and learner-visible `label`, plus `prefilled.correctOrder[]` using exactly those IDs.
7. For `http-request-builder`, seed the exact method, endpoint, locked params/body/headers needed by the exercise.
8. For `jwt-inspector`, seed `prefilled.jwt` and set `prefilled.mode` to `audit` unless the exercise asks the learner to paste a token.
9. Add or update the lesson MDX frontmatter with:

   ```yaml
   type: "interactive"
   environment: "json-editor"
   challengeId: "your-challenge-id"
   missionTitle: "Short mission title"
   estimatedMinutes: 10
   ```

10. Use canonical `challengeId`, not legacy `challengeid`, for new MDX.
11. Avoid editable-looking JSON code blocks in the MDX lesson narrative; place editable templates in `prefilled.template`.
12. Run `pnpm test -- tests/content-validation.test.ts` before opening a content PR.
13. If the challenge uses deterministic sequence scoring, also run `pnpm test -- tests/judge-sequence.test.ts`.
14. Do not expect non-sequence `validation` to be deterministic yet; it is currently prompt context for the LLM judge.

## Provider And Tutor Boundaries

- `/api/judge` can call the configured judge provider for every non-sequence submission.
- Sequence submissions still call the provider for feedback text after deterministic scoring, unless route behavior changes in a future PR.
- `/api/tutor` does not validate challenge JSON. It receives optional context from the Python Interview Prep client and calls the same judge LLM factory for conversational help.
- This compatibility matrix did not add provider calls, tutor calls, or route implementation changes.
