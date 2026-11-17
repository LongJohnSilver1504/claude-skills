# Guardrail catalog

Rules to choose from. Each is proposed only when the repository shows the thing it protects, and is **fitted** before it is written — the real branch names, commands and paths — with examples from the project's own usage.

Profiles: **L** lite · **S** standard · **X** strict (each includes the one before).

## Layer 1 — `.claude/guardrails.json`

### Bash

| id | Profile | Action | Propose when | Stops | Starting pattern |
|----|:------:|--------|--------------|-------|------------------|
| `deny-recursive-delete-outside` | L | deny | always | A recursive delete aimed at `/`, `~`, `$HOME` or a parent directory | `^rm\s+(?:-[a-zA-Z]*r[a-zA-Z]*\s+\|--recursive\s+)+(?:-\S+\s+)*(?:/\|~\|\$HOME\|\.\.)` |
| `deny-pipe-to-shell` | L | deny | always | Downloading a script straight into an interpreter | `^(?:curl\|wget)\b.*\|\s*(?:ba\|z)?sh\b` — tried against the whole command, so the pipe is visible |
| `ask-discard-uncommitted` | L | ask | always | Commands that throw away uncommitted work with no way back: `git reset --hard`, `git clean -f`, `git checkout .`, `git restore .` | `^git\s+(?:reset\s+--hard\|clean\s+-[a-zA-Z]*f\|checkout\s+(?:--\s+)?\.(?:\s\|$)\|restore\s+(?!--staged\s+\.)(?:--\S+\s+)*\.(?:\s\|$))` — `git restore --staged .` only unstages and is left alone |
| `deny-history-rewrite-shared` | L | deny | a shared branch exists | Deleting a shared branch, locally or on the remote | `^git\s+(?:branch\s+-D\|push\b.*--delete)\b.*(?<![\w/-])(?:<base>\|<release>)(?![\w/-])` |
| `no-force-push-shared` | S | deny | a base or release branch exists | Force-pushing a branch other people pull | `^git\s+push\b(?=.*(?:--force\|\s-f\b))(?=.*(?<![\w/-])(?:<base>\|<release>)(?![\w/-]))` |
| `ask-push-shared` | S | ask | the team merges by PR | A direct push to the base branch | `^git\s+push\b.*(?<![\w/-])(?:<base>)(?![\w/-])` |
| `ask-migrations` | S | ask | a migrations directory or ORM CLI | Applying or rolling back migrations against whatever database the env points at | `^(?:npm\|pnpm\|yarn\|bun)\s+(?:run\s+)?db:migrate(?!:status)\b` plus the bare CLI form (`\bsequelize(?:-cli)?\b.*\bdb:migrate(?!:status)\b`, `\bprisma\s+migrate\s+(?:deploy\|reset)\b`) — leave the read-only status command out |
| `deny-db-destructive` | S | deny | the repo has an ORM or database CLI as a dependency, or scripts that open a SQL shell | `DROP`, `TRUNCATE`, a schema reset or "undo all" command | `\b(?:drop\s+(?:table\|database\|schema)\|truncate\s+table)\b` with `"flags": "i"`, plus the ORM's reset (`db:migrate:undo:all`, `migrate reset`) |
| `ask-live-scripts` | S | ask | package scripts that seed data, run jobs, or call a payment, mail or other live provider | Running a script whose effect lands outside the repository | `^(?:npm\|pnpm\|yarn\|bun)\s+(?:run\s+)?(?:<the script prefixes found, e.g. db:seed\|jobs:run\|scripts:ops>)` |
| `ask-deploy` | S | ask | a deploy CLI in scripts or CI | A production deploy or a promote | fit: e.g. `^vercel\b.*--prod`, `^(?:npm\|pnpm\|yarn)\s+(?:run\s+)?deploy` |
| `deny-infra-destroy` | S | deny | infra-as-code or a cluster CLI | Destroying infrastructure or deleting cluster resources | `^terraform\s+destroy`, `^kubectl\s+delete\b` |
| `ask-infra-apply` | S | ask | same | Applying infrastructure changes | `^terraform\s+apply`, `^kubectl\s+apply` |
| `ask-publish` | X | ask | the package is published | Publishing a package or pushing a release tag | `^(?:npm\|pnpm\|yarn)\s+publish`, `^git\s+push\b.*--tags` |
| `ask-global-install` | X | ask | always | Installing software machine-wide | `^(?:npm\|pnpm)\s+(?:i\|install\|add)\b.*\s-g\b`, `^brew\s+install` |

The table shows `\|` where a pattern has `|`; in JSON every backslash is doubled, and flags go in their own key:

```json
{ "id": "deny-db-destructive", "action": "deny", "pattern": "\\b(?:drop\\s+(?:table|database|schema)|truncate\\s+table)\\b", "flags": "i", "reason": "…", "examples": { "block": ["psql -c 'DROP TABLE orders'"], "allow": ["psql -c 'select 1'"] } }
```

