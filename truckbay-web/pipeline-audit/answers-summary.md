# Pipeline Audit — Answers Summary

**Date:** 2026-03-15
**Status:** Complete — Ready for implementation planning

---

## P1: CRITICAL GAPS

| Q | Topic | Answer | Action |
|---|-------|--------|--------|
| Q1 | Pipeline resume after context cleanup | **C** | Add resume instructions to EVERY pipeline skill |
| Q2 | Observer persistence | **D (custom)** | Observer stays lightweight during pipeline (just notes), heavy analysis at end (root cause tracing, session scoring, skill refinement). Resume mechanism needed. |
| Q3 | Shift test scenarios earlier | **B** | Create new `/generate-test-plan` skill between prd-to-ux and ux-to-prompt |
| Q4 | States matrix for interactive elements | **A** | Add mandatory states matrix table to prd-to-ux Pass 5 |
| Q5 | Size gate / fast-track | **C** | No formal gate — invoke whichever skill directly |
| Q6 | Testable requirements gate | **C** | Move testability check to prd-to-ux (when requirements become interactions) |
| Q7 | DECISIONS.md across stages | **A** | Create DECISIONS.md in feature folder, each skill appends |
| Q8 | Component vocabulary in UX spec | **C** | Pass 7 references design-system-map.md rule file + shadcn MCP for component data |

## P2: IMPROVEMENTS

| Q | Topic | Answer | Action |
|---|-------|--------|--------|
| Q9 | Metadata naming consistency | **A** | Fix metadata to match directory names |
| Q10 | Path reference standardization | **A** | One-time audit, fix all wrong paths |
| Q11 | Scope creep detection | **D** | Observer logs it, retrospective analyzes |
| Q12 | Pipeline skill output summaries | **C** | DECISIONS.md serves as cumulative digest |
| Q13 | Success metrics in PRD | **D** | Skip — test plan handles quality gates |
| Q14 | E2E testing guidance | **D** | Add later when flows are stable |
| Q15 | Design system map rule file | **A** | Create design-system-map.md in .claude/rules/ |
| Q16 | Known limitations in docs | **D** | Skip — limitations live in PRD which is kept |
| Q17 | Quantitative pipeline metrics | **A** | Metrics collection in retrospective Phase 3 |
| Q18 | Auto-promote recurring observations | **D** | Draft rule, always ask before creating |

## P3: NICE-TO-HAVES

| Q | Topic | Answer | Action |
|---|-------|--------|--------|
| Q19 | Mobile/responsive states | **C** | Not needed — project is mobile-only |
| Q20 | Accessibility compliance level | **C** | Project-wide a11y rule in .claude/rules/ |
| Q21 | Skill index by use case | **A** | Create SKILLS-INDEX.md |
| Q22 | API contract evolution | **C** | Handle when it happens |
| Q23 | Feature rollback documentation | **D** | Add later when in production (already in production — revisit if needed) |
| Q24 | Spec drift detection | **B** | Add to retrospective Phase 3 analysis |
| Q25 | Pipeline stage transition confirmation | **A** | Already handled — no change |
| Q26 | i18n integration | **B** | create-feature scaffolds translation files |
| Q27 | Figma MCP integration | **D** | Keep separate — not always used |
| Q28 | Linear integration | **D** | Keep separate — use /linear-ticket independently |

## P4: ARCHITECTURE

| Q | Topic | Answer | Action |
|---|-------|--------|--------|
| Q29 | Skill file size | **C** | Core logic in SKILL.md, examples/templates in reference files |
| Q30 | Skill versioning | **A** | Separate git repo + symlinks. Supports shared + project-specific skills |
| Q31 | Cross-skill communication | **C** | Not needed — single maintainer |
| Q32 | Parallel pipeline execution | **A** | Keep sequential |
| Q33 | Pipeline telemetry | **A** | Aggregate metrics in global RETRO.md (in skills repo) |
| Q34 | Skill dependencies declaration | **B** | Implicit — pipeline order is enough |
| Q35 | User onboarding | **D** | Create /pipeline-help skill for interactive guidance |

---

## Additional Decisions Made During Session

1. **shadcn MCP server installed** — handles component catalog/props/variants. Skill updated to focus on project-specific patterns only.
2. **React version corrected** — project is React 18, not 19 (forwardRef still required).
3. **Import paths fixed** in shadcn-ui skill — all now use @/new-app/ui/, not @/components/ui/.
4. **PRD renamed** — from "demo-grade PRD" to "feature PRD" (project is in production).
5. **Project is mobile-only** — saved to memory, affects all UX/design decisions.
6. **Skills repo structure** — will support shared/ (cross-project) and project-specific/ directories.

---

## Implementation Work Items

### New Skills to Create
1. `/generate-test-plan` — test matrix from UX spec (Q3)
2. `/pipeline-help` — interactive pipeline guide (Q35)

### Skills to Update
3. All pipeline skills — add resume instructions after context cleanup (Q1)
4. `feature-retrospective` — add Phase 1.5 resume, enhance Phase 3 with root cause tracing, session scoring, skill refinement, quantitative metrics, spec drift detection (Q2, Q17, Q18, Q24)
5. `prd-to-ux` — add states matrix to Pass 5, add testability check, reference design-system-map.md in Pass 7 (Q4, Q6, Q8)
6. `generate-prd` — rename "demo-grade" to "feature PRD" (additional decision)
7. `create-feature` — add i18n scaffolding (Q26)
8. `ux-to-prompt` — fix metadata name (Q9)
9. Large skills — move examples/templates to reference files (Q29)

### New Files to Create
10. `.claude/rules/design-system-map.md` — component inventory + usage mapping (Q15)
11. `.claude/rules/accessibility.md` — WCAG AA project-wide constant (Q20)
12. `.claude/SKILLS-INDEX.md` — use-case → skill mapping (Q21)
13. `DECISIONS.md` template — for feature folders, appended by each skill (Q7)

### Infrastructure
14. Create separate git repo for skills (Q30)
15. One-time path audit across all skills — fix @/components/ui/ → @/new-app/ui/ (Q10)

### No Action Required
- Q5 (size gate), Q11 (scope creep), Q12 (summaries), Q13 (success metrics), Q14 (E2E), Q16 (known limitations), Q19 (responsive), Q22 (API evolution), Q23 (rollback), Q25 (transitions), Q27 (Figma), Q28 (Linear), Q31 (contracts), Q32 (parallelism), Q34 (dependencies)
