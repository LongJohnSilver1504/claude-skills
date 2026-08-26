#!/usr/bin/env node
/**
 * design-craft validator — the invariants this plugin depends on:
 * parseable frontmatter, the SKILL.md line budget, "Use when" triggers on
 * model-invoked skills, no cross-skill file paths, references to skills that
 * exist, the byte-identical Reporting block across reference skills, a
 * read-only critic agent, and counters/versions in sync.
 *
 * Run from design-craft/:  node scripts/validate.mjs   (exit 1 on any error)
 */
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs'
import { join, resolve, dirname, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const errors = []
const fail = (file, line, msg, fix) =>
  errors.push(`${relative(root, file)}${line ? `:${line}` : ''}\n    ${msg}\n    Fix: ${fix}`)

const skillsDir = join(root, 'skills')
const skillNames = readdirSync(skillsDir).filter((d) => {
  try {
    return statSync(join(skillsDir, d)).isDirectory() && existsSync(join(skillsDir, d, 'SKILL.md'))
  } catch {
    return false
  }
})

// Skills whose rules design-review routes to. Their Reporting blocks share one
// canonical tail so the orchestrator can consolidate them without translation.
const REFERENCE_SKILLS = [
  'accessibility', 'hierarchy-layout', 'interface-copy', 'typography', 'color-system', 'ui-polish', 'motion',
]
const CANONICAL_REPORTING = [
  '**Format.** Group findings under the principle each violates, ordered by severity, one row per root cause listing every location it appears in:',
  '',
  '| Severity | Location | Before | After | Why |',
  '| --- | --- | --- | --- | --- |',
  '',
  '`Location` is `path/to/file:line`. `Why` names the principle and the user impact. Report every check you could not run as `Not verified`.',
  '',
  'End with `Block` when any `HIGH` remains, `Approve` otherwise, leaving the rest in the table as work to do. Never `Approve` coverage you did not inspect. With nothing to report, say "No actionable findings" for this domain in one line and report verification.',
].join('\n')

// Claude Code built-ins that are not skills here.
const SLASH_ALLOWLIST = new Set(['plugin', 'help', 'config', 'clear', 'compact', 'review', 'code-review', 'commit', 'init'])

// ---------- 1. Frontmatter, budget, triggers ----------
for (const name of skillNames) {
  const file = join(skillsDir, name, 'SKILL.md')
  const content = readFileSync(file, 'utf8')
  const lines = content.split('\n')

  if (lines.length >= 500) {
    fail(file, 1, `SKILL.md has ${lines.length} lines (budget: <500).`, 'Move depth to references/.')
  }
  if (lines[0] !== '---') {
    fail(file, 1, 'Frontmatter must start on line 1 with `---`.', 'Add YAML frontmatter.')
    continue
  }
  const closing = lines.indexOf('---', 1)
  if (closing === -1) {
    fail(file, 1, 'Frontmatter has no closing `---`.', 'Close the YAML block.')
    continue
  }
  const fm = lines.slice(1, closing)
  fm.forEach((line, i) => {
    if (line.trim() === '') fail(file, i + 2, 'Blank line inside frontmatter.', 'Delete it.')
    const kv = line.match(/^([A-Za-z][\w-]*):[ \t]+(.*)$/)
    if (!kv) return
    const value = kv[2].trim()
    if (/^(".*"|'.*')$/.test(value) || !value || value === '|' || value === '>-') return
    if (/:\s/.test(value) || /\s#/.test(value)) {
      fail(file, i + 2, `Unquoted \`${kv[1]}:\` value contains ": " or " #" — YAML parses a nested mapping and the skill loads with empty metadata.`,
        'Rephrase with an em dash or comma, or quote the whole value.')
    }
  })
  const fmText = fm.join('\n')
  const nameMatch = fmText.match(/^name:\s*(\S+)\s*$/m)
  if (!nameMatch) fail(file, 2, 'Missing `name:`.', `Add \`name: ${name}\`.`)
  else if (nameMatch[1] !== name) fail(file, 2, `name \`${nameMatch[1]}\` != directory \`${name}\`.`, 'Make them match.')

  const descMatch = fmText.match(/^description:\s*(.+)$/m)
  if (!descMatch || !descMatch[1].trim()) {
    fail(file, 2, 'Missing a non-empty `description:`.', 'Add one.')
  } else {
    const desc = descMatch[1].trim()
    if (desc.length > 1024) fail(file, 2, `Description is ${desc.length} chars (max 1024).`, 'Shorten it.')
    const manualOnly = /^disable-model-invocation:\s*true/m.test(fmText)
    if (!manualOnly && !/use when/i.test(desc)) {
      fail(file, 2, 'Model-invoked skill has no "Use when" trigger clause.',
        'Add "Use when <triggers>" or mark it `disable-model-invocation: true`.')
    }
  }

  if (REFERENCE_SKILLS.includes(name)) {
    if (!content.includes(CANONICAL_REPORTING)) {
      fail(file, null, 'Reporting block differs from the canonical text shared by every reference skill.',
        'Copy the block byte-for-byte from another reference skill (design-review consolidates on it).')
    }
    if (!/^\*\*Severity\.\*\*/m.test(content) || !/^\*\*Verification\.\*\*/m.test(content)) {
      fail(file, null, 'Reference skill lacks a `**Severity.**` or `**Verification.**` line before the Format block.',
        'Add both: what HIGH/MEDIUM/LOW mean in this domain, and what to check with and without a browser.')
    }
  }
}

// ---------- 2. Cross-skill paths and slash references ----------
const walkMd = (dir) => {
  const out = []
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name)
    if (e.isDirectory()) out.push(...walkMd(p))
    else if (e.name.endsWith('.md')) out.push(p)
  }
  return out
}
const scanFiles = [...walkMd(skillsDir), ...walkMd(join(root, 'agents')), join(root, 'README.md')]
for (const file of scanFiles) {
  const content = readFileSync(file, 'utf8')
  const ownSkill = file.startsWith(skillsDir + '/') ? relative(skillsDir, file).split('/')[0] : null
  content.split('\n').forEach((line, i) => {
    if (line.includes('~/.claude/skills') || line.includes('~/.claude/agents')) {
      fail(file, i + 1, 'Path into `~/.claude/` — breaks on plugin installs.', 'Refer to the other skill by name in prose.')
    }
    const m = line.match(/\bskills\/([a-z0-9-]+)\/(?:SKILL\.md|references)/)
    if (m && m[1] !== ownSkill && !file.endsWith('README.md')) {
      fail(file, i + 1, `Cross-skill file path into \`skills/${m[1]}/\`.`, 'Reference the other skill by name in prose.')
    }
    const invocationContext = line.trimStart().startsWith('|') || /\b(skill|invoke|run|use|via|see)\b/i.test(line)
    if (!invocationContext) return
    for (const s of line.matchAll(/`\/([a-z][a-z0-9-]*)`/g)) {
      if (!skillNames.includes(s[1]) && !SLASH_ALLOWLIST.has(s[1])) {
        fail(file, i + 1, `Reference to \`/${s[1]}\` — no such skill and not a known built-in.`, 'Fix the name or add it to SLASH_ALLOWLIST.')
      }
    }
  })
}

