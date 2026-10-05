#!/usr/bin/env node
/**
 * verify-stamp — record that a test/build command passed against a specific
 * working-tree content, so later pipeline phases can reuse that run instead of
 * repeating it when nothing changed.
 *
 * Usage (from the project directory):
 *
 *   node <plugin>/scripts/verify-stamp.mjs record <test|build> -- <command...>
 *   node <plugin>/scripts/verify-stamp.mjs check  <test|build> -- <command...>
 *
 * Stamps are keyed by kind AND command: a stamp for `pnpm vitest run src/a`
 * says nothing about `pnpm vitest run src/b`. They live in
 * `<git-dir>/claude/verify-stamps.json` as
 * `{ [kind]: { [command]: { fingerprint, at } } }` — inside the git dir, so the
 * file is never tracked and never part of the fingerprint.
 *
 * record: fingerprints the tree, runs <command> through a shell with inherited
 *   stdio and exits with its exit code. On exit 0 it re-fingerprints; if the
 *   tree is unchanged it stores the stamp for that kind+command. A command that
 *   changed tracked or untracked (non-ignored) files is not stamped — the run
 *   did not verify the tree that now exists. Exit 0 is the only criterion the
 *   script applies: a caller with stricter pass criteria (e.g. "0 matched test
 *   files = FAIL") still reads the output it prints.
 *
 * check: exit 0 and print `fresh: <kind> passed at <at> (<command>)` when a
 *   stamp for exactly this command matches the current fingerprint; otherwise
 *   exit 1 and print `stale: no stamp for this command` or
 *   `stale: tree changed …`.
 *
 * The command key is the arguments after `--` joined by single spaces, with
 * runs of whitespace collapsed. Exit 2 on bad arguments. The fingerprint is
 * hooks/lib/tree-fingerprint.mjs (its header lists what it covers).
 */
import { readFileSync, writeFileSync, mkdirSync, renameSync } from 'node:fs'
import { dirname } from 'node:path'
import { spawnSync } from 'node:child_process'
import { treeFingerprint, markerPath } from '../hooks/lib/tree-fingerprint.mjs'

const KINDS = ['test', 'build']
const USAGE =
  'usage:\n' +
  '  verify-stamp.mjs record <test|build> -- <command...>\n' +
  '  verify-stamp.mjs check  <test|build> -- <command...>'

const cwd = process.cwd()

const fail = (msg) => {
  console.error(`verify-stamp: ${msg}\n${USAGE}`)
  process.exit(2)
}

const [mode, kind, ...rest] = process.argv.slice(2)
if (mode !== 'record' && mode !== 'check') fail(`unknown mode "${mode ?? ''}"`)
if (!KINDS.includes(kind)) fail(`kind must be one of ${KINDS.join('|')}, got "${kind ?? ''}"`)
const sep = rest.indexOf('--')
const commandParts = sep >= 0 ? rest.slice(sep + 1) : []
if (sep !== 0 || commandParts.length === 0) fail(`${mode} needs \`-- <command...>\``)
const command = commandParts.join(' ')
const key = command.trim().replace(/\s+/g, ' ')

const stampsPath = markerPath(cwd, 'verify-stamps.json')

const readStamps = () => {
  try {
    const s = JSON.parse(readFileSync(stampsPath, 'utf8'))
    return s && typeof s === 'object' && !Array.isArray(s) ? s : {}
  } catch {
    return {}
  }
}

if (mode === 'check') {
  if (stampsPath === null) {
    console.log('stale: not a git repository — the tree cannot be fingerprinted')
    process.exit(1)
  }
  const stamp = readStamps()[kind]?.[key]
  if (!stamp?.fingerprint) {
    console.log(`stale: no stamp for this command (${kind}: ${key})`)
    process.exit(1)
  }
  const current = treeFingerprint(cwd)
  if (current === null || current !== stamp.fingerprint) {
    console.log(`stale: tree changed since ${kind} passed at ${stamp.at} (${key})`)
    process.exit(1)
  }
  console.log(`fresh: ${kind} passed at ${stamp.at} (${key})`)
  process.exit(0)
}

// ---------- record ----------
const before = treeFingerprint(cwd)
const r = spawnSync(command, { cwd, shell: true, stdio: 'inherit' })
const code = r.status ?? 1

if (code !== 0) {
  console.error(`verify-stamp: ${kind} command exited ${code} — not stamped`)
  process.exit(code)
}
if (before === null || stampsPath === null) {
  console.error('verify-stamp: not stamped — not a git repository, the tree cannot be fingerprinted')
  process.exit(0)
}
const after = treeFingerprint(cwd)
if (after !== before) {
  console.error(
    `verify-stamp: not stamped — the ${kind} command changed the working tree while it ran ` +
      '(tracked or untracked non-ignored files); re-run it on the settled tree to stamp'
  )
  process.exit(0)
}

const stamps = readStamps()
const at = new Date().toISOString()
const byCommand = stamps[kind] && typeof stamps[kind] === 'object' && !Array.isArray(stamps[kind]) ? stamps[kind] : {}
byCommand[key] = { fingerprint: after, at }
stamps[kind] = byCommand
try {
  mkdirSync(dirname(stampsPath), { recursive: true })
  const tmp = `${stampsPath}.${process.pid}.tmp`
  writeFileSync(tmp, JSON.stringify(stamps, null, 2) + '\n')
  renameSync(tmp, stampsPath)
  console.error(`verify-stamp: stamped ${kind} (${key}) at ${at}`)
} catch (e) {
  console.error(`verify-stamp: command passed but the stamp could not be written (${e.message})`)
}
process.exit(0)
