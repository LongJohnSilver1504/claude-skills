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
| 2 | `/generate-prd` | Idea / DESIGN | `PRD.md` | — (entry point for specs) |
| 3 | `/prd-clarifier` | PRD | Clarifications merged into `PRD.md` | The PRD is already sharp |
| 4 | `/prd-to-ux` | PRD | `UX-spec.md` | — |
| 5 | `/plan-implementation` | Specs | Implementation plan | — |
| 6 | `/execute-tasks` | Plan | Code + review gates | Built outside the pipeline → `/audit-branch` |
| 7 | `/finish-feature` | Code | Tests, build, commit / PR / discard | — |
| 8 | `/generate-feature-doc` | Feature code | Feature `README.md` | Small features |

## Quick Start — pick the entry by blast radius

Score the request on three signals and take the **highest** tier any of them reaches. State the tier in one line before starting so the user can override it.

| Tier | Files | New contract / dependency | Ambiguity | Entry point |
|------|-------|---------------------------|-----------|-------------|
| **Bug** | any | none — behavior is wrong, spec is not | none | `/systematic-debugging` (failing test first, then the fix). No pipeline. |
| **Small** | 1–4, inside one feature | none, or one internal hook/component | clear once you read the code | `/modify-feature` for extend/refactor; or `/plan-implementation → /execute-tasks → /finish-feature` when several files need review gates |
| **Standard** | 5+, or fewer with a new contract | new endpoint, new screen, new shared piece | one real choice to make | `/generate-prd → /prd-to-ux → /plan-implementation → /execute-tasks → /finish-feature` |
| **Large** | cross-feature or shared infra | new external dep, public API, `UNVERIFIED` contracts | multiple open questions | `/brainstorm` first, then the full pipeline |

File count alone never promotes past Small — the contract and ambiguity columns do. Tie-breaker: anything touching auth, user input, external HTML/URLs, token storage or env access is **at least Standard** — the quality gate is where `frontend-security.md` runs. Inside `/execute-tasks` the same idea repeats per deliverable (tier S/M/L in PROGRESS.md decides how many reviewers each one gets).

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
