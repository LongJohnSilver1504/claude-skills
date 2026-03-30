# Claude Skills

A complete feature development pipeline for Claude Code — 29 skills that take you from a rough idea to a merged PR.

## What This Is

Claude Skills is a composable skill library that turns Claude Code into a structured development partner. Instead of ad-hoc prompting, each skill enforces a specific workflow — brainstorming before coding, specs before implementation, tests before shipping.

The skills connect into a **12-step pipeline** that covers the full lifecycle of a feature: exploring ideas, writing requirements, designing UX, planning implementation, autonomous execution with subagents, testing, documentation, retrospective, and finalization.

**Core principles:**
- **Design before code** — No implementation without approved specs
- **Test-driven** — Failing test first, minimal code to pass, then refactor
- **Systematic over ad-hoc** — Structured debugging, structured planning, structured review
- **Evidence over claims** — Verification before completion, no "should work"
- **Autonomous execution** — Subagents build in parallel, smart triage on review findings

## The Pipeline

```
brainstorm(0) --> generate-prd(1) --> prd-clarifier(2) --> prd-to-ux(3) --> generate-test-plan(4)
     |                                                                            |
     v                                                                            v
                    ux-to-prompt(5) --> plan-implementation(6) --> execute-tasks(7)
                                                                        |
     feature-retrospective(10) <-- generate-feature-doc(9) <-- frontend-testing(8)
                |
                v
         finish-feature(11)
```

| Phase | Steps | Mode |
|-------|-------|------|
| Explore & Design | 0-6 | Human-in-the-loop (you drive design decisions) |
| Build | 7 | Autonomous (subagents execute, smart triage on findings) |
| Validate & Ship | 8-11 | Human-in-the-loop (testing, docs, retro, merge) |

`/feature-retrospective` runs as an observer alongside the entire pipeline, tracking patterns and problems for the final retro.

Use `/feature-flow` to orchestrate the full pipeline, or invoke individual skills directly.

## Skill Catalog

### Explore & Plan

| Skill | What it does |
|-------|-------------|
| `/brainstorm` | Explore a feature idea with adaptive depth — Quick, Deep, or Grill mode for stress-testing |
| `/generate-prd` | Convert an idea into a structured, builder-ready PRD |
| `/prd-clarifier` | Refine a PRD through structured questions that uncover ambiguities and edge cases |
| `/prd-to-ux` | Translate PRD into UX specifications through 8 structured passes |
| `/generate-test-plan` | Generate a test matrix from a UX spec (interaction, state, and edge case tests) |
| `/ux-to-prompt` | Transform UX specs into build-order prompts for implementation |
| `/plan-implementation` | Bridge design artifacts into a dependency-ordered implementation plan |
| `/pipeline-help` | Interactive guide — explains the flow, which skill to use next, how to resume |

### Build

| Skill | What it does |
|-------|-------------|
| `/execute-tasks` | Execute an implementation plan using autonomous subagents with review gates |
| `/create-feature` | Scaffold a domain feature module (vertical slicing, hexagonal architecture) |
| `/create-infrastructure` | Scaffold shared infrastructure (providers, hooks, layouts, i18n) |
| `/frontend-testing` | Write tests using Vitest, React Testing Library, and MSW v2 |
| `/tdd` | RED-GREEN-REFACTOR discipline — failing test first, minimal code to pass |

### Debug & Fix

| Skill | What it does |
|-------|-------------|
| `/systematic-debugging` | 4-phase process: reproduce, isolate, identify root cause, verify with test |

### Document & Review

| Skill | What it does |
|-------|-------------|
| `/generate-feature-doc` | Generate feature documentation by analyzing code changes |
| `/web-design-guidelines` | Review UI code for Web Interface Guidelines compliance |
| `/linear-ticket` | Create or improve Linear tickets with proper documentation |
| `/git-commit` | Create commits following conventional commit style with descriptive bodies |
| `/finish-feature` | Finalize a feature — run tests, build, present commit/PR/discard options |

### Observe & Learn

| Skill | What it does |
|-------|-------------|
| `/feature-retrospective` | Track pipeline runs, detect patterns, facilitate retrospective discussion |
| `/learn-from-session` | Capture reusable patterns and conventions into persistent memory |
| `/feature-flow` | Orchestrate the full pipeline from idea to merge |

