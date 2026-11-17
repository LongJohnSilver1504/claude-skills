---
name: pipeline-help
description: Interactive guide for the feature development pipeline. Explains the flow, which skill to use, and how to resume after context cleanup. Use when asking about the pipeline, how to start, or what comes next.
---

# Pipeline Help

If `docs/agents/project-conventions.md` is missing, run `/setup-daher-skills` first. Every other skill stops without the files it seeds.

Conventions live in the project's `.claude/rules/` — one source of truth.

```
brainstorm → generate-prd → prd-clarifier → prd-to-ux → plan-implementation → execute-tasks → finish-feature → generate-feature-doc
     │                                           │
     └──────────── prototype (optional) ────────┘
```

| # | Skill | Input | Output | Skip when |
|---|-------|-------|--------|-----------|
| 1 | `/brainstorm` | Rough idea | `DESIGN.md` | The feature is already clear |
| 2 | `/generate-prd` | Idea / DESIGN | `PRD.md` | Standard tier with no new screens or product decisions → `/plan-implementation` direct mode |
| 3 | `/prd-clarifier` | PRD | Clarifications merged into `PRD.md` | The PRD is already sharp |
| 4 | `/prd-to-ux` | PRD | `UX-spec.md` | No PRD (direct mode) |
| 5 | `/plan-implementation` | Specs — or, in direct mode, the request itself (Standard tier, no PRD) | Implementation plan | — |
| 6 | `/execute-tasks` | Plan | Code + review gates + browser smoke-walk (`Runtime` line) + `docs/agents/runs/<feature>-<date>.json` run report | Built outside the pipeline → `/audit-branch` |
| 7 | `/finish-feature` | Code | Tests, build, commit / PR / discard | — |
| 8 | `/generate-feature-doc` | Feature code | Feature `README.md` | Small features |

## Quick Start — pick the entry by tier

Classify the request and state the tier in one line before starting so the user can override it. The table is the same one every session already carries in `.claude/rules/working-principles.md` §3 (a project whose copy predates it re-seeds the rule with `/setup-daher-skills`):

<!-- tier-table:start -->
| Tier | Understanding | Resume test | Entry point |
|------|---------------|-------------|-------------|
| **Bug** | Behavior is wrong; the spec is not | — | `/systematic-debugging` (failing test first, then the fix). No pipeline. |
| **Small** | After reading the code you can state the change and the check that proves it | **Passes** — if the session stopped now, someone could finish from the original request and `git diff` alone | Inline, with the verifiable goals below; `/modify-feature` to extend or restructure a shipped feature. No plan document, no subagents. |
| **Standard** | The what is clear; there is one real choice or one new contract (endpoint, screen, shared piece) | **Fails** — more than one session, separate deliverables, or requirements too long to survive compaction | `/plan-implementation` in direct mode (one document — the request verbatim, numbered specs, deliverables) → `/execute-tasks` → `/finish-feature`. New screens or open product decisions: `/generate-prd → /prd-to-ux` first. |
| **Large** | Several open questions, cross-feature or shared infrastructure, a new external dependency, a public API, a contract nobody can verify yet | Fails | `/brainstorm`, then the full pipeline. |

Risk raises the tier, size does not: anything touching auth, user input, external HTML or URLs, token or PII storage, env access, irreversible data effects personal data leaving the system, or a contract other code depends on is **at least Standard** — the review gates are where `frontend-security.md` runs. A change with no test that would catch its regression gets that test first, at any tier.
<!-- tier-table:end -->

Inside `/execute-tasks` the same idea repeats per deliverable (tier S/M/L in PROGRESS.md decides how many reviewers each one gets).

## Artifacts

Permanent, next to the feature: `PRD.md`, `UX-spec.md`, `README.md`. Intermediate (deleted after ship): `DESIGN.md`, `*-implementation-plan.md`, `PROGRESS.md`.

Each skill reads the previous artifact, not the conversation. Fresh session between `/plan-implementation` and `/execute-tasks`. After two failed corrections on the same problem, start a fresh session. Resume: name the feature and invoke the next skill.

## Outside the pipeline

| Need | Skill |
|------|-------|
| Extend or restructure a shipped feature | `/modify-feature` |
| Write tests | `/frontend-testing` |
| Something is broken | `/systematic-debugging` |
| Build or audit UI | `/refactoring-ui` |
| Dev-only debug panel | `/create-devtool` |
| Review a branch built without the pipeline | `/audit-branch` |
| Commit / PR | `/git-commit`, `/finish-feature` |
