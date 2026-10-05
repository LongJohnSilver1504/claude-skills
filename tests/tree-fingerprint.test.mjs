import { test } from 'node:test'
import assert from 'node:assert/strict'
import { execSync } from 'node:child_process'
import { realpathSync, utimesSync } from 'node:fs'
import { join } from 'node:path'
import { treeFingerprint, markerPath } from '../hooks/lib/tree-fingerprint.mjs'
import { tempProject, writeAt } from './helpers.mjs'

/** A git repo with one committed source file. */
function repo() {
  const root = tempProject('fp-')
  execSync('git init -q && git config user.email t@t && git config user.name t', { cwd: root })
  writeAt(root, 'src/a.ts', 'export const a = 1\n')
  execSync('git add -A && git commit -qm init', { cwd: root })
  return root
}

test('returns a sha256 hex that is stable while nothing changes', () => {
  const root = repo()
  const a = treeFingerprint(root)
  assert.match(a, /^[0-9a-f]{64}$/)
  assert.equal(treeFingerprint(root), a)
})

test('changes on a content edit of a file that is already dirty', () => {
  const root = repo()
  writeAt(root, 'src/a.ts', 'export const a = 2\n')
  const dirty = treeFingerprint(root)
  writeAt(root, 'src/a.ts', 'export const a = 3\n') // same `git status`, new content
  assert.notEqual(treeFingerprint(root), dirty)
})

test('changes on a content edit of an untracked file', () => {
  const root = repo()
  writeAt(root, 'src/new.ts', 'one\n')
  const before = treeFingerprint(root)
  writeAt(root, 'src/new.ts', 'two\n')
  assert.notEqual(treeFingerprint(root), before)
})

test('same content after a commit gives the same fingerprint; a content edit does not', () => {
  const root = repo()
  writeAt(root, 'src/a.ts', 'export const a = 2\n')
  writeAt(root, 'src/new.ts', 'new\n')
  const dirty = treeFingerprint(root)
  execSync('git add -A && git commit -qm wip', { cwd: root }) // HEAD moves, content does not
  assert.equal(treeFingerprint(root), dirty)
  writeAt(root, 'src/a.ts', 'export const a = 3\n')
  assert.notEqual(treeFingerprint(root), dirty)
})

test('staging a change does not change the fingerprint, and the real index is left alone', () => {
  const root = repo()
  writeAt(root, 'src/a.ts', 'export const a = 2\n')
  writeAt(root, 'src/new.ts', 'new\n')
  const before = treeFingerprint(root)
  assert.equal(execSync('git status --porcelain', { cwd: root, encoding: 'utf8' }), ' M src/a.ts\n?? src/new.ts\n')
  execSync('git add -A', { cwd: root })
  assert.equal(treeFingerprint(root), before)
})

test('marker files live in the git dir, outside the hashed tree', () => {
  const root = repo()
  const before = treeFingerprint(root)
  writeAt(root, '.git/claude/verify-stamps.json', '{}')
  writeAt(root, '.git/claude/iron-law-pass', 'abc\n')
  assert.equal(realpathSync(markerPath(root, 'iron-law-pass')), realpathSync(join(root, '.git/claude/iron-law-pass')))
  assert.equal(treeFingerprint(root), before)
  assert.equal(markerPath(tempProject('fp-'), 'x'), null)
})

test('a linked worktree gets its own marker dir and its own fingerprint', () => {
  const root = repo()
  const wt = join(tempProject('fp-wt-'), 'wt')
  execSync(`git worktree add -q "${wt}"`, { cwd: root })
  assert.match(markerPath(wt, 'iron-law-pass'), /\.git\/worktrees\/wt\/claude\/iron-law-pass$/)
  assert.equal(treeFingerprint(wt), treeFingerprint(root)) // same content
  writeAt(wt, 'src/a.ts', 'worktree edit\n')
  assert.notEqual(treeFingerprint(wt), treeFingerprint(root))
})

test('changes when a gitignored root .env file changes', () => {
  const root = repo()
  writeAt(root, '.gitignore', '.env*\n')
  writeAt(root, '.env.local', 'API=one\n')
  const before = treeFingerprint(root)
  writeAt(root, '.env.local', 'API=two\n')
  assert.notEqual(treeFingerprint(root), before)
})

test('changes when the package-manager install marker changes', () => {
  const root = repo()
  writeAt(root, '.gitignore', 'node_modules/\n')
  writeAt(root, 'node_modules/.package-lock.json', '{}', 1_700_000_000)
  const before = treeFingerprint(root)
  utimesSync(join(root, 'node_modules/.package-lock.json'), 1_700_000_100, 1_700_000_100) // reinstall
  assert.notEqual(treeFingerprint(root), before)
})

test('changes when a submodule has uncommitted content', () => {
  const sub = repo()
  const root = repo()
  execSync(`git -c protocol.file.allow=always submodule add -q "${sub}" vendor/sub && git commit -qm sub`, { cwd: root })
  const before = treeFingerprint(root)
  assert.match(before, /^[0-9a-f]{64}$/)
  writeAt(root, 'vendor/sub/src/a.ts', 'edited inside the submodule\n')
  assert.notEqual(treeFingerprint(root), before)
})

test('ignores gitignored files', () => {
  const root = repo()
  writeAt(root, '.gitignore', 'dist/\n')
  execSync('git add -A && git commit -qm ignore', { cwd: root })
  const before = treeFingerprint(root)
  writeAt(root, 'dist/index.js', 'built\n')
  assert.equal(treeFingerprint(root), before)
})

test('works before the first commit', () => {
  const root = tempProject('fp-')
  execSync('git init -q', { cwd: root })
  writeAt(root, 'a.ts', 'one\n')
  const before = treeFingerprint(root)
  assert.match(before, /^[0-9a-f]{64}$/)
  writeAt(root, 'a.ts', 'two\n')
  assert.notEqual(treeFingerprint(root), before)
})

test('returns null outside a git repo', () => {
  const root = tempProject('fp-')
  writeAt(root, 'a.ts', 'x')
  assert.equal(treeFingerprint(root), null)
})
