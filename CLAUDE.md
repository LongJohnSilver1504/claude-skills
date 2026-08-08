# claude-skills — Maintainer Guide

This repo is a Claude Code **plugin**: 23 skills, 6 agents, 3 hooks, and 16 seed rules forming a feature-development pipeline. Consumers install it and run `/setup-daher-skills` once per project.

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

## Release checklist

1. `node scripts/validate-skills.mjs` && `node scripts/sync-version.mjs --check`
2. `claude plugin validate . --strict`
3. CHANGELOG entry explaining the *why*, not just the what
4. Bump `package.json` version → `npm run sync-version`

## Writing style for skills

- `**Done when:**` gates on numbered steps — prefer a runnable check over a descriptive condition.
- Formulate in positive ("stage specific files") over prohibition where possible; prohibitions that stay must carry the failure they prevent.
- Test before trusting: a new or heavily edited skill gets one subagent run with a realistic prompt (see `writing-skills`).
