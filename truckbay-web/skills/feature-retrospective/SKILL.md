---
name: feature-retrospective
description: Active observer that runs throughout the entire feature creation pipeline. Logs user requirements, tracks problems in real-time, detects scattered requirements that should be unified, and facilitates a retrospective discussion at the end. Activate at pipeline start with "observe", "start tracking", or "retro on". Runs alongside generate-prd → prd-clarifier → prd-to-ux → ux-to-prompt → plan-implementation → create-infrastructure/create-feature → frontend-testing → generate-feature-doc.
---

# Pipeline Observer

## Overview

An **active observer** that runs alongside the entire feature creation pipeline — from PRD generation through documentation. It silently logs user requirements, tracks problems as they happen, detects patterns in user input (scattered requirements, contradictions, repeated asks), and at the end facilitates a focused retrospective discussion.

Unlike a post-mortem tool, this skill is **always on** during a pipeline run. It produces a living document that grows with each pipeline step.

## When to Activate

- At the start of any feature pipeline run
- When the user says "observe", "start tracking", "retro on", "watch this", "track this feature"
- Automatically when `generate-prd` is invoked (if user has opted in)

## When to Finalize

- After `generate-feature-doc` completes (end of pipeline)
- When the user says "retro", "retrospective", "what went wrong", "wrap up", "end tracking"
- When the user explicitly stops: "stop observing", "retro off"

## The Pipeline Being Observed

```
generate-prd → prd-clarifier → prd-to-ux → ux-to-prompt → plan-implementation → create-infrastructure / create-feature → frontend-testing → generate-feature-doc
```

---

## Phase 1: Initialization (Pipeline Start)

When activated, create the observation log file immediately:

**File location:** Pipeline artifacts directory (outside source code).

| Scope | Location |
|-------|----------|
| All features | `.claude/pipeline/{feature}/OBSERVATION-LOG.md` |

**Initial content:**

```markdown
# Pipeline Observation Log: {Feature Name}

**Started:** {date}
**Pipeline:** generate-prd → prd-clarifier → prd-to-ux → ux-to-prompt → plan-implementation → {create-infrastructure|create-feature} → generate-feature-doc
**Status:** In Progress

---

## Requirements Log

| # | Requirement | Source | Pipeline Stage | Notes |
|---|-------------|--------|---------------|-------|

---

## Observations

{Entries will be appended as the pipeline progresses}
```

---

## Phase 1.5: Resume After Context Cleanup

When Claude detects that context was cleaned mid-pipeline, resume the observer:

### Detection

Check for an existing OBSERVATION-LOG.md with `Status: In Progress`:
1. Look in `.claude/pipeline/` for directories with an `OBSERVATION-LOG.md`
2. If the file exists and status is "In Progress", we're resuming — not starting fresh

### Resume Steps

1. **Read the OBSERVATION-LOG.md** to understand:
   - Which feature is being built
   - Which pipeline stage was last recorded
   - What observations and problems were logged so far
   - Watch list items being tracked
2. **Read DECISIONS.md** in the feature folder (if it exists) for accumulated context
3. **Read the latest pipeline artifact** (PRD, UX-spec, etc.) to understand current state
4. **Append a resume marker** to the observation log:

```markdown
---
## Context Resumed
**Resumed at:** {date/time}
**Last recorded stage:** {stage from log}
**Current stage:** {stage user is now in}
**Context gap:** {estimated messages/time lost}
---
```

5. **Continue observing** — append new entries using the same format as before

### Important

- Do NOT create a new OBSERVATION-LOG.md — append to the existing one
- Do NOT re-initialize the watch list — it's already in the file
- The resume is silent — don't interrupt the user's flow to announce it

---

## Phase 2: Active Observation (During Pipeline)

### What to Log

During each pipeline step, silently observe and append to the `OBSERVATION-LOG.md`:

#### A. User Requirements

Every time the user states a requirement (explicit or implicit), log it:

