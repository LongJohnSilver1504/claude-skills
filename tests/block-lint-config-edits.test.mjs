import { test } from 'node:test'
import assert from 'node:assert/strict'
import { join } from 'node:path'
import { runHook, tempProject, writeAt } from './helpers.mjs'

const edit = (file_path) => ({ tool_name: 'Edit', tool_input: { file_path, old_string: 'a', new_string: 'b' } })
const write = (file_path) => ({ tool_name: 'Write', tool_input: { file_path, content: '{}' } })

test('allows editing ordinary source files', () => {
  const root = tempProject()
  const p = writeAt(root, 'src/app.tsx', 'x')
  assert.equal(runHook('block-lint-config-edits.mjs', edit(p)).code, 0)
})

test('allows creating a lint config that does not exist yet', () => {
  const root = tempProject()
  assert.equal(runHook('block-lint-config-edits.mjs', write(join(root, 'eslint.config.mjs'))).code, 0)
  assert.equal(runHook('block-lint-config-edits.mjs', write(join(root, '.prettierrc'))).code, 0)
})

test('blocks modifying an existing lint/formatter config', () => {
  const root = tempProject()
  for (const name of ['eslint.config.mjs', '.eslintrc.json', '.prettierrc', 'biome.json', '.stylelintrc']) {
    const p = writeAt(root, name, '{}')
    const r = runHook('block-lint-config-edits.mjs', edit(p))
    assert.equal(r.code, 2, name)
    assert.match(r.stderr, new RegExp(name.replace('.', '\\.')))
  }
})

test('matches config names case-insensitively', () => {
  const root = tempProject()
  const p = writeAt(root, 'Biome.JSON', '{}')
  assert.equal(runHook('block-lint-config-edits.mjs', edit(p)).code, 2)
})

test('leaves tsconfig and package.json alone', () => {
  const root = tempProject()
  for (const name of ['tsconfig.json', 'package.json', 'vitest.config.ts']) {
    const p = writeAt(root, name, '{}')
    assert.equal(runHook('block-lint-config-edits.mjs', edit(p)).code, 0, name)
  }
})

test('resolves relative paths against the payload cwd (fail closed)', () => {
  const root = tempProject()
  writeAt(root, '.eslintrc.json', '{}')
  const r = runHook('block-lint-config-edits.mjs', { cwd: root, tool_name: 'Edit', tool_input: { file_path: '.eslintrc.json', old_string: 'a', new_string: 'b' } })
  assert.equal(r.code, 2)
})

test('blocks ignore files, ignores fixtures and vendored copies', () => {
  const root = tempProject()
  assert.equal(runHook('block-lint-config-edits.mjs', edit(writeAt(root, '.eslintignore', 'dist'))).code, 2)
  assert.equal(runHook('block-lint-config-edits.mjs', edit(writeAt(root, 'tests/fixtures/eslint.config.js', '{}'))).code, 0)
  assert.equal(runHook('block-lint-config-edits.mjs', edit(writeAt(root, 'node_modules/x/.prettierrc', '{}'))).code, 0)
})

test('exits 0 on malformed or empty input', () => {
  assert.equal(runHook('block-lint-config-edits.mjs', 'garbage').code, 0)
  assert.equal(runHook('block-lint-config-edits.mjs', { tool_input: {} }).code, 0)
})
