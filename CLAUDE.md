# claude-skills — Maintainer Guide

This repo is a Claude Code **plugin**: 26 skills, 6 agents, 3 hooks, and 16 seed rules forming a feature-development pipeline. Consumers install it and run `/setup-daher-skills` once per project.

## Invariants (checked by `node scripts/validate-skills.mjs` — run it after ANY change)

1. **Counts stay in sync.** The number of `skills/*/SKILL.md` directories must match the "N skills" claim in README.md, package.json, and `.claude-plugin/plugin.json`.
2. **One version, one source.** `package.json` is the version source of truth; `.claude-plugin/plugin.json` follows via `npm run sync-version`. CI runs `--check`.
3. **No cross-skill file paths.** Skills and agents reference other skills by prose invocation ("run the `/x` skill") or agent `skills:` preload — never `skills/<other>/...` or `~/.claude/...` paths (they break on plugin installs).
4. **Descriptions follow the invocation-mode formula.** Model-invoked: *what + "Use when \<triggers\>" (+ "NOT for" when skills compete)*. Manual-only: `disable-model-invocation: true` + one line. A skill referenced by another skill's transition (e.g. `git-commit`, `finish-feature`) must NOT be manual-only — the model has to be able to invoke it.
5. **The router never lies.** `pipeline-help` must be re-synced whenever any pipeline skill's routing, inputs, or outputs change — a router mentioning a skill that doesn't exist (or missing one that does) is a router that lies. Same for the README catalog.
6. **SKILL.md < 500 lines.** Depth goes to `references/` (progressive disclosure). Artifact formats live in `references/*-FORMAT.md` (PRD-FORMAT, UX-SPEC-FORMAT, PLAN-FORMAT, PROGRESS-FORMAT).
7. **Canonical blocks are byte-identical.** The `> **Project config:**` preamble and the two mirrored `shared-conventions.md` files must not drift (validator enforces).
8. **Reviewer agents are read-only.** Every `agents/*-reviewer.md` declares `tools:` without Write/Edit, reports with the shared contract (`Status: PASS | CONCERNS | FAIL` + TRIVIAL/ARCHITECTURAL tags, ≤120 lines), and carries the anti-overengineering clause.
9. **Hooks are real or absent.** Never write "a hook blocks X" unless the hook exists in `hooks/` and is wired in `hooks/hooks.json`. Instructions are advisory; hooks are deterministic — critical verification rules get a hook, not prose.
10. **No TruckBays values in generic content.** Project-specific values (package manager, base branch, error surface, viewport container) live in the seeded `docs/agents/project-conventions.md`; skills reference the file, with `pnpm`-style commands only as examples ("e.g. `pnpm build`").
11. **Retired means deleted.** Removing a skill = delete the directory + remove every reference (README, pipeline-help, plugin counts) + CHANGELOG entry naming the replacement. No deprecated/ graveyard.
12. **Rejected ideas live in `.out-of-scope/`.** One file per concept with the decision and the why — check it before proposing "new" ideas.
13. **Every released version is recoverable.** It has a `claude-skills--vX.Y.Z` tag at the commit that shipped it and a `## X.Y.Z (date)` CHANGELOG section (validator enforces the section for the current version). Without both, "go back to the version before it broke" is guesswork.

## Releases

Record what changed under `## [Unreleased]` in CHANGELOG.md **as the work lands** — while you still remember the why. Then, from `main` after your PR is merged:

```bash
npm run release -- <patch|minor|major> --dry-run   # prints all 10 steps, changes nothing
npm run release -- <patch|minor|major>
```

`scripts/release.mjs` *is* the checklist: guards (on main, clean, in sync) → validators + both plugin validations → require `[Unreleased]` notes → bump + `sync-version` → cut the CHANGELOG section → **re-validate after the bump** → commit → `claude plugin tag --push` → push → `gh release create` with the section as notes.

**`claude plugin validate` takes two invocations, and only one of them looks at skills:**

```bash
claude plugin validate .claude-plugin/plugin.json   # plugin + every SKILL.md (no --strict: root CLAUDE.md warns)
claude plugin validate . --strict                   # marketplace manifest only
```

`.` resolves to `marketplace.json` and exits 0 even when a skill's frontmatter doesn't parse — which is how a broken `audit-branch` description survived two releases.

Don't hand-bump the version: the old manual checklist ran `--check` *before* the bump, so it validated the previous version and nothing re-checked afterwards.

To see what changed between versions: `npm run changes -- 3.0.0 3.1.0`.

## Writing style for skills

- `**Done when:**` gates on numbered steps — prefer a runnable check over a descriptive condition.
- Formulate in positive ("stage specific files") over prohibition where possible; prohibitions that stay must carry the failure they prevent.
- Test before trusting: a new or heavily edited skill gets one subagent run with a realistic prompt (see `writing-skills`).
