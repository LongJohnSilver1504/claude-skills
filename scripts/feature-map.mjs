#!/usr/bin/env node
/**
 * feature-map — the deterministic half of the `feature-map` skill. The skill writes
 * `docs/agents/feature-map.md`; this script says what exists, records what the map
 * was written against, and reports drift. It never writes the map itself.
 *
 * Run from the project root (or pass --cwd):
 *
 *   node scripts/feature-map.mjs scan  --root "src/features" --root "src/pages files"
 *       Print the listing of each root as JSON — what the map has to cover.
 *
 *   node scripts/feature-map.mjs lock  [--root … ]
 *       Record the current listing in docs/agents/feature-map.lock.json. Reuses the
 *       lock's roots when none are given. Refuses (exit 1) while the map does not
 *       mention a feature directory or names a path that does not exist.
 *
 *   node scripts/feature-map.mjs check
 *       fresh | stale: +added -removed | unmapped: … | dead: …   (exit 1 unless fresh)
 *
 * Root spec: "path" (sub-directories, depth 1) · "path depth=2" · "path files"
 * (every source file — file-based routers) · "path files=page.tsx,route.ts".
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { LOCK_FILE, MAP_FILE, deadPaths, diffLock, featureDirs, parseRoot, readLock, scan, summarize } from '../hooks/lib/feature-map.mjs'

const argv = process.argv.slice(2)
const mode = argv[0]
const all = (flag) => argv.flatMap((a, i) => (a === flag && argv[i + 1] !== undefined ? [argv[i + 1]] : []))
const cwd = resolve(all('--cwd')[0] ?? process.cwd())
const die = (msg, code = 1) => {
  console.error(`✗ ${msg}`)
  process.exit(code)
}

const rootsFromArgs = () => {
  const roots = all('--root')
  try {
    roots.forEach(parseRoot)
  } catch (e) {
    die(e.message, 2)
  }
  return roots
}

/** Problems that make a map wrong even when the listing has not moved. */
function mapProblems(roots) {
  const mapFile = join(cwd, MAP_FILE)
  if (!existsSync(mapFile)) return { missing: true, unmapped: [], dead: [] }
  // A large repo splits the map by area: docs/agents/feature-map/<area>.md count as part of it.
  const areaDir = join(cwd, MAP_FILE.replace(/\.md$/, ''))
  const areaFiles = existsSync(areaDir) ? readdirSync(areaDir).filter((f) => f.endsWith('.md')).sort() : []
  const text = [mapFile, ...areaFiles.map((f) => join(areaDir, f))].map((f) => readFileSync(f, 'utf8')).join('\n')
  return {
    missing: false,
    unmapped: featureDirs(cwd, roots).filter((dir) => !text.includes(dir)),
    dead: deadPaths(cwd, text),
  }
}

if (mode === 'scan') {
  const roots = rootsFromArgs()
  if (!roots.length) die('scan needs at least one --root "<path> [depth=N | files | files=a,b]"', 2)
  const listing = scan(cwd, roots)
  for (const [spec, entries] of Object.entries(listing)) {
    if (!entries.length) console.error(`! root "${spec}" lists nothing — wrong path, or nothing there yet`)
  }
  console.log(JSON.stringify(listing, null, 2))
} else if (mode === 'lock') {
  let roots = rootsFromArgs()
  if (!roots.length) {
    let lock
    try {
      lock = readLock(cwd)
    } catch (e) {
      die(e.message)
    }
    if (!lock) die(`no ${LOCK_FILE} yet — pass the roots: lock --root "src/features" [--root …]`, 2)
    roots = lock.roots
  }
  const problems = mapProblems(roots)
  if (problems.missing) die(`${MAP_FILE} does not exist — write the map first, then lock it`)
  if (problems.unmapped.length || problems.dead.length) {
    if (problems.unmapped.length) console.error(`✗ unmapped: ${summarize(problems.unmapped, 20)} — every feature directory needs a row that names its path`)
    if (problems.dead.length) console.error(`✗ dead: ${summarize(problems.dead, 20)} — the map names paths that do not exist`)
    process.exit(1)
  }
  const file = join(cwd, LOCK_FILE)
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, `${JSON.stringify({ version: 1, roots, entries: scan(cwd, roots) }, null, 2)}\n`)
  console.log(`✓ locked: ${LOCK_FILE} (${roots.length} root(s))`)
} else if (mode === 'check') {
  let lock
  try {
    lock = readLock(cwd)
  } catch (e) {
    die(e.message)
  }
  if (!lock) die(`no ${LOCK_FILE} — this project has no feature map yet (run the feature-map skill)`)
  const { added, removed } = diffLock(cwd, lock)
  const problems = mapProblems(lock.roots)
  const lines = []
  if (problems.missing) lines.push(`missing: ${MAP_FILE}`)
  if (added.length || removed.length) {
    lines.push(`stale: ${[...added.map((e) => `+${e}`), ...removed.map((e) => `-${e}`)].join(' ')}`)
  }
  if (problems.unmapped.length) lines.push(`unmapped: ${problems.unmapped.join(' ')}`)
  if (problems.dead.length) lines.push(`dead: ${problems.dead.join(' ')}`)
  if (!lines.length) {
    console.log('fresh')
  } else {
    console.log(lines.join('\n'))
    process.exit(1)
  }
} else {
  die('usage: feature-map.mjs scan --root <spec> … | lock [--root <spec> …] | check   [--cwd <project>]', 2)
}
