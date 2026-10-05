import { test } from 'node:test'
import assert from 'node:assert/strict'
import { execSync } from 'node:child_process'
import { utimesSync } from 'node:fs'
import { join } from 'node:path'
import { runHook, tempProject, writeAt, hooksDir } from './helpers.mjs'

const commit = (cwd, command = 'git commit -m "x"') => ({ cwd, tool_name: 'Bash', tool_input: { command } })
const T0 = 1_700_000_000 // fixed epoch seconds for deterministic mtimes
// The hook reads the mtime of the build *marker* — for `dist` that is the directory
// itself, which a real build rewrites. Pin it like a build would have.
const buildAt = (root, t) => { writeAt(root, 'dist/index.js', '', t); utimesSync(join(root, 'dist'), t, t) }

test('ignores commands that are not git commit', () => {
  const root = tempProject()
  buildAt(root, T0)
  writeAt(root, 'src/a.ts', '', T0 + 100)
  assert.equal(runHook('check-build-before-commit.mjs', commit(root, 'git status')).code, 0)
  assert.equal(runHook('check-build-before-commit.mjs', commit(root, 'pnpm build')).code, 0)
})

test('allows commit when no build output exists (not a buildable app)', () => {
  const root = tempProject()
  writeAt(root, 'src/a.ts', '', T0 + 100)
  assert.equal(runHook('check-build-before-commit.mjs', commit(root)).code, 0)
})

test('allows commit when the build is newer than every source file', () => {
  const root = tempProject()
  writeAt(root, 'src/a.ts', '', T0)
  writeAt(root, 'src/deep/b.tsx', '', T0 + 10)
  buildAt(root, T0 + 100)
  assert.equal(runHook('check-build-before-commit.mjs', commit(root)).code, 0)
})

test('blocks commit when a source file is newer than the build', () => {
  const root = tempProject()
  buildAt(root, T0)
  writeAt(root, 'src/deep/b.tsx', '', T0 + 100)
  const r = runHook('check-build-before-commit.mjs', commit(root))
  assert.equal(r.code, 2)
  assert.match(r.stderr, /Build is stale/)
  assert.match(r.stderr, /b\.tsx/)
})

test('ignores non-source files and skipped directories', () => {
  const root = tempProject()
  buildAt(root, T0)
  writeAt(root, 'src/README.md', '', T0 + 100)              // not a source extension
  writeAt(root, 'src/node_modules/x/index.js', '', T0 + 100) // skipped dir
  assert.equal(runHook('check-build-before-commit.mjs', commit(root)).code, 0)
})

/** Git repo whose build output is stale by mtime; `stamp` writes a build stamp for the current tree. */
function staleRepo() {
  const root = tempProject()
  execSync('git init -q && git config user.email t@t && git config user.name t', { cwd: root })
  writeAt(root, '.gitignore', 'dist/\n')
  writeAt(root, 'src/a.ts', 'export const a = 1\n', T0)
  execSync('git add -A && git commit -qm init', { cwd: root })
  buildAt(root, T0)
  writeAt(root, 'src/a.ts', 'export const a = 2\n', T0 + 100) // newer than the build
  return root
}
const stamp = (root) =>
  execSync(`"${process.execPath}" "${join(hooksDir, '..', 'scripts', 'verify-stamp.mjs')}" record build -- true`, { cwd: root })

test('allows a stale-by-mtime commit when a build stamp matches the staged tree', () => {
  const root = staleRepo()
  execSync('git add -A', { cwd: root })
  stamp(root)
  assert.equal(runHook('check-build-before-commit.mjs', commit(root)).code, 0)
})

test('still blocks when the build stamp no longer matches the tree', () => {
  const root = staleRepo()
  execSync('git add -A', { cwd: root })
  stamp(root)
  writeAt(root, 'src/a.ts', 'export const a = 3\n', T0 + 200) // edited after the stamped build
  execSync('git add -A', { cwd: root })
  const r = runHook('check-build-before-commit.mjs', commit(root))
  assert.equal(r.code, 2)
  assert.match(r.stderr, /Build is stale/)
})

test('ignores a matching build stamp while tracked changes are unstaged', () => {
  const root = staleRepo()
  stamp(root) // src/a.ts is modified but not staged: the commit would not be the built content
  assert.equal(runHook('check-build-before-commit.mjs', commit(root)).code, 2)
})

test('a corrupt stamps file falls back to the mtime check', () => {
  const root = staleRepo()
  execSync('git add -A', { cwd: root })
  writeAt(root, '.git/claude/verify-stamps.json', '{not json')
  assert.equal(runHook('check-build-before-commit.mjs', commit(root)).code, 2)
})

test('exits 0 on malformed input', () => {
  assert.equal(runHook('check-build-before-commit.mjs', 'nope').code, 0)
})
