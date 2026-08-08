# Changelog

Each entry records the *why* behind the change, not just the what.

## 3.0.0 (2026-08-08)

The "usable by people who aren't Daher" release. Until now the repo worked reliably only on its author's machine: skills referenced `.claude/rules/` files the plugin never installs, agents pointed at `~/.claude/skills/...` paths that don't resolve in a plugin install, and TruckBays conventions (pnpm, `AppContainer`, `develop` base branch) were hardcoded as if universal.

### Added
- **`setup-daher-skills` skill** — one-time per-project setup: detects package manager, structure, and base branch; seeds the chosen `.claude/rules/` subset, `docs/agents/project-conventions.md`, a permissions allowlist, and (opt-in) the Iron-Law verify config; adds a skills block with `@`-import to the project's CLAUDE.md. This is what turns the repo from personal config into an installable plugin.
- **Real hooks** (`hooks/hooks.json`) — instructions are advisory, hooks are deterministic: `check-build-before-commit` (blocks `git commit` when build output is stale vs. source), `block-raw-palette` (blocks raw Tailwind palette classes in `.tsx` for projects carrying `color-usage.md`), `iron-law-stop` (opt-in Stop hook that blocks turn end until the project's verify command passes). Four files used to *claim* hooks that didn't exist; now they point at these.
- **`scripts/validate-skills.mjs`** — CI validator: frontmatter validity, SKILL.md line budget (<500), no cross-skill path references, no references to nonexistent skills, skill-count consistency across package.json / plugin.json / README.
- **`scripts/sync-version.mjs`** (`--check` for CI) — package.json is the single version source of truth; plugin.json follows.
- **`.claude-plugin/marketplace.json`** — the README documented `/plugin marketplace add` but no marketplace manifest existed.
- **CI workflow** (`.github/workflows/validate.yml`) running both scripts on every push/PR.
- **`CLAUDE.md`** at repo root with maintenance invariants (count sync, router re-sync, description formula).

### Changed
- **Descriptions follow the invocation-mode formula** — model-invoked skills state *what + "Use when" triggers + "NOT for"*; manual-only skills carry `disable-model-invocation: true` and a one-line description (context-budget win: trigger lists for slash-only skills were paid every session and never used).
- **Reviewer agents hardened** — `spec-reviewer`, `quality-reviewer`, `test-reviewer`, `code-reviewer` now declare restricted `tools:` (a reviewer that can Write/Edit the code it audits is a risk); explicit `model:` per role; `design-reviewer` adopts the same `Status: PASS | CONCERNS | FAIL` + TRIVIAL/ARCHITECTURAL contract as its siblings (two incompatible report formats for one triage loop was a bug); test-reviewer's "run the tests first" precondition moved to the top of its prompt.
- **Cross-skill dependencies are prose invocations** ("run the `/refactoring-ui` skill"), never file paths — `~/.claude/skills/...` paths broke on every plugin install.
- **Reviewer discipline (context engineering)** — all six agents now cap their reports (findings only, `file:line`, ≤120 lines, no process narration) and carry an anti-overengineering clause: only gaps affecting correctness or stated requirements are findings; a clean PASS is a valid answer.
- **`audit-branch` is the single review-loop primitive** — `execute-tasks`' post-execution phase now delegates to it instead of duplicating the fan-out/triage/fix loop.
- **Long skills slimmed via progressive disclosure** — `frontend-testing` (512→<400 lines, factories moved to `references/factories.md`), `execute-tasks` (431→~300, PROGRESS format + design-review loop extracted to references).
- **Pipeline skills carry `Done when:` gates** on their numbered steps.

### Removed
- References to skills that don't exist in this repo: `/to-issues`, `shadcn-ui`, `tailwindcss-fundamentals-v4`.

## 2.2.0 (2026-08-01)

- Session-mining improvements: `audit-branch` skill (holistic post-hoc review of ad-hoc branches), smoke-walk gate in `finish-feature`, backend-checkout-first contract verification.
- `modify-feature` skill — extend/refactor existing code with discipline.

## 2.0.0 (2026-07)

- API Boundary (Anti-Corruption Layer) pattern adopted across create-feature, frontend-testing, and rules.
- Full skill-collection overhaul: paths made project-defined via `.claude/rules/project-structure.md`, prototype skill moved into the repo, refactoring-ui designer+reviewer merged, high-value practices imported from obra/superpowers, skills superseded by built-ins removed.
- Bundled the 6 `execute-tasks` subagents as a repo dependency; final holistic design-review stage.
- Rules synced from the production project: 10 → 16.

## 1.0.0 (2026-03-28)

### Initial Release

- Full feature development pipeline from brainstorming to merge
- Example project convention rules
- Claude Code plugin manifest for installation
