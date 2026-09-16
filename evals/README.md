# Routing evals — claude-skills

What this suite gates: **the skill that fires is the skill the description promised.** Invariant 4 says every competing skill carries a `NOT for <competitor>` clause; until now nothing checked that the clause changed any behaviour. These cases do, mechanically, on every skill that has one.

One case per skill with a `NOT for` clause. Each is a realistic user request in the phrasing this repo actually gets, with two deterministic graders:

| Grader | Type | Asserts |
| --- | --- | --- |
| `fires-<skill>.md` | `tool_used` · `min: 1` | the owning skill was invoked |
| `not-<competitor>.md` | `tool_used` · `min: 0, max: 0` | the skill it names in `NOT for` was not |

Both graders are deterministic — no LLM judge, no scored prose. A case passes or it does not.

## Run it

```bash
npm run eval                       # all pipeline cases
npm run eval -- --case 'pipeline-0[1-4]-*'   # a subset
```

`npm run eval` filters on `--case 'pipeline-*'` on purpose: the root target also scans `design-craft/evals/`, and those cases belong to the other plugin. design-craft's own suite runs from `design-craft/` (see `design-craft/evals/README.md`).

Each case is `runs: 1`, `max_turns: 4`, `allowed_tools: [Skill]`, with an `append_system_prompt` that stops the agent once it has routed. That keeps a full pass at roughly 20 seconds and $2–3 — routing is all these cases measure, so paying for the work afterwards would buy nothing.

## What a failure means

A red case is one of three things, in order of likelihood:

1. **A description drifted.** Someone edited a `description:` and the trigger or the `NOT for` clause no longer separates the two skills. Fix the description.
2. **The case is wrong.** The request genuinely belongs to the other skill, or reasonably routes to either. Fix the case — but say why in the commit, because a case softened until it always passes is a vanity metric.
3. **A real routing bug** that predates the edit and the suite only now has a case for it.

## Honest limits

This is a **regression gate, not a discovery tool.** Every case passed the first time it ran, which is what you would expect: they were written from the descriptions that already exist. Their value is the next edit — a `NOT for` clause deleted, a trigger widened, a new skill whose description swallows an old one's requests. The suite catches that on the pull request instead of in a user's session.

It measures routing only. It says nothing about whether a skill, once fired, does good work.

Adding a skill with a `NOT for` clause adds a case here — `node scripts/validate-skills.mjs` fails until it does.
