import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const plugin = JSON.parse(readFileSync(join(root, '.claude-plugin/plugin.json'), 'utf8'))
const hooksJson = JSON.parse(readFileSync(join(root, 'hooks/hooks.json'), 'utf8'))

test('plugin.json does not declare hooks (auto-loaded; declaring it duplicates the load)', () => {
  // Claude Code ≥ 2.1: "Duplicate hooks file detected: ./hooks/hooks.json resolves to
  // already-loaded file … Hook load failed" — observed on 3.3.0.
  assert.equal('hooks' in plugin, false)
})

test('plugin.json does not declare agents (rejected by the manifest validator)', () => {
  assert.equal('agents' in plugin, false)
})

test('every hook script is wired in hooks.json and every wired script exists', () => {
  const scripts = readdirSync(join(root, 'hooks')).filter((f) => f.endsWith('.mjs'))
  const wired = JSON.stringify(hooksJson).match(/hooks\/([\w-]+\.mjs)/g).map((m) => m.split('/')[1])
  for (const s of scripts) assert.ok(wired.includes(s), `${s} is not wired`)
  for (const w of wired) assert.ok(scripts.includes(w), `${w} is wired but missing`)
})

test('hooks.json commands resolve through CLAUDE_PLUGIN_ROOT', () => {
  for (const event of Object.values(hooksJson.hooks)) {
    for (const group of event) {
      for (const h of group.hooks) {
        assert.equal(h.type, 'command')
        assert.match(h.command, /\$\{CLAUDE_PLUGIN_ROOT\}\/hooks\//)
      }
    }
  }
})