```markdown
### Req {N}: {Short description}
**Stage:** {current pipeline step}
**User said:** "{exact or paraphrased user input}"
**Type:** Explicit / Implicit / Correction / Clarification
**Related to:** Req #{other} (if refining an earlier requirement)
```

**Types:**
- **Explicit** — user directly states what they want ("border should be theme color")
- **Implicit** — user assumes something without stating it ("it should work like the other pages")
- **Correction** — user corrects something the pipeline produced ("no, not like that, I meant...")
- **Clarification** — user provides missing detail when asked ("yes, full height with scroll")

#### B. Requirement Patterns

Watch for these patterns and flag them in the log:

| Pattern | Signal | Action |
|---------|--------|--------|
| **Scattered requirements** | Same topic mentioned 3+ times across different stages | Flag for unification |
| **Contradictions** | Requirement A conflicts with requirement B | Flag for resolution |
| **Late additions** | New requirement appears during implementation | Flag as pipeline escape |
| **Repeated corrections** | User corrects the same type of mistake 2+ times | Flag as skill issue |
| **Scope creep** | Requirements grow significantly from PRD to implementation | Flag for discussion |
| **Implicit assumptions** | User expects behavior never documented | Flag as clarifier gap |

When a pattern is detected, append:

```markdown
### Pattern Detected: {Pattern Name}
**Involves:** Req #{list}
**Description:** {what's happening}
**Suggestion:** {how to address — unify, resolve, add to clarifier, etc.}
```

#### C. Problems

When something goes wrong (rework, confusion, wrong output), log it immediately:

```markdown
### Problem {N}: {Title}
**Stage:** {current pipeline step}
**Category:** {CODE} (see category table below)
**Severity:** Low / Medium / High / Critical
**What happened:** {description}
**Impact:** {did it cause rework, delay, confusion?}
**Quick fix applied:** {what was done to keep going, if anything}
```

#### D. Stage Transitions

When moving from one pipeline step to the next, append a brief checkpoint:

```markdown
---
## Stage: {skill name} → {next skill name}
**Artifacts produced:** {what was created}
**Requirements logged this stage:** {count}
**Problems logged this stage:** {count}
**Notes:** {any observations about the transition}
---
```

### How to Observe Without Disrupting

- **Do NOT interrupt the pipeline** to log observations — append silently
- **Do NOT ask the user retro questions mid-pipeline** — save them for Phase 3
- **Do flag critical issues immediately** if they will cause significant rework (ask: "I noticed X contradicts Y — should we resolve this now or continue?")
- **Update the log file after each meaningful interaction**, not after every single message

---

## Phase 3: Retrospective Discussion (Pipeline End)

After `generate-feature-doc` completes (or when the user triggers the retro), shift to discussion mode.

### Step 1: Analyze the Observation Log

Before talking to the user, analyze the log for:

1. **Requirement density per stage** — which stage generated the most requirements?
2. **Correction frequency** — how often did the user correct pipeline output?
3. **Scattered requirements** — which topics were spread across multiple stages?
4. **Problems by category** — which root cause category dominates?
5. **Pipeline escape rate** — how many issues made it to implementation?
6. **Root cause tracing** — for each problem, trace back to the earliest pipeline stage where it could have been caught. Map: problem → originating stage → skill that should have prevented it
7. **Spec drift** — compare what the UX spec defined vs what was actually built. Flag divergences and classify as intentional (technical constraint) or unintentional (missed requirement)
8. **Session quality score** — rate the pipeline run:
   - **Green:** 0-1 problems, no pipeline escapes, minimal corrections
   - **Yellow:** 2-4 problems, <20% escape rate, some corrections needed
   - **Red:** 5+ problems, >20% escape rate, significant rework required

### Step 2: Present Summary

Show the user a concise summary:

