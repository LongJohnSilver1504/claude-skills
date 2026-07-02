---
name: writing-skills
description: Use when creating new skills, editing existing skills, or verifying skills work before deployment
---

# Writing Skills

## Overview

A skill is a reference guide that teaches future Claude instances a reusable technique, pattern, or workflow — not a narrative about how you solved a problem once. Keep SKILL.md lean, write the description for discovery, and verify the skill actually changes behavior before trusting it.

**Canonical methodology:** [references/anthropic-best-practices.md](references/anthropic-best-practices.md) — Anthropic's full skill-authoring guide (conciseness, progressive disclosure, workflows, scripts, evaluation). Read it when authoring anything non-trivial.

## Writing the Description (Most Important Part)

Claude reads only the frontmatter `description` when deciding whether to load a skill. It must answer: "Should I read this skill right now?"

**Rule: the description states WHEN to use the skill — triggers, symptoms, situations. It NEVER summarizes the skill's workflow.**

Why: when a description summarizes the process, Claude tends to follow the summary and skip the skill body entirely. A description saying "code review between tasks" caused Claude to run ONE review even though the skill required two; rewriting the description to triggers-only ("Use when executing implementation plans with independent tasks") made Claude read the body and follow both reviews.

```yaml
# ❌ Summarizes workflow — Claude may follow this instead of reading the skill
description: Use when executing plans - dispatches subagent per task with code review between tasks

# ❌ Too abstract, no trigger
description: For async testing

# ✅ Triggering conditions only
description: Use when executing implementation plans with independent tasks in the current session

# ✅ Symptoms, not process
description: Use when tests have race conditions, timing dependencies, or pass/fail inconsistently
```

Guidelines:

- Start with "Use when..." and list concrete triggers, symptoms, and situations
- Write in third person (it is injected into the system prompt)
- Describe the *problem* (race conditions, flaky tests), not language-specific symptoms — unless the skill is technology-specific, in which case name the technology explicitly
- Include keywords Claude would search for: error messages, tool names, synonyms

## Structure Checklist

- [ ] Frontmatter has `name` (letters, numbers, hyphens only) and `description` (max 1024 chars)
- [ ] SKILL.md stays lean — well under 500 lines; move depth to `references/` files loaded on demand
- [ ] One canonical copy of any shared reference — never duplicate guidance across skills; cross-reference by skill name instead
- [ ] One excellent code example beats many mediocre ones in multiple languages
- [ ] No `@` force-load links to other files (they consume context immediately); use plain paths or skill names

## Test Before Trusting

For any meaningful new skill (or meaningful edit), verify it works before deploying:

1. Run one subagent with a realistic prompt that should trigger the skill
2. Check the outcome against what an agent does without the skill
3. Confirm the skill actually changed behavior — the agent found it, read it, and followed it

If the agent ignored or misapplied the skill, fix the description or the ambiguous section and re-run. Trivial edits (typos, link fixes) don't need this.

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Description summarizes the workflow | Rewrite to triggers/symptoms only |
| Everything inline in SKILL.md | Move heavy reference material to `references/` |
| Same guidance pasted into multiple skills | Keep one canonical copy, cross-reference it |
| Narrative "how I solved it once" storytelling | Distill into a reusable technique |
| Deployed without testing | Run one subagent check first |
