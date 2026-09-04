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
  'review', 'code-review', 'security-review', 'simplify', 'commit', 'clear', 'config', 'plugin', 'compact',
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
  // `argument-hint` is shown to the user on `/skill <tab>`; a hint that does not
  // read as a placeholder (`<path/to/plan.md>`) is noise in the picker.
  const hintMatch = fmText.match(/^argument-hint:\s*(.+)$/m)
  if (hintMatch && !/^["']?<.+>["']?$/.test(hintMatch[1].trim())) {
    fail(file, 2, `argument-hint "${hintMatch[1].trim()}" is not written as a placeholder.`,
      'Write it as `<what-to-pass>`, e.g. `argument-hint: <path/to/*-implementation-plan.md>`.')
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

// Claude Code ≥ 2.1 auto-loads `hooks/hooks.json` and `agents/` by convention.
// Declaring either in plugin.json makes the loader report "Duplicate hooks file
// detected … Hook load failed" (seen in this repo's own debug logs on 3.3.0) or
// reject the manifest outright for `agents`. Only *additional* hook files may be
// declared, and we ship none.
const pluginJsonPath = join(root, '.claude-plugin/plugin.json')
if ('hooks' in plugin) {
  fail(pluginJsonPath, null, 'plugin.json declares `hooks` — Claude Code already auto-loads hooks/hooks.json, so this produces "Duplicate hooks file detected" and the hooks fail to load.',
    'Remove the `hooks` key. Only additional hook files (not hooks/hooks.json) may be declared.')
}
if ('agents' in plugin) {
  fail(pluginJsonPath, null, 'plugin.json declares `agents` — the Claude Code manifest validator rejects the field; agents/*.md are discovered by convention.',
    'Remove the `agents` key.')
}

// The number of `.mjs` hooks wired in hooks.json must match the "N hooks" claim in
// CLAUDE.md and README — a README table that lists three hooks when five ship is a
// README that lies about what the plugin enforces.
const hookScripts = readdirSync(join(root, 'hooks')).filter((f) => f.endsWith('.mjs'))
const hooksJsonText = readFileSync(join(root, 'hooks/hooks.json'), 'utf8')
for (const f of hookScripts) {
  if (!hooksJsonText.includes(f)) {
    fail(join(root, 'hooks', f), null, `Hook script ${f} exists but is not wired in hooks/hooks.json.`,
      'Wire it (with its matcher) or delete it — an unwired hook enforces nothing.')
  }
}
// Anchored to the two claim sites ("…, N hooks, and…" in CLAUDE.md; "ships N (`hooks/hooks.json`)"
// in README) so "React 19 hooks" in prose never trips it.
const HOOK_WORDS = { two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8 }
for (const [label, file, re] of [
  ['CLAUDE.md', join(root, 'CLAUDE.md'), /agents,\s+(\d+|[a-z]+)\s+hooks,/g],
  ['README', join(root, 'README.md'), /ships\s+(\d+|[a-z]+)\s+\(`hooks\/hooks\.json`\)/g],
]) {
  const text = readFileSync(file, 'utf8')
  let seen = 0
  for (const m of text.matchAll(re)) {
    seen++
    const c = HOOK_WORDS[m[1]] ?? Number(m[1])
    if (c !== hookScripts.length) {
      fail(file, null, `${label} says "${m[1]} hooks" but hooks/ contains ${hookScripts.length} wired scripts.`,
        `Update the count to ${hookScripts.length} and the hooks table.`)
    }
  }
  if (seen === 0) {
    fail(file, null, `${label} no longer carries a hooks count the validator recognizes.`,
      'Keep the phrasing "N hooks, and" (CLAUDE.md) / "ships N (`hooks/hooks.json`)" (README), or update the regex here.')
  }
}

// Personal absolute paths leak the author's machine into every consumer's context and
// break the moment the plugin is installed elsewhere. `~/` paths are fine (documented
// as the user's own clone); `/Users/<name>/` is not. (`/home/` is left alone — it is a
// common route literal in examples.)
const rulesDir = join(root, 'rules')
for (const file of [...walkMd(skillsDir), ...walkMd(join(root, 'agents')), ...walkMd(rulesDir), join(root, 'README.md')]) {
  readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
    if (/(?:^|[^\w])\/Users\/[a-z][\w.-]*\//i.test(line)) {
      fail(file, i + 1, 'Personal absolute path (`/Users/<name>/…`).',
        'Use `~/`, `${CLAUDE_PLUGIN_ROOT}`, or a project-relative path.')
    }
  })
}