### Reference

These skills provide domain knowledge and are typically invoked by other skills, not directly.

| Skill | What it covers |
|-------|---------------|
| `/shadcn-ui` | shadcn/ui project patterns, form conventions, post-install fixes |
| `/error-handling` | Error creation, propagation, transformation, and display patterns |
| `/react-clean-architecture` | React clean architecture principles — the WHY behind structure decisions |
| `/vercel-react-best-practices` | React and Next.js performance optimization (from Vercel Engineering) |
| `/vercel-composition-patterns` | React composition patterns that scale |
| `/tailwindcss-fundamentals-v4` | Tailwind CSS v4 installation, configuration, and best practices |
| `/find-skills` | Discover and install new agent skills |

## Installation

### As a Claude Code Plugin

```bash
claude plugin add LongJohnSilver1504/claude-skills
```

### Manual (Clone + Symlink)

```bash
# Clone the repo
git clone git@github.com:LongJohnSilver1504/claude-skills.git ~/.claude/skills-repo

# Symlink all skills
for skill in ~/.claude/skills-repo/skills/*/; do
  ln -sf "$skill" ~/.claude/skills/"$(basename "$skill")"
done
```

### Selective Installation

Only want specific skills? Symlink individual ones:

```bash
git clone git@github.com:LongJohnSilver1504/claude-skills.git ~/.claude/skills-repo

# Pick the skills you want
ln -sf ~/.claude/skills-repo/skills/brainstorm ~/.claude/skills/brainstorm
ln -sf ~/.claude/skills-repo/skills/tdd ~/.claude/skills/tdd
ln -sf ~/.claude/skills-repo/skills/systematic-debugging ~/.claude/skills/systematic-debugging
```

## Rules (Example Project Conventions)

The `rules/` directory contains 10 example `.claude/rules/` files from a production React/Next.js project. Several skills reference these patterns. Copy the ones relevant to your stack into your project's `.claude/rules/` directory.

| Rule | What it covers |
|------|---------------|
| `accessibility.md` | WCAG 2.1 AA compliance for mobile-first apps |
| `centralized-links.md` | Never hardcode URLs — route builders and endpoint constants |
| `component-hook-separation.md` | Components as pure renderers, hooks own all logic |
| `design-system-map.md` | Which UI component to use for each concept |
| `error-handling.md` | AppError flow, API adapters, tryCatch pattern |
| `form-patterns.md` | react-hook-form + Zod + Controller + Field components |
| `package-manager.md` | pnpm enforcement |
| `project-structure.md` | Feature-based architecture with vertical slicing |
| `react-components.md` | Arrow functions, named exports, forwardRef, props conventions |
| `tanstack-query.md` | Query keys, useQuery/useMutation patterns, invalidation rules |

```bash
# Copy rules you want to your project
cp ~/.claude/skills-repo/rules/component-hook-separation.md .claude/rules/
cp ~/.claude/skills-repo/rules/error-handling.md .claude/rules/
```

## Customization

These skills were built for a production React/Next.js/TypeScript project. To adapt them to your stack:

1. **Fork the repo** and modify skill instructions to match your conventions
2. **Swap rule files** — replace the example rules with your project's patterns
3. **Adjust the pipeline** — not every project needs all 12 steps; remove or reorder skills in `/feature-flow`
4. **Add your own skills** — follow the pattern in any `skills/*/SKILL.md` file

Each skill is self-contained in its directory with a `SKILL.md` file and optional `references/` for templates and examples.

## How Skills Work

Each skill is a `SKILL.md` file with YAML frontmatter (name + description) and markdown instructions that Claude follows. Claude Code loads skill names at startup and reads the full content only when a skill triggers.

```
skills/
  brainstorm/
    SKILL.md              # Instructions Claude follows
  create-feature/
    SKILL.md
    references/           # Templates, examples, conventions
      templates.md
      shared-conventions.md
    examples/
      payments.md
```

Skills can reference other skills, read project files, and use any Claude Code tool. The frontmatter `description` field controls when Claude auto-triggers the skill.

## License

[MIT](LICENSE)
