# Routing evals — design-craft

What this suite gates: **the skill that fires is the skill the description promised.** Invariant 6 requires a `NOT for <competitor>` clause on every model-invoked skill; invariant 2 says each reference skill owns its domain and nobody restates it. Both were prose until now. These cases check them mechanically.

The boundaries here are tighter than the pipeline's — a request about a button that vanishes in dark mode could plausibly reach `color-system`, `accessibility` or `design-review`, and the descriptions are the only thing that decides. One case per skill with a `NOT for` clause, two deterministic graders each:

| Grader | Type | Asserts |
| --- | --- | --- |
| `fires-<skill>.md` | `tool_used` · `min: 1` | the owning skill was invoked |
| `not-<competitor>.md` | `tool_used` · `min: 0, max: 0` | the skill it names in `NOT for` was not |

No LLM judge anywhere — a case passes or it does not.

## Run it

```bash
cd design-craft && npm run eval
```

The target is `design-craft`, which scopes the scan to this plugin's own cases and loads this plugin. Running the suite from the repo root instead would score design-craft's cases against the `claude-skills` plugin and report a pass that means nothing.

Twelve cases. Each is `runs: 1`, `max_turns: 4`, `allowed_tools: [Skill]`, with an `append_system_prompt` that stops the agent once it has routed: a full pass is about 15 seconds and $1.50.

## What a failure means

1. **A description drifted** — the trigger or the `NOT for` clause stopped separating the two skills. Fix the description.
2. **The case is wrong** — the request genuinely belongs to the other skill, or routes to either. Fix the case, and say why in the commit; a case softened until it always passes measures nothing.
3. **A real routing bug** the suite only now has a case for.

## Honest limits

A **regression gate, not a discovery tool.** All eleven cases passed on their first run — they were written from descriptions that already work. The value is the next edit to one of those descriptions. It measures routing only, never the quality of the review or the build that follows.

Adding a skill with a `NOT for` clause adds a case here — `node scripts/validate.mjs` fails until it does.