- `examples.block` lists the calls the rule **catches**, whether its action is `deny` or `ask`; `examples.allow` lists near-misses it must leave alone.
- `^` anchors to the start of a command or of any chained part of it, after wrappers are stripped — so `^npm run db:migrate` still matches `cd api && npm run db:migrate`.
- Branch names are matched as whole words that are not part of a longer ref — `(?<![\w/-])main(?![\w/-])` — so a rule about `main` leaves `feat/main-menu` alone.
- `--force-with-lease` is a force push: the `no-force-push-shared` pattern matches it on purpose.

### Paths (Write / Edit)

| id | Profile | Action | Propose when | Globs |
|----|:------:|--------|--------------|-------|
| `protect-env-files` | L | deny | any `.env*` file | `.env`, `.env.*` — except `.env.example` |
| `protect-key-material` | L | deny | key or certificate files, a secrets directory | `*.pem`, `*.key`, `*.p12`, `secrets/**` |
| `protect-applied-migrations` | S | ask | a migrations directory | `<migrations source dir>/**` with `"existingOnly": true` — a new migration file passes, a change to one already on disk asks. Point it at the source directory, not a compiled copy |
| `protect-lockfile` | X | ask | a lockfile | the lockfile name — it changes through the package manager, not by hand |
| `protect-generated` | X | deny | generated code checked in | `**/*.generated.*`, the codegen output dir — regenerate instead |
| `ask-ci-config` | X | ask | CI workflows | `.github/workflows/**`, release config — CI runs with repository secrets |

### Content (Write / Edit, inside a glob)

Only for a boundary the project already has and whose violation is always a defect. Each needs an `except` for tests and for the file that legitimately holds the thing.

| id | Profile | Propose when | Stops |
|----|:------:|--------------|-------|
| `no-hardcoded-api-host` | X | endpoint constants or an env object exist | A literal API host in application code |
| `no-direct-env-access` | X | a validated env object exists | `process.env.X` / `import.meta.env.X` outside the env module |
| `no-wire-types-in-ui` | X | a DTO-to-domain boundary exists | UI code importing wire/DTO types |
| `no-debug-leftovers` | X | the team treats them as defects | `debugger`, focused tests (`.only(`) |

### Secrets

`scanWrites` and `scanCommits` on in every profile. Formats known: AWS key ids, GitHub tokens, Anthropic and OpenAI keys, Stripe live keys, Slack tokens, Google API keys, private-key headers. Put test fixtures under `secrets.allow`.

## Layer 2 — permission rules (`.claude/settings.json`)

Evaluated before any hook: `deny`, then `ask`, then `allow`; the first match wins. A `Read(path)` deny also blocks Edit and Write on that path.

| Rule | List | Why |
|------|------|-----|
| `Read(./.env)`, `Read(./.env.*)` | deny | The agent never needs the values — the env schema gives it the names |
| `Read(./secrets/**)`, `Read(~/.ssh/**)`, `Read(~/.aws/**)` | deny | Key material |
| `Bash(git push *)` | ask | Publishing work is the user's call, unless the project runs unattended |
| The deploy and infra commands found in the repo | ask | Same commands as the `ask-*` bash rules — two layers on purpose |

Merge into the existing arrays; never replace them. Do not deny a tool outright (`Bash`) — it removes the tool from the session.

## Layer 3 — sandbox

The sandbox limits what a shell command can write and reach, whatever its text — it is what covers the commands a pattern cannot see. Recommend it; write the settings only on a yes:

- Enabled, with writes limited to the project directory.
- Network limited to the hosts the build and tests need: the package registry, the source host, the project's own API hosts.
- Refuse to run unsandboxed when the sandbox is unavailable, for projects that hold production credentials.

Limits to state: it covers shell commands only (not file tools, hooks or connectors), an allowed broad host can still carry data out, and it has to be enabled on each machine.

## What these rules do not catch

| Gap | Why | Covered by |
|-----|-----|-----------|
| A command an interpreter builds at run time (`python -c`, a script that calls `rm`, an alias) | The pattern sees the text of the call, not what it executes | Sandbox |
| Reads of protected files through a shell (`cat .env`) | Path rules cover Write and Edit | Permission `Read` deny + sandbox |
| A password written in plain words | Secret scanning knows key formats | Review |
| A dangerous command quoted in text after a separator | Read as that command — a false positive | Rephrase the call |
| A hook process that crashes or times out | Claude Code lets the call proceed unless the installed version can fail closed | Permission rules |

## Sources

Permission deny/ask lists, the destructive-command and pipe-to-shell guards, commit-time secret scanning and the sandbox baseline are adapted from two public write-ups — dwarvesf/claude-guardrails and Cordum's Claude Code security guide — rewritten as data for one tested hook. Their prompt-injection output scanner was not adopted: it warns without blocking and is noisy on security text. `ask-discard-uncommitted` follows the command list of Matt Pocock's `git-guardrails-claude-code` skill — as `ask` rather than a block, because discarding work is sometimes exactly what the user wants.
