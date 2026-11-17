import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { tempProject, writeAt } from './helpers.mjs'

const script = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'scripts', 'baseline.mjs')
const run = (args) => {
  const r = spawnSync(process.execPath, [script, ...args], { encoding: 'utf8' })
  return { code: r.status, stdout: r.stdout ?? '', stderr: r.stderr ?? '' }
}

/** A tiny plugin tree: two skills, one agent, one hook, one rule, one eval case, one test. */
const pluginTree = () => {
  const root = tempProject('baseline-tree-')
  writeAt(root, 'package.json', JSON.stringify({ version: '9.9.9' }))
  writeAt(root, 'skills/alpha/SKILL.md', '---\nname: alpha\ndescription: Does alpha. Use when alpha. NOT for beta (beta).\n---\n\n# Alpha\n\n**Done when:** a\n\n**Done when:** b\n')
  writeAt(root, 'skills/alpha/references/FORMAT.md', '# format\n')
  writeAt(root, 'skills/beta/SKILL.md', '---\nname: beta\ndescription: Does beta. Use when beta.\n---\n\n# Beta\n')
  writeAt(root, 'agents/x-reviewer.md', '---\nname: x-reviewer\n---\n')
  writeAt(root, 'hooks/guard.mjs', '')
  writeAt(root, 'hooks/lib/shared.mjs', '')
  writeAt(root, 'rules/README.md', '')
  writeAt(root, 'rules/one.md', '')
  writeAt(root, 'evals/pipeline-01-alpha/prompt.md', 'x')
  writeAt(root, 'evals/pipeline-01-alpha/graders/fires.md', '---\ntype: tool_used\n---\n')
  writeAt(root, 'evals/outcome-01-alpha/graders/judge.md', '---\ntype: llm\n---\n')
  writeAt(root, 'tests/a.test.mjs', "test('one', () => {})\ntest('two', () => {})\n")
  return root
}

const line = (o) => JSON.stringify(o)
const at = '2026-11-02T10:00:00.000Z'

/** One project, one session that used the plugin, one subagent reviewer, one session outside the window. */
const transcripts = () => {
  const projects = tempProject('baseline-projects-')
  const main = [
    // A request blob repeats the assistant message verbatim — it must not be counted.
    line({ type: 'api-request-blob', message: { role: 'assistant', content: [{ type: 'tool_use', id: 't1', name: 'Skill', input: { skill: 'claude-skills:alpha' } }] } }),
    line({ parentUuid: null, type: 'user', timestamp: at, message: { role: 'user', content: '<command-name>/claude-skills:beta</command-name> go' } }),
    line({ parentUuid: 'a', type: 'assistant', timestamp: at, message: { role: 'assistant', content: [{ type: 'tool_use', id: 't1', name: 'Skill', input: { skill: 'claude-skills:alpha' } }] } }),
    // Same tool_use id again (a re-serialised turn) and a skill from another plugin.
    line({ parentUuid: 'b', type: 'assistant', timestamp: at, message: { role: 'assistant', content: [{ type: 'tool_use', id: 't1', name: 'Skill', input: { skill: 'claude-skills:alpha' } }, { type: 'tool_use', id: 't2', name: 'Skill', input: { skill: 'vercel:deploy' } }] } }),
    line({ parentUuid: 'c', type: 'user', timestamp: at, message: { role: 'user', content: [{ type: 'tool_result', tool_use_id: 't9', is_error: true, content: 'PreToolUse:Bash hook error: [node "/p/hooks/check-build-before-commit.mjs"]: Build is stale' }] } }),
    line({ parentUuid: 'd', type: 'user', timestamp: at, message: { role: 'user', content: [{ type: 'tool_result', tool_use_id: 't8', is_error: true, content: 'command failed: no such file hooks/thing.mjs' }] } }),
    '{ not json',
  ]
  writeAt(projects, 'proj-a/s1.jsonl', main.join('\n'))
  writeAt(projects, 'proj-a/s1/subagents/agent-1.meta.json', JSON.stringify({ agentType: 'claude-skills:quality-reviewer' }))
  writeAt(projects, 'proj-a/s1/subagents/agent-1.jsonl', [
    line({ parentUuid: null, type: 'user', timestamp: at, message: { role: 'user', content: 'review D1' } }),
    line({ parentUuid: 'x', type: 'assistant', timestamp: at, message: { role: 'assistant', content: [{ type: 'tool_use', id: 's1', name: 'Skill', input: { skill: 'claude-skills:alpha' } }] } }),
    line({ parentUuid: 'y', type: 'assistant', timestamp: at, message: { role: 'assistant', content: [{ type: 'text', text: 'draft **Status:** PASS' }] } }),
    line({ parentUuid: 'z', type: 'assistant', timestamp: at, message: { role: 'assistant', content: [{ type: 'text', text: '**Status:** CONCERNS\n\n### Findings' }] } }),
  ].join('\n'))
  writeAt(projects, 'proj-a/s1/subagents/agent-2.meta.json', JSON.stringify({ agentType: 'Explore' }))
  writeAt(projects, 'proj-a/s1/subagents/agent-2.jsonl', line({ parentUuid: null, type: 'user', timestamp: at, message: { role: 'user', content: 'look' } }))
  // In-window file whose entries are all older than the window.
  writeAt(projects, 'proj-b/s2.jsonl', line({ parentUuid: 'a', type: 'assistant', timestamp: '2026-01-01T00:00:00.000Z', message: { role: 'assistant', content: [{ type: 'tool_use', id: 'old', name: 'Skill', input: { skill: 'claude-skills:alpha' } }] } }))
  return projects
}

