# Changelog

Each entry records the *why* behind the change, not just the what.

Work in progress is recorded under `## [Unreleased]` as it lands; `npm run release` turns that section into the next version's entry.

## [Unreleased]

## 3.2.3 (2026-08-11)

### Added
- **`.gitignore`** — the repo had none, so OS and npm scratch files showed up as untracked noise in every session. Covers `.DS_Store`, `node_modules/`, and editor scratch. Deliberately *not* `package-lock.json`: this package declares no dependencies today, but if that changes the lockfile should be committed, and ignoring it now would silently prevent that.

### Changed
- **The plugin install is documented first, and labelled recommended** — it was second behind "Clone + Symlink (Primary)", which is backwards now that releases are tagged: the plugin path is the one with pinned versions, `claude plugin update`, and a rollback story. The symlink path is documented as what it actually is — tracks `main`, no version pinning, and a stale clone silently serves old skills.
- **README warns against running both installs for the same skills** — each loads independently, so duplicates cost context twice, and a stale clone next to a current plugin serves two versions of one skill under two names. (Found live: a `~/claude-skills` clone 18 commits behind was feeding `~/.claude/skills` while the plugin was current.)
- **Upstream attribution for the mobile skills** — the Upstream Skills table now credits pingdotgg/t3code and, through it, OpenAI's `build-ios-apps`.
- **Corrected 3.2.0's account of the YAML frontmatter bug.** It stated as fact that the three skills "loaded with no name and no description and could never be model-invoked", and that `audit-branch` had been "dead since 2.2.0". That was inferred from `claude plugin validate`'s warning text, not observed: in practice those descriptions did load — Claude Code's runtime loader tolerates the form that the strict validator rejects. What is established is that the invalid frontmatter blocks releases (`claude plugin tag` refused) and is a latent bug worth fixing. The entry and the published 3.2.0 release notes now say only that.

## 3.2.2 (2026-08-11)

### Fixed
- **`create-feature` promised a hook that doesn't exist** — its templates said the DTO-import ban was "(hook-enforced)", but no hook in this plugin enforces it (the three wired hooks are `check-build-before-commit`, `block-raw-palette`, `iron-law-stop`). Invariant 9 exists because a false guarantee is worse than an honest convention: the reader stops checking. Now stated as rule-enforced, with a project hook as the way to make it mechanical.
- **The validator now gates hook claims** — prose matching "hook-enforced" / "hook enforces|blocks|prevents" must name a hook that actually exists in `hooks/` *and* is wired in `hooks/hooks.json`.

## 3.2.1 (2026-08-11)

