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

**Small change:** `/plan-implementation` → `/execute-tasks` → `/finish-feature`. **Bug fix:** no pipeline.

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
