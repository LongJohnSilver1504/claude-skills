import { test } from 'node:test'
import assert from 'node:assert/strict'
import { execSync, spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { tempProject, writeAt } from './helpers.mjs'

const script = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'scripts', 'verify-stamp.mjs')

const run = (cwd, args) => {
  const r = spawnSync(process.execPath, [script, ...args], { encoding: 'utf8', cwd })
  return { code: r.status, stdout: r.stdout ?? '', stderr: r.stderr ?? '' }
}

function repo() {
  const root = tempProject('vs-')
  execSync('git init -q && git config user.email t@t && git config user.name t', { cwd: root })
  writeAt(root, 'src/a.ts', 'export const a = 1\n')
  execSync('git add -A && git commit -qm init', { cwd: root })
  writeAt(root, 'src/a.ts', 'export const a = 2\n') // dirty, like mid-feature
  return root
}

const stampsPath = (root) => join(root, '.git/claude/verify-stamps.json')

test('record runs the command, passes its output through, and stamps it under its command', () => {
  const root = repo()
  const r = run(root, ['record', 'test', '--', 'echo', 'all-green'])
  assert.equal(r.code, 0)
  assert.match(r.stdout, /all-green/)
  const stamps = JSON.parse(readFileSync(stampsPath(root), 'utf8'))
  const s = stamps.test['echo all-green']
  assert.match(s.fingerprint, /^[0-9a-f]{64}$/)
  assert.ok(!Number.isNaN(Date.parse(s.at)))
  assert.equal(existsSync(join(root, '.claude')), false) // nothing written into the worktree
})

test('check is fresh after record, then stale after a content edit', () => {
  const root = repo()
  assert.equal(run(root, ['record', 'build', '--', 'true']).code, 0)
  const fresh = run(root, ['check', 'build', '--', 'true'])
  assert.equal(fresh.code, 0)
  assert.match(fresh.stdout, /^fresh: build passed at \S+ \(true\)/)

  writeAt(root, 'src/a.ts', 'export const a = 3\n') // already-dirty file, new content
  const stale = run(root, ['check', 'build', '--', 'true'])
  assert.equal(stale.code, 1)
  assert.match(stale.stdout, /^stale: tree changed/)
})

test('a stamp only vouches for its own command', () => {
  const root = repo()
  run(root, ['record', 'test', '--', 'echo src/a'])
  assert.equal(run(root, ['check', 'test', '--', 'echo', 'src/a']).code, 0) // same command, split differently
  const other = run(root, ['check', 'test', '--', 'echo src/b'])
  assert.equal(other.code, 1)
  assert.match(other.stdout, /^stale: no stamp for this command/)
})

test('stamps of different kinds and commands merge instead of overwriting', () => {
  const root = repo()
  run(root, ['record', 'test', '--', 'true'])
  run(root, ['record', 'test', '--', 'echo second'])
  run(root, ['record', 'build', '--', 'true'])
  const stamps = JSON.parse(readFileSync(stampsPath(root), 'utf8'))
  assert.deepEqual(Object.keys(stamps).sort(), ['build', 'test'])
  assert.deepEqual(Object.keys(stamps.test).sort(), ['echo second', 'true'])
  assert.equal(run(root, ['check', 'test', '--', 'true']).code, 0)
})

test('a commit of the stamped content keeps the stamp fresh', () => {
  const root = repo()
  run(root, ['record', 'test', '--', 'true'])
  execSync('git add -A && git commit -qm wip', { cwd: root })
  assert.equal(run(root, ['check', 'test', '--', 'true']).code, 0)
})

test('a failing command exits with its code and writes no stamp', () => {
  const root = repo()
  const r = run(root, ['record', 'test', '--', 'exit 3'])
  assert.equal(r.code, 3)
  assert.equal(existsSync(stampsPath(root)), false)
  const c = run(root, ['check', 'test', '--', 'exit 3'])
  assert.equal(c.code, 1)
  assert.match(c.stdout, /^stale: no stamp for this command/)
})

test('a command that modifies tracked files is not stamped', () => {
  const root = repo()
  const r = run(root, ['record', 'test', '--', 'echo changed >> src/a.ts'])
  assert.equal(r.code, 0)
  assert.match(r.stderr, /not stamped/)
  assert.equal(existsSync(stampsPath(root)), false)
})

test('check is stale outside a git repo; bad arguments exit 2', () => {
  const root = tempProject('vs-')
  const c = run(root, ['check', 'test', '--', 'true'])
  assert.equal(c.code, 1)
  assert.match(c.stdout, /^stale: /)
  assert.equal(run(root, ['check', 'lint', '--', 'true']).code, 2)
  assert.equal(run(root, ['check', 'test']).code, 2) // the command is required
  assert.equal(run(root, ['record', 'test']).code, 2)
})
