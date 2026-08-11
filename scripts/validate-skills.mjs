#!/usr/bin/env node
/**
 * Repo validator — catches the bug classes that have actually shipped here:
 * invalid frontmatter, bloated SKILL.md, cross-skill path references,
 * references to skills that don't exist, and desynced counters/versions.
 *
 * Run: node scripts/validate-skills.mjs   (exit 1 on any error)
 */
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs'
import { join, resolve, dirname, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const errors = []
const fail = (file, line, msg, fix) =>
  errors.push(`${relative(root, file)}${line ? `:${line}` : ''}\n    ${msg}\n    Fix: ${fix}`)

// Claude Code built-ins and external commands that are NOT skills in this repo
const SLASH_ALLOWLIST = new Set([
  'review', 'code-review', 'commit', 'clear', 'config', 'plugin', 'compact',
  'help', 'goal', 'fast', 'resume', 'init',
])

const skillsDir = join(root, 'skills')
const skillNames = readdirSync(skillsDir).filter((d) => {
  try {
    return statSync(join(skillsDir, d)).isDirectory() && existsSync(join(skillsDir, d, 'SKILL.md'))
  } catch {
    return false
  }
})

// ---------- 1. Frontmatter + line budget per skill ----------
for (const name of skillNames) {
  const file = join(skillsDir, name, 'SKILL.md')
  const content = readFileSync(file, 'utf8')
  const lines = content.split('\n')

  if (lines.length >= 500) {
    fail(file, 1, `SKILL.md has ${lines.length} lines (budget: <500).`,
      'Move depth to references/ files loaded on demand (progressive disclosure).')
  }

  if (lines[0] !== '---') {
    fail(file, 1, 'Frontmatter must start on line 1 with `---`.', 'Add YAML frontmatter delimiters.')
    continue
  }
  const closing = lines.indexOf('---', 1)
  if (closing === -1) {
    fail(file, 1, 'Frontmatter has no closing `---`.', 'Close the YAML block.')
    continue
  }
  const fm = lines.slice(1, closing)
  const blankIdx = fm.findIndex((l) => l.trim() === '')
  if (blankIdx !== -1) {
    fail(file, blankIdx + 2, 'Blank line inside YAML frontmatter (can break parsing).', 'Delete the blank line.')
  }
  // A plain (unquoted) YAML scalar may not contain ": " — the parser reads it as
  // a nested mapping and the whole frontmatter fails, which loads the skill with
  // EMPTY metadata (no name, no description) instead of erroring visibly. This
  // silently killed `audit-branch` for two releases. Same for " #" (comment).
  fm.forEach((line, i) => {
    const kv = line.match(/^([A-Za-z][\w-]*):[ \t]+(.*)$/)
    if (!kv) return
    const value = kv[2].trim()
    const quoted = /^(".*"|'.*')$/.test(value)
    if (quoted || !value) return
    if (/:\s/.test(value) || /\s#/.test(value)) {
      const offender = /:\s/.test(value) ? '": " (colon-space)' : '" #" (comment marker)'
      fail(file, i + 2, `Unquoted \`${kv[1]}:\` value contains ${offender} — YAML parsing fails and the skill loads with empty metadata.`,
        'Rephrase with an em dash or comma (preferred, keeps it a plain scalar), or wrap the whole value in quotes.')
    }
  })

  const fmText = fm.join('\n')
  const nameMatch = fmText.match(/^name:\s*(\S+)\s*$/m)
  if (!nameMatch) {
    fail(file, 2, 'Frontmatter is missing `name:`.', `Add \`name: ${name}\`.`)
  } else if (nameMatch[1] !== name) {
    fail(file, 2, `Frontmatter name \`${nameMatch[1]}\` != directory name \`${name}\`.`, 'Make them match.')
  }
  const descMatch = fmText.match(/^description:\s*(.+)$/m)
  if (!descMatch || !descMatch[1].trim()) {
    fail(file, 2, 'Frontmatter is missing a non-empty `description:`.', 'Add one.')
  } else {
    const desc = descMatch[1].trim()
    if (desc.length > 1024) {
      fail(file, 2, `Description is ${desc.length} chars (max 1024).`, 'Shorten it.')
    }
    const manualOnly = /^disable-model-invocation:\s*true/m.test(fmText)
    if (!manualOnly && !/use when/i.test(desc)) {
      fail(file, 2, `Model-invoked skill description has no "Use when" trigger clause.`,
        'Add "Use when <triggers>" — or mark the skill `disable-model-invocation: true` if it is manual-only.')
    }
  }
}

// ---------- 2. Cross-skill path references + canonical preamble drift ----------
const walkMd = (dir) => {
  const out = []
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name)
    if (e.isDirectory()) out.push(...walkMd(p))
    else if (e.name.endsWith('.md')) out.push(p)
  }
  return out
}

