import { test } from 'node:test'
import assert from 'node:assert/strict'
import { runHook, tempProject, writeAt } from './helpers.mjs'

const payload = (cwd, file_path, content) => ({ cwd, tool_name: 'Write', tool_input: { file_path, content } })

test('inactive in projects without .claude/rules/color-usage.md', () => {
  const root = tempProject()
  const r = runHook('block-raw-palette.mjs', payload(root, 'src/a.tsx', '<p className="text-red-500" />'))
  assert.equal(r.code, 0)
})

test('blocks raw palette classes in .tsx when the rule is seeded', () => {
  const root = tempProject()
  writeAt(root, '.claude/rules/color-usage.md', '# rule')
  const r = runHook('block-raw-palette.mjs', payload(root, 'src/a.tsx', '<p className="text-red-500 bg-blue-100/50" />'))
  assert.equal(r.code, 2)
  assert.match(r.stderr, /text-red-500/)
  assert.match(r.stderr, /bg-blue-100\/50/)
})

test('allows semantic tokens and ignores non-JSX files', () => {
  const root = tempProject()
  writeAt(root, '.claude/rules/color-usage.md', '# rule')
  assert.equal(runHook('block-raw-palette.mjs', payload(root, 'src/a.tsx', '<p className="text-muted-foreground bg-destructive" />')).code, 0)
  assert.equal(runHook('block-raw-palette.mjs', payload(root, 'src/a.css', '.x { color: red } /* text-red-500 */')).code, 0)
  assert.equal(runHook('block-raw-palette.mjs', payload(root, 'docs/notes.md', 'text-red-500')).code, 0)
})

test('checks Edit new_string too', () => {
  const root = tempProject()
  writeAt(root, '.claude/rules/color-usage.md', '# rule')
  const r = runHook('block-raw-palette.mjs', { cwd: root, tool_name: 'Edit', tool_input: { file_path: 'x.jsx', old_string: 'a', new_string: 'border-slate-200' } })
  assert.equal(r.code, 2)
})
