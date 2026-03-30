---
name: learn-from-session
description: Capture reusable patterns, conventions, and decisions from the current session into auto-memory. Use when the user says "learn this", "remember this pattern", "save what we learned", or at the end of a productive session where new conventions were established.
---

# Learn From Session

## Overview

Analyze the current conversation to extract stable patterns, conventions, and decisions worth remembering across sessions. Write them to the auto-memory system so future sessions benefit from past experience.

## When to Use

- User says "learn this", "save what we learned", "remember this"
- At the end of a session where new conventions were established
- After a retrospective that produced skill improvements
- When the user corrects the same type of mistake — capture the correction

## Process

### Step 1: Scan the Session

Review the conversation for:

1. **Corrections** — things the user corrected you on (these are highest priority)
2. **New conventions** — patterns the user established or approved
3. **Tool/framework discoveries** — things that work differently than expected
4. **Project structure decisions** — where files go, naming conventions
5. **User preferences** — how they like things done (commit style, code style, communication)

### Step 2: Classify Each Finding

| Category | Where to Store | Example |
|----------|---------------|---------|
| Project convention | `MEMORY.md` (concise) | "shadcn components install to `src/new-app/ui/`" |
| Tool quirk | `MEMORY.md` or topic file | "axios v0.21 has no named `isAxiosError` export" |
| Debugging insight | `debugging.md` | "Embla inside Dialog needs `min-w-0` on flex children" |
| User workflow preference | `MEMORY.md` | "Skill transitions use AskUserQuestion, not typed numbers" |
| Architectural decision | `MEMORY.md` | "Custom UI lives in `ui/custom/`, not `shared/layouts/`" |

### Step 3: Check for Duplicates

Before writing, read the existing memory files:

1. Read `MEMORY.md` — check if the finding is already documented
2. Read relevant topic files if they exist — avoid duplicating
3. If a finding **updates** an existing entry, edit it rather than adding a new one
4. If a finding **contradicts** an existing entry, update or remove the old one

### Step 4: Write to Memory

**Rules:**
- `MEMORY.md` stays under 200 lines (truncated after that)
- Use concise bullet points, not paragraphs
- Group by topic with `##` headers
- Create topic files (e.g., `debugging.md`, `patterns.md`) for detailed notes
- Link topic files from `MEMORY.md` when relevant

**Format:**
```markdown
## {Topic Header}
- {Concise finding} — {context if needed}
```

### Step 5: Present Summary

Use `AskUserQuestion` to confirm the findings before saving:

Show what will be added/updated/removed, then ask if the user wants to proceed.

## What NOT to Save

- Session-specific context (current task details, in-progress work)
- Information that might be incomplete — verify against project docs first
- Anything that duplicates CLAUDE.md or rule files
- Speculative conclusions from reading a single file
- One-time fixes that won't recur

## Anti-Patterns

- **Don't dump everything** — only save patterns confirmed by user behavior or explicit approval
- **Don't save implementation details** — save conventions, not "we added a function called X"
- **Don't create topic files prematurely** — only when MEMORY.md would exceed its limit or a topic has 5+ entries
- **Don't save what rules already cover** — if it's in `.claude/rules/`, don't duplicate in memory

## Context Management

After completing this skill's work, report the **context usage percentage** so the user can decide whether to clean context:

> "{Skill output summary}. Context usage: **{X}%**"

Do NOT recommend cleaning context — just show the percentage. The user will decide.
