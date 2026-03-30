---
name: finish-feature
description: Finalize a feature — run tests, build, and present options for committing, creating a PR, or discarding. Use when user says "finish", "wrap up", "done", "create PR", "merge", or wants to finalize their work on a feature.
---

# Finish Feature

Verify the feature is ready, then help the user decide what to do with it.

## Process

### Step 1: Verify

Run these checks in order:

1. **Feature tests:**
   ```bash
   pnpm vitest run src/new-app/features/{feature}/
   ```
   Report: X tests passed, Y failed

2. **Build:**
   ```bash
   pnpm build
   ```
   Report: success or failure with error summary

3. **Uncommitted changes:**
   ```bash
   git status
   ```
   Report: X files modified, Y untracked

If tests or build fail, report the failures and ask the user:
- **Fix the issues** — investigate and fix
- **Continue anyway** — proceed to Step 2 despite failures
- **Stop** — abort finalization

### Step 2: Read Branch Context

Look for PROGRESS.md files to determine the base branch:

1. Check for `PROGRESS.md` in the feature directory (`src/new-app/features/{feature}/`)
2. Read the `**Base Branch**` field if it exists
3. If found, use it as the target for PR creation and merge operations
4. If not found, ask the user which branch to target

Also check `.claude/pipeline/{feature}/` for any pipeline artifacts.

### Step 3: Present Options

Use AskUserQuestion to present:

- **Review changes** — show `git diff --stat` and a summary of what was built
- **Commit changes** — stage and commit (will ask for message guidance, split by concern)
- **Create PR** — commit + push + create PR via `gh pr create`
- **Keep as-is** — leave changes uncommitted on current branch
- **Discard changes** — WARNING: this is destructive. Confirm before proceeding.
- **Something else**

### If "Commit changes"

1. Run `git status` and `git diff --stat` to see what's changed
2. Ask the user for commit message guidance or suggest based on the changes
3. Split commits by layer/concern:
   - Infrastructure changes (new packages, config)
   - Domain/API layer changes
   - Hook/business logic changes
   - Component/UI changes
   - Test files
4. Run `pnpm build` before each commit to verify
5. Never add `Co-Authored-By` lines

### If "Create PR"

1. First commit all changes (following the commit flow above)
2. Push current branch:
   ```bash
   git push -u origin {branch-name}
   ```
3. Create PR targeting the base branch (from Step 2):
   ```bash
   gh pr create --base {base-branch} --title "{title}" --body "{body}"
   ```
   - Base: from PROGRESS.md `Base Branch` field, or ask user if not found
   - Title: short, under 70 chars, describes the feature
   - Body: summary from the implementation plan + PROGRESS.md, test plan checklist
4. Return the PR URL to the user

### If "Discard changes"

**This is destructive.** Always confirm:

> "This will discard ALL uncommitted changes on this branch. Are you sure? This cannot be undone."

Only proceed if user explicitly confirms.

## Cleanup

After committing or creating a PR:

1. Clean up pipeline artifacts if they exist:
   - `.claude/pipeline/{feature}/DESIGN.md` (brainstorm output)
   - Any `*-implementation-plan.md` execution PROGRESS.md

## Rules

- **Always ask before committing** — never auto-commit
- **Always run `pnpm build` before committing** — catch type errors early
- **Split commits by concern** — not one giant commit
- **Never force-push** unless user explicitly requests it
- **Never discard without confirmation** — destructive operations require explicit "yes"
- If the user says "just commit everything", still run the build first but don't split commits