```markdown
## Pipeline Summary: {Feature Name}

| Metric | Value |
|--------|-------|
| Total requirements logged | {n} |
| Requirements added after PRD | {n} ({percentage}%) |
| Corrections made | {n} |
| Problems encountered | {n} |
| Scattered requirements unified | {n} |
| Session quality score | {Green/Yellow/Red} |
| Context cleanups during pipeline | {n} |
| Observer gaps (time not observing) | {duration} |
| Spec drift items | {n} intentional, {n} unintentional |

**Top issue category:** {category} ({count} issues)
**Most active stage:** {stage} ({count} requirements)
```

### Step 3: Discuss with User

Use AskQuestion to walk through key findings. Focus on:

1. **Scattered requirements** — "I noticed you mentioned {topic} in {N} different stages. Should this become a standard clarifier question?"

2. **Repeated corrections** — "You corrected {type of thing} {N} times. The {skill} skill might need an update to handle this by default."

3. **Late additions** — "These {N} requirements appeared after the PRD was finalized. Should the clarifier ask about {topic}?"

4. **Problems** — For each logged problem, confirm the category and severity with the user.

Ask the user:
> "Based on what I observed, here are the key friction points. Which ones do you want to address? I'll generate specific skill improvements for each."

### Step 4: Generate the Retrospective Document

After the discussion, produce the final `RETRO.md` (replaces or supplements the observation log):

```markdown
# Retrospective: {Feature Name}

**Date:** {date}
**Pipeline:** generate-prd → ... → generate-feature-doc
**Steps completed:** {list of skills used}

---

## Summary

| Category | Count | Severity |
|----------|-------|----------|
| PRD | {n} | {highest} |
| CLAR | {n} | ... |
| ... | | |

**Overall assessment:** {Green / Yellow / Red}

---

## Requirements Analysis

**Total requirements:** {n}
**Added during PRD:** {n} ({%})
**Added during clarification:** {n} ({%})
**Added during UX/prompts:** {n} ({%})
**Added during implementation:** {n} ({%}) ← these are pipeline escapes

### Scattered Requirements (Unified)
{List of requirements that were mentioned across stages and should be unified}

### Late Requirements (Pipeline Escapes)
{List of requirements that appeared after they should have been caught}

---

## Issues

### Issue 1: {Title}

**Category:** {CODE} — {Category Name}
**Severity:** Low / Medium / High / Critical
**Pipeline Stage:** {which skill or step}
**What happened:** {description}
**Expected:** {what should have happened}
**Root cause:** {why it happened}
**Fix:** {specific improvement to make}
**Fix target:** {which file/skill to update}

---

## Patterns

{What patterns emerge from the observation log}

---

## Recommendations (Priority Order)

### 1. {Highest impact fix}
**Fixes issues:** #{list}
**Action:** {specific change to make}
**Target:** {file or skill to update}

---

## Metrics

- **Total requirements:** {n}
- **Pipeline escape rate:** {requirements added after PRD / total}%
- **Correction rate:** {corrections / total interactions}%
- **Problems by stage:** {breakdown}
- **Skill improvement candidates:** {list of skills with proposed changes}
```

### Step 5: Apply Improvements

For each recommendation the user approves:

1. **Skill bugs (`SBUG`):** Read the skill file, propose a concrete edit, apply if approved
2. **Clarifier gaps (`CLAR`):** Propose new questions to add to `prd-clarifier`
3. **PRD template gaps (`PRD`):** Propose additions to `generate-prd` template
4. **Process issues (`PROC`):** Document in memory for future sessions

### Step 6: Track Across Features

Append a summary line to the global retro file (`src/new-app/RETRO.md`):

```markdown
| Date | Feature | Requirements | Escapes | Problems | Top Category | Key Fix |
|------|---------|-------------|---------|----------|-------------|---------|
| 2026-03-13 | app-container | 12 | 3 (25%) | 2 | CLAR (1), SCAFFOLD (1) | Add height question to clarifier |
```

---

## Problem Categories

