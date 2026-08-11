---
name: finish-feature
description: Finalize a feature — run tests, build, and present options for committing, creating a PR, or discarding. Use when user says "finish", "wrap up", "done", "create PR", "merge", or wants to finalize their work on a feature.
---

# Finish Feature

Verify the feature is ready, then help the user decide what to do with it.

## Process

### Step 1: Verify

Run these checks in order:

1. **Feature tests:** the project's test command scoped to the feature (from `docs/agents/project-conventions.md`; e.g. `pnpm vitest run {feature-dir}`, where `{feature-dir}` comes from `.claude/rules/project-structure.md`).
   **If the glob matches 0 test files, treat verification as FAILED** — the path is wrong or tests are missing; never report a vacuous pass.
   Report: X tests passed, Y failed

2. **Build:** the project's build command (e.g. `pnpm build`). Report: success or failure with error summary

3. **Uncommitted changes:** `git status`. Report: X files modified, Y untracked

If tests or build fail, report the failures and ask the user:
- **Fix the issues** — investigate and fix
- **Continue anyway** — proceed to Step 2 despite failures
- **Stop** — abort finalization

**Done when:** you have fresh test output, fresh build output, and a `git status` snapshot from THIS session — or an explicit user decision to continue despite failures.

### Step 1.5: Browser Smoke-Walk (UI features — mandatory gate)

"Tests green" has repeatedly NOT meant "flow works" — session mining found ~35+ manual QA rounds where the human caught redirect bugs, runtime schema crashes, and viewport breaks that the unit suite structurally cannot see. If the feature has visual components or user flows, walk it in a real browser BEFORE offering commit/PR:

1. **Get a dev server — reuse before start.** If a dev server for THIS worktree is already running, probe it (the app responds, not an error page) and reuse it. Otherwise start the project's dev command (from `docs/agents/project-conventions.md`) in the background and **read the actual port/URL from its output** — never assume the default port. In parallel-worktree setups an occupied default port is usually a sibling worktree's server: **never kill a process this session didn't start**; start on a free port instead.
2. Walk the CHANGED flow only — ≤15 steps, at the project's real viewport (from `docs/agents/project-conventions.md`; mobile-only projects: use the Playwright MCP's device emulation if configured, e.g. `--device "iPhone 15"`, or whatever browser tooling the session has). Derive the steps from the UX spec's flow matrix when one exists.
3. At each key state: screenshot, and check the console/network panel for errors (uncaught exceptions, 4xx/5xx, literal `undefined` in query params, Zod VALIDATION_ERRORs). A rendered page with a clean console is not yet a pass — confirm the concrete expected state of the step (real data loaded, the mutation visible), not an empty shell or disconnected state.
4. Report pass/fail per step with the screenshots. A failed step blocks the commit/PR offer — fix first (or the user explicitly waives).

**Authentication (how the walk gets a session — in this order, never improvise):**
1. **Mock mode (default)**: run the dev server with the project's mock flag enabled; before first navigation, inject a fake session in the exact shape the project's auth layer expects (see the auth feature's domain types + testing factories) via Playwright `addInitScript`/`localStorage`. Client-side expiry checks need a token with a future `exp`; mocked endpoints don't validate it. Zero real credentials, fully deterministic.
2. **Staging (opt-in only)**: reuse a saved Playwright `storageState` file from a ONE-TIME manual login with a dedicated TEST user (never real user data). The state file lives in a gitignored path (e.g. `.playwright/`); when it's missing or expired, STOP and report "auth wall — needs a one-time manual login", don't attempt to script OTP/password flows.
3. **Never**: credentials or OTPs in the repo/skill, auth bypasses in production code, or guessing at login forms.

Skip only for pure-logic, infrastructure, or docs-only changes — say so explicitly ("smoke-walk skipped: no UI surface"). Keep walks under ~15 steps; longer flows degrade browser-agent reliability — split or fall back to manual QA for the tail.

**Keep the environment alive.** The lifecycle boundary is the user's iteration loop, not this turn: don't stop the dev server because the walk passed or the turn is ending — the user will likely iterate. Leave it running and include its URL in the report; stop it only in Cleanup below.

**Troubleshooting the walk:**

- **Default port occupied** → likely a sibling worktree's server; read the real port from your dev command's output, never kill the occupant.
- **Old or unexpected UI** → confirm the browser points at THIS worktree's server (right port) before diagnosing the code.
- **Blank page** → console + network first; distinguish "server down" from "app crashed on mount".
- **Auth wall** → follow the Authentication order above; never improvise logins.

**Done when:** every step of the walked flow has a screenshot + pass/fail, or the report says "smoke-walk skipped: no UI surface".

### Step 2: Read Branch Context

Look for PROGRESS.md files to determine the base branch:

1. Check for `PROGRESS.md` in the feature directory (under the features root per `.claude/rules/project-structure.md`)
2. Read the `**Base Branch**` field if it exists
3. If found, use it as the target for PR creation and merge operations
4. If not found, use the base/integration branch from `docs/agents/project-conventions.md`; only ask the user when no convention is documented, and offer to record the answer there

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

Invoke the `git-commit` skill for the commit flow — it owns build-freshness, user confirmation, grouping commits by layer, and message format.

### If "Create PR"

1. First commit all changes (via the `git-commit` skill, as above)
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
2. Stop the smoke-walk dev server **only if this session started it** — leave a reused or sibling-worktree server running.

## Rules

- **Always ask before committing** — never auto-commit
- **Commit flow is owned by the `git-commit` skill** — build-freshness, layer grouping, and message conventions live there, not here
- **Never force-push** unless user explicitly requests it
- **Never discard without confirmation** — destructive operations require explicit "yes"
