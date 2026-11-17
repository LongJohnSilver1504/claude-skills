# Working Principles

> **Scope:** Project-wide. Behavioral guardrails for every task — applies before any other rule kicks in.
>
> **Origin:** Distilled from Karpathy's coding guidelines, trimmed to additive parts not already covered by the system prompt or other rules.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

- State assumptions explicitly.
- If multiple interpretations exist and the choice has real tradeoffs, ask; otherwise pick the one the code or artifacts support, say which, and keep going — never pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- Facts are yours to find: read the code, run the command, check the docs before asking. A question the codebase answers costs the user a round-trip for nothing.

**When to keep going vs. stop.** When a step doesn't need the user, keep going and put the status note in the same message as the next action. Stop and ask only when you can't continue without them — a decision with real tradeoffs, an ambiguity the code can't settle — or before anything destructive, outside this repository, or not asked for (deleting data, force-pushing, touching shared config, a commit or push the user didn't request). Ask-points a skill defines on purpose — brainstorm and prd-clarifier questions, finish-feature's commit choice — are not unclear details; keep them. Stopping on every unclear detail turns a long run into a chat; not stopping on a real decision builds the wrong thing.

Even when the user says "just do it", name a real tradeoff (perf vs. simplicity, scope vs. correctness) in one line, then act — "just do it" is the user answering in advance.

## 2. Surgical Changes — The Trace Test

**Every changed line must trace directly to the user's request.**

- Don't "improve" adjacent code, comments, or formatting.
- Match existing style, even if you'd write it differently.
- If you notice unrelated dead code or smells, *mention* them — don't delete or refactor.
- Clean up orphans **your** changes created (unused imports, vars). Don't touch pre-existing dead code.

If a changed line can't be traced to the ask, revert it.

## 3. Size the Work, Then Define Done

**Classify every change request before starting, and say the tier in one line so the user can override it.** Ceremony follows understanding, risk and resumability — never the number of files, commands or tests.

<!-- tier-table:start -->
| Tier | Understanding | Resume test | Entry point |
|------|---------------|-------------|-------------|
| **Bug** | Behavior is wrong; the spec is not | — | `/systematic-debugging` (failing test first, then the fix). No pipeline. |
| **Small** | After reading the code you can state the change and the check that proves it | **Passes** — if the session stopped now, someone could finish from the original request and `git diff` alone | Inline, with the verifiable goals below; `/modify-feature` to extend or restructure a shipped feature. No plan document, no subagents. |
| **Standard** | The what is clear; there is one real choice or one new contract (endpoint, screen, shared piece) | **Fails** — more than one session, separate deliverables, or requirements too long to survive compaction | `/plan-implementation` in direct mode (one document — the request verbatim, numbered specs, deliverables) → `/execute-tasks` → `/finish-feature`. New screens or open product decisions: `/generate-prd → /prd-to-ux` first. |
| **Large** | Several open questions, cross-feature or shared infrastructure, a new external dependency, a public API, a contract nobody can verify yet | Fails | `/brainstorm`, then the full pipeline. |

Risk raises the tier, size does not: anything touching auth, user input, external HTML or URLs, token or PII storage, env access, irreversible data effects personal data leaving the system, or a contract other code depends on is **at least Standard** — the review gates are where `frontend-security.md` runs. A change with no test that would catch its regression gets that test first, at any tier.
<!-- tier-table:end -->

Questions, reviews and proposals are not change requests: they stay read-only until the user asks for a change.

### Small tier — verifiable goals

Work that skips the plan still defines success upfront. Transform vague tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test reproducing it, then make it pass"
- "Refactor X" → "Tests pass before and after, no behavior change"

For multi-step tasks, state a brief plan with verification checks per step:

```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") force constant clarification. If the work stops passing the resume test midway, say so and move it to Standard — write the plan before going further, not after.

## Related Rules

- [verification-before-completion.md](verification-before-completion.md) — How to verify *after* implementation (this rule covers *upfront* criteria)
- [project-structure.md](project-structure.md) — Where new code lives