// ---------- 4b. Every rule is in the catalog, and every referenced rule exists ----------
// `rules/README.md` is what /setup-daher-skills offers, so a rule missing from it is
// never seeded — and every skill saying "read `.claude/rules/<that>.md`" then points at
// a file the project doesn't have. That silently killed `api-boundary.md`.
const ruleFiles = readdirSync(rulesDir).filter((f) => f.endsWith('.md') && f !== 'README.md')
const rulesReadmePath = join(rulesDir, 'README.md')
const rulesReadme = readFileSync(rulesReadmePath, 'utf8')
const catalogued = new Set([...rulesReadme.matchAll(/`([a-z0-9-]+\.md)`/g)].map((m) => m[1]))

for (const f of ruleFiles) {
  if (!catalogued.has(f)) {
    fail(rulesReadmePath, null, `Rule \`${f}\` exists but is not in the catalog table.`,
      `Add a row for \`${f}\` — /setup-daher-skills only offers what this table lists.`)
  }
}
for (const f of catalogued) {
  if (!ruleFiles.includes(f)) {
    fail(rulesReadmePath, null, `Catalog lists \`${f}\` but no such file exists in rules/.`,
      'Remove the row, or restore the rule file.')
  }
}
for (const file of [...walkMd(skillsDir), ...walkMd(join(root, 'agents'))]) {
  readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
    for (const m of line.matchAll(/(?:\.claude\/)?rules\/([a-z0-9-]+\.md)/g)) {
      if (!ruleFiles.includes(m[1]) && m[1] !== 'README.md') {
        fail(file, i + 1, `References rule \`${m[1]}\`, which does not exist in rules/.`,
          'Fix the name, or add the rule file (and its catalog row).')
      }
    }
  })
}

// The "N seed rules" claim in CLAUDE.md must match the seedable rule count.
const claudeMdPath = join(root, 'CLAUDE.md')
const claudeMd = readFileSync(claudeMdPath, 'utf8')
const seedClaim = claudeMd.match(/(\d+)\s+seed rules/)
if (seedClaim && Number(seedClaim[1]) !== ruleFiles.length) {
  fail(claudeMdPath, null, `CLAUDE.md says "${seedClaim[1]} seed rules" but rules/ contains ${ruleFiles.length}.`,
    `Update to "${ruleFiles.length} seed rules".`)
}

// ---------- 4c. A claimed hook must exist and be wired ----------
// Instructions are advisory, hooks are deterministic — so "hook-enforced" prose that
// names no real hook promises a guarantee the plugin does not provide.
const hooksJsonPath = join(root, 'hooks/hooks.json')
const hooksJson = existsSync(hooksJsonPath) ? readFileSync(hooksJsonPath, 'utf8') : ''
const wiredHooks = readdirSync(join(root, 'hooks'))
  .filter((f) => f.endsWith('.mjs') && hooksJson.includes(f))
  .map((f) => f.replace(/\.mjs$/, ''))

for (const file of [...walkMd(skillsDir), ...walkMd(join(root, 'agents'))]) {
  readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
    if (!/hook-enforced|hooks? (?:blocks|enforces|prevents)/i.test(line)) return
    if (!wiredHooks.some((h) => line.includes(h))) {
      fail(file, i + 1, 'Claims a hook enforces something without naming a hook wired in hooks/hooks.json.',
        `Name one of: ${wiredHooks.join(', ')} — or state that the rule is advisory and a project hook can enforce it.`)
    }
  })
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
