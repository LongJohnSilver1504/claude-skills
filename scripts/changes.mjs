#!/usr/bin/env node
/**
 * Show what changed between two released versions: the why (CHANGELOG), the
 * commits, the surface touched, and which skills appeared or disappeared.
 *
 * Usage:
 *   node scripts/changes.mjs 3.0.0          # 3.0.0 -> HEAD
 *   node scripts/changes.mjs 3.0.0 3.1.0    # between two releases
 */
import { readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const [from, to = 'HEAD'] = process.argv.slice(2).filter((a) => !a.startsWith('-'))

if (!from) {
  console.error('Usage: node scripts/changes.mjs <from-version> [to-version]\n' +
    '  e.g. node scripts/changes.mjs 3.0.0 3.1.0')
  process.exit(1)
}

const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim()
const tagFor = (v) => (v === 'HEAD' ? 'HEAD' : `claude-skills--v${v}`)

/** Resolve a version to a git ref, explaining clearly when its tag is missing. */
const resolveRef = (version) => {
  const ref = tagFor(version)
  try {
    git('rev-parse', '--verify', `${ref}^{commit}`)
    return ref
  } catch {
    const known = git('tag', '--list', 'claude-skills--v*')
      .split('\n')
      .filter(Boolean)
      .map((t) => t.replace('claude-skills--v', ''))
    console.error(
      `✗ No tag for version ${version} (looked for ${ref}).\n` +
        `  Tagged versions: ${known.length ? known.join(', ') : '(none yet)'}\n` +
        `  Versions before 3.0.0 were never tagged — read their CHANGELOG entry instead.`
    )
    process.exit(1)
  }
}

const fromRef = resolveRef(from)
const toRef = resolveRef(to)
const range = `${fromRef}..${toRef}`
const heading = (title) => console.log(`\n\x1b[1m${title}\x1b[0m`)

console.log(`\nchanges ${from} → ${to}   (${range})`)

// ---------- Why: the CHANGELOG section of the target version ----------
heading(`CHANGELOG — ${to}`)
const changelog = readFileSync(resolve(root, 'CHANGELOG.md'), 'utf8')
// Tolerates both `## 3.1.0 (2026-08-11)` and the older `## 2.0.0 (2026-07)`.
const sectionRe = to === 'HEAD'
  ? /^## \[Unreleased\]\s*$/m
  : new RegExp(`^## ${to.replace(/\./g, '\\.')} \\(\\d{4}-\\d{2}(?:-\\d{2})?\\)\\s*$`, 'm')
const start = changelog.match(sectionRe)
if (!start) {
  console.log(`  (no CHANGELOG section found for ${to})`)
} else {
  const rest = changelog.slice(start.index + start[0].length)
  const end = rest.search(/^## /m)
  const body = (end === -1 ? rest : rest.slice(0, end)).trim()
  console.log(body ? body : '  (section is empty)')
}

// ---------- Commits ----------
heading('Commits')
const log = git('log', '--oneline', '--no-merges', range)
console.log(log || '  (none)')

// ---------- Surface touched ----------
heading('Files')
const stat = git('diff', '--stat', range)
console.log(stat || '  (none)')

// ---------- Skills added / removed — the signal that matters most here ----------
const skillsAt = (ref) =>
  new Set(
    git('ls-tree', '-r', '--name-only', ref, 'skills/')
      .split('\n')
      .filter((p) => p.endsWith('/SKILL.md'))
      .map((p) => p.split('/')[1])
  )

const before = skillsAt(fromRef)
const after = skillsAt(toRef)
const added = [...after].filter((s) => !before.has(s))
const removed = [...before].filter((s) => !after.has(s))

heading(`Skills (${before.size} → ${after.size})`)
if (!added.length && !removed.length) console.log('  (no skills added or removed)')
for (const s of added) console.log(`  + ${s}`)
for (const s of removed) console.log(`  - ${s}`)
console.log()
