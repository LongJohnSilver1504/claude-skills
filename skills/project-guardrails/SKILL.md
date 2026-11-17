---
name: project-guardrails
description: Generate and maintain deterministic guardrails fitted to one project — `.claude/guardrails.json` for the plugin's hook, permission rules, and a sandbox recommendation — from what the repository actually contains. Use when the user asks for guardrails, safety rules or protections for a project ("ponle guardrails a este repo", "block dangerous commands here", "stop the agent from touching X"), wants to add, loosen or review one, or after a near-miss that a rule would have stopped. NOT for coding conventions an agent should follow (those are `.claude/rules/`, seeded by setup-daher-skills) or for reviewing code for vulnerabilities (the `/security-review` command).
argument-hint: <create|add|review>
---

# Project Guardrails

Instructions are advice; a guardrail is a tool call that does not happen. This skill reads what a project has that can be damaged, proposes the guardrails that fit it, and writes them as **data** the plugin's `project-guardrails` hook enforces.

**One generic hook, per-project data.** The hook is tested once in the plugin. What differs per project lives in `.claude/guardrails.json`: rules with a pattern, a reason and examples of what they must stop and what they must let through. A project with no such file has no project guardrails — the hook is inert there.

The plugin root below is `${CLAUDE_PLUGIN_ROOT}` if set, otherwise two levels above this skill's own directory. File format: [references/GUARDRAILS-FORMAT.md](references/GUARDRAILS-FORMAT.md). What to choose from: [references/CATALOG.md](references/CATALOG.md).

## What a guardrail is here — and is not

- **Is:** a specific action with a specific cost — force-pushing a shared branch, writing an env file, running a migration, committing a token. Each one names the failure it prevents.
- **Is not:** a check on whether the agent thought first, read enough, or planned. Those tax every turn and stop nothing in particular; this plugin rejected that pattern (`.out-of-scope/gateguard-fact-forcing.md` in its repository).
- **Is not:** a convention. "Use the semantic color tokens" is a rule file. A `content` guardrail is for the few conventions whose violation is always a defect and can be matched exactly — a hardcoded API host, a wire type imported into UI code.

Three layers, because each one has holes the others cover:

| Layer | Stops | Blind to |
|-------|-------|----------|
| `.claude/guardrails.json` (this plugin's hook) | Commands and writes matching a rule, with a reason the agent can act on | A command an interpreter assembles at run time |
| Permission rules in `.claude/settings.json` | Tools and paths, before any hook runs; `deny` removes the option outright | Text variants of a Bash command |
| Sandbox | What a shell command can reach on disk and on the network, whatever its text | Non-shell tools; it must be enabled per machine |

## Create

1. **Read the risk surface** — what this repository can damage. Look, do not ask:

   | Look for | Evidence | Suggests (catalog id) |
   |----------|----------|-----------------------|
   | Shared branches | base branch in `project-conventions.md`, release branches in CI | `no-force-push-shared`, `ask-push-shared` |
   | Env and secret files | `.env*`, `*.pem`, a `secrets/` dir, an env schema file | `protect-env-files`, `secrets` scanning |
   | Database migrations | a `migrations/` dir, an ORM CLI in `package.json` | `ask-migrations`, `protect-applied-migrations` |
   | Deploy and infra CLIs | `vercel`, `terraform`, `kubectl`, `aws`, `gcloud` in scripts or CI | `ask-deploy`, `deny-infra-destroy` |
   | Package publishing | a public package, a `publishConfig`, a release workflow | `ask-publish` |
   | Lockfiles and generated code | lockfile, `*.generated.*`, a codegen script | `protect-lockfile`, `protect-generated` |
   | CI and release config | `.github/workflows/`, release tooling | `ask-ci-config` |
   | Scripts that act on live systems | `package.json` scripts that seed, run jobs, or call a payment or mail provider | `ask-live-scripts` |
   | A boundary the code already has | an env object, endpoint constants, a DTO/domain split | `content` rules — only where the project has the boundary |

   **Done when:** each row is either "found" with the file that proves it, or "not present".

2. **Propose a profile, with the evidence.** `lite` (destructive commands and secrets), `standard` (lite + shared branches, env files, migrations, deploys — the default), `strict` (standard + CI config, lockfile, publishing, content rules). Present the rules as a table — id, action, why this project needs it (the evidence from step 1) — and let the user drop or add rows with `AskUserQuestion`. A rule with no evidence in this repository is not proposed.

3. **Write `.claude/guardrails.json`.** Copy each chosen rule from the catalog and **fit it**: the real branch names, the real migration command, the real paths. Most projects run things through package scripts, so fit to the script name the team types (`npm run db:migrate`), not only to the underlying binary, and leave read-only variants out (`db:migrate:status`). A risk this repository has that the catalog does not list gets its own rule, in the same shape. Every rule keeps a `reason` that tells the agent what to do instead, and `examples` taken from this project's own commands.

4. **Prove it:**
   `node "<plugin-root>/scripts/guardrails.mjs" check` then `… test`
   A failing example means the pattern is wrong — fix the pattern, never delete the example. Then try the calls the project makes every day (`… explain --bash "<its build, test, commit and push commands>"`): a guardrail that blocks normal work gets disabled within a week.

   **Done when:** `test` prints `✓` and `explain` prints `allow: no rule matches` for the project's build, test, commit and push-to-a-feature-branch commands.

5. **Permission rules.** Offer the matching `deny`/`ask` entries from the catalog for `.claude/settings.json`. If the file exists, read it and merge into `permissions.deny` / `permissions.ask` — creating the `permissions` key when the file has none, never replacing what is there.

6. **Sandbox.** State the recommendation from the catalog for this project (what the build and tests need to reach). Write sandbox settings only when the user says yes: they change how every command runs on the machine.

7. **Report:** what is enforced, by which layer, what was deliberately left out and why, and the two commands to re-check it.

## Add or loosen one rule

1. Reproduce the call it should stop (or wrongly stopped): `guardrails.mjs explain --bash "<command>"`.
2. Edit the rule and add that call to its `examples` — on the `block` side for a miss, the `allow` side for a false positive. The hook asks the user to confirm any edit to the guardrails file.
3. `guardrails.mjs test`.

**Done when:** `test` passes with the new example in the file.

## Review

`guardrails.mjs check` and `test`, then read each rule against the repository as it is today: a rule naming a branch, directory or tool that no longer exists is removed; a risk from the step 1 table that appeared since gets proposed. Report rules by layer, and any gap between the three layers.

## Rules

- Every rule names the failure it prevents and what to do instead. "Not allowed" is not a reason.
- `deny` for what is never right in this project; `ask` for what is sometimes right and always worth a look. When unsure, `ask`.
- Never write a rule the project's daily commands trip. Test them in step 4.
- Text matching is not a security boundary. Say so in the report, and recommend the other two layers whenever a rule protects something that matters.
- Do not weaken or remove a guardrail to get a task done. If a rule blocks legitimate work, stop and show the user the rule and the call.
