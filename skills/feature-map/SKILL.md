---
name: feature-map
description: Create or refresh `docs/agents/feature-map.md`, the per-repo index that tells agents where each feature lives — its routes, directory, key files, backend endpoints, tests and docs. Use when the user asks for a feature map or a map of the codebase for agents, when a session starts with "Feature map is stale", after a feature was added, moved, renamed or removed, or when another skill needs to locate code and the project has no map yet. NOT for documenting one feature in depth (generate-feature-doc) or for a symbol-level index of functions and classes, which this skill deliberately does not build.
argument-hint: <create|update>
---

# Feature Map

One file per repository: `docs/agents/feature-map.md`. One row per feature — where it is, how a user reaches it, which backend endpoints it calls. An agent that reads it knows which directory to open before it greps anything.

**Feature level, on purpose.** A symbol index (every function, every class) is large, stale the day after it is written, and repeats what Grep already answers. The map holds only what search cannot tell you quickly: which directory is "the reservations feature", which legacy page still owns a route, which endpoints a screen depends on.

**Project values** (features root, new-code root, backend checkout) come from `docs/agents/project-conventions.md` and `.claude/rules/project-structure.md`. If neither exists, stop: "Run `/setup-daher-skills` first."

The plugin root below is `${CLAUDE_PLUGIN_ROOT}` if set, otherwise two levels above this skill's own directory.

## What keeps it honest

The map is prose; its machine state is `docs/agents/feature-map.lock.json` — the roots that are watched and the directory listing they had when the map was last written.

- `node "<plugin-root>/scripts/feature-map.mjs" check` compares the tree with the lock and prints `fresh`, or what was added and removed, which feature directories the map never mentions, and which paths it names that no longer exist.
- The plugin's `feature-map-stale` hook runs the same comparison when a session starts and says so in one line. It is silent in projects without a lock and never blocks.

So freshness is detected by a script and repaired by this skill. Nothing regenerates the map behind your back.

## Create

1. **Choose the roots.** Read `project-conventions.md` for the features root, then look for the others a user can reach code through: a file-based router (`src/app`, `src/pages`) and any area outside the features root that routes still render from. Find that area by counting, not by guessing: Grep the router root for import paths and tally the top-level directories they resolve to — a directory many routes import from is a root, whatever it is called. List what each holds:
   `node "<plugin-root>/scripts/feature-map.mjs" scan --root "<features root>" --root "<router root> files=page.tsx,route.ts"`
   Root specs: `"path"` (sub-directories), `"path depth=2"`, `"path files"` (every source file — a pages-style router), `"path files=page.tsx,route.ts"` (an app-style router).

   **Done when:** `scan` prints a non-empty listing for every root, and no directory a user-facing feature lives in is outside them.

2. **Read each feature just enough to fill its row** — the barrel, the names of its API and hook files, the first lines of its README if it has one. Do not read the feature end to end; a map row is five facts, not a summary.
   - *Entry points:* Grep the router root for imports that resolve into the feature's directory — routes often import one file, not the directory. A route that renders two features is listed under both.
   - *Backend:* the endpoints the feature's own code calls — method and path, not the handler. Take them from the endpoint constants, or from wherever the project defines paths. When paths live in a shared API layer and the feature only calls its functions, write `via` plus that layer's path and list the layer under Shared; do not guess which endpoints are "the feature's".
   - *Status:* `current` (under the features root), `legacy` (outside it, still serving a route), or `migrating` (a route renders both a feature and a legacy component — name both).
   - *Directories that are not features* (a `shared` folder, cross-feature helpers inside the features root) get a row in the Shared table. `lock` needs every directory under a watched root named somewhere in the map, not necessarily as a feature.
   - *Many small legacy directories* may share one row per area, with each directory named in it.

3. **Write the map** in the format of [references/FEATURE-MAP-FORMAT.md](references/FEATURE-MAP-FORMAT.md). Every directory and file goes in backticks as a complete repo-relative path, extension included — that is what `check` verifies. No `…` abbreviations and no component names standing in for files: a backticked token containing `/` that does not exist on disk is reported as dead. (Tokens starting with `/` are read as routes and tokens with no `/` are not checked.) Keep it under about 150 lines; past that, follow the reference's rule for splitting by area.

4. **Lock it:** `node "<plugin-root>/scripts/feature-map.mjs" lock --root … ` with the same roots as step 1. It refuses while a feature directory has no row or a row names a path that does not exist — fix the map, not the lock.

   **Done when:** `feature-map.mjs check` prints `fresh`.

5. **Make it findable.** The project's `CLAUDE.md` block from `/setup-daher-skills` already points at the map. If the project has no such block, add one line to its `CLAUDE.md`: "Where features live: `docs/agents/feature-map.md` — read it before searching for a feature's code; the code wins where they disagree."

## Update

1. `node "<plugin-root>/scripts/feature-map.mjs" check` — its output is the work list.
2. For each `+` entry: add the row, or extend the row of the feature it belongs to. For each `-` entry and each `dead:` path: remove or correct it. For each `unmapped:` directory: it is a feature with no row — add one.
3. Re-read the rows of the features the current branch touched (`git diff --name-only <base>...HEAD`): a route or an endpoint can change without any directory moving, and the script cannot see that.
4. `feature-map.mjs lock` (no arguments — it reuses the recorded roots), then `check`.

**Done when:** `check` prints `fresh` and the map and lock are part of the same change as the code that moved.

## Rules

- **Facts from the tree only.** No design rationale, no history, no "should" — those belong in the feature's README. A row someone cannot verify with `ls` or one Grep does not belong.
- **The code wins.** The map is an index, never a contract. Every reader is told to trust the code where the two disagree and to report the drift.
- **Never hand-edit the lock** to make `check` pass. It records what the map was written against; editing it hides drift.
- **One row per feature, not per file.** Key files are the two or three an agent opens first.
- **Private areas stay out.** Do not list secrets, env files, or generated output.
