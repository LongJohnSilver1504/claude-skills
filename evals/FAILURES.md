# Failure ledger

Every failure seen in real use, and the exam that now covers it. **A new failure enters here with its exam, in the same change as its fix** — a fix with no exam is a fix nobody will notice regressing.

A failure belongs here when a skill or agent did the wrong thing in a real session (or in a trial run on a real project). A typo or a one-off does not.

| # | Seen | What happened | Root cause | Fix | Exam |
|---|------|---------------|------------|-----|------|
| F1 | 2026-11-02, a full pipeline run | The run reported success — green build, every test passing — and the feature did not load in the browser | Every reviewer reads code; nothing ran the app. The smoke-walk lived in `finish-feature`, which the run never reached | `execute-tasks` Runtime Verification step | **not covered** — needs a browser inside the eval sandbox |
| F2 | 2026-11-02, same run | The per-deliverable design audit never ran | `quality-reviewer` was told to invoke a skill and has no Skill tool | The agent preloads the skill | **not covered** — needs a visual component fixture; `outcome-04` covers the reviewer's convention path only |
| F3 | 2026-11-02, same run | `prd-to-ux` stopped on rule files the project never seeded | The skill assumed three seed rules exist | Checks which exist; derives from code when absent | **not covered** — a nine-pass run is too costly for the default suite |
| F4 | 2026-10, two sessions | `refactoring-ui` fired on a marketing site and on a Figma-reading task | Description had no `NOT for` | `NOT for` clause | `pipeline-11-refactoring-ui` (routing) |
| F5 | 2026-10/11, ~29 dispatches | Mid-sized work skipped the pipeline entirely: implementers dispatched with no plan and no review gates | The only planning path required a PRD and a UX spec | `plan-implementation` direct mode | `pipeline-12`, `pipeline-13` (routing) · `outcome-01-direct-plan` |
| F6 | 2026-11-12, trial run | A direct-mode plan invented `Must not` rows the request never stated | The format asked for a `Must not` per spec with no source | Filled only when the request states or implies one | `outcome-01-direct-plan` (`no-invented-must-not`) |
| F7 | 2026-11-12, audit | A PRD's `Must not` never reached the spec-reviewer | The reviewer only receives the deliverable spec | `Covers` + `Must not` copied into every deliverable; matrix by id | `outcome-05-spec-reviewer-must-not` |
| F8 | 2026-10/11, ten bug sessions | Bugs arrived as ticket ids and the agent improvised the intake; confidence was a bare number | No skill covered tickets, outside evidence or the backend | `fix-ticket` | `pipeline-14`, `pipeline-15` (routing) · `outcome-02-fix-ticket-diagnosis` |
| F9 | 2026-11-17, trial on a real ticket | The confidence rubric gave 60 or 75 for the same evidence | "Not reproduced" cap contradicted the "recording shows it" tier | Two caps: 60 with no recording, 75 with one | **not covered** — needs a recording fixture |
| F10 | 2026-11-17, trial on a real app | The feature map skill gave no way to find a legacy area, and `lock` demanded a row for a non-feature directory | Instructions assumed every directory under the features root is a feature | Count where the router's imports resolve; Shared table | `outcome-03-feature-map` (the fixture has a `shared` directory) |
| F11 | 2026-11-17, trial on a real API | The guardrail catalog had no rule for scripts that act on live systems, and several rules had no starting pattern | Catalog written before it met a real repository | `ask-live-scripts`, starting patterns, whole-ref branch matching | `outcome-06-guardrails-self-test` |
| F12 | 2026-11-12, audit | `test-reviewer` reported without TRIVIAL/ARCHITECTURAL tags that triage keys on | Invariant 8 listed the contract; the validator only checked the tool list | Tags added; validator enforces the contract | `scripts/validate-skills.mjs` (not an eval — deterministic) |

| F13 | 2026-11-17, first full exam pass | `outcome-02` failed two runs of three on correct diagnoses | The run answers in the user's language; two graders matched English headings | Graders match the rubric's structure (`n/30`, `n/25`…) and accept either language | `outcome-02-fix-ticket-diagnosis` itself — a grader defect, recorded so the pattern is not repeated |

## Reading it

- **Covered by an outcome exam** means a regression shows up as a failing case, not as a bad week.
- **Routing only** means the right skill fires; nothing checks that it then does the right thing.
- **Not covered** is honest debt. Each one says what an exam would need.
