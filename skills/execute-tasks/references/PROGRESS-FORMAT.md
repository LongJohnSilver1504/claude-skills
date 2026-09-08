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
**Progress**: {filled gate cells}/{deliverables × 4} gates ({percent}%)

## Deliverables

| # | Deliverable | Tier | Status | Impl | Spec | Quality | Tests |
|---|-------------|------|--------|------|------|---------|-------|
| D1 | {name} | S | DONE | DONE | PASS | SKIPPED (S) | SKIPPED (S) |
| D2 | {name} | M | DONE | DONE_WITH_CONCERNS | PASS | CONCERNS (1 trivial, auto-fixed) | PASS |
| D3 | {name} | L | IN_PROGRESS | - | - | - | - |
| D4+ | {name} | - | PENDING | - | - | - | - |

## Dispatch Log

| # | Model | Re-dispatches | Fix rounds | Files predicted → changed |
|---|-------|---------------|------------|---------------------------|
| D1 | sonnet | 0 | 0 | 1 → 1 |
| D2 | sonnet | 1 (BLOCKED → opus) | 1 | 3 → 4 |

## Decisions

| When | Decision | Why |
|------|----------|-----|
| D2 | Accepted quality finding "prop drilling in FiltersBar" | Genuine tradeoff — spec pins the component API; refactor would touch D5's contract |
| D4 | Fixed ARCHITECTURAL finding (raw color token) | Violates color-usage.md |
| checkpoint | Committed a1b2c3d after D1-D3 | Autonomy Contract — checkpoint every 2-3 deliverables |

Append-only, one line each. This is the audit trail the Autonomy Contract promises: the
user reviews judgment calls here after the run instead of being asked during it.

## Concerns Log

### D2 — Implementer Concern
{concern text}

### D2 — Quality: TRIVIAL (auto-fixed)
{what was fixed}

## Blocked Items

{empty or description}

## What Did NOT Work

{Every approach tried and abandoned, with the EXACT reason — "threw X because Y", not
"didn't work". A resumed session reads this before touching anything, so it never retries
a dead end.}

- **{approach}** (D{N}) — failed because: {error / reason}

## Exact Next Step

{One sentence a resumed session can act on with zero re-derivation: "Dispatch D5 (tier M)
with rules X, Y; D4's quality re-review is pending." Written before every context pause.}

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
- The `Spec`/`Quality`/`Tests` columns are the **review-gate join ledger**: when independent
  deliverables are implemented concurrently, each row records its own gates as they return.
  A `-` in a gate column on a DONE row means that gate never ran — Post-Execution must not
  start until every DONE row carries real results. `SKIPPED (S)` is a real result: it records
  that the tier deferred the gate on purpose — Post-Execution runs one batched
  `quality-reviewer` over every `SKIPPED (S)` file. (`N/A` alone still means "no test files".)
- `Tier` is written **before** dispatch, so the user can override the ceremony. The
  Dispatch Log (joined to the tier by `#`) is the standing evidence for the implementer
  model threshold (5 files) — re-dispatches and fix rounds per tier are what would justify
  moving it.
- **What Did NOT Work** and **Exact Next Step** are written at the moment, not reconstructed
  later: the first whenever an approach is abandoned, the second before every context pause.
