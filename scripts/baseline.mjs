#!/usr/bin/env node
/**
 * baseline — a dated, comparable snapshot of the plugin and of how it is used, so
 * "did that change help?" is answered from two files instead of from memory.
 *
 *   node scripts/baseline.mjs snapshot --label <name> [options]
 *   node scripts/baseline.mjs compare <before.json> <after.json> [--json]
 *
 * snapshot options:
 *   --root <dir>         plugin tree to measure (default: this repo). Point it at a
 *                        `git worktree` of an older commit to snapshot the past.
 *   --out <dir>          where to write (default: <this repo>/docs/baselines)
 *   --date <YYYY-MM-DD>  date in the file name (default: today)
 *   --since / --until <YYYY-MM-DD>   usage window, inclusive (default: last 30 days)
 *   --projects <dir>     transcript root (default: ~/.claude/projects)
 *   --plugins <a,b>      skill/agent name prefixes to count (default: claude-skills,design-craft)
 *   --no-usage           skip the transcript scan (a tree nobody has used yet)
 *   --no-validators      skip running the tree's validator
 *   --runs <dir>         run reports to aggregate (agent-status.mjs --aggregate)
 *   --eval-result <file> an aggregate-result.json from `claude plugin eval`
 *   --scores <file>      the maintainer's judgment: { overall, dimensions: { name: { score, confidence, evidence } } }
 *
 * What a snapshot holds — numbers only. No project names, no paths, no session text:
 *   repo     sha, version, per-skill size and gates, counts, eval cases by grader type
 *   usage    skill invocations, subagent dispatches, reviewer verdicts, hook blocks
 *   runs     gate verdicts and fix rounds across committed run reports
 *   evals    the scores of one eval pass
 *   judgment the 1–10 scores a human (or an audit) gave, with their evidence
 *
 * The usage section reads Claude Code's session transcripts, whose format is internal
 * and can change between CLI versions. The snapshot records the CLI version; treat a
 * usage comparison across versions as indicative, and re-check `method` first.
 */
