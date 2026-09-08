import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { runHook, tempProject } from './helpers.mjs'

const SESSION = 'sess-1234'
const AGENT = 'agent-abc'

const run = (dir, payload) =>
  runHook('agent-heartbeat.mjs', payload, { env: { CLAUDE_HEARTBEAT_DIR: dir } })

const read = (dir) => JSON.parse(readFileSync(join(dir, SESSION, `${AGENT}.json`), 'utf8'))

const base = (extra) => ({ session_id: SESSION, agent_id: AGENT, cwd: '/tmp/proj', ...extra })

test('ignores main-thread events (no agent_id) and writes nothing', () => {
  const dir = tempProject('hb-')
  const r = run(dir, { session_id: SESSION, hook_event_name: 'PostToolUse', tool_name: 'Bash', cwd: '/tmp/proj' })
  assert.equal(r.code, 0)
  assert.equal(r.stdout, '')
  assert.equal(existsSync(join(dir, SESSION)), false)
})

test('SubagentStart creates a running heartbeat with the agent type and cwd', () => {
  const dir = tempProject('hb-')
  const r = run(dir, base({ hook_event_name: 'SubagentStart', agent_type: 'implementer' }))
  assert.equal(r.code, 0)
  const hb = read(dir)
  assert.equal(hb.status, 'running')
  assert.equal(hb.agent_type, 'implementer')
  assert.equal(hb.cwd, '/tmp/proj')
  assert.equal(hb.tool_calls, 0)
  assert.deepEqual(hb.files_written, [])
})

test('PostToolUse counts tool calls, records the last tool and de-duplicates written files', () => {
  const dir = tempProject('hb-')
  run(dir, base({ hook_event_name: 'SubagentStart', agent_type: 'implementer' }))
  run(dir, base({ hook_event_name: 'PostToolUse', tool_name: 'Read', tool_input: { file_path: '/tmp/proj/a.ts' } }))
  run(dir, base({ hook_event_name: 'PostToolUse', tool_name: 'Write', tool_input: { file_path: '/tmp/proj/b.ts' } }))
  run(dir, base({ hook_event_name: 'PostToolUse', tool_name: 'Edit', tool_input: { file_path: '/tmp/proj/b.ts' } }))
  run(dir, base({ hook_event_name: 'PostToolUseFailure', tool_name: 'Bash', tool_input: { command: 'false' } }))
  const hb = read(dir)
  assert.equal(hb.tool_calls, 4)
  assert.equal(hb.last_tool, 'Bash')
  assert.deepEqual(hb.files_written, ['/tmp/proj/b.ts']) // Read is not a write; the second b.ts is a duplicate
  assert.equal(hb.status, 'running')
})

test('PostToolUse without a prior SubagentStart still creates the file (hook installed mid-run)', () => {
  const dir = tempProject('hb-')
  run(dir, base({ hook_event_name: 'PostToolUse', tool_name: 'Grep', agent_type: 'spec-reviewer' }))
  const hb = read(dir)
  assert.equal(hb.tool_calls, 1)
  assert.equal(hb.agent_type, 'spec-reviewer')
})

test('SubagentStop marks done and keeps the head of the final message', () => {
  const dir = tempProject('hb-')
  run(dir, base({ hook_event_name: 'SubagentStart', agent_type: 'implementer' }))
  run(dir, base({ hook_event_name: 'SubagentStop', last_assistant_message: '- **STATUS**: DONE\n\nFiles changed: …' }))
  const hb = read(dir)
  assert.equal(hb.status, 'done')
  assert.ok(hb.ended_at)
  assert.match(hb.result_head, /STATUS\*\*: DONE/)
})

test('last_activity_at moves forward on every event', async () => {
  const dir = tempProject('hb-')
  run(dir, base({ hook_event_name: 'SubagentStart' }))
  const t1 = read(dir).last_activity_at
  await new Promise((r) => setTimeout(r, 15))
  run(dir, base({ hook_event_name: 'PostToolUse', tool_name: 'Bash' }))
  const t2 = read(dir).last_activity_at
  assert.ok(new Date(t2) > new Date(t1))
})

test('sanitizes ids used as path segments', () => {
  const dir = tempProject('hb-')
  const r = run(dir, { session_id: '../../etc', agent_id: 'x/../y', hook_event_name: 'SubagentStart' })
  assert.equal(r.code, 0)
  const sessions = readdirSync(dir)
  assert.deepEqual(sessions, ['.._.._etc'])
  assert.deepEqual(readdirSync(join(dir, sessions[0])), ['x_.._y.json'])
})

test('exits 0 and stays silent on malformed input or an unwritable directory', () => {
  assert.equal(runHook('agent-heartbeat.mjs', 'garbage').code, 0)
  assert.equal(runHook('agent-heartbeat.mjs', '').code, 0)
  const r = run('/dev/null/not-a-dir', base({ hook_event_name: 'SubagentStart' }))
  assert.equal(r.code, 0)
  assert.equal(r.stdout, '')
})