const snapshotArgs = (root, out, extra = []) => [
  'snapshot', '--label', 'fixture', '--root', root, '--out', out, '--date', '2026-11-17', '--no-validators', ...extra,
]

test('snapshot measures the plugin tree: sizes, gates, counts, eval cases by grader type', () => {
  const out = tempProject('baseline-out-')
  const r = run(snapshotArgs(pluginTree(), out, ['--no-usage']))
  assert.equal(r.code, 0, r.stderr)
  assert.deepEqual(readdirSync(out), ['2026-11-17-fixture.json'])
  const snap = JSON.parse(readFileSync(join(out, '2026-11-17-fixture.json'), 'utf8'))
  assert.equal(snap.usage, null)
  assert.equal(snap.repo.version, '9.9.9')
  assert.deepEqual(snap.repo.totals, {
    skills: 2, skillLines: snap.repo.skills.alpha.lines + snap.repo.skills.beta.lines, gates: 2,
    skillsWithoutGates: 1, skillsWithNotFor: 1, agents: 1, hooks: 1, rules: 1, tests: 2,
  })
  assert.equal(snap.repo.skills.alpha.gates, 2)
  assert.equal(snap.repo.skills.alpha.references, 1)
  assert.equal(snap.repo.skills.alpha.notFor, true)
  assert.equal(snap.repo.skills.beta.notFor, false)
  assert.deepEqual(snap.repo.evalCases, { outcome: 1, pipeline: 1 })
  assert.deepEqual(snap.repo.gradersByType, { llm: 1, tool_used: 1 })
})

test('snapshot counts usage once per real event, inside the window, for the named plugins only', () => {
  const out = tempProject('baseline-out-')
  const r = run(snapshotArgs(pluginTree(), out, ['--projects', transcripts(), '--since', '2026-10-13', '--until', '2026-11-12']))
  assert.equal(r.code, 0, r.stderr)
  const { usage } = JSON.parse(readFileSync(join(out, '2026-11-17-fixture.json'), 'utf8'))
  assert.deepEqual(usage.window, { since: '2026-10-13', until: '2026-11-12' })
  assert.equal(usage.sessionsScanned, 2)
  assert.equal(usage.sessionsUsingPlugin, 1)
  // t1 appears in a request blob and twice in assistant entries: one invocation. The slash command is a second skill.
  assert.deepEqual(usage.skillInvocations, { 'claude-skills:beta': 1, 'claude-skills:alpha': 1 })
  assert.deepEqual(usage.skillInvocationsInSubagents, { 'claude-skills:alpha': 1 })
  assert.deepEqual(usage.subagentDispatches, { 'claude-skills:quality-reviewer': 1 })
  // The last Status line wins — a reviewer that revises its verdict is counted once.
  assert.deepEqual(usage.reviewerVerdicts, { 'claude-skills:quality-reviewer': { PASS: 0, CONCERNS: 1, FAIL: 0, none: 0 } })
  // Only an error result that says "hook" and names a hook script is a block.
  assert.deepEqual(usage.hookBlocks, { 'check-build-before-commit': 1 })
})

test('snapshot stores no project names, paths or session text', () => {
  const out = tempProject('baseline-out-')
  const projects = transcripts()
  run(snapshotArgs(pluginTree(), out, ['--projects', projects, '--since', '2026-10-13', '--until', '2026-11-12']))
  const raw = readFileSync(join(out, '2026-11-17-fixture.json'), 'utf8')
  for (const leak of ['proj-a', projects, 'Build is stale', 'review D1']) assert.ok(!raw.includes(leak), `leaked: ${leak}`)
})

