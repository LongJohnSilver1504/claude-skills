/**
 * Feature-map freshness — shared by `scripts/feature-map.mjs` and the
 * `feature-map-stale` SessionStart hook.
 *
 * The map (`docs/agents/feature-map.md`) is prose for agents. Its machine state lives
 * next to it in `feature-map.lock.json`: the roots that were watched and the listing
 * they had when the map was last written. Drift = the listing today differs from the
 * lock. Nothing here reads file contents or calls a model.
 *
 * Root spec, one string per root:
 *   "src/features"                 immediate sub-directories (depth 1)
 *   "src/features depth=2"         directories down to depth 2
 *   "src/pages files"              every source file, recursively (file-based routers)
 *   "src/app files=page.tsx,route.ts"   only files with those basenames
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

export const MAP_FILE = 'docs/agents/feature-map.md'
export const LOCK_FILE = 'docs/agents/feature-map.lock.json'

const SKIP_DIR = /^(\.|node_modules$|__tests__$|__mocks__$|__snapshots__$|dist$|build$|coverage$)/
const SOURCE_FILE = /\.(tsx?|jsx?|mjs|cjs|vue|svelte|astro)$/
const TEST_FILE = /\.(test|spec|stories)\.[a-z]+$|\.d\.ts$/

export function parseRoot(spec) {
  const [path, ...flags] = String(spec).trim().split(/\s+/)
  const root = { path: path.replace(/\/+$/, ''), mode: 'dirs', depth: 1, names: null }
  for (const flag of flags) {
    const depth = flag.match(/^depth=(\d+)$/)
    const files = flag.match(/^files(?:=(.+))?$/)
    if (depth) root.depth = Math.max(1, Number(depth[1]))
    else if (files) {
      root.mode = 'files'
      root.names = files[1] ? files[1].split(',').map((n) => n.trim()).filter(Boolean) : null
    } else throw new Error(`unknown root flag "${flag}" in "${spec}" (use depth=N, files, or files=a.tsx,b.ts)`)
  }
  if (!root.path) throw new Error(`empty root in "${spec}"`)
  return root
}

/** Sorted, repo-relative entries for one root. A missing root lists nothing. */
export function listRoot(cwd, spec) {
  const root = parseRoot(spec)
  const out = []
  const walk = (rel, level) => {
    let entries
    try {
      entries = readdirSync(join(cwd, rel), { withFileTypes: true })
    } catch {
      return
    }
    for (const e of entries) {
      const child = `${rel}/${e.name}`
      if (e.isDirectory()) {
        if (SKIP_DIR.test(e.name)) continue
        if (root.mode === 'dirs') {
          out.push(child)
          if (level < root.depth) walk(child, level + 1)
        } else walk(child, level + 1)
      } else if (root.mode === 'files' && e.isFile()) {
        const wanted = root.names ? root.names.includes(e.name) : SOURCE_FILE.test(e.name) && !TEST_FILE.test(e.name)
        if (wanted) out.push(child)
      }
    }
  }
  walk(root.path, 1)
  return out.sort()
}

export function scan(cwd, roots) {
  return Object.fromEntries(roots.map((spec) => [spec, listRoot(cwd, spec)]))
}

export function readLock(cwd) {
  const file = join(cwd, LOCK_FILE)
  if (!existsSync(file)) return null
  const lock = JSON.parse(readFileSync(file, 'utf8'))
  if (!Array.isArray(lock.roots) || typeof lock.entries !== 'object' || lock.entries === null) {
    throw new Error(`${LOCK_FILE} is not a feature-map lock (needs "roots" and "entries")`)
  }
  return lock
}

/** What changed on disk since the lock was written. */
export function diffLock(cwd, lock) {
  const added = []
  const removed = []
  for (const spec of lock.roots) {
    const before = new Set(lock.entries[spec] ?? [])
    const now = new Set(listRoot(cwd, spec))
    for (const e of now) if (!before.has(e)) added.push(e)
    for (const e of before) if (!now.has(e)) removed.push(e)
  }
  return { added: added.sort(), removed: removed.sort() }
}

/** Depth-1 directories of every `dirs` root — the features a map has to mention. */
export function featureDirs(cwd, roots) {
  const dirs = []
  for (const spec of roots) {
    const root = parseRoot(spec)
    if (root.mode !== 'dirs') continue
    for (const e of listRoot(cwd, `${root.path} depth=1`)) dirs.push(e)
  }
  return dirs
}

/** Backticked repo-relative paths in the map that no longer exist. Routes (`/login`) and endpoints (`GET /x`) are not paths. */
export function deadPaths(cwd, mapText) {
  const dead = new Set()
  for (const m of mapText.matchAll(/`([^`\s]+)`/g)) {
    const token = m[1].replace(/[.,;:]+$/, '')
    if (!token.includes('/') || token.startsWith('/') || /^[a-z]+:\/\//i.test(token)) continue
    if (/[*{}<>$|]/.test(token) || token.startsWith('@')) continue
    if (!existsSync(join(cwd, token))) dead.add(token)
  }
  return [...dead].sort()
}

export const summarize = (list, max = 6) =>
  list.length <= max ? list.join(', ') : `${list.slice(0, max).join(', ')} and ${list.length - max} more`
