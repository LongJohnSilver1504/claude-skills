#!/usr/bin/env node
/**
 * Sync the plugin version from package.json (single source of truth) into
 * .claude-plugin/plugin.json.
 *
 * Usage:
 *   node scripts/sync-version.mjs          # write plugin.json version from package.json
 *   node scripts/sync-version.mjs --check  # exit 1 if versions are out of sync (for CI)
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const pkgPath = resolve(root, 'package.json')
const pluginPath = resolve(root, '.claude-plugin/plugin.json')

const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))
const plugin = JSON.parse(readFileSync(pluginPath, 'utf8'))

const check = process.argv.includes('--check')

if (pkg.version === plugin.version) {
  console.log(`✓ Versions in sync: ${pkg.version}`)
  process.exit(0)
}

if (check) {
  console.error(
    `✗ Version mismatch:\n` +
      `    package.json            → ${pkg.version}\n` +
      `    .claude-plugin/plugin.json → ${plugin.version}\n` +
      `  Fix: run \`npm run sync-version\` (package.json is the source of truth).`
  )
  process.exit(1)
}

plugin.version = pkg.version
writeFileSync(pluginPath, JSON.stringify(plugin, null, 2) + '\n')
console.log(`✓ Wrote ${plugin.version} to .claude-plugin/plugin.json`)
