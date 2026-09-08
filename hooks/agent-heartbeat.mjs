#!/usr/bin/env node
/**
 * Subagent heartbeat — liveness and progress signal for every dispatched agent.
 *
 * Wired on SubagentStart, PostToolUse, PostToolUseFailure and SubagentStop. Each
 * event that carries an `agent_id` updates one small JSON file:
 *
 *   ${CLAUDE_HEARTBEAT_DIR:-~/.claude/heartbeats}/<session_id>/<agent_id>.json
 *
 * The orchestrator (or `scripts/agent-status.mjs`) reads those files to answer two
 * questions no transcript answers cheaply: *is this agent still doing anything?* and
 * *how far along is it?* — tool calls made, files written, seconds since the last
 * tool call.
 *
 * Why a hook and not the transcript: a stalled agent's transcript does not change
 * either, so its mtime tells you when you killed it, not when it stopped. A hook
 * fires on every tool call, so "last_activity_at older than N minutes" is a real
 * stall signal (the 2026-09-07 incident recorded in
 * skills/execute-tasks/references/AGENT-LIVENESS.md: seven agents sat for up to
 * two hours on a Bash call that was waiting for a permission nobody could answer).
 *
 * Contract: never blocks, never prints, exits 0 on every path. A heartbeat that
 * could fail a tool call would be worse than no heartbeat.
 */
import { readFileSync, writeFileSync, mkdirSync, renameSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { homedir } from 'node:os'

let input
try {
  input = JSON.parse(readFileSync(0, 'utf8'))
} catch {
  process.exit(0)
}

const agentId = input?.agent_id
const sessionId = input?.session_id
if (!agentId || !sessionId) process.exit(0) // main thread, or a payload we do not understand

const event = input.hook_event_name ?? ''
const now = new Date().toISOString()
const baseDir = process.env.CLAUDE_HEARTBEAT_DIR || join(homedir(), '.claude', 'heartbeats')
const dir = join(baseDir, String(sessionId).replace(/[^A-Za-z0-9_.-]/g, '_'))
const file = join(dir, `${String(agentId).replace(/[^A-Za-z0-9_.-]/g, '_')}.json`)

let state = null
if (existsSync(file)) {
  try {
    state = JSON.parse(readFileSync(file, 'utf8'))
  } catch {
    state = null
  }
}
if (!state) {
  state = {
    agent_id: agentId,
    agent_type: input.agent_type ?? null,
    session_id: sessionId,
    cwd: input.cwd ?? null,
    status: 'running',
    started_at: now,
    last_activity_at: now,
    ended_at: null,
    tool_calls: 0,
    last_tool: null,
    files_written: [],
    result_head: null,
  }
}

if (input.agent_type && !state.agent_type) state.agent_type = input.agent_type
if (input.cwd && !state.cwd) state.cwd = input.cwd
state.last_activity_at = now

switch (event) {
  case 'SubagentStart':
    state.status = 'running'
    state.started_at = now
    break
  case 'PostToolUse':
  case 'PostToolUseFailure': {
    state.status = 'running'
    state.tool_calls = (state.tool_calls ?? 0) + 1
    state.last_tool = input.tool_name ?? state.last_tool
    const path = input.tool_input?.file_path
    if (path && /^(Write|Edit|MultiEdit|NotebookEdit)$/.test(input.tool_name ?? '')) {
      if (!state.files_written.includes(path)) state.files_written.push(path)
    }
    break
  }
  case 'SubagentStop': {
    state.status = 'done'
    state.ended_at = now
    const msg = input.last_assistant_message
    if (typeof msg === 'string' && msg.trim()) state.result_head = msg.trim().slice(0, 200)
    break
  }
  default:
    break // unknown event with an agent_id: still counts as activity
}

try {
  mkdirSync(dir, { recursive: true })
  const tmp = `${file}.${process.pid}.tmp`
  writeFileSync(tmp, JSON.stringify(state) + '\n')
  renameSync(tmp, file) // atomic replace: a concurrent reader never sees a half-written file
} catch {
  /* the heartbeat is an observation, never a gate */
}
process.exit(0)
