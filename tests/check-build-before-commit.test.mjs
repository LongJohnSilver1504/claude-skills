import { test } from 'node:test'
import assert from 'node:assert/strict'
import { utimesSync } from 'node:fs'
import { join } from 'node:path'
import { runHook, tempProject, writeAt } from './helpers.mjs'

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

test('exits 0 on malformed input', () => {
  assert.equal(runHook('check-build-before-commit.mjs', 'nope').code, 0)
})