Every issue falls into one of these root cause categories:

| Category | Code | Description | Example |
|----------|------|-------------|---------|
| **PRD Gap** | `PRD` | Requirement missing, vague, or wrong in the PRD | "PRD didn't mention border radius" |
| **Clarifier Miss** | `CLAR` | prd-clarifier should have caught this but didn't ask | "Nobody asked about mobile vs desktop behavior" |
| **UX Spec Gap** | `UX` | prd-to-ux missed a pass or produced incomplete output | "Pass 5 didn't cover error state" |
| **Prompt Gap** | `PROMPT` | ux-to-prompt produced a prompt missing key details | "Build prompt didn't include a11y requirements" |
| **Plan Gap** | `PLAN` | plan-implementation misclassified or missed a deliverable | "Should have been feature, not infrastructure" |
| **Scaffold Gap** | `SCAFFOLD` | create-infrastructure/feature produced wrong structure | "Generated a hook for a stateless component" |
| **Skill Missing** | `SKILL` | No skill exists for this type of problem | "No skill for responsive testing" |
| **Skill Bug** | `SBUG` | Skill instructions are wrong or incomplete | "Template doesn't match project conventions" |
| **User Input** | `USER` | User provided incomplete or ambiguous input | "Requirements changed mid-implementation" |
| **External** | `EXT` | Problem outside the pipeline (dependency, API, etc.) | "Tailwind class doesn't work as expected" |
| **Process** | `PROC` | Pipeline ordering or handoff issue | "Should have done X before Y" |

---

## Output Location

| Document | Location | When Created |
|----------|----------|-------------|
| Observation log | `.claude/pipeline/{feature}/OBSERVATION-LOG.md` | Phase 1 (pipeline start) |
| Retrospective | `.claude/pipeline/{feature}/RETRO.md` | Phase 3 (pipeline end) |
| Global tracker | `src/new-app/RETRO.md` | Phase 3, Step 6 |

---

## Anti-Patterns

- **Don't interrupt the pipeline** to ask retro questions — observe silently, discuss at the end
- **Don't blame the user** for unclear input — classify as `USER` but focus the fix on better clarifier questions
- **Don't log non-issues** — "I had to think about X" is not an issue unless it caused rework
- **Don't suggest process changes for one-off problems** — only recommend changes for patterns
- **Don't skip severity** — every issue needs a severity to prioritize fixes
- **Don't skip the discussion** — the retro conversation is where real insights emerge; don't just generate a report
- **Don't write a retro for trivial features** — if there were zero issues, just note "clean run" in the global tracker
- **Don't over-log** — focus on requirements that matter, not every conversational exchange

## Skill Improvement Protocol

When a retro identifies a skill bug (`SBUG`):

1. Read the skill file at `~/.claude/skills/{skill-name}/SKILL.md`
2. Identify the specific section that caused the issue
3. Propose a concrete edit to the skill file
4. Ask the user if they want to apply it now

This creates a **feedback loop**: features improve skills, skills improve future features.

---

## Auto-Memory Integration

The pipeline observer uses Claude's auto-memory (`MEMORY.md` + topic files) to track problems across pipeline runs. This enables a **watch-then-fix** approach: problems are stored on first occurrence and only escalated to skill changes when they recur.

### Memory Location

```
~/.claude/projects/{project}/memory/
  MEMORY.md                    # Always loaded — includes watch list summary
  pipeline-observations.md     # Detailed cross-run observation history
```

### Phase 1 Addition: Read Memory on Initialization

When starting a new pipeline run, **before creating the OBSERVATION-LOG.md**, read the memory files:

1. Read `MEMORY.md` — check the `## Pipeline Observations (Watch List)` section
2. Read `pipeline-observations.md` if it exists — check for recurring patterns
3. Note any watch list items relevant to this feature type (shared component, domain feature, etc.)
4. Include a `## Watch List (from previous runs)` section in the new OBSERVATION-LOG.md:

