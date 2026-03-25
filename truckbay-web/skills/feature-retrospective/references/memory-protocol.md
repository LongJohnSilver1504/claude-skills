# Memory Protocol

The pipeline observer uses Claude's memory to track problems across pipeline runs. This enables the watch-then-fix approach: problems are stored on first occurrence and only escalated to skill changes when they recur.

## Memory Location

```
~/.claude/projects/{project}/memory/
  MEMORY.md                    # Always loaded — includes watch list summary
  pipeline-observations.md     # Detailed cross-run history
```

## On Pipeline Start (Phase 1)

Before creating the OBSERVATION-LOG.md:

1. Read `MEMORY.md` — check the `## Pipeline Observations (Watch List)` section
2. Read `pipeline-observations.md` if it exists — check for recurring patterns
3. Include relevant watch list items in the new observation log's Watch List section

## On Retrospective (Phase 3, Step 5)

After the retro discussion, update memory based on the watch-then-fix protocol:

### For New Problems (not in watch list)

First occurrence → Add to watch list → Do NOT change skills

Tell user: "Logged to watch list. If this recurs next run, I'll propose a fix."

### For Recurring Problems (already in watch list)

Second occurrence → Propose concrete skill fix → Apply if approved

Ask: "This recurred from {previous feature}. Should I update {skill}?"

### For Chronic Problems (3+ occurrences)

Third+ occurrence → Strongly recommend fix → Apply with minimal friction

"This has happened in {N} runs. Applying the fix unless you object."

### Auto-Draft Rule for Chronic Problems

When user approves a fix for a 3+ occurrence problem:

1. Draft a rule file in `.claude/rules/` with the fix
2. Present draft to user for review
3. Only create the file after explicit approval
4. Update watch list — mark as resolved

Never auto-create rules without asking.

## Updating MEMORY.md

Keep the watch list section concise (it's always loaded):

```markdown
## Pipeline Observations (Watch List)
- {Short description} — first seen {date}, {N} occurrences, watching
- {Short description} — first seen {date}, {N} occurrences, **recurred** → fixed in {skill}
```

Rules:

- Add new problems the user chose NOT to fix immediately
- Update occurrence count for recurring problems
- Remove problems that were fixed (move to pipeline-observations.md as resolved)
- Remove problems that didn't recur after 3+ clean runs (they were one-offs)
- Keep under 10 items — if it grows beyond that, archive old items

## Updating pipeline-observations.md

Append a run entry after each retrospective:

```markdown
## Run: {Feature Name} ({date})
**Result**: {Green/Yellow/Red}
**New watch items**: {count}
**Recurring items**: {count}
**Resolved items**: {count}
```

With brief details for each category. This is the detailed history; MEMORY.md is the summary.

## Memory Hygiene

- After 3 clean runs with no recurrence → remove from watch list (it was a one-off)
- After fixing a skill for a recurring item → mark resolved, keep in history
- Never store session-specific context in memory — only patterns confirmed across runs
