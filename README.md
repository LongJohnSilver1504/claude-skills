# Claude Skills

A complete feature development pipeline for Claude Code — 22 skills that take you from a rough idea to a merged PR.

## What This Is

Claude Skills is a composable skill library that turns Claude Code into a structured development partner. Instead of ad-hoc prompting, each skill enforces a specific workflow — brainstorming before coding, specs before implementation, tests before shipping.

The skills connect into a **9-step pipeline** that covers the full lifecycle of a feature: exploring ideas, writing requirements, designing UX (with embedded test matrix), planning implementation, autonomous execution with subagents, testing, documentation, and finalization.

**Core principles:**
- **Design before code** — No implementation without approved specs
- **Test-driven** — Failing test first, minimal code to pass, then refactor
- **Systematic over ad-hoc** — Structured debugging, structured planning, structured review
- **Evidence over claims** — Verification before completion, no "should work"
- **Autonomous execution** — Subagents build in parallel, smart triage on review findings

## The Pipeline

```
brainstorm(0) --> generate-prd(1) --> prd-clarifier(2) --> prd-to-ux(3)
     |                                                          |
     v                                                          v
                            plan-implementation(4) --> execute-tasks(5)
                                                              |
                                   generate-feature-doc(7) <-- frontend-testing(6)
                                                |
                                                v
                                         finish-feature(8)
```

| Phase | Steps | Mode |
|-------|-------|------|
| Explore & Design | 0-4 | Human-in-the-loop (you drive design decisions) |
| Build | 5 | Autonomous (subagents execute, smart triage on findings) |
| Validate & Ship | 6-8 | Human-in-the-loop (testing, docs, merge) |

Invoke individual skills directly, or follow the pipeline order for a full feature build.

### How Steps Connect

Each skill produces an artifact that the next skill consumes:

| Step | Skill | Produces | Consumed by |
|------|-------|----------|-------------|
| 0 | `/brainstorm` | Validated idea + approach | `/generate-prd` |
| 1 | `/generate-prd` | `PRD.md` (requirements doc) | `/prd-clarifier` |
| 2 | `/prd-clarifier` | Refined PRD (ambiguities resolved) | `/prd-to-ux` |
| 3 | `/prd-to-ux` | `UX-spec.md` (9 passes inc. test matrix) | `/plan-implementation`, `/frontend-testing` (later) |
| 4 | `/plan-implementation` | Implementation plan (ordered deliverables) | `/execute-tasks` |
| 5 | `/execute-tasks` | Working code (built by agents) | `/frontend-testing` |
| 6 | `/frontend-testing` | Test files | `/generate-feature-doc` |
| 7 | `/generate-feature-doc` | `README.md` for the feature | `/finish-feature` |
| 8 | `/finish-feature` | Commit / PR / merge | — |

### How Execution Works (Step 5)

`/execute-tasks` is the autonomous build phase. It reads the implementation plan from step 4 and dispatches **subagents** — each agent gets a fresh context with only its task spec and relevant convention files.

```
execute-tasks (orchestrator)
  │
  ├── For each deliverable in the plan:
  │     │
  │     ├── 1. Implementer agent ──── builds the code
  │     │        uses /create-feature (domain modules)
  │     │        uses /create-infrastructure (shared plumbing)
  │     │
  │     ├── 2. Spec reviewer agent ── verifies code matches the spec
  │     │
  │     ├── 3. Quality reviewer agent ── checks project conventions
  │     │        reads .claude/rules/ files
  │     │
  │     └── 4. Test reviewer agent ── checks test quality (if tests exist)
  │
  └── Build verification ──── runs pnpm build to catch type errors
```

**How `/create-feature` and `/create-infrastructure` fit in:** The implementation plan (step 4) classifies each deliverable as either a **domain feature** (entities, API, CRUD) or **shared infrastructure** (providers, hooks, layouts). When the implementer agent builds a deliverable, it follows the scaffolding patterns from `/create-feature` or `/create-infrastructure` depending on the type.

**Agent model selection:** Simple deliverables (1-2 files, clear spec) use a fast model. Complex ones (3+ files, integration concerns) use a more capable model. If an agent gets stuck, it's automatically re-dispatched with a stronger model before escalating to you.

**Review triage:**
- **PASS** — move to the next deliverable
- **TRIVIAL findings** — auto-fixed by re-dispatching the implementer
- **ARCHITECTURAL findings** — reported to you for a decision (fix or accept)

## Skill Catalog

### Explore & Plan