const preambleVariants = new Map()
for (const file of [...walkMd(skillsDir), ...walkMd(join(root, 'agents'))]) {
  const content = readFileSync(file, 'utf8')
  const ownSkill = file.startsWith(skillsDir + '/') ? relative(skillsDir, file).split('/')[0] : null
  content.split('\n').forEach((line, i) => {
    if (line.includes('~/.claude/skills') || line.includes('~/.claude/agents')) {
      fail(file, i + 1, 'Path into `~/.claude/` — breaks on plugin installs.',
        'Express the dependency as a prose invocation ("run the `/x` skill") or preload via agent `skills:` frontmatter.')
    }
    const m = line.match(/\bskills\/([a-z0-9-]+)\/(?:SKILL\.md|references|templates)/)
    if (m && m[1] !== ownSkill) {
      fail(file, i + 1, `Cross-skill file path into \`skills/${m[1]}/\`.`,
        'Reference the other skill by name in prose, never by file path.')
    }
    if (line.startsWith('> **Project config:**')) {
      if (!preambleVariants.has(line)) preambleVariants.set(line, [])
      preambleVariants.get(line).push(`${relative(root, file)}:${i + 1}`)
    }
  })
}
if (preambleVariants.size > 1) {
  const variants = [...preambleVariants.entries()]
    .map(([text, locs], i) => `  variant ${i + 1} (${locs.length}×): ${locs[0]} …`)
    .join('\n')
  fail(join(root, 'skills'), null, `The "Project config" preamble has ${preambleVariants.size} divergent variants:\n${variants}`,
    'Make every copy byte-identical (it is a canonical block).')
}

// shared-conventions.md exists in two skills as a deliberate mirrored copy
// (cross-skill file references are banned) — guard against drift.
const scA = join(skillsDir, 'create-feature/references/shared-conventions.md')
const scB = join(skillsDir, 'create-infrastructure/references/shared-conventions.md')
if (existsSync(scA) && existsSync(scB) && readFileSync(scA, 'utf8') !== readFileSync(scB, 'utf8')) {
  fail(scB, null, "shared-conventions.md diverged from create-feature's copy (they are deliberate mirrors).",
    'Make both files byte-identical.')
}

// ---------- 3. Slash references to nonexistent skills ----------
// CHANGELOG.md is excluded: it narrates history, including removed skills.
// A `/token` only counts as a skill reference in an invocation-ish context
// (table rows, or lines talking about skills/running/using) — bare route
// examples like `/settings` are not flagged.
const slashScanFiles = [...walkMd(skillsDir), ...walkMd(join(root, 'agents')), join(root, 'README.md')]
for (const file of slashScanFiles) {
  const content = readFileSync(file, 'utf8')
  content.split('\n').forEach((line, i) => {
    const invocationContext = line.trimStart().startsWith('|') || /\b(skill|invoke|run|use|via|see|pipeline)\b/i.test(line)
    if (!invocationContext) return
    for (const m of line.matchAll(/`\/([a-z][a-z0-9-]*)`/g)) {
      const ref = m[1]
      if (!skillNames.includes(ref) && !SLASH_ALLOWLIST.has(ref)) {
        fail(file, i + 1, `Reference to \`/${ref}\` — no such skill in skills/ and not a known built-in.`,
          'Remove the reference, fix the name, or add the command to SLASH_ALLOWLIST in scripts/validate-skills.mjs if it is a Claude Code built-in.')
      }
    }
  })
}

