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
