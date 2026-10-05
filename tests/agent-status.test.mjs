import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { tempProject } from './helpers.mjs'

const script = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'scripts', 'agent-status.mjs')

const run = (args, { cwd } = {}) => {
  const r = spawnSync(process.execPath, [script, ...args], { encoding: 'utf8', cwd: cwd ?? process.cwd() })
  return { code: r.status, stdout: r.stdout ?? '', stderr: r.stderr ?? '' }
}

const heartbeat = (dir, session, agent, overrides = {}) => {
  mkdirSync(join(dir, session), { recursive: true })
  const now = new Date().toISOString()
  const hb = {
    agent_id: agent,
    agent_type: 'implementer',
    session_id: session,
    cwd: '/tmp/proj',
    status: 'running',
    started_at: now,
    last_activity_at: now,
    ended_at: null,
    tool_calls: 3,
    last_tool: 'Bash',
    files_written: [],
    result_head: null,
    ...overrides,
  }
  writeFileSync(join(dir, session, `${agent}.json`), JSON.stringify(hb))
  return hb
}

const minutesAgo = (m) => new Date(Date.now() - m * 60_000).toISOString()

test('table lists agents of the current project and flags SILENT ones', () => {
  const dir = tempProject('st-')
  heartbeat(dir, 's1', 'fresh')
  heartbeat(dir, 's1', 'stale', { last_activity_at: minutesAgo(12), last_tool: 'Bash' })
  heartbeat(dir, 's1', 'finished', { status: 'done', result_head: 'STATUS: DONE' })
  heartbeat(dir, 's2', 'elsewhere', { cwd: '/tmp/other' })
  const r = run(['--dir', dir, '--cwd', '/tmp/proj'])
  assert.equal(r.code, 0)
  assert.match(r.stdout, /fresh\s+implementer\s+working/)
  assert.match(r.stdout, /stale\s+implementer\s+SILENT/)
  assert.match(r.stdout, /finished\s+implementer\s+done/)
  assert.doesNotMatch(r.stdout, /elsewhere/)
  assert.match(r.stdout, /1 agent\(s\) SILENT for more than 5 min/)
})

test('--all ignores the cwd filter; --json is machine-readable', () => {
  const dir = tempProject('st-')
  heartbeat(dir, 's1', 'a', { cwd: '/tmp/one' })
  heartbeat(dir, 's2', 'b', { cwd: '/tmp/two' })
  const r = run(['--dir', dir, '--all', '--json'])
  const out = JSON.parse(r.stdout)
  assert.deepEqual(out.agents.map((a) => a.agent).sort(), ['a', 'b'])
})

test('--progress counts filled gate cells over deliverables × 4', () => {
  const dir = tempProject('st-')
  const progress = join(dir, 'PROGRESS.md')
  writeFileSync(
    progress,
    [
      '| # | Deliverable | Tier | Status | Impl | Spec | Quality | Tests |',
      '|---|---|---|---|---|---|---|---|',
      '| D1 | route | S | DONE | DONE | PASS | SKIPPED (S) | SKIPPED (S) |',
      '| D2 | store | M | DONE_WITH_CONCERNS | DONE | PASS | CONCERNS (1 trivial, auto-fixed) | PASS |',
      '| D3 | view | L | IN_PROGRESS | - | - | - | - |',
      '| D4 | wiring | - | PENDING | - | - | - | - |',
    ].join('\n')
  )
  const r = run(['--dir', dir, '--all', '--progress', progress])
  assert.match(r.stdout, /Progress: 8\/16 gates \(50%\) · 2\/4 deliverables DONE/)
})

test('--watch exits with one STALL line when an agent passes the silence threshold', () => {
  const dir = tempProject('st-')
  heartbeat(dir, 's1', 'fresh')
  heartbeat(dir, 's1', 'stuck', { last_activity_at: minutesAgo(9), tool_calls: 56, last_tool: 'Bash' })
  const r = run(['--dir', dir, '--cwd', '/tmp/proj', '--watch', '--silence', '5', '--poll', '0.1'])
  assert.equal(r.code, 0)
  const lines = r.stdout.trim().split('\n')
  assert.equal(lines.length, 1)
  assert.match(lines[0], /^STALL agent=stuck type=implementer silent=9m tools=56 files=0 last_tool=Bash/)
})