// ---------- 4. Counter + version sync ----------
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
const plugin = JSON.parse(readFileSync(join(root, '.claude-plugin/plugin.json'), 'utf8'))
const readme = readFileSync(join(root, 'README.md'), 'utf8')
const n = skillNames.length

for (const [label, text, file] of [
  ['package.json description', pkg.description, join(root, 'package.json')],
  ['plugin.json description', plugin.description, join(root, '.claude-plugin/plugin.json')],
  ['README', readme, join(root, 'README.md')],
]) {
  const counts = [...text.matchAll(/(\d+)\s+skills/g)].map((m) => Number(m[1]))
  for (const c of counts) {
    if (c !== n) {
      fail(file, null, `${label} says "${c} skills" but skills/ contains ${n}.`, `Update to "${n} skills".`)
    }
  }
}

if (pkg.version !== plugin.version) {
  fail(join(root, 'package.json'), null, `Version mismatch: package.json=${pkg.version}, plugin.json=${plugin.version}.`,
    'Run `npm run sync-version` (package.json is the source of truth).')
}

// The current version must have a CHANGELOG entry — shipping a version whose
// changes were never narrated is the failure this repo's release flow prevents.
// Tolerates the older month-only date form (`## 2.0.0 (2026-07)`).
const changelogPath = join(root, 'CHANGELOG.md')
const changelog = readFileSync(changelogPath, 'utf8')
const versionHeading = new RegExp(`^## ${pkg.version.replace(/\./g, '\\.')} \\(\\d{4}-\\d{2}(?:-\\d{2})?\\)\\s*$`, 'm')
if (!versionHeading.test(changelog)) {
  fail(changelogPath, null, `No CHANGELOG entry for the current version ${pkg.version}.`,
    `Add a "## ${pkg.version} (YYYY-MM-DD)" section — or let \`npm run release\` cut it from [Unreleased].`)
}
if (!existsSync(join(root, '.claude-plugin/marketplace.json'))) {
  fail(join(root, '.claude-plugin'), null, 'marketplace.json is missing but the README documents `/plugin marketplace add`.',
    'Restore .claude-plugin/marketplace.json.')
}

// ---------- 5. Reviewer agents must not carry Write/Edit ----------
for (const agentFile of readdirSync(join(root, 'agents')).filter((f) => f.endsWith('.md'))) {
  const p = join(root, 'agents', agentFile)
  const content = readFileSync(p, 'utf8')
  if (!/-reviewer\.md$/.test(agentFile)) continue
  const toolsMatch = content.match(/^tools:\s*(.+)$/m)
  if (!toolsMatch) {
    fail(p, null, 'Reviewer agent declares no `tools:` — it inherits everything, including Write/Edit.',
      'Declare a restricted tool list (Read, Grep, Glob[, Bash]).')
  } else if (/\b(Write|Edit|NotebookEdit)\b/.test(toolsMatch[1])) {
    fail(p, null, `Reviewer agent tools include a mutating tool: ${toolsMatch[1]}.`,
      'Reviewers read and report — remove Write/Edit/NotebookEdit.')
  }
}

// ---------- Report ----------
if (errors.length) {
  console.error(`✗ ${errors.length} validation error(s):\n`)
  for (const e of errors) console.error(`  ${e}\n`)
  process.exit(1)
}
console.log(`✓ ${n} skills, agents, hooks, and manifests validated — no errors.`)
