#!/usr/bin/env node
/**
 * PreToolUse hook (matcher: Write|Edit).
 * Blocks modifications to existing linter/formatter config files.
 *
 * Failure this prevents: when a lint or type check fails, the cheapest way to
 * "make it green" is to weaken the config — disable the rule, widen an ignore,
 * drop a strict flag. The code stays wrong and the check stops catching it.
 * Blocking the edit steers the fix back to the source.
 *
 * Behavior:
 * - Only inspects Write/Edit calls whose target basename is a known config.
 * - Creating a config that does not exist yet is allowed (bootstrapping a
 *   fresh project is legitimate — there is nothing to weaken).
 * - Modifying an existing one is blocked (exit 2) with the reason on stderr.
 * - A stat error other than "not found" counts as existing (fail closed).
 *
 * Adapted from affaan-m/ECC `scripts/hooks/config-protection.js` (MIT).
 */
import { readFileSync, lstatSync } from 'node:fs'
import { basename, resolve } from 'node:path'

const PROTECTED = new Set([
  // ESLint — legacy and flat config
  '.eslintrc', '.eslintrc.js', '.eslintrc.cjs', '.eslintrc.json', '.eslintrc.yml', '.eslintrc.yaml',
  'eslint.config.js', 'eslint.config.mjs', 'eslint.config.cjs', 'eslint.config.ts', 'eslint.config.mts', 'eslint.config.cts',
  // Prettier
  '.prettierrc', '.prettierrc.js', '.prettierrc.cjs', '.prettierrc.json', '.prettierrc.yml', '.prettierrc.yaml',
  'prettier.config.js', 'prettier.config.cjs', 'prettier.config.mjs',
  // Biome
  'biome.json', 'biome.jsonc',
  // Stylelint / markdownlint
  '.stylelintrc', '.stylelintrc.json', '.stylelintrc.yml',
  '.markdownlint.json', '.markdownlint.yaml', '.markdownlintrc',
  // Ignore files — widening an ignore is the other way to make lint "pass"
  '.eslintignore', '.prettierignore', '.stylelintignore',
])
// Vendored or fixture copies of a config are test data, not the project's config.
const NOT_PROJECT_CONFIG = /(^|\/)(node_modules|fixtures|__fixtures__|__mocks__|examples?)\//
// tsconfig is deliberately NOT here: it carries paths/aliases that change for
// legitimate reasons. The strict-flag failure mode is covered by the project's
// verify command (Iron Law), not by freezing the file.

let input
try {
  input = JSON.parse(readFileSync(0, 'utf8'))
} catch {
  process.exit(0) // malformed input — never break the session
}

const rawPath = input?.tool_input?.file_path ?? ''
if (!rawPath) process.exit(0)
// Relative paths resolve against the session's cwd, not this process's — otherwise a
// relative `.eslintrc.json` stats the wrong place and the guard fails open.
const filePath = resolve(input?.cwd ?? process.cwd(), rawPath)
if (NOT_PROJECT_CONFIG.test(filePath)) process.exit(0)

const name = basename(filePath)
// Case-insensitive filesystems (macOS, Windows) map `.ESLINTRC.JS` to the same
// inode as `.eslintrc.js`, so match on the lowercased name too.
if (!PROTECTED.has(name) && !PROTECTED.has(name.toLowerCase())) process.exit(0)

let exists = true
try {
  lstatSync(filePath)
} catch (err) {
  if (err?.code === 'ENOENT') exists = false
}
if (!exists) process.exit(0) // first-time creation — nothing to weaken

console.error(
  `Modifying ${name} is blocked: fix the source code so the linter/formatter passes instead of ` +
    `weakening its config. If the config change itself is the task, ask the user to make it (or to ` +
    `disable this hook for the session).`
)
process.exit(2)