test('snapshot carries run aggregates and the judgment file when given', () => {
  const out = tempProject('baseline-out-')
  const runs = join(tempProject(), 'runs')
  mkdirSync(runs, { recursive: true })
  writeFileSync(join(runs, 'a-2026-11-01.json'), JSON.stringify({ runtime: 'PASS', dispatchLog: [{ deliverable: 'D1', tier: 'S', model: 'sonnet', fixRounds: 1, spec: 'PASS' }] }))
  const scores = join(tempProject(), 'scores.json')
  writeFileSync(scores, JSON.stringify({ overall: 6.5, dimensions: { runtime: { score: 4, confidence: 'medium', evidence: 'one run' } } }))
  const r = run(snapshotArgs(pluginTree(), out, ['--no-usage', '--runs', runs, '--scores', scores]))
  assert.equal(r.code, 0, r.stderr)
  const snap = JSON.parse(readFileSync(join(out, '2026-11-17-fixture.json'), 'utf8'))
  assert.equal(snap.runs.runs, 1)
  assert.deepEqual(snap.runs.runtime, { PASS: 1 })
  assert.equal(snap.runs.dir, undefined)
  assert.equal(snap.judgment.dimensions.runtime.score, 4)
})

test('compare prints what moved between two snapshots, and says when a section cannot be compared', () => {
  const out = tempProject('baseline-out-')
  const before = pluginTree()
  const after = pluginTree()
  writeAt(after, 'skills/beta/SKILL.md', '---\nname: beta\ndescription: Does beta. Use when beta.\n---\n\n# Beta\n\n**Done when:** c\n')
  writeAt(after, 'skills/gamma/SKILL.md', '---\nname: gamma\ndescription: Does gamma. Use when gamma.\n---\n')
  run(['snapshot', '--label', 'before', '--root', before, '--out', out, '--date', '2026-11-01', '--no-validators', '--no-usage'])
  run(['snapshot', '--label', 'after', '--root', after, '--out', out, '--date', '2026-11-17', '--no-validators', '--projects', transcripts(), '--since', '2026-10-13', '--until', '2026-11-12'])
  const files = [join(out, '2026-11-01-before.json'), join(out, '2026-11-17-after.json')]

  const json = JSON.parse(run(['compare', ...files, '--json']).stdout)
  const totals = Object.fromEntries(json.sections['repo.totals'].changes.map((c) => [c.key, c]))
  assert.equal(totals.skills.delta, 1)
  assert.equal(totals.gates.delta, 1)
  assert.equal(totals.skillsWithoutGates, undefined) // beta gained a gate, gamma arrived without one: no net change
  assert.ok(json.sections['repo.skills'].changes.some((c) => c.key === 'gamma.lines' && c.before === null))
  assert.match(json.sections.usage.skipped, /absent in before/)

  const text = run(['compare', ...files]).stdout
  assert.match(text, /Baseline compare: before .* → after /)
  assert.match(text, /skills: 2 → 3 {2}\(\+1\)/)
  assert.match(text, /usage: not compared \(absent in before\)/)
})

test('bad invocations exit 1 with a usage line', () => {
  assert.equal(run([]).code, 1)
  assert.equal(run(['snapshot']).code, 1)
  assert.match(run(['snapshot', '--label', 'Bad Label']).stderr, /--label/)
  assert.equal(run(['compare', 'only-one.json']).code, 1)
})

test('snapshot merges eval results into totals and a score per case; compare shows a case that moved', () => {
  const out = tempProject('baseline-out-')
  const dir = tempProject('baseline-evals-')
  const result = (name, cases) => {
    const file = join(dir, name)
    writeFileSync(file, JSON.stringify({ schemaVersion: 1, claudeVersion: '9.9.9', costUsd: 0.5, cases: cases.map(([n, score]) => ({ name: n, aggregates: { score } })) }))
    return file
  }
  const routing = result('routing.json', [['pipeline-01-alpha', 1], ['pipeline-02-beta', 1]])
  const outcomeBefore = result('outcome-a.json', [['outcome-01-plan', 0.5]])
  const outcomeAfter = result('outcome-b.json', [['outcome-01-plan', 1]])
  const tree = pluginTree()
  run(['snapshot', '--label', 'a', '--root', tree, '--out', out, '--date', '2026-11-01', '--no-validators', '--no-usage', '--eval-result', routing, '--eval-result', outcomeBefore])
  run(['snapshot', '--label', 'b', '--root', tree, '--out', out, '--date', '2026-11-02', '--no-validators', '--no-usage', '--eval-result', routing, '--eval-result', outcomeAfter])
  const a = JSON.parse(readFileSync(join(out, '2026-11-01-a.json'), 'utf8'))
  assert.deepEqual(a.evals.aggregates, { casesTotal: 3, casesPassed: 2, overallScore: 0.8333 })
  assert.equal(a.evals.costUsd, 1)
  assert.deepEqual(a.evals.cases['outcome-01-plan'], { score: 0.5 })
  const text = run(['compare', join(out, '2026-11-01-a.json'), join(out, '2026-11-02-b.json')]).stdout
  assert.match(text, /cases\.outcome-01-plan\.score: 0\.5 → 1 {2}\(\+0\.50\)/)
  assert.match(text, /aggregates\.casesPassed: 2 → 3/)
})