import { createReadStream, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { createInterface } from 'node:readline'
import { spawnSync } from 'node:child_process'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { homedir } from 'node:os'

const here = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(here, '..')

const argv = process.argv.slice(2)
const has = (flag) => argv.includes(flag)
const opt = (flag, dflt) => {
  const i = argv.indexOf(flag)
  return i >= 0 && argv[i + 1] !== undefined ? argv[i + 1] : dflt
}
const die = (msg) => {
  console.error(`✗ ${msg}`)
  process.exit(1)
}
const day = (d) => d.toISOString().slice(0, 10)
const readJson = (p) => JSON.parse(readFileSync(p, 'utf8'))
const bump = (obj, key, by = 1) => {
  obj[key] = (obj[key] ?? 0) + by
}

// ---------- repo ----------
const listDirs = (p) =>
  existsSync(p) ? readdirSync(p, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name).sort() : []
const listFiles = (p, re) => (existsSync(p) ? readdirSync(p).filter((f) => re.test(f)).sort() : [])

export function measureRepo(root, { validators = true } = {}) {
  const git = (...args) => {
    const r = spawnSync('git', ['-C', root, ...args], { encoding: 'utf8' })
    return r.status === 0 ? r.stdout.trim() : null
  }
  const skills = {}
  for (const name of listDirs(join(root, 'skills'))) {
    const file = join(root, 'skills', name, 'SKILL.md')
    if (!existsSync(file)) continue
    const text = readFileSync(file, 'utf8')
    const description = text.match(/^description:\s*(.+)$/m)?.[1] ?? ''
    skills[name] = {
      lines: text.split('\n').length,
      gates: (text.match(/\*\*Done when:\*\*/g) ?? []).length,
      references: listFiles(join(root, 'skills', name, 'references'), /\.md$/).length,
      notFor: /NOT for/i.test(description),
      descriptionChars: description.length,
    }
  }
  const evalCases = {}
  const gradersByType = {}
  for (const c of listDirs(join(root, 'evals')).filter((d) => d !== 'results')) {
    bump(evalCases, c.split('-')[0])
    for (const g of listFiles(join(root, 'evals', c, 'graders'), /\.md$/)) {
      const type = readFileSync(join(root, 'evals', c, 'graders', g), 'utf8').match(/^type:\s*(\S+)/m)?.[1] ?? 'unknown'
      bump(gradersByType, type)
    }
  }
  let tests = 0
  for (const f of listFiles(join(root, 'tests'), /\.test\.mjs$/)) {
    tests += (readFileSync(join(root, 'tests', f), 'utf8').match(/^test\(/gm) ?? []).length
  }
  const names = Object.keys(skills)
  let validatorPasses = null
  const validator = join(root, 'scripts', 'validate-skills.mjs')
  if (validators && existsSync(validator)) {
    validatorPasses = spawnSync(process.execPath, [validator], { encoding: 'utf8' }).status === 0
  }
  return {
    sha: git('rev-parse', 'HEAD'),
    dirty: (git('status', '--porcelain') ?? '') !== '',
    version: existsSync(join(root, 'package.json')) ? readJson(join(root, 'package.json')).version ?? null : null,
    totals: {
      skills: names.length,
      skillLines: names.reduce((n, s) => n + skills[s].lines, 0),
      gates: names.reduce((n, s) => n + skills[s].gates, 0),
      skillsWithoutGates: names.filter((s) => skills[s].gates === 0).length,
      skillsWithNotFor: names.filter((s) => skills[s].notFor).length,
      agents: listFiles(join(root, 'agents'), /\.md$/).length,
      hooks: listFiles(join(root, 'hooks'), /\.mjs$/).length,
      rules: listFiles(join(root, 'rules'), /\.md$/).filter((f) => f !== 'README.md').length,
      tests,
    },
    evalCases,
    gradersByType,
    validatorPasses,
    skills,
  }
}

// ---------- usage (session transcripts) ----------
const STATUS = /\*\*Status:\*\*\s*(PASS|CONCERNS|FAIL)\b/g
const HOOK_SCRIPT = /hooks\/([a-z0-9-]+)\.(?:mjs|js)\b/
const SLASH = /<command-name>\/([a-z0-9:_-]+)<\/command-name>/g

/** Lines worth parsing — everything else (request blobs, snapshots) is skipped unparsed. */
const interesting = (line) =>
  (line.startsWith('{"parentUuid"') || line.includes('"type":"assistant"') || line.includes('"type":"user"')) &&
  !line.startsWith('{"type":"api-request')

async function eachEntry(file, fn) {
  const rl = createInterface({ input: createReadStream(file, 'utf8'), crlfDelay: Infinity })
  for await (const line of rl) {
    if (!line || !interesting(line)) continue
    let entry
    try {
      entry = JSON.parse(line)
    } catch {
      continue
    }
    if (entry.type === 'assistant' || entry.type === 'user') fn(entry)
  }
}

const textOf = (content) =>
  typeof content === 'string'
    ? content
    : Array.isArray(content)
      ? content.map((c) => (typeof c === 'string' ? c : typeof c?.text === 'string' ? c.text : typeof c?.content === 'string' ? c.content : '')).join('\n')
      : ''

export async function measureUsage({ projects, since, until, plugins }) {
  const from = Date.parse(`${since}T00:00:00Z`)
  const to = Date.parse(`${until}T23:59:59Z`)
  const inWindow = (iso) => {
    const t = Date.parse(iso)
    return Number.isFinite(t) && t >= from && t <= to
  }
  const owned = (name) => plugins.some((p) => String(name).startsWith(`${p}:`))
  const out = {
    window: { since, until },
    sessionsScanned: 0,
    sessionsUsingPlugin: 0,
    skillInvocations: {},
    skillInvocationsInSubagents: {},
    subagentDispatches: {},
    reviewerVerdicts: {},
    hookBlocks: {},
  }
  const seenToolUse = new Set()

  const scan = async (file, { subagent }) => {
    let touched = false
    let lastStatus = null
    let firstTimestamp = null
    await eachEntry(file, (entry) => {
      firstTimestamp ??= entry.timestamp
      if (!inWindow(entry.timestamp)) return
      const content = entry.message?.content
      if (entry.type === 'assistant' && Array.isArray(content)) {
        for (const c of content) {
          if (c?.type === 'tool_use' && c.name === 'Skill' && owned(c.input?.skill) && !seenToolUse.has(c.id)) {
            seenToolUse.add(c.id)
            bump(subagent ? out.skillInvocationsInSubagents : out.skillInvocations, c.input.skill)
            touched = true
          }
          if (c?.type === 'text' && typeof c.text === 'string') {
            for (const m of c.text.matchAll(STATUS)) lastStatus = m[1]
          }
        }
      }
      if (entry.type === 'user') {
        if (typeof content === 'string' && !subagent) {
          for (const m of content.matchAll(SLASH)) {
            if (owned(m[1])) {
              bump(out.skillInvocations, m[1])
              touched = true
            }
          }
        }
        if (Array.isArray(content)) {
          for (const c of content) {
            if (c?.type !== 'tool_result' || c.is_error !== true) continue
            const text = textOf(c.content)
            const hook = /\bhook\b/i.test(text) ? text.match(HOOK_SCRIPT)?.[1] : null
            if (hook) bump(out.hookBlocks, hook)
          }
        }
      }
    })
    return { touched, lastStatus, firstTimestamp }
  }

  if (!existsSync(projects)) return { ...out, note: `no transcript root at the given --projects path` }
  for (const project of listDirs(projects)) {
    const pdir = join(projects, project)
    for (const f of listFiles(pdir, /\.jsonl$/)) {
      const file = join(pdir, f)
      if (statSync(file).mtimeMs < from) continue // never written inside the window
      out.sessionsScanned++
      let used = (await scan(file, { subagent: false })).touched
      const subDir = join(pdir, f.replace(/\.jsonl$/, ''), 'subagents')
      for (const meta of listFiles(subDir, /\.meta\.json$/)) {
        let agentType
        try {
          agentType = readJson(join(subDir, meta)).agentType
        } catch {
          continue
        }
        const transcript = join(subDir, meta.replace(/\.meta\.json$/, '.jsonl'))
        if (!existsSync(transcript)) continue
        const r = await scan(transcript, { subagent: true })
        if (!owned(agentType) || !inWindow(r.firstTimestamp)) continue
        used = true
        bump(out.subagentDispatches, agentType)
        if (/-reviewer$/.test(agentType)) {
          const v = (out.reviewerVerdicts[agentType] ??= { PASS: 0, CONCERNS: 0, FAIL: 0, none: 0 })
          v[r.lastStatus ?? 'none']++
        }
      }
      if (used) out.sessionsUsingPlugin++
    }
  }
  return out
}

// ---------- snapshot ----------
async function snapshot() {
  const label = opt('--label', null)
  if (!label || !/^[a-z0-9][a-z0-9-]*$/.test(label)) die('--label <name> is required (lowercase letters, digits, hyphens)')
  const root = resolve(opt('--root', repoRoot))
  if (!existsSync(join(root, 'skills'))) die(`${root} has no skills/ directory — not a plugin tree`)
  const today = new Date()
  const until = opt('--until', day(today))
  const since = opt('--since', day(new Date(Date.parse(`${until}T00:00:00Z`) - 30 * 86400_000)))
  for (const d of [since, until]) if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) die(`dates are YYYY-MM-DD, got "${d}"`)

  const cli = spawnSync('claude', ['--version'], { encoding: 'utf8' })
  const snap = {
    schema: 1,
    label,
    createdAt: today.toISOString(),
    claudeVersion: cli.status === 0 ? cli.stdout.trim() : null,
    method: 'repo: file counts under --root. usage: assistant tool_use Skill + <command-name> slash invocations, subagent meta agentType, last **Status:** line per reviewer transcript, is_error tool results naming a hooks/<script>. Counts only.',
    repo: measureRepo(root, { validators: !has('--no-validators') }),
    usage: has('--no-usage')
      ? null
      : await measureUsage({
          projects: resolve(opt('--projects', join(homedir(), '.claude', 'projects'))),
          since,
          until,
          plugins: opt('--plugins', 'claude-skills,design-craft').split(',').map((s) => s.trim()).filter(Boolean),
        }),
    runs: null,
    evals: null,
    judgment: null,
  }
  const runsDir = opt('--runs', null)
  if (runsDir) {
    const r = spawnSync(process.execPath, [join(here, 'agent-status.mjs'), '--aggregate', resolve(runsDir), '--json'], { encoding: 'utf8' })
    if (r.status !== 0) die(`agent-status --aggregate failed: ${r.stderr}`)
    const { dir: _dir, ...agg } = JSON.parse(r.stdout)
    snap.runs = agg
  }
  const evalFile = opt('--eval-result', null)
  if (evalFile) {
    const e = readJson(resolve(evalFile))
    snap.evals = { claudeVersion: e.claudeVersion ?? null, aggregates: e.aggregates ?? null, costUsd: e.costUsd ?? e.aggregates?.costUsd ?? null }
  }
  const scoresFile = opt('--scores', null)
  if (scoresFile) snap.judgment = readJson(resolve(scoresFile))

  const outDir = resolve(opt('--out', join(repoRoot, 'docs', 'baselines')))
  mkdirSync(outDir, { recursive: true })
  const file = join(outDir, `${opt('--date', day(today))}-${label}.json`)
  writeFileSync(file, `${JSON.stringify(snap, null, 2)}\n`)
  console.log(`✓ baseline written: ${file}`)
  console.log(`  repo ${snap.repo.sha?.slice(0, 7) ?? '(no git)'}${snap.repo.dirty ? ' +dirty' : ''} · ${snap.repo.totals.skills} skills · ${snap.repo.totals.gates} gates` +
    (snap.usage ? ` · usage ${since}..${until}: ${snap.usage.sessionsUsingPlugin}/${snap.usage.sessionsScanned} sessions used the plugin` : ' · usage skipped'))
}

// ---------- compare ----------
/** Flatten nested numbers/booleans/strings to "a.b.c" → value. */
function flatten(value, prefix, into) {
  if (value === null || value === undefined) return into
  if (typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) flatten(v, prefix ? `${prefix}.${k}` : k, into)
  } else {
    into[prefix] = value
  }
  return into
}