| Skill | What it does |
|-------|-------------|
| `/brainstorm` | Explore a feature idea with adaptive depth — Quick, Deep, or Grill mode for stress-testing |
| `/generate-prd` | Convert an idea into a structured, builder-ready PRD |
| `/prd-clarifier` | Refine a PRD through structured questions that uncover ambiguities and edge cases |
| `/prd-to-ux` | Translate PRD into UX specifications through 9 structured passes (includes test matrix as Pass 9) |
| `/plan-implementation` | Bridge design artifacts into a dependency-ordered implementation plan |
| `/pipeline-help` | Interactive guide — explains the flow, which skill to use next, how to resume |

### Build

| Skill | What it does |
|-------|-------------|
| `/execute-tasks` | Execute an implementation plan using autonomous subagents with review gates |
| `/create-feature` | Scaffold a domain feature module (vertical slicing, hexagonal architecture) |
| `/create-infrastructure` | Scaffold shared infrastructure (providers, hooks, layouts, i18n) |
| `/frontend-testing` | Write tests using Vitest, React Testing Library, and MSW v2 |
| `/using-git-worktrees` | Set up isolated workspace via native tools or git worktree fallback |

### Debug & Fix

| Skill | What it does |
|-------|-------------|
| `/systematic-debugging` | 4-phase process: reproduce, isolate, identify root cause, verify with test |

### Document & Review

| Skill | What it does |
|-------|-------------|
| `/generate-feature-doc` | Generate feature documentation by analyzing code changes |
| `/refactoring-ui-reviewer` | Audit existing UI against Refactoring UI principles — prioritized findings with rule citations |
| `/git-commit` | Create commits following conventional commit style with descriptive bodies |
| `/finish-feature` | Finalize a feature — run tests, build, present commit/PR/discard options |

### Reference

These skills provide domain knowledge and are typically invoked by other skills, not directly.

| Skill | What it covers |
|-------|---------------|
| `/shadcn-ui` | shadcn/ui project patterns, form conventions, post-install fixes |
| `/react-clean-architecture` | React clean architecture principles — the WHY behind structure decisions |
| `/refactoring-ui-designer` | Apply Refactoring UI principles when building new components — hierarchy, layout, polish |
| `/tailwindcss-fundamentals-v4` | Tailwind CSS v4 installation, configuration, and best practices |
| `/writing-skills` | TDD-style workflow for authoring new skills — baseline test, write, refactor |
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

The `rules/` directory contains 16 example `.claude/rules/` files from a production React/Next.js project. Several skills reference these patterns. Copy the ones relevant to your stack into your project's `.claude/rules/` directory.

| Rule | What it covers |
|------|---------------|
| `working-principles.md` | Behavioral guardrails — think before coding, surgical changes, goal-driven execution |
| `verification-before-completion.md` | The Iron Law — no completion claims without fresh verification |
| `project-structure.md` | Feature-based architecture, sub-feature pattern, tech stack reference |
| `accessibility.md` | WCAG 2.1 AA compliance for mobile-first apps |
| `centralized-links.md` | Never hardcode URLs — route builders and endpoint constants |
| `color-usage.md` | Semantic theme tokens — no raw Tailwind colors |
| `component-hook-separation.md` | Components as pure renderers, hooks own all logic |
| `design-system-map.md` | Which UI component to use for each concept |
| `error-handling.md` | AppError flow, API adapters, tryCatch pattern |
| `form-patterns.md` | react-hook-form + Zod + Controller + Field components |
| `layout-ownership.md` | Components render flush, parents own inter-component spacing |
| `package-manager.md` | pnpm enforcement |
| `react-components.md` | Arrow functions, named exports, forwardRef, props conventions |
| `tanstack-query.md` | Query keys, useQuery/useMutation patterns, invalidation rules |
| `testing.md` | Vitest config, polyfills, feature test helpers |
| `zustand-patterns.md` | Avoid store-object in dependency arrays, use selectors |

```bash
# Copy rules you want to your project
cp ~/.claude/skills-repo/rules/component-hook-separation.md .claude/rules/
cp ~/.claude/skills-repo/rules/error-handling.md .claude/rules/
```

## Upstream Skills

Some skills were adapted from external sources. To pull updates, check the original repos:

| Skill | Source |
|-------|--------|
| `/refactoring-ui-designer` | [Refactoring UI by Wathan & Schoger](https://refactoringui.com) |
| `/refactoring-ui-reviewer` | [Refactoring UI by Wathan & Schoger](https://refactoringui.com) |
| `/tailwindcss-fundamentals-v4` | [Tailwind CSS v4 docs](https://tailwindcss.com/docs) |

These skills are snapshots — they don't auto-update. When a new version of Tailwind or React ships, review the source and update the skill content manually.

## Customization

These skills were built for a production React/Next.js/TypeScript project. To adapt them to your stack:

1. **Fork the repo** and modify skill instructions to match your conventions
2. **Swap rule files** — replace the example rules with your project's patterns
3. **Adjust the pipeline** — not every project needs all steps; remove or reorder as needed
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
