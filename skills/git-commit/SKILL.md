---
name: git-commit
description: Create git commits following the project's conventional commit style with descriptive bullet-point bodies. Use when user says "commit", "save changes", or invokes /commit.
---

# Git Commit

Create git commits following the project's conventional commit style with descriptive bullet-point bodies.

## When to Use

- User says "commit", "save changes", "create a commit"
- After completing a feature, fix, or refactor
- When user invokes `/commit`

## Commit Style

Based on the project's commit history, commits follow this format:

### Subject Line

```
{type}: {Short imperative description}
```

**Types:**
| Type | When |
|------|------|
| `feat` | New feature or capability |
| `fix` | Bug fix |
| `refactor` | Code restructuring without behavior change |
| `chore` | Dependencies, config, tooling, cleanup |
| `test` | Adding or updating tests |
| `docs` | Documentation only |

**Rules:**
- Imperative mood ("Create", "Add", "Update", "Fix" — not "Created", "Added")
- Start with capital letter after the colon
- No period at the end
- Under 72 characters

### Body (Required for non-trivial commits)

```
- Bullet point describing a key change
- Another key change
- Group related changes logically
```

**Rules:**
- Each bullet starts with `- ` (dash + space)
- Each bullet is imperative mood ("Add X", "Update Y", "Wire Z")
- Focus on WHAT changed, not WHY (the subject covers the why)
- 3-8 bullets typical for feature commits
- Skip the body for single-file trivial changes

### No Co-Authored-By

Per user preference, do NOT add `Co-Authored-By` lines.

## Process

### Step 0: Build Freshness

Ensure a successful `pnpm build` ran within the last 30 minutes — the `check-build-before-commit.js` hook blocks commits otherwise. If not (or unsure), run `pnpm build` first and confirm it succeeds before proceeding. One fresh build covers all split commits in the same session.

### Step 1: Analyze and Group Changes

Split changes into **multiple focused commits by layer/concern**. Never combine everything into one monolithic commit.

**Grouping order (commit in this sequence):**

| Order | Type | What belongs |
|-------|------|-------------|
| 1 | `chore` | shadcn installs, dependencies, config, tooling |
| 2 | `feat` | Shared infrastructure (`ui/custom/`, `shared/`) |
| 3 | `feat` | Domain layer (types, pure functions, state logic) |
| 4 | `feat` | Feature code (API adapters, hooks, components, page wiring) |
| 5 | `test` | Tests (`.test.ts`, `.test.tsx`) |
| 6 | `docs` | PRDs, UX specs, README updates |

Not every commit group will apply — skip empty groups. If a group has only 1-2 trivial files, it can merge into the nearest related group.

For each group:
- Identify the type (feat/fix/refactor/chore/test/docs)
- Draft subject line and body bullets

### Step 2: Confirm With the User

**Always confirm with the user before creating any commit** (standing preference — never auto-commit). Present the planned groups with their draft messages and wait for approval before staging anything.

### Step 3: Stage and Commit Each Group

For each approved group:

1. **Stage** specific files by name — never use `git add -A` or `git add .`
2. **Commit** with the drafted subject and body, then move to the next group

- Do NOT stage files that contain secrets (.env, credentials)

### Step 4: Verify

Run `git status` after all commits to confirm clean working tree.

## Examples

### Feature commit (multi-file)

```
feat: Create reservation details feature

- Add reservation detail page with checkout guide dialog
- Implement multi-step dialog with embla carousel and numbered pills
- Add location API adapter with AppError transformation
- Add checkout guide store with zustand for auto-open timer
- Wire Sonner toast provider in _app.tsx
- Route file is thin re-export, page component lives in feature
```

### Refactor commit

```
refactor: Move custom UI components to ui/custom

- Move AppContainer, BackButton, TruckerNavbar, LanguageSelector
  from shared/layouts/ to ui/custom/
- Move FuelMeter and Stepper from shared/components/ to ui/custom/
- Separate custom hand-crafted UI from shadcn CLI-managed primitives
```

### Fix commit

```
fix: Correct warehouse data extraction in checkout flow

- Update daily and hourly pay-invoices pages to access nested data property
```

### Chore commit

```
chore: Update dependencies and config

- Add embla-carousel, sonner, and zustand dependencies
- Add jsdom polyfills for Radix UI pointer capture APIs
- Update .gitignore and tsconfig build info
```

### Small commit (no body needed)

```
feat: Create shared links
```

## Anti-Patterns

- **Don't use past tense** — "Created" → "Create", "Added" → "Add"
- **Don't use `git add .`** — stage specific files
- **Don't combine unrelated changes** — split into separate commits
- **Don't add Co-Authored-By** — user preference
- **Don't skip the body** for multi-file changes
- **Don't amend previous commits** unless explicitly asked
- **Don't push** unless explicitly asked

## PR Base

When a PR follows the commit, the base is the project's documented integration branch (check CLAUDE.md — e.g. `develop`), never assumed to be `main`.