export function compareSnapshots(a, b) {
  const sections = {}
  const section = (name, x, y) => {
    if (x === null || x === undefined || y === null || y === undefined) {
      sections[name] = { skipped: x == null && y == null ? 'absent in both' : `absent in ${x == null ? 'before' : 'after'}` }
      return
    }
    const fa = flatten(x, '', {})
    const fb = flatten(y, '', {})
    const changes = []
    for (const key of [...new Set([...Object.keys(fa), ...Object.keys(fb)])].sort()) {
      const [before, after] = [fa[key], fb[key]]
      if (before === after) continue
      const numeric = typeof (before ?? 0) === 'number' && typeof (after ?? 0) === 'number'
      changes.push({ key, before: before ?? null, after: after ?? null, delta: numeric ? (after ?? 0) - (before ?? 0) : null })
    }
    sections[name] = { changes }
  }
  section('repo.totals', a.repo?.totals, b.repo?.totals)
  section('repo.evalCases', a.repo?.evalCases, b.repo?.evalCases)
  section('repo.gradersByType', a.repo?.gradersByType, b.repo?.gradersByType)
  section('repo.skills', a.repo?.skills, b.repo?.skills)
  const usageOf = (s) => (s.usage ? (({ window: _w, note: _n, ...rest }) => rest)(s.usage) : null)
  section('usage', usageOf(a), usageOf(b))
  section('runs', a.runs, b.runs)
  section('evals', a.evals?.aggregates, b.evals?.aggregates)
  section('judgment', a.judgment, b.judgment)
  return {
    before: { label: a.label, sha: a.repo?.sha ?? null, createdAt: a.createdAt, claudeVersion: a.claudeVersion ?? null, usageWindow: a.usage?.window ?? null },
    after: { label: b.label, sha: b.repo?.sha ?? null, createdAt: b.createdAt, claudeVersion: b.claudeVersion ?? null, usageWindow: b.usage?.window ?? null },
    sections,
  }
}

