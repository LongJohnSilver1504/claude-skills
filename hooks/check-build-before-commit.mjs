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
 *   block (exit 2) and tell Claude to run the project's build first —
 *   unless `<git-dir>/claude/verify-stamps.json` holds a `build` stamp (any
 *   command; written by scripts/verify-stamp.mjs) whose fingerprint matches the
 *   current working tree: that build already passed against exactly this
 *   content. The stamp is only trusted when the index equals the working tree
 *   for tracked files (`git diff --quiet`); with unstaged changes the commit is
 *   not the content the build saw, so the mtime check decides.
 */
import { readFileSync, statSync, readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'

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

/** True when a recorded build stamp matches the tree being committed. Never throws. */
const buildStampMatches = async () => {
  try {
    // Loaded lazily: only a stale-by-mtime commit pays for the git calls.
    const { treeFingerprint, markerPath } = await import(new URL('./lib/tree-fingerprint.mjs', import.meta.url).href)
    const path = markerPath(cwd, 'verify-stamps.json')
    if (!path) return false
    const byCommand = JSON.parse(readFileSync(path, 'utf8'))?.build
    if (!byCommand || typeof byCommand !== 'object') return false
    const stored = Object.values(byCommand).map((s) => s?.fingerprint).filter((f) => typeof f === 'string' && f)
    if (stored.length === 0) return false
    // Unstaged tracked changes: what gets committed is not what was built.
    if (spawnSync('git', ['diff', '--quiet'], { cwd, stdio: 'ignore' }).status !== 0) return false
    const current = treeFingerprint(cwd)
    return current !== null && stored.includes(current)
  } catch {
    return false
  }
}

if (newestSource !== null && newestSource > buildMtime) {
  if (await buildStampMatches()) process.exit(0)
  console.error(
    `Build is stale: ${newestPath} was modified after the last build. ` +
      `Run the project's build command (see docs/agents/project-conventions.md, e.g. \`pnpm build\`) ` +
      `and confirm it succeeds before committing.`
  )
  process.exit(2) // block the tool call; stderr is fed back to Claude
}

process.exit(0)