// Skill names mentioned in backticks must exist (catches renamed skills in prose).
const KNOWN_TOKENS = new Set(skillNames)
for (const file of [...walkMd(skillsDir), ...walkMd(join(root, 'agents'))]) {
  readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
    for (const s of line.matchAll(/`([a-z]+(?:-[a-z]+)+)`/g)) {
      const t = s[1]
      // only tokens that look like one of our skills but aren't: same vocabulary, hyphenated, ends in a known skill suffix
      if (KNOWN_TOKENS.has(t)) continue
      if (/^(design|interface|hierarchy|pick|stress|landing)-[a-z-]+$/.test(t) || /^(ui-polish|color-system)[a-z-]+$/.test(t)) {
        fail(file, i + 1, `Mentions \`${t}\`, which is not a skill in skills/.`, 'Fix the name or drop the backticks.')
      }
    }
  })
}

// ---------- 3. Counts and version ----------
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
const plugin = JSON.parse(readFileSync(join(root, '.claude-plugin/plugin.json'), 'utf8'))
const marketplace = JSON.parse(readFileSync(join(root, '.claude-plugin/marketplace.json'), 'utf8'))
const readme = readFileSync(join(root, 'README.md'), 'utf8')
const n = skillNames.length
for (const [label, text, file] of [
  ['package.json description', pkg.description, join(root, 'package.json')],
  ['plugin.json description', plugin.description, join(root, '.claude-plugin/plugin.json')],
  ['marketplace.json plugin description', marketplace.plugins[0].description, join(root, '.claude-plugin/marketplace.json')],
  ['README', readme, join(root, 'README.md')],
]) {
  for (const c of [...text.matchAll(/(\d+)\s+skills/g)].map((m) => Number(m[1]))) {
    if (c !== n) fail(file, null, `${label} says "${c} skills" but skills/ contains ${n}.`, `Update to "${n} skills".`)
  }
}
if (pkg.version !== plugin.version) {
  fail(join(root, 'package.json'), null, `Version mismatch: package.json=${pkg.version}, plugin.json=${plugin.version}.`, 'Make them equal.')
}
const changelog = readFileSync(join(root, 'CHANGELOG.md'), 'utf8')
if (!new RegExp(`^## ${pkg.version.replace(/\./g, '\\.')} \\(\\d{4}-\\d{2}-\\d{2}\\)[ \\t]*$`, 'm').test(changelog)) {
  fail(join(root, 'CHANGELOG.md'), null, `No CHANGELOG section for ${pkg.version}.`, `Add "## ${pkg.version} (YYYY-MM-DD)".`)
}
// Every skill is listed in the README catalog.
for (const s of skillNames) {
  if (!readme.includes(`\`${s}\``)) fail(join(root, 'README.md'), null, `Skill \`${s}\` is not in the README catalog.`, 'Add a row.')
}

// ---------- 4. Agents are read-only ----------
for (const agentFile of readdirSync(join(root, 'agents')).filter((f) => f.endsWith('.md'))) {
  const p = join(root, 'agents', agentFile)
  const toolsMatch = readFileSync(p, 'utf8').match(/^tools:\s*(.+)$/m)
  if (!toolsMatch) fail(p, null, 'Agent declares no `tools:` — it inherits Write/Edit.', 'Declare Read, Glob, Grep[, Bash].')
  else if (/\b(Write|Edit|NotebookEdit)\b/.test(toolsMatch[1])) fail(p, null, `Agent tools include a mutating tool: ${toolsMatch[1]}.`, 'Reviewers read and report.')
}

if (errors.length) {
  console.error(`✗ ${errors.length} validation error(s):\n`)
  for (const e of errors) console.error(`  ${e}\n`)
  process.exit(1)
}
console.log(`✓ design-craft: ${n} skills, agents and manifests validated — no errors.`)