test('--watch exits with ALL_DONE when every agent has stopped', () => {
  const dir = tempProject('st-')
  heartbeat(dir, 's1', 'a', { status: 'done' })
  heartbeat(dir, 's1', 'b', { status: 'done' })
  const r = run(['--dir', dir, '--cwd', '/tmp/proj', '--watch', '--poll', '0.1'])
  assert.equal(r.code, 0)
  assert.match(r.stdout.trim(), /^ALL_DONE 2 agent\(s\) finished$/)
})

test('--watch reports NO_HEARTBEAT after the grace period instead of waiting forever', () => {
  const dir = tempProject('st-')
  const r = run(['--dir', dir, '--cwd', '/tmp/proj', '--watch', '--grace', '0.2', '--poll', '0.1'])
  assert.equal(r.code, 0)
  assert.match(r.stdout, /^NO_HEARTBEAT/)
})

test('--watch times out with WATCH_TIMEOUT while agents keep working', () => {
  const dir = tempProject('st-')
  heartbeat(dir, 's1', 'busy')
  const r = run(['--dir', dir, '--cwd', '/tmp/proj', '--watch', '--timeout', '0.005', '--poll', '0.1'])
  assert.equal(r.code, 0)
  assert.match(r.stdout, /^WATCH_TIMEOUT 1 agent\(s\) still working/)
})

test('rejects a non-numeric option instead of silently defaulting', () => {
  const r = run(['--watch', '--silence', 'soon'])
  assert.equal(r.code, 1)
  assert.match(r.stderr, /--silence must be a non-negative number/)
})

test('an empty heartbeat root prints a hint, not an error', () => {
  const dir = tempProject('st-')
  const r = run(['--dir', join(dir, 'missing'), '--cwd', '/tmp/proj'])
  assert.equal(r.code, 0)
  assert.match(r.stdout, /no agent heartbeats for \/tmp\/proj/)
})

const at = (iso) => new Date(iso).toISOString()

/** Two finished sessions for /tmp/proj; s-new is the most recent one. */
function reportFixture() {
  const dir = tempProject('st-')
  heartbeat(dir, 's-old', 'old1', {
    status: 'done',
    started_at: at('2026-10-01T10:00:00Z'),
    last_activity_at: at('2026-10-01T10:05:00Z'),
    ended_at: at('2026-10-01T10:05:00Z'),
  })
  heartbeat(dir, 's-new', 'impl1', {
    agent_type: 'implementer',
    status: 'done',
    started_at: at('2026-10-02T10:00:00Z'),
    last_activity_at: at('2026-10-02T10:02:00Z'),
    ended_at: at('2026-10-02T10:02:00Z'),
    tool_calls: 10,
    files_written: ['a.ts', 'b.ts'],
  })
  heartbeat(dir, 's-new', 'impl2', {
    agent_type: 'implementer',
    status: 'done',
    started_at: at('2026-10-02T10:01:00Z'),
    last_activity_at: at('2026-10-02T10:04:00Z'),
    ended_at: at('2026-10-02T10:04:00Z'),
    tool_calls: 5,
    files_written: ['c.ts'],
  })
  heartbeat(dir, 's-new', 'rev1', {
    agent_type: 'quality-reviewer',
    status: 'running',
    started_at: at('2026-10-02T10:05:00Z'),
    last_activity_at: at('2026-10-02T10:06:00Z'),
    tool_calls: 4,
  })
  return dir
}

