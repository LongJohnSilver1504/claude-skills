#!/usr/bin/env node
/**
 * PreToolUse hook (matchers: Bash, Write|Edit). Enforces the project's own
 * guardrails from `.claude/guardrails.json`.
 *
 * Opt-in by project: without that file the hook exits 0 immediately. With it:
 *   - a `deny` rule blocks the call (exit 2, the rule's reason on stderr);
 *   - an `ask` rule hands the call to the user (permissionDecision "ask");
 *   - `secrets.scanWrites` blocks a write that contains a credential;
 *   - `secrets.scanCommits` blocks a `git commit` whose staged diff adds one;
 *   - editing the guardrails file itself always asks — a guardrail the agent can
 *     quietly loosen is not one.
 *
 * A config that does not parse or validate blocks everything except fixing the
 * config: the project opted in, and silently enforcing nothing is the worse failure.
 * The rules are text matching — see hooks/lib/guardrails.mjs for what that does and
 * does not catch.
 */
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { CONFIG_FILE, describeSecrets, evaluateBash, evaluateWrite, loadConfig, matchesAny, scanSecrets, toRelative } from './lib/guardrails.mjs'

let input
try {
  input = JSON.parse(readFileSync(0, 'utf8'))
} catch {
  process.exit(0)
}

const cwd = input?.cwd ?? process.cwd()
const tool = input?.tool_name ?? ''
const { config, error } = loadConfig(cwd)
if (!config && !error) process.exit(0)

const deny = (message) => {
  console.error(message)
  process.exit(2)
}
const ask = (message) => {
  console.log(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'ask', permissionDecisionReason: message } }))
  process.exit(0)
}
const apply = (decision) => {
  if (!decision) return
  const message = `Project guardrail "${decision.id}" (${CONFIG_FILE}): ${decision.reason}`
  if (decision.action === 'deny') deny(message)
  ask(message)
}

const isWrite = tool === 'Write' || tool === 'Edit'
const relPath = isWrite ? toRelative(cwd, input?.tool_input?.file_path ?? '') : ''

if (isWrite && relPath === CONFIG_FILE) {
  ask(`This edits the project's guardrails (${CONFIG_FILE}). Confirm the change is intended — after it, run the guardrails script's "test" command.`)
}

if (error) {
  deny(`${CONFIG_FILE} is not usable: ${error}. Guardrails are blocking tool calls until it is fixed — edit ${CONFIG_FILE} (that edit is allowed) and validate it with the guardrails script's "check" command.`)
}

if (tool === 'Bash') {
  const command = input?.tool_input?.command ?? ''
  apply(evaluateBash(config, command))
  if (config.secrets?.scanCommits && /(^|[\s;&|(])git\s+(?:-\S+\s+)*commit\b/.test(command)) {
    const names = spawnSync('git', ['diff', '--cached', '--name-only'], { cwd, encoding: 'utf8' })
    const files = names.status === 0 ? names.stdout.split('\n').filter((f) => f && !matchesAny(f, config.secrets.allow)) : []
    if (files.length) {
      const diff = spawnSync('git', ['diff', '--cached', '--unified=0', '--', ...files], { cwd, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 })
      const added = diff.status === 0 ? diff.stdout.split('\n').filter((l) => l.startsWith('+') && !l.startsWith('+++')).join('\n') : ''
      const found = scanSecrets(added)
      if (found.length) {
        deny(`Project guardrail "secrets" (${CONFIG_FILE}): the staged changes add what looks like ${describeSecrets(found)}. Unstage it, move the value to the environment, and rotate it if it was ever pushed.`)
      }
    }
  }
} else if (isWrite) {
  const content = input?.tool_input?.content ?? input?.tool_input?.new_string ?? ''
  apply(evaluateWrite(config, relPath, content, existsSync(join(cwd, relPath))))
}

process.exit(0)
