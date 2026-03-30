---
name: feature-retrospective
description: Observe the feature pipeline and run a retrospective at the end. Silently logs requirements, detects patterns (scattered requirements, contradictions, scope creep), tracks problems by root cause, and facilitates a retro discussion that improves skills for future runs. Use when user says "observe", "start tracking", "retro on", "what went wrong", "retrospective", or "watch this feature".
---

# Pipeline Observer & Retrospective

Silently observe the feature pipeline. Log requirements and problems as they happen. At the end, facilitate a retrospective that turns observations into skill improvements.

## How It Works

1. **Start**: Create observation log when pipeline begins
2. **Observe**: After each pipeline step, log requirements and problems silently
3. **Retro**: When pipeline ends, analyze patterns and discuss with user
4. **Improve**: Apply fixes to skills based on recurring problems

## When Observation Happens

Claude doesn't run two skills simultaneously. Observation happens at **transition points** — when `feature-flow` moves between steps. After each skill completes, read its output artifacts and log observations before the next step begins.

## Phase 1: Start Observation

Create `.claude/pipeline/{feature}/OBSERVATION-LOG.md`:

```markdown
# Observation Log: {Feature Name}
**Started**: {date}
**Status**: In Progress

## Watch List (from previous runs)
{Read from memory — see references/memory-protocol.md}

## Requirements Log
{Append entries as pipeline progresses}

## Problems
{Append entries as pipeline progresses}
```

Before creating, check memory files for watch list items from previous runs. See [references/memory-protocol.md](references/memory-protocol.md) for the memory protocol.

## Phase 2: Active Observation

After each pipeline step completes, append to the observation log.

### Log Requirements

Every time the user states a requirement (explicit or implicit), log it with:
- Short description
- Which pipeline stage it appeared in
- Type: **Explicit** (user directly states it), **Implicit** (user assumes it), **Correction** (user corrects output), **Clarification** (user fills a gap when asked)
- Related requirement numbers if refining an earlier one

### Detect Patterns

Watch for these and flag when detected:

| Pattern | Signal | Action |
|---------|--------|--------|
| Scattered requirements | Same topic mentioned 3+ times across stages | Flag for unification |
| Contradictions | Requirement A conflicts with requirement B | Flag for resolution |
| Late additions | New requirement appears during implementation | Flag as pipeline escape |
| Repeated corrections | Same type of mistake corrected 2+ times | Flag as skill issue |
| Scope creep | Requirements grow significantly from PRD to implementation | Flag for discussion |
| Implicit assumptions | User expects behavior never documented | Flag as clarifier gap |

### Log Problems

When something goes wrong (rework, confusion, wrong output), log with:
- Title and description
- Pipeline stage where it happened
- Category code (see [references/problem-categories.md](references/problem-categories.md))
- Severity: Low / Medium / High / Critical
- Impact: did it cause rework, delay, confusion?
- Quick fix applied (if any)

### Observation Rules

- **Don't interrupt the pipeline** to log — append silently
- **Don't ask retro questions mid-pipeline** — save for Phase 3
- **Do flag critical contradictions immediately** — "I noticed X contradicts Y, resolve now or continue?"
- **Don't log non-issues** — only log things that caused or could cause rework

## Phase 3: Retrospective

When the pipeline ends (or user triggers with "retro", "retrospective", "what went wrong"):

### Step 1: Analyze

Before talking to the user, analyze the log for:
- Which stage generated the most requirements?
- How often did the user correct pipeline output?
- Which requirements were scattered across stages?
- Which problem category dominates?
- How many requirements appeared after the PRD? (pipeline escape rate)
- For each problem, trace back to the earliest stage where it could have been caught

Rate the run:
- **Green**: 0-1 problems, no pipeline escapes, minimal corrections
- **Yellow**: 2-4 problems, <20% escape rate, some corrections
- **Red**: 5+ problems, >20% escape rate, significant rework

### Step 2: Present Summary

| Metric | Value |
|--------|-------|
| Total requirements logged | {n} |
| Requirements added after PRD | {n} ({%}) |
| Corrections made | {n} |
| Problems encountered | {n} |
| Session quality | {Green/Yellow/Red} |
| Top issue category | {category} ({count}) |

### Step 3: Discuss

Walk through key findings with the user. Focus on:

1. **Scattered requirements** — "You mentioned {topic} in {N} stages. Should this become a standard clarifier question?"
2. **Repeated corrections** — "You corrected {type} {N} times. The {skill} skill might need updating."
3. **Late additions** — "These {N} requirements appeared after the PRD. Should the clarifier ask about {topic}?"
4. **Problems** — confirm category and severity for each

Ask: "Which friction points do you want to address? I'll generate specific skill improvements."

### Step 4: Generate RETRO.md

Save to `.claude/pipeline/{feature}/RETRO.md` with:
- Summary metrics (from Step 2)
- Each issue with: category, severity, stage, what happened, root cause, specific fix, target skill/file
- Patterns observed
- Prioritized recommendations
- Skill improvement candidates

### Step 5: Apply the Watch-Then-Fix Protocol

This is the key mechanism that prevents over-reacting to one-off problems:

| Occurrence | Action |
|------------|--------|
| **1st time** | Add to memory watch list. Do NOT change skills yet. Tell user: "Logged to watch list. If this recurs, I'll propose a fix." |
| **2nd time** | Flag as recurring. Propose a concrete skill change. Ask user to approve. |
| **3rd+ time** | Flag as chronic. Present the fix as a strong recommendation. "This has happened in {N} runs. Applying the fix unless you object." |

See [references/memory-protocol.md](references/memory-protocol.md) for the full memory update protocol.

### Step 6: Update Global Tracker

Append a summary line to `src/new-app/RETRO.md`:

```markdown
| Date | Feature | Requirements | Escapes | Problems | Top Category | Key Fix |
```

## Problem Categories

See [references/problem-categories.md](references/problem-categories.md) for the full taxonomy. Quick reference:

| Code | Category | Fix Target |
|------|----------|------------|
| `PRD` | PRD Gap | generate-prd template |
| `CLAR` | Clarifier Miss | prd-clarifier questions |
| `UX` | UX Spec Gap | prd-to-ux pass checklist |
| `PROMPT` | Prompt Gap | ux-to-prompt template |
| `PLAN` | Plan Gap | plan-implementation |
| `SCAFFOLD` | Scaffold Gap | create-feature |
| `SKILL` | Skill Missing | create new skill |
| `SBUG` | Skill Bug | the broken skill |
| `USER` | User Input | better clarifier questions |
| `EXT` | External | document workaround |
| `PROC` | Process | feature-flow |

## Anti-Patterns

- Don't interrupt the pipeline for retro questions — observe silently, discuss at the end
- Don't blame the user — classify as USER but focus the fix on better clarifier questions
- Don't suggest changes for one-off problems — only for patterns (use watch-then-fix)
- Don't skip the discussion — the retro conversation is where real insights emerge
- Don't write a retro for trivial features — if zero issues, just note "clean run" in the global tracker
