# Skills Index — Quick Reference

## I want to...

### Plan & Design
| Task | Skill |
|------|-------|
| Turn an idea into requirements | `/generate-prd` |
| Find gaps in a PRD | `/prd-clarifier` |
| Create UX spec from requirements | `/prd-to-ux` |
| Generate build-order prompts from UX spec | `/ux-to-prompt` |
| Create implementation plan from specs | `/plan-implementation` |
| Create a test plan from UX spec | `/generate-test-plan` |
| Understand the pipeline flow | `/pipeline-help` |

### Build
| Task | Skill |
|------|-------|
| Scaffold a new feature (entities, API, CRUD) | `/create-feature` |
| Scaffold shared infrastructure (providers, layouts) | `/create-infrastructure` |
| Write tests for a feature | `/frontend-testing` |

### Document & Review
| Task | Skill |
|------|-------|
| Document a completed feature | `/generate-feature-doc` |
| Review UI against web design guidelines | `/web-design-guidelines` |
| Create/improve a Linear ticket | `/linear-ticket` |
| Commit changes with conventional style | `/git-commit` |

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
generate-prd → prd-clarifier → prd-to-ux → generate-test-plan → ux-to-prompt → plan-implementation → create-feature / create-infrastructure → frontend-testing → generate-feature-doc
```

Observer: `/feature-retrospective` runs alongside the entire pipeline.
