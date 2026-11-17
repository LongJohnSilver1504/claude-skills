# Evals — claude-skills

Two suites, two questions.

| Suite | Cases | Question | Graders |
| --- | --- | --- | --- |
| **Routing** | `pipeline-*` | Does the skill the description promised fire, and not its competitor? | `tool_used` only — deterministic |
| **Outcome** | `outcome-*` | Given a small real workspace, is what the run produced right? | `file_exists`, `regex` on the produced file, `tool_used`, and an `llm` rubric only where nothing else can decide |

[FAILURES.md](FAILURES.md) is the ledger behind the outcome suite: every failure seen in real use, and the exam that covers it — or the honest note that none does yet.

## Routing

What it gates: **the skill that fires is the skill the description promised.** Invariant 4 says every competing skill carries a `NOT for <competitor>` clause; nothing checked that the clause changed any behaviour. These cases do, mechanically, on every skill that has one.

One case per skill with a `NOT for` clause, plus tier cases (`pipeline-12`, `pipeline-13`) asserting that small work and already-understood work do not start the spec chain. Each is a realistic user request in the phrasing this repo actually gets, with two deterministic graders:

| Grader | Type | Asserts |
| --- | --- | --- |
| `fires-<skill>.md` | `tool_used` · `min: 1` | the owning skill was invoked |
| `not-<competitor>.md` | `tool_used` · `min: 0, max: 0` | the skill it names in `NOT for` was not |

Both graders are deterministic — no LLM judge, no scored prose. A case passes or it does not.

## Outcome

Each case is a directory with a `fixture.sh` that builds the smallest workspace showing a real problem, a prompt in the user's phrasing, and graders on what the run left behind. The first six come from the failure ledger:

| Case | Examines | Key grader |
| --- | --- | --- |
| `outcome-01-direct-plan` | `plan-implementation` direct mode | the request survives verbatim; no `Must not` the request never stated |
| `outcome-02-fix-ticket-diagnosis` | `fix-ticket` on a seeded bug | cause as `file:line`, the six-line rubric, and **no edit to the buggy file before approval** |
| `outcome-03-feature-map` | `feature-map` | the lock exists (so `lock` accepted the map) and every directory is named |
| `outcome-04-quality-reviewer-control` | the `quality-reviewer` agent | the seeded violation is found **and the clean file is not flagged** |
| `outcome-05-spec-reviewer-must-not` | the `spec-reviewer` agent | a violated `Must not` is reported VIOLATED and the status is FAIL |
| `outcome-06-guardrails-self-test` | `project-guardrails` | the generated config is fitted to the project and its own `test` was run |

Cases tagged `holdout` are never read when a skill is being tuned — they are there so a skill cannot be fitted to the cases that judge it. The repository's `exam-coordinator` skill (`.claude/skills/`, maintainer-only) runs the suites, records the result in `docs/baselines/`, and reviews failures without opening the holdouts.

What these cases cannot see: anything that needs a browser, a live connector, or the user's own settings — an eval run loads only this plugin, in a sandbox.

## Run it

```bash
npm run eval                                  # routing: all pipeline cases
npm run eval -- --case 'pipeline-0[1-4]-*'    # a subset
npm run eval:outcome                          # outcome: all cases, 2 runs each, capped at 10 USD
npm run eval:outcome -- --case 'outcome-02-*' --runs 1   # one case, one run — a look, not a baseline
```

Runs are child `claude` sessions on the credential you are logged in with; no API key is needed. `eval:outcome` passes `--scaffold` (it runs each case's `fixture.sh` as you — only on cases this repo wrote) and grants `Write`, `Edit` and `Bash`, which puts every shell command of the run under the OS sandbox.

`npm run eval` filters on `--case 'pipeline-*'` on purpose: the root target also scans `design-craft/evals/`, and those cases belong to the other plugin. design-craft's own suite runs from `design-craft/` (see `design-craft/evals/README.md`).

Measured on 2026-11-17 (CLI 2.1.322), as the run reported it: routing, 17 cases at one run each — **2.22 USD**, under a minute at `-j 4`; outcome, 6 cases at two runs each — **4.29 USD**, about four minutes at `-j 3`. On a subscription login that figure is usage against the plan, not an API invoice. Routing cases are `runs: 1`, `max_turns: 4`, `allowed_tools: [Skill]`, with an `append_system_prompt` that stops the agent once it has routed — routing is all they measure, so paying for the work afterwards would buy nothing.

## What a failure means

A red case is one of three things, in order of likelihood:

1. **A description drifted.** Someone edited a `description:` and the trigger or the `NOT for` clause no longer separates the two skills. Fix the description.
2. **The case is wrong.** The request genuinely belongs to the other skill, or reasonably routes to either. Fix the case — but say why in the commit, because a case softened until it always passes is a vanity metric.
3. **A real routing bug** that predates the edit and the suite only now has a case for it.

## Honest limits

**Routing is a regression gate, not a discovery tool.** Every routing case passed the first time it ran, which is what you would expect: they were written from the descriptions that already exist. Their value is the next edit — a `NOT for` clause deleted, a trigger widened, a new skill whose description swallows an old one's requests.

**Outcome exams measure a fixture, not the field.** Six small workspaces say whether a skill still does the specific thing a real failure taught it to do. They do not say the skill is good on a real repository — the trial runs on real projects found problems none of these fixtures would. Three failures in the ledger have no exam at all.

**Two runs cannot tell a regression from noise.** A case that drops from 1.0 to 0.5 is a reason to re-run it with `--runs 5`, not a finding.

**A grader can be the thing that is wrong.** The first full pass failed `outcome-02` twice out of three: the diagnoses were correct, in Spanish, and the grader looked for English headings. Read the transcript before believing a red case — and write graders on structure, not on labels the model will translate.

Adding a skill with a `NOT for` clause adds a routing case here — `node scripts/validate-skills.mjs` fails until it does. A failure seen in real use adds a row to [FAILURES.md](FAILURES.md), with its exam.
