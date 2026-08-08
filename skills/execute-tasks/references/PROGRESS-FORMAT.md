# PROGRESS-FORMAT — the execution-state artifact `execute-tasks` maintains

Lives in the same directory as the implementation plan. Updated after EVERY deliverable — it is the resume state if context is cleaned, and the compaction instruction in the project's CLAUDE.md tells Claude to preserve it.

## Template

```markdown
# Execution Progress: {Feature Name}
**Started**: {date}
**Plan**: {path to implementation plan}
**Branch**: feat/{feature-name}
**Base Branch**: {branch execution started from}
**Status**: In Progress | Complete | Blocked

## Deliverables

| # | Deliverable | Status | Impl | Spec | Quality | Tests |
|---|-------------|--------|------|------|---------|-------|
| D1 | {name} | DONE | DONE | PASS | PASS | N/A |
| D2 | {name} | DONE | DONE_WITH_CONCERNS | PASS | CONCERNS (1 trivial, auto-fixed) | PASS |
| D3 | {name} | IN_PROGRESS | - | - | - | - |
| D4+ | {name} | PENDING | - | - | - | - |

## Concerns Log

### D2 — Implementer Concern
{concern text}

### D2 — Quality: TRIVIAL (auto-fixed)
{what was fixed}

## Blocked Items

{empty or description}

## Files Changed

{running list of every file created/modified, per deliverable — the post-execution
review and finish-feature read this}

## Post-Execution Review

| Round | Reviewer | Findings (fixed/accepted/rejected/remaining) | Result |
|-------|----------|----------------------------------------------|--------|
| 1 | code-reviewer + /code-review | {n}/{n}/{n}/{n} | FINDINGS |
| 1 | design-reviewer | 🔴{n} 🟡{n} 🟢{n} | FINDINGS |
| 2 | design-reviewer | 0/0/{n} | PASS |
```

## Rules

- `**Base Branch**` is mandatory — `finish-feature` uses it for PR targets and `audit-branch` for diff scoping.
- Update the table before moving to the next deliverable, never in batches.
- The Files Changed list is append-only and complete — reviews are dispatched from it.
