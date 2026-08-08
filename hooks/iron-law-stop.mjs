#!/usr/bin/env node
/**
 * Stop hook — the Iron Law as a mechanical gate.
 * "A DONE without fresh verification output is not accepted" stops being prose
 * the model can ignore and becomes a deterministic check that blocks the end
 * of the turn until the project's verify command passes.
 *
 * Opt-in by project: only active when `.claude/iron-law.json` exists —
 * seeded by /setup-daher-skills when the user accepts it. Shape:
 *
 *   { "verify": "pnpm vitest run --changed --passWithNoTests", "timeoutSeconds": 120 }
 *
 * Loop/perf safety:
 * - `stop_hook_active` → exit 0 (never re-block a continuation we forced).
 * - No modified source files in the working tree → exit 0.
 * - Working-tree state hash matches the last PASS → exit 0 (no re-runs when
 *   nothing changed since the last successful verification).
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { execSync, spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'

let input
try {
  input = JSON.parse(readFileSync(0, 'utf8'))
} catch {
  process.exit(0)
}

if (input?.stop_hook_active) process.exit(0)

const cwd = input?.cwd ?? process.cwd()
const configPath = join(cwd, '.claude/iron-law.json')
if (!existsSync(configPath)) process.exit(0)

let config
try {
  config = JSON.parse(readFileSync(configPath, 'utf8'))
} catch {
  process.exit(0)
}
if (!config?.verify) process.exit(0)

let status
try {
  status = execSync('git status --porcelain', { cwd, encoding: 'utf8' })
} catch {
  process.exit(0) // not a git repo — nothing to gate
}

const touchedSource = status
  .split('\n')
  .filter((l) => /\.(ts|tsx|js|jsx|mjs)$/.test(l.trim()))
if (touchedSource.length === 0) process.exit(0)

const stateHash = createHash('sha256').update(status).digest('hex')
const markerPath = join(cwd, '.claude/.iron-law-pass')
if (existsSync(markerPath) && readFileSync(markerPath, 'utf8').trim() === stateHash) {
  process.exit(0)
}

const timeout = (config.timeoutSeconds ?? 120) * 1000
const result = spawnSync(config.verify, {
  cwd,
  shell: true,
  encoding: 'utf8',
  timeout,
})

if (result.status === 0) {
  try {
    writeFileSync(markerPath, stateHash + '\n')
  } catch {
    /* marker is an optimization, not a requirement */
  }
  process.exit(0)
}

const tail = ((result.stdout ?? '') + '\n' + (result.stderr ?? ''))
  .trim()
  .split('\n')
  .slice(-25)
  .join('\n')

console.error(
  `Iron Law: source files changed this session and the project's verify command failed.\n` +
    `Command: ${config.verify}\n` +
    `Output (tail):\n${tail}\n` +
    `Fix the failures (or, if this check is wrong for the current work, tell the user), then finish.`
)
process.exit(2)
