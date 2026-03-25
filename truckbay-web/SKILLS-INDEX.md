# Skills Index — Quick Reference

## I want to...

### Explore & Plan
| Task | Skill |
|------|-------|
| Explore a vague idea before writing requirements | `/brainstorm` |
| Turn an idea into requirements | `/generate-prd` |
| Find gaps in a PRD | `/prd-clarifier` |
| Create UX spec from requirements | `/prd-to-ux` |
| Generate build-order prompts from UX spec | `/ux-to-prompt` |
| Create a test plan from UX spec | `/generate-test-plan` |
| Create implementation plan from specs | `/plan-implementation` |
| Understand the pipeline flow | `/pipeline-help` |

### Build
| Task | Skill |
|------|-------|
| Execute an implementation plan with agents | `/execute-tasks` |
| Scaffold a new feature (entities, API, CRUD) | `/create-feature` |
| Scaffold shared infrastructure (providers, layouts) | `/create-infrastructure` |
| Write tests for a feature | `/frontend-testing` |
| Build with test-first discipline (RED-GREEN-REFACTOR) | `/tdd` |

### Debug & Fix
| Task | Skill |
|------|-------|
| Investigate a bug systematically | `/systematic-debugging` |

### Document & Review
| Task | Skill |
|------|-------|
| Document a completed feature | `/generate-feature-doc` |
| Review UI against web design guidelines | `/web-design-guidelines` |
| Create/improve a Linear ticket | `/linear-ticket` |
| Commit changes with conventional style | `/git-commit` |
| Finalize, commit, or create PR for a feature | `/finish-feature` |

### Observe & Learn
| Task | Skill |
|------|-------|
| Track pipeline run for retrospective | `/feature-retrospective` |
| Save patterns from this session | `/learn-from-session` |
| Review code for simplification | `/simplify` |

### Reference (invoked by other skills)
| Topic | Skill |
|-------|-------|
| shadcn/ui project patterns | `/shadcn-ui` |
| Error handling patterns | `/error-handling` |
| React architecture principles | `/react-clean-architecture` |
| React performance (Vercel) | `/vercel-react-best-practices` |
| React composition patterns | `/vercel-composition-patterns` |
| Tailwind CSS v4 | `/tailwindcss-fundamentals-v4` |
| Claude API / Anthropic SDK | `/claude-api` |
| Find new skills to install | `/find-skills` |

## Pipeline Order

```
brainstorm(0) → generate-prd(1) → prd-clarifier(2) → prd-to-ux(3) → generate-test-plan(4) →
ux-to-prompt(5) → plan-implementation(6) → execute-tasks(7) → frontend-testing(8) →
generate-feature-doc(9) → feature-retrospective(10) → finish-feature(11)
```

- Steps 0-6: Human-in-the-loop (user drives design decisions)
- Step 7: Autonomous (subagents execute, smart triage on review findings)
- Steps 8-11: Human-in-the-loop (testing, docs, retro, merge decision)

Observer: `/feature-retrospective` runs alongside the entire pipeline.
