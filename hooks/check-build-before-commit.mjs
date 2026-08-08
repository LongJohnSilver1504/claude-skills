#!/usr/bin/env node
/**
 * PreToolUse hook (matcher: Bash).
 * Blocks `git commit` when the build output is stale relative to source changes.
 *
 * Deterministic version of the git-commit skill's "Build Freshness" step:
 * instructions are advisory, hooks guarantee the action happens.
 *
 * Behavior:
 * - Only inspects Bash commands that run `git commit`.
 * - Looks for a build output (BUILD_MARKERS). If none exists, the project may
 *   not be a buildable app — allow.
 * - If any source file under SOURCE_DIRS is newer than the build output,
 *   block (exit 2) and tell Claude to run the project's build first.
 */
import { readFileSync, statSync, readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const BUILD_MARKERS = ['.next/BUILD_ID', '.next', 'dist', 'build', 'out', '.output']
const SOURCE_DIRS = ['src', 'app', 'pages', 'components', 'features', 'shared', 'lib']
const SOURCE_EXT = /\.(ts|tsx|js|jsx|mjs|css|scss)$/
const SKIP_DIRS = new Set(['node_modules', '.git', '.next', 'dist', 'build', 'out', '.output', 'coverage'])

let input
try {
  input = JSON.parse(readFileSync(0, 'utf8'))
} catch {
  process.exit(0) // malformed input — never break the session
}

const command = input?.tool_input?.command ?? ''
if (!/\bgit\b[^\n;&|]*\bcommit\b/.test(command)) process.exit(0)

const cwd = input?.cwd ?? process.cwd()

const mtimeOf = (p) => {
  try {
    return statSync(p).mtimeMs
  } catch {
    return null
  }
}

let buildMtime = null
for (const marker of BUILD_MARKERS) {
  const t = mtimeOf(join(cwd, marker))
  if (t !== null && (buildMtime === null || t > buildMtime)) buildMtime = t
}
if (buildMtime === null) process.exit(0) // no build output — not a buildable app

let newestSource = null
let newestPath = null
const walk = (dir, depth) => {
  if (depth > 6) return
  let entries
  try {
    entries = readdirSync(dir, { withFileTypes: true })
  } catch {
    return
  }
  for (const e of entries) {
    if (e.isDirectory()) {
      if (!SKIP_DIRS.has(e.name) && !e.name.startsWith('.')) walk(join(dir, e.name), depth + 1)
    } else if (SOURCE_EXT.test(e.name)) {
      const p = join(dir, e.name)
      const t = mtimeOf(p)
      if (t !== null && (newestSource === null || t > newestSource)) {
        newestSource = t
        newestPath = p
      }
    }
  }
}
for (const d of SOURCE_DIRS) {
  const p = join(cwd, d)
  if (existsSync(p)) walk(p, 0)
}

if (newestSource !== null && newestSource > buildMtime) {
  console.error(
    `Build is stale: ${newestPath} was modified after the last build. ` +
      `Run the project's build command (see docs/agents/project-conventions.md, e.g. \`pnpm build\`) ` +
      `and confirm it succeeds before committing.`
  )
  process.exit(2) // block the tool call; stderr is fed back to Claude
}

process.exit(0)
