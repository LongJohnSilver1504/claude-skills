import { test } from 'node:test'
import assert from 'node:assert/strict'
import { execSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { runHook, tempProject, writeAt } from './helpers.mjs'

const stop = (cwd, extra = {}) => ({ cwd, hook_event_name: 'Stop', stop_hook_active: false, ...extra })

/** A git repo with one committed source file and the Iron Law configured. */
function repoWith(verify) {
  const root = tempProject()
  execSync('git init -q && git config user.email t@t && git config user.name t', { cwd: root })
  writeAt(root, 'src/a.ts', 'export const a = 1\n')
  execSync('git add -A && git commit -qm init', { cwd: root })
  if (verify !== undefined) writeAt(root, '.claude/iron-law.json', JSON.stringify({ verify, timeoutSeconds: 10 }))
  return root
}

test('inactive without .claude/iron-law.json', () => {
  const root = repoWith(undefined)
  writeAt(root, 'src/a.ts', 'export const a = 2\n')
  assert.equal(runHook('iron-law-stop.mjs', stop(root)).code, 0)
})

test('never re-blocks a continuation it forced (stop_hook_active)', () => {
  const root = repoWith('exit 1')
  writeAt(root, 'src/a.ts', 'changed\n')
  assert.equal(runHook('iron-law-stop.mjs', stop(root, { stop_hook_active: true })).code, 0)
})

test('exits 0 when no source files are modified', () => {
  const root = repoWith('exit 1')
  writeAt(root, 'notes.md', 'docs only\n')
  assert.equal(runHook('iron-law-stop.mjs', stop(root)).code, 0)
})

test('blocks the turn when sources changed and verify fails, with the output tail', () => {
  const root = repoWith('echo "1 test failed" && exit 1')
  writeAt(root, 'src/a.ts', 'changed\n')
  const r = runHook('iron-law-stop.mjs', stop(root))
  assert.equal(r.code, 2)
  assert.match(r.stderr, /Iron Law/)
  assert.match(r.stderr, /1 test failed/)
})

test('passes when verify succeeds and caches the PASS by working-tree hash', () => {
  const root = repoWith('exit 0')
  writeAt(root, 'src/a.ts', 'changed\n')
  assert.equal(runHook('iron-law-stop.mjs', stop(root)).code, 0)
  const marker = join(root, '.claude/.iron-law-pass')
  assert.ok(existsSync(marker), 'PASS marker written')
  const hash = readFileSync(marker, 'utf8').trim()

  // Same tree state, failing verify now → still 0, because the cached PASS matches.
  writeAt(root, '.claude/iron-law.json', JSON.stringify({ verify: 'exit 1', timeoutSeconds: 10 }))
  assert.equal(runHook('iron-law-stop.mjs', stop(root)).code, 0)

  // Tree changes → hash differs → verify runs again and blocks.
  writeAt(root, 'src/b.ts', 'new\n')
  assert.equal(runHook('iron-law-stop.mjs', stop(root)).code, 2)
  assert.notEqual(readFileSync(marker, 'utf8').trim(), hash + 'x') // sanity: file still readable
})

test('exits 0 outside a git repo and on malformed input', () => {
  const root = tempProject()
  writeAt(root, '.claude/iron-law.json', JSON.stringify({ verify: 'exit 1' }))
  writeAt(root, 'src/a.ts', 'x')
  assert.equal(runHook('iron-law-stop.mjs', stop(root)).code, 0)
  assert.equal(runHook('iron-law-stop.mjs', 'not json').code, 0)
})
