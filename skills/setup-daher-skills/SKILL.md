---
name: setup-daher-skills
description: One-time per-project setup for the claude-skills plugin — detects the project's stack, seeds .claude/rules/ and docs/agents/project-conventions.md, and wires CLAUDE.md.
disable-model-invocation: true
---

# Setup Daher Skills

Run once per project (re-running is safe — see Idempotency). This is what makes every other skill in the plugin work: they read the files this skill seeds, and fail with `Run /setup-daher-skills first — missing <file>` when they're absent.

**Division of labor:** finding **facts** about the project is your job — never the user's (search the codebase yourself). **Decisions** belong to the user.

## Step 0: Idempotency Check

If `docs/agents/project-conventions.md` already exists, switch to **update mode**: read it, re-run detection (Step 1), present only the values that differ or are new, and ask whether to update them. Never silently overwrite an existing config.

**Done when:** you know whether this is a fresh setup or an update, and (in update mode) you have the existing values loaded.

## Step 1: Detect the Project

Gather every fact you can without asking:

| Fact | How to detect |
|------|---------------|
| Package manager | Lockfile: `pnpm-lock.yaml` → pnpm, `yarn.lock` → yarn, `bun.lockb` → bun, `package-lock.json` → npm |
| Build / test / lint / dev commands | `package.json` scripts (`build`, `test`, `lint`, `typecheck`, `dev`) |
| New-code root (`{app}`) + features root | Glob for `src/features/`, `src/new-app/`, `app/`, `src/` |
| Base / integration branch | `git remote show origin` (HEAD branch); check whether `develop` exists |
| Error surface | Grep for `useNotification`, `toast.`, `sonner`, `notistack` in the app code |
| Viewport policy | Grep for a container component (`AppContainer` or similar) and for `sm:`/`md:`/`lg:` usage — responsive vs mobile-only |
| i18n / locales | `public/locales/*`, i18n config files |
| Test runner | `vitest.config.*` / `jest.config.*` |
| UI kit | `components.json` (shadcn), Tailwind version in `package.json` |

**Done when:** every row above has a value or an explicit "not found".

## Step 2: Confirm With the User

Present findings with recommendations, then ask **one AskUserQuestion round for the whole open frontier** — batch independent questions (up to 4 per call); a question whose answer depends on another open one waits for the next round. Recommended option first, marked "(Recommended)".

Decisions to resolve (skip any that detection settled unambiguously):

1. **Rules subset** — which `.claude/rules/` files to seed. Recommend based on detection (e.g. skip `form-patterns.md` if no react-hook-form; skip `zustand-patterns.md` if no zustand). Full catalog in the plugin's `rules/README.md`.
2. **Base branch** for PRs (if both `develop` and `main` exist).
3. **Viewport policy** — mobile-only (default) vs responsive; which container component; allowed breakpoints.
4. **Error surface** — how errors are shown to users.
5. **Permissions allowlist** — seed `.claude/settings.json` with safe commands for the detected package manager (fewer approval interruptions during `execute-tasks`)?
6. **Iron-Law Stop hook (opt-in)** — seed `.claude/iron-law.json` with a fast verify command (recommend `{pm} vitest run --changed --passWithNoTests`, or `tsc --noEmit` for projects without tests)? Explain: it mechanically blocks ending a turn with modified source files until the verify command passes.

**Done when:** every decision has a user answer or a detection-backed default the user saw.

## Step 3: Write the Config

1. **`.claude/rules/`** — copy the chosen rule files from the plugin's `rules/` directory. Resolve the plugin root: `${CLAUDE_PLUGIN_ROOT}` if set; otherwise the directory two levels above this skill's own directory (this skill lives at `<plugin-root>/skills/setup-daher-skills/`).
2. **`docs/agents/project-conventions.md`** — fill [templates/project-conventions.md](templates/project-conventions.md) with the confirmed values.
3. **Project `CLAUDE.md`** — append the block from [templates/claude-md-block.md](templates/claude-md-block.md) (create the file if missing; in update mode, replace the previous block between its markers). The block uses `@docs/agents/project-conventions.md` import syntax — one source of truth, zero drift — and carries the compaction instruction that protects `execute-tasks` from auto-compact.
4. **`.claude/settings.json`** (if accepted) — merge the permissions allowlist for the detected package manager. If the file exists, **read it and merge into the existing `permissions.allow` array** — never clobber other settings.
5. **`.claude/iron-law.json`** (if accepted) — `{ "verify": "<command>", "timeoutSeconds": 120 }`.

**Done when:** every accepted file exists on disk and `cat docs/agents/project-conventions.md` shows the confirmed values.

## Step 4: Verify and Report

1. Re-read each written file — confirm valid content (JSON parses, markdown has no placeholders left).
2. Report: files written, files skipped and why, values chosen.
3. Point the user at the pipeline: "Start with `/brainstorm` (vague idea) or `/generate-prd` (clear feature); `/pipeline-help` explains the full flow."

**Done when:** the report lists every file with its path and the user knows the next command.

## Rules

- Never guess a project value silently — detect it, or ask.
- Never overwrite user-edited config without showing the diff and asking.
- Seeded files belong to the project — tell the user they can edit them freely; skills read them at run time.