function compare() {
  const files = argv.slice(1).filter((a) => !a.startsWith('--'))
  if (files.length !== 2) die('compare takes two snapshot files: <before.json> <after.json>')
  const [a, b] = files.map((f) => readJson(resolve(f)))
  const result = compareSnapshots(a, b)
  if (has('--json')) return console.log(JSON.stringify(result, null, 2))
  const who = (s) => `${s.label} (${s.sha?.slice(0, 7) ?? 'no sha'}, ${s.createdAt?.slice(0, 10)})`
  console.log(`Baseline compare: ${who(result.before)} → ${who(result.after)}`)
  if (result.before.claudeVersion !== result.after.claudeVersion) {
    console.log(`! CLI version differs (${result.before.claudeVersion} → ${result.after.claudeVersion}): usage counts depend on the transcript format — treat them as indicative.`)
  }
  const fmt = (v) => (v === null ? '—' : String(v))
  for (const [name, s] of Object.entries(result.sections)) {
    if (s.skipped) {
      console.log(`\n${name}: not compared (${s.skipped})`)
      continue
    }
    console.log(`\n${name}: ${s.changes.length ? `${s.changes.length} change(s)` : 'no change'}`)
    for (const c of s.changes) {
      const delta = c.delta === null ? '' : `  (${c.delta > 0 ? '+' : ''}${Number.isInteger(c.delta) ? c.delta : c.delta.toFixed(2)})`
      console.log(`  ${c.key}: ${fmt(c.before)} → ${fmt(c.after)}${delta}`)
    }
  }
}

// ---------- main ----------
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const mode = argv[0]
  if (mode === 'snapshot') await snapshot()
  else if (mode === 'compare') compare()
  else die('usage: baseline.mjs snapshot --label <name> [options] | baseline.mjs compare <before.json> <after.json>')
}
