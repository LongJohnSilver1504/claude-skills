# Claude Skills

A complete feature development pipeline for Claude Code — 26 skills that take you from a rough idea to a merged PR.

**First run:** after installing, open your project and run `/setup-daher-skills`. It detects your stack (package manager, structure, base branch), seeds the convention rules and `docs/agents/project-conventions.md`, and wires your CLAUDE.md — every other skill reads those files. Skills that need missing config stop with `Run /setup-daher-skills first — missing <file>`.

## What This Is

Claude Skills is a composable skill library that turns Claude Code into a structured development partner. Instead of ad-hoc prompting, each skill enforces a specific workflow — brainstorming before coding, specs before implementation, tests before shipping.

The skills connect into an **8-step pipeline** that covers the full lifecycle of a feature: exploring ideas, writing requirements, designing UX (with embedded test matrix), planning implementation, autonomous execution with subagents, finalization, and documentation — with an optional prototyping branch.

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
                                                              v
                            generate-feature-doc(7) <-- finish-feature(6)
```

**Optional branch:** `/prototype` — flesh out a design before committing to it (branch off during brainstorm or UX design).

| Phase | Steps | Mode |
|-------|-------|------|
| Explore & Design | 0-4 | Human-in-the-loop (you drive design decisions) |
| Build | 5 | Autonomous (subagents execute, smart triage on findings) |
| Validate & Ship | 6-7 | Human-in-the-loop (testing, merge, docs) |

Invoke individual skills directly, or follow the pipeline order for a full feature build.

### How Steps Connect

Each skill produces an artifact that the next skill consumes:

| Step | Skill | Produces | Consumed by |
|------|-------|----------|-------------|
| 0 | `/brainstorm` | Validated idea + approach | `/generate-prd` |
| 1 | `/generate-prd` | `PRD.md` (requirements doc) | `/prd-clarifier` |
| 2 | `/prd-clarifier` | Refined PRD (clarifications merged into `PRD.md`) | `/prd-to-ux` |
| 3 | `/prd-to-ux` | `UX-spec.md` (9 passes inc. test matrix) | `/plan-implementation` |
| 4 | `/plan-implementation` | Implementation plan (ordered deliverables) | `/execute-tasks` |
| 5 | `/execute-tasks` | Working code + tests (built by agents) | `/finish-feature` |
| 6 | `/finish-feature` | Commit / PR / merge | `/generate-feature-doc` |
| 7 | `/generate-feature-doc` | `README.md` for the feature | — |

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

### Setup

| Skill | What it does |
|-------|-------------|
| `/setup-daher-skills` | One-time per-project setup — detects the stack, seeds `.claude/rules/` + `docs/agents/project-conventions.md`, wires CLAUDE.md, optional permissions allowlist and Iron-Law verify gate |

### Explore & Plan

| Skill | What it does |
|-------|-------------|
| `/brainstorm` | Explore a feature idea with adaptive depth — Quick, Deep, or Grill mode for stress-testing |
| `/generate-prd` | Convert an idea into a structured, builder-ready PRD |
| `/prd-clarifier` | Refine a PRD through structured questions that uncover ambiguities and edge cases |
| `/prd-to-ux` | Translate PRD into UX specifications through 9 structured passes (includes test matrix as Pass 9) |
| `/plan-implementation` | Bridge design artifacts into a dependency-ordered implementation plan |
| `/prototype` | Build a throwaway prototype to flesh out a design before committing — terminal app for state/logic questions, or several UI variations on one route |
| `/pipeline-help` | Interactive guide — explains the flow, which skill to use next, how to resume |

### Build

| Skill | What it does |
|-------|-------------|
| `/execute-tasks` | Execute an implementation plan using autonomous subagents with review gates |
| `/create-feature` | Scaffold a domain feature module (vertical slicing, hexagonal architecture) |
| `/modify-feature` | Extend or refactor EXISTING feature code — add code to a shipped feature, or restructure with zero behavior change (characterization tests first) |
| `/create-infrastructure` | Scaffold shared infrastructure (providers, hooks, layouts, i18n) |
| `/frontend-testing` | Write tests using Vitest, React Testing Library, and MSW v2 |
| `/create-devtool` | Create a dev-only DevTool debug panel that surfaces store state, query status, and API payloads |

### Mobile

Standalone runtime-verification skills for mobile targets (not part of the 8-step pipeline).

| Skill | What it does |
|-------|-------------|
| `/test-mobile-app` | One focused end-to-end verification pass of a mobile change — platform selection, lightest valid launch path, bundler lifecycle, evidence-gated verification, scoped cleanup |
| `/ios-simulator` | Operate the iOS Simulator with one pinned UDID — build/reuse decisions, semantic UI driving, deep links, screenshots, scoped logs |
| `/android-emulator` | Operate Android emulators/devices through adb with one explicit serial — installs, deep links, `adb reverse`, uiautomator-based driving, screenshots, scoped logcat |

### Debug & Fix

| Skill | What it does |
|-------|-------------|
| `/systematic-debugging` | 4-phase process: reproduce, isolate, identify root cause, verify with test |

### Document & Review

| Skill | What it does |
|-------|-------------|
| `/generate-feature-doc` | Generate feature documentation by analyzing code changes |
| `/refactoring-ui` | Apply Refactoring UI principles when building new UI, and audit existing components — prioritized findings with rule citations |
| `/receiving-code-review` | Evaluate code review feedback with technical rigor — verify before implementing, no performative agreement |
| `/audit-branch` | One-command holistic audit of an ad-hoc branch: conventions + design + tests + correctness, triage, fix loop |
| `/git-commit` | Create commits following conventional commit style with descriptive bodies |
| `/finish-feature` | Finalize a feature — run tests, build, present commit/PR/discard options |

### Reference

These skills provide domain knowledge and are typically invoked by other skills, not directly.

| Skill | What it covers |
|-------|---------------|
| `/react-clean-architecture` | React clean architecture principles — the WHY behind structure decisions |
| `/writing-skills` | Authoring skills — discovery-focused descriptions, lean structure, test before trusting |

## Installation

### As a Claude Code Plugin (recommended)

```
/plugin marketplace add LongJohnSilver1504/claude-skills
/plugin install claude-skills
```

This is the path with real version management: installs are pinned to a released version, `claude plugin update claude-skills` moves you forward, and every version is tagged (see [Versions & Rollback](#versions--rollback)). Update with:

```bash
claude plugin marketplace update claude-skills   # refresh the marketplace clone first
claude plugin update claude-skills               # restart to apply
```

### Clone + Symlink

Prefer this when you want to edit the skills in place and have changes take effect immediately — it tracks a branch rather than a release, so you get whatever is on `main`:

```bash
# Clone the repo
git clone git@github.com:LongJohnSilver1504/claude-skills.git ~/claude-skills

