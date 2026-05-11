# Working Principles

> **Scope:** Project-wide. Behavioral guardrails for every task — applies before any other rule kicks in.
>
> **Origin:** Distilled from Karpathy's coding guidelines, trimmed to additive parts not already covered by the system prompt or other rules.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

- State assumptions explicitly. If uncertain, ask before implementing.
- If multiple interpretations exist, present them — don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

This applies even when the user says "just do it" — if a choice has real tradeoffs (perf vs. simplicity, scope vs. correctness), name them in one line before acting.

## 2. Surgical Changes — The Trace Test

**Every changed line must trace directly to the user's request.**

- Don't "improve" adjacent code, comments, or formatting.
- Match existing style, even if you'd write it differently.
- If you notice unrelated dead code or smells, *mention* them — don't delete or refactor.
- Clean up orphans **your** changes created (unused imports, vars). Don't touch pre-existing dead code.

If a changed line can't be traced to the ask, revert it.

## 3. Goal-Driven Execution (Small Tasks)

**For tasks that don't go through the full pipeline (brainstorm → PRD → plan), define success criteria upfront.**

Transform vague tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test reproducing it, then make it pass"
- "Refactor X" → "Tests pass before and after, no behavior change"

For multi-step tasks, state a brief plan with verification checks per step:

```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") force constant clarification.

## Related Rules

- [verification-before-completion.md](verification-before-completion.md) — How to verify *after* implementation (this rule covers *upfront* criteria)
- [project-structure.md](project-structure.md) — Where new code lives
