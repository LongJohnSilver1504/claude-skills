# GUARDRAILS-FORMAT — `.claude/guardrails.json`

Read by the plugin's `project-guardrails` hook on every Bash, Write and Edit call, and by `scripts/guardrails.mjs` (`check`, `test`, `explain`). Committed with the project.

```json
{
  "version": 1,
  "bash": [
    {
      "id": "no-force-push-shared",
      "action": "deny",
      "pattern": "^git\\s+push\\b(?=.*(?:--force|\\s-f\\b))(?=.*(?<![\\w/-])(?:main|develop)(?![\\w/-]))",
      "reason": "Force-pushing main or develop rewrites history other people have pulled. Push a new commit, or ask the user to do the force-push themselves.",
      "examples": {
        "block": ["git push --force origin main", "git push origin develop -f"],
        "allow": ["git push origin feat/orders-export", "git push --force origin feat/main-menu"]
      }
    }
  ],
  "paths": [
    {
      "id": "protect-env-files",
      "action": "deny",
      "glob": [".env", ".env.*"],
      "except": [".env.example"],
      "reason": "Env files hold real credentials. Declare the variable in the env schema and add a placeholder to .env.example.",
      "examples": { "block": [".env", "apps/web/.env.local"], "allow": [".env.example"] }
    }
  ],
  "content": [
    {
      "id": "no-hardcoded-api-host",
      "action": "deny",
      "glob": ["src/**/*.ts", "src/**/*.tsx"],
      "except": ["src/**/*.test.ts", "src/**/*.test.tsx"],
      "pattern": "https?://api\\.[a-z0-9.-]+",
      "reason": "API hosts come from the validated env object. Import it and build the URL from the endpoint constants.",
      "examples": { "block": ["fetch('https://api.example.com/v1/orders')"], "allow": ["fetch(`${env.API_URL}/orders`)"] }
    }
  ],
  "secrets": { "scanWrites": true, "scanCommits": true, "allow": ["**/*.test.ts", "**/fixtures/**"] }
}
```

## Fields

| Field | In | Meaning |
|-------|----|---------|
| `id` | every rule | Lowercase, digits, hyphens; unique in the file. It is what the block message and `explain` name |
| `action` | every rule | `deny` — the call does not happen. `ask` — the user confirms it |
| `reason` | every rule | Why, and what to do instead. The agent reads this when it is stopped, so write it as an instruction |
| `examples.block` / `examples.allow` | every rule | Commands (bash), paths (paths) or the text that would be written (content). `block` holds what the rule catches — for `ask` rules too — and must not be empty |
| `pattern`, `flags` | bash, content | A JavaScript regular expression and optional flags (`i`) |
| `glob`, `except` | paths, content | Globs relative to the project root: `*`, `**`, `?`. A glob with no `/` matches a basename in any directory |
| `existingOnly` | paths | `true` — the rule applies only to files already on disk, so creating a new file under the glob passes |
| `secrets.scanWrites` | — | Block a Write or Edit whose content holds a known credential format |
| `secrets.scanCommits` | — | Block `git commit` when the staged diff adds one |
| `secrets.allow` | — | Globs exempt from secret scanning (test fixtures) |

## How a bash rule is matched

The pattern is tried against the command, against each part of a chain (`&&`, `||`, `;`, `|`), and against the body of `sh -c "…"` and `$(…)`, after removing `sudo`, `env X=…`, leading assignments and absolute binary paths. So `^git\s+push` matches `cd app && sudo /usr/bin/git push`. Anchor with `^` — an unanchored pattern also matches the command when it is only *mentioned* (`echo "never git push --force"`).

When several rules match, `deny` wins over `ask`.

## What the hook does on its own

- **No file:** nothing. The project has not opted in.
- **Editing `.claude/guardrails.json`:** always `ask`.
- **A file that does not parse or validate:** every Bash, Write and Edit is blocked, except editing the guardrails file, with the validation errors in the message. Run `guardrails.mjs check` before committing a change to it.

## Limits to state in every report

- A command built at run time (a script that calls `rm`, `python -c`, an alias) is invisible to a text pattern.
- Text inside quotes that contains a separator and then a dangerous command (`echo "x; rm -rf /"`) is read as that command — a false positive, on the safe side.
- Secret scanning knows the common key formats (cloud, source-host, AI, payment and chat providers, private-key headers). A password in plain words passes.
- If the hook process crashes or times out, Claude Code lets the call through unless the installed version supports failing closed. Guardrails are one layer of three.