```markdown
## Watch List (from previous runs)

Items flagged in previous pipeline runs that may recur:

| # | Issue | First Seen | Occurrences | Status |
|---|-------|-----------|-------------|--------|
| W1 | {description from memory} | {date} | {count} | Watching / Recurred / Resolved |
```

During the pipeline, if a watch list item recurs, update its status to **Recurred** and increment the count.

### Phase 3 Addition: Memory-Aware Retrospective

During the retrospective discussion, apply this decision framework:

#### For New Problems (not in watch list)

```
First occurrence → Store in memory watch list → Do NOT change skills yet
```

- Add to `MEMORY.md` under `## Pipeline Observations (Watch List)`
- Add detailed entry to `pipeline-observations.md`
- Tell the user: "Logged to watch list. If this recurs in the next pipeline run, I'll propose a skill fix."

#### For Recurring Problems (already in watch list)

```
Second occurrence → Propose skill fix → Apply if user approves
```

- Flag as **Recurred** in the retro summary
- Propose a concrete skill change
- Ask the user: "This problem recurred from {previous feature}. Should I update the {skill} skill now?"

#### For Problems That Recur 3+ Times

```
Third+ occurrence → Strongly recommend fix → Apply with minimal friction
```

- Flag as **Chronic** in the retro summary
- Present the fix as a strong recommendation, not a question
- "This has happened in {N} pipeline runs. I'm applying the fix to {skill} unless you object."

#### Auto-Draft Rule for Chronic Problems

When a problem reaches 3+ occurrences and the user approves a fix:

1. **Draft a rule file** in `.claude/rules/` with the fix
2. **Present the draft** to the user for review
3. **Only create the file** after explicit user approval
4. **Update the watch list** — mark as resolved with reference to the new rule

Never auto-create rules without asking. Always draft first, ask second.

### Step 5 Update: Store to Memory

After the retrospective discussion, update memory files:

#### Update `MEMORY.md` — Pipeline Observations (Watch List)

Keep this section concise (it's always loaded into context). Format:

```markdown
## Pipeline Observations (Watch List)
- {Short description} — first seen {date}, {N} occurrences, watching
- {Short description} — first seen {date}, {N} occurrences, **recurred** → fixed in {skill}
```

Rules:
- **Add** new problems from this run that the user chose NOT to fix immediately
- **Update** occurrence count for recurring problems
- **Remove** problems that were fixed (move to `pipeline-observations.md` as resolved)
- **Remove** problems that didn't recur after 3+ clean runs (they were one-offs)

#### Update `pipeline-observations.md` — Detailed History

Append a run entry with full context:

```markdown
## Run: {Feature Name} ({date})

**Pipeline result:** {Green / Yellow / Red}
**New problems:** {count}
**Recurring problems:** {count}
**Watch list changes:** {added N, updated N, resolved N, removed N}

### New Watch Items
- **W{N}: {Title}** — {category}, {severity}, {description}. First seen this run.

### Recurring Items
- **W{N}: {Title}** — occurrence #{count}. Previously seen in {feature}. {Was it fixed? How?}

### Resolved Items
- **W{N}: {Title}** — resolved by {skill change / config fix / process change}. Removing from watch list.
```

### Step 6 Update: Global Tracker + Memory Sync

After updating the global retro file (`src/new-app/RETRO.md`), ensure memory is in sync:

1. `MEMORY.md` watch list reflects current state
2. `pipeline-observations.md` has the full run entry
3. Items resolved in this run are moved from watch list to history

### Memory Hygiene

- **After 3 clean runs** with no recurrence of a watch item → remove it (it was a one-off)
- **After fixing a skill** for a recurring item → mark as resolved, keep in history for reference
- **Keep MEMORY.md watch list under 10 items** — if it grows beyond that, prioritize and archive old items to `pipeline-observations.md`
- **Never store session-specific context** in memory — only patterns confirmed across runs