### Fixed
- **`api-boundary.md` was a dead rule** — 12+ places across `create-feature`, `frontend-testing`, `modify-feature`, `react-clean-architecture`, `prd-clarifier`, and the `quality-reviewer` agent instruct the model to read `.claude/rules/api-boundary.md` ("Full rule: …"), but the rule was missing from `rules/README.md`'s catalog — the table `/setup-daher-skills` offers. So it was never seeded, and in every fresh project those instructions pointed at a file that didn't exist. Same failure species as the `audit-branch` frontmatter: silent, and invisible to CI.
- **The validator now guards the rule catalog in both directions** — every `rules/*.md` must have a catalog row, every catalog row must have a file, every `rules/<x>.md` referenced by a skill or agent must exist, and CLAUDE.md's "N seed rules" claim must match the count (it said 16 for 17 rules).
- **`pipeline-help` omitted 7 skills that exist** — `modify-feature`, `frontend-testing`, `systematic-debugging`, `create-devtool`, and the three mobile skills had no route anywhere in the router, which invariant 5 exists to prevent. Added an "Outside the Pipeline" table so asking "which skill do I use" can reach every skill.
- **`release.mjs` glued the cut version heading to the first `###` subsection** — the `## [Unreleased]` matcher used `\s*$`, and `\s` matches newlines, so it swallowed the blank line after the heading (visible in 3.2.0's own entry). Both scripts now anchor with `[ \t]*$`.

## 3.2.0 (2026-08-11)

### Fixed
- **Three skills had frontmatter that didn't parse as YAML** (`audit-branch`, `android-emulator`, `ios-simulator`) — an unquoted `: ` inside the description ("NOT for: single-deliverable…", "verification: launching…") makes a strict parser read a nested mapping and reject the frontmatter block. `claude plugin tag` refused to cut this release because of it, so the invalid form blocks shipping; Claude Code's runtime loader turned out to be more forgiving (those descriptions did load), so the practical impact was a latent bug rather than a dead skill. `audit-branch` carried the invalid form since 2.2.0. Descriptions rephrased with em dashes to stay plain scalars.
- **The validator now catches that class**: an unquoted frontmatter value containing `": "` or `" #"` fails with the fix. The old check regex-matched `description:` and never verified the YAML parsed — which is why the invalid form passed CI for two releases.
- **`claude plugin validate` was being called in the one form that skips skills.** `claude plugin validate . --strict` resolves to `marketplace.json` and exits 0 even when a SKILL.md is unparseable; `claude plugin validate .claude-plugin/plugin.json` validates the plugin and every skill. CI, the release script, and CLAUDE.md now run both (the plugin path without `--strict`, since the root CLAUDE.md is a maintainer guide rather than shipped context). Found because `claude plugin tag` runs the real validation and refused to tag.

### Added
- **`scripts/release.mjs`** (`npm run release -- <patch|minor|major>`, `--dry-run`) — one command replaces the manual release checklist, in an order that actually works: validate → require `[Unreleased]` notes → bump → re-validate → commit → tag → push → GitHub Release. The old checklist ran `sync-version --check` *before* the bump, so it validated the previous version and nothing re-checked afterwards.
- **`scripts/changes.mjs`** (`npm run changes -- 3.0.0 [3.1.0]`) — answers "what changed between these two versions": the CHANGELOG section, the commits, the file stat, and which skills appeared or disappeared.
- **Release tags** — every version now has a `claude-skills--vX.Y.Z` tag (the scheme `claude plugin tag` produces and validates), so `git diff` between versions and rollback to a known-good point are possible. `3.0.0` and `3.1.0` were tagged retroactively at their real commits; pre-3.0 stays untagged (no verifiable commit).
- **`## [Unreleased]` buffer** in this file — the *why* gets written while the work is fresh instead of being reconstructed at release time.
- **README "Versions & rollback"** — how to see what changed, update, roll back per install method, and fix a broken version. Documents the verified constraint that `claude plugin` has no downgrade: for plugin installs the supported rollback is forward (revert on `main`, ship a patch).

### Changed
- **`validate-skills.mjs` requires a CHANGELOG heading for the current version** — publishing a version whose changes were never narrated is exactly the failure this work exists to prevent.
- **`CLAUDE.md` release checklist replaced by the script** plus an invariant: every released version has a tag and a CHANGELOG section.

## 3.1.0 (2026-08-11)

Patterns mined from pingdotgg/t3code's `.agents/skills` (itself partly adapted from OpenAI's `build-ios-apps` plugin). Their four skills are T3-product-specific and not importable, but they exemplify environment-lifecycle discipline our set lacked entirely: zero dev-server lifecycle guidance, zero troubleshooting sections, zero worktree awareness (despite all work happening in parallel Orca worktrees), and an evidence rule that only pointed one way.

### Added
- **Mobile skill set** (`test-mobile-app`, `ios-simulator`, `android-emulator`) — generic runtime verification for mobile targets, distilled from t3code's skills with the product-specific parts removed. `test-mobile-app` owns the workflow (platform selection, lightest-valid-launch-path, bundler reuse, evidence-gated verification); the platform skills own the mechanics (pinned UDID/serial, semantic UI driving over coordinates, deep links, scoped logs, own-what-you-started cleanup). Not part of the 8-step pipeline.
- **`.out-of-scope/agents-dir-portability.md`** — records the decision NOT to adopt the `.agents/skills` + `openai.yaml` multi-host convention (PRD non-goal A3; second metadata surface = drift risk).

### Changed
- **`finish-feature` smoke-walk learned environment lifecycle** — reuse a healthy dev server before starting one, read the real port from output (parallel worktrees shift ports), never kill a process the session didn't start, keep the server alive across turns while the user iterates (the lifecycle boundary is the iteration loop, not the turn), and a symptom→fix troubleshooting list. Rationale: the old text said only "reuse it if already running" with no health check, no port discipline, no retention.
- **`verification-before-completion` closes the inverse evidence gap** — it guarded "tests green ≠ flow works" but not "rendered page ≠ flow works"; new mapping rows require the concrete expected state, and a server claim requires the port printed this session.
- **`writing-skills` teaches the new patterns** — checklist item for skills that manage long-lived processes (ownership + troubleshooting section) and a Common Mistakes row against self-attested `Done when:` gates (runnable checks were already repo style, but the authoring skill never said so).
- **`project-conventions.md` template gains a `Dev command` row** (and setup detection reads the `dev` script) — the smoke-walk needed a documented dev command; before, it was implied.
- **`frontend-testing`** flags `test:watch` as a long-lived process to stop, preferring `vitest run` in agent sessions.

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