# Symlink all skills
mkdir -p ~/.claude/skills
for skill in ~/claude-skills/skills/*/; do
  ln -sf "$skill" ~/.claude/skills/"$(basename "$skill")"
done

# Symlink the subagents (required by /execute-tasks)
mkdir -p ~/.claude/agents
for agent in ~/claude-skills/agents/*.md; do
  ln -sf "$agent" ~/.claude/agents/"$(basename "$agent")"
done
```

Because the skills are symlinked, a `git pull` in `~/claude-skills` updates every installed skill in place. The flip side: nothing pins a version, so a stale clone silently serves old skills — check it with `git -C ~/claude-skills status -sb`.

**Don't run both installs for the same skills.** Each one loads independently, so every duplicated skill is parsed twice and costs context twice; worse, a stale clone alongside a current plugin gives you two different versions of the same skill under two names (`/audit-branch` vs `/claude-skills:audit-branch`).

### Selective Installation

Only want specific skills? Symlink individual ones:

```bash
git clone git@github.com:LongJohnSilver1504/claude-skills.git ~/claude-skills

# Pick the skills you want
ln -sf ~/claude-skills/skills/brainstorm ~/.claude/skills/brainstorm
ln -sf ~/claude-skills/skills/git-commit ~/.claude/skills/git-commit
ln -sf ~/claude-skills/skills/systematic-debugging ~/.claude/skills/systematic-debugging
```

## Versions & Rollback

Every release is tagged `claude-skills--vX.Y.Z` (the scheme `claude plugin tag` produces and validates) and has a CHANGELOG section explaining the *why*. Versions before 3.0.0 predate tagging and live only in the CHANGELOG.

**See what changed between two versions:**

```bash
npm run changes -- 3.0.0 3.1.0   # CHANGELOG section, commits, files, skills added/removed
npm run changes -- 3.1.0         # ...through HEAD
```

Or read the [GitHub Releases](https://github.com/LongJohnSilver1504/claude-skills/releases) — each carries its CHANGELOG section as the release notes.

**Update to the latest version:**

```bash
claude plugin update claude-skills   # plugin installs (restart required to apply)
git -C ~/claude-skills pull          # symlink installs
```

**Go back to an earlier version:**

- *Symlink install* — check the tag out; the symlinks point at the working tree, so it takes effect immediately:
  ```bash
  git -C ~/claude-skills checkout claude-skills--v3.0.0   # detached HEAD
  git -C ~/claude-skills switch main                      # back to latest
  ```
- *Plugin install* — `claude plugin` has **no downgrade command**, and the version-keyed cache under `~/.claude/plugins/cache/` isn't selectable (old versions are pruned after ~14 days). The supported rollback is forward: revert the bad change on `main` and ship a patch, then `claude plugin update claude-skills`.

**Fix a version that broke something** — branch from its tag, so you're working from exactly what shipped:

```bash
git switch -c fix/3.1.1 claude-skills--v3.1.0
# fix, open a PR, merge, then from main:
npm run release -- patch
```

**Cut a release** (maintainers) — one command runs the whole checklist: validators, `[Unreleased]` notes check, version bump + manifest sync, re-validation, commit, tag, push, GitHub Release.

```bash
npm run release -- minor --dry-run   # print every step, change nothing
npm run release -- minor             # for real
```

## Agents (Required by `/execute-tasks`)

The `agents/` directory contains the 6 subagents that `/execute-tasks` dispatches per deliverable. Without them, the autonomous build phase cannot run. They are project-agnostic — each reads conventions from the consuming project's `.claude/rules/` at dispatch time.

| Agent | Purpose | Dispatched when |
|-------|---------|-----------------|
| `implementer` | Implements one deliverable, writes tests, self-reviews | Every deliverable |
| `spec-reviewer` | Verifies code matches spec (compliance matrix) | After implementer reports DONE |
| `quality-reviewer` | Checks code against `.claude/rules/` conventions | After spec passes |
| `test-reviewer` | Checks test quality | After quality passes, if tests exist |
| `code-reviewer` | Holistic full-feature review (cross-deliverable concerns) | After all deliverables pass |
| `design-reviewer` | Holistic visual/design audit of the feature UI against Refactoring UI principles | After code review passes |

Install them globally (once) so every project can run `/execute-tasks` — see the symlink loop in [Installation](#manual-clone--symlink). Alternatively, copy them per-project into `.claude/agents/`.

## Rules (Seed Templates for Project Conventions)

The `rules/` directory contains 16 `.claude/rules/` seed files distilled from a production React/Next.js project. `/setup-daher-skills` copies the subset relevant to your stack into your project's `.claude/rules/` — skills and agents read them from there at run time.

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
# Manual alternative to /setup-daher-skills — copy rules yourself
cp ~/claude-skills/rules/component-hook-separation.md .claude/rules/
cp ~/claude-skills/rules/error-handling.md .claude/rules/
```

## Hooks (Deterministic Guardrails)

Instructions are advisory; hooks are deterministic. The plugin ships three (`hooks/hooks.json`):

| Hook | Event | What it does |
|------|-------|--------------|
| `check-build-before-commit` | PreToolUse (Bash) | Blocks `git commit` when build output is stale relative to source changes |
| `block-raw-palette` | PreToolUse (Write/Edit) | Blocks raw Tailwind palette classes in `.tsx`/`.jsx` — only in projects that carry `.claude/rules/color-usage.md` |
| `iron-law-stop` | Stop | Blocks ending a turn with modified source files until the project's verify command passes — **opt-in**, active only when `.claude/iron-law.json` exists (seeded by `/setup-daher-skills`) |

## Upstream Skills

Some skills were adapted from external sources. To pull updates, check the original repos:

| Skill | Source |
|-------|--------|
| `/refactoring-ui` | [Refactoring UI by Wathan & Schoger](https://refactoringui.com) |
| `/receiving-code-review` | [obra/superpowers](https://github.com/obra/superpowers) (adapted) |
| `/writing-skills` | [obra/superpowers](https://github.com/obra/superpowers) (adapted) + [Anthropic skill authoring docs](https://docs.claude.com) |
| `/test-mobile-app`, `/ios-simulator`, `/android-emulator` | Patterns distilled from [pingdotgg/t3code](https://github.com/pingdotgg/t3code) `.agents/skills`, itself partly adapted from OpenAI's [`build-ios-apps`](https://github.com/openai/plugins/tree/main/plugins/build-ios-apps) (MIT). Rewritten generically — no T3-specific commands, tooling, or stack assumptions carried over. |

These skills are snapshots — they don't auto-update. When the upstream source changes, review it and update the skill content manually.

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
