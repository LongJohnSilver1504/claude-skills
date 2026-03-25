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

### Step 2: Check Pipeline State

Look for active pipeline artifacts:

1. Check `.claude/pipeline/{feature}/OBSERVATION-LOG.md` — if it exists and has entries, the feature-retrospective observer was active
2. Check for `PROGRESS.md` in the feature directory

If the observer was active, suggest running `feature-retrospective` before finalizing:

> "The pipeline observer has entries for this feature. Run retrospective before finishing?"

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
3. Create PR:
   ```bash
   gh pr create --title "{title}" --body "{body}"
   ```
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
   - Keep: `OBSERVATION-LOG.md`, `RETRO.md` (retrospective artifacts)

2. Update the feature-flow `PROGRESS.md` if one exists:
   - Mark "finish-feature" as complete

## Rules

- **Always ask before committing** — never auto-commit
- **Always run `pnpm build` before committing** — catch type errors early
- **Split commits by concern** — not one giant commit
- **Never force-push** unless user explicitly requests it
- **Never discard without confirmation** — destructive operations require explicit "yes"
- If the user says "just commit everything", still run the build first but don't split commits