test('--report --json aggregates the most recent session per agent and per agent_type', () => {
  const dir = reportFixture()
  const r = run(['--dir', dir, '--cwd', '/tmp/proj', '--report', '--json'])
  assert.equal(r.code, 0)
  const out = JSON.parse(r.stdout)
  assert.equal(out.session, 's-new')
  const byId = Object.fromEntries(out.agents.map((a) => [a.agent_id, a]))
  assert.deepEqual(Object.keys(byId).sort(), ['impl1', 'impl2', 'rev1'])
  assert.deepEqual(byId.impl1, {
    agent_id: 'impl1',
    agent_type: 'implementer',
    status: 'done',
    duration_ms: 120_000,
    tool_calls: 10,
    files_written: 2,
  })
  assert.equal(byId.rev1.duration_ms, null) // still running: no ended_at
  assert.deepEqual(out.totals.implementer, { agents: 2, duration_ms: 300_000, tool_calls: 15, files_written: 3 })
  assert.deepEqual(out.totals['quality-reviewer'], { agents: 1, duration_ms: 0, tool_calls: 4, files_written: 0 })
})

test('--report <session> picks that session and prints a table with per-type totals', () => {
  const dir = reportFixture()
  const r = run(['--dir', dir, '--cwd', '/tmp/proj', '--report', 's-old'])
  assert.equal(r.code, 0)
  assert.match(r.stdout, /session s-old/)
  assert.match(r.stdout, /old1\s+implementer\s+done\s+5m0s\s+3\s+0/)
  assert.doesNotMatch(r.stdout, /impl1/)
  assert.match(r.stdout, /implementer\s+1\s+5m0s\s+3\s+0/)
})

test('--report with no heartbeats prints a hint, not an error', () => {
  const dir = tempProject('st-')
  const r = run(['--dir', dir, '--cwd', '/tmp/proj', '--report'])
  assert.equal(r.code, 0)
  assert.match(r.stdout, /no agent heartbeats/)
})

/** A real implementer plus two phantom side-agent records (empty type, 0 tools, zero duration). */
function phantomFixture() {
  const dir = tempProject('st-')
  const t = at('2026-10-03T09:00:00Z')
  heartbeat(dir, 's-ph', 'real1', { status: 'done', started_at: t, last_activity_at: t, ended_at: at('2026-10-03T09:01:00Z') })
  for (const id of ['ph1', 'ph2']) {
    heartbeat(dir, 's-ph', id, {
      agent_type: '',
      status: 'done',
      started_at: t,
      last_activity_at: t,
      ended_at: t,
      tool_calls: 0,
      last_tool: null,
      result_head: 'the user prompt, echoed',
    })
  }
  return dir
}

test('--report hides phantom records (empty agent_type, 0 tool calls) unless --all-records', () => {
  const dir = phantomFixture()
  const out = JSON.parse(run(['--dir', dir, '--cwd', '/tmp/proj', '--report', 's-ph', '--json']).stdout)
  assert.deepEqual(out.agents.map((a) => a.agent_id), ['real1'])
  assert.equal(out.totals[''], undefined)

  const all = JSON.parse(run(['--dir', dir, '--cwd', '/tmp/proj', '--report', 's-ph', '--json', '--all-records']).stdout)
  assert.deepEqual(all.agents.map((a) => a.agent_id).sort(), ['ph1', 'ph2', 'real1'])

  const text = run(['--dir', dir, '--cwd', '/tmp/proj', '--report', 's-ph']).stdout
  assert.match(text, /2 phantom record\(s\) hidden/)
  assert.doesNotMatch(text, /ph1/)
})

test('--report without a session ignores sessions that only hold phantom records', () => {
  const dir = phantomFixture()
  const later = at('2026-10-04T09:00:00Z')
  heartbeat(dir, 's-only-ph', 'ph9', {
    agent_type: '',
    status: 'done',
    started_at: later,
    last_activity_at: later,
    ended_at: later,
    tool_calls: 0,
  })
  const out = JSON.parse(run(['--dir', dir, '--cwd', '/tmp/proj', '--report', '--json']).stdout)
  assert.equal(out.session, 's-ph')
})
