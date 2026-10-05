#!/usr/bin/env node
/**
 * agent-status — read the heartbeats `hooks/agent-heartbeat.mjs` writes and answer
 * "how are the agents doing?" in one table, or wait for the first stall.
 *
 * Usage (from the project directory the orchestrator runs in):
 *
 *   node scripts/agent-status.mjs                          # table of this project's agents
 *   node scripts/agent-status.mjs --progress PROGRESS.md   # + "Progress: 34/76 gates (45%)"
 *   node scripts/agent-status.mjs --watch                  # block; print ONE line on stall/done
 *   node scripts/agent-status.mjs --watch --silence 5 --poll 30 --timeout 240
 *   node scripts/agent-status.mjs --prune                  # delete session dirs idle > 7 days
 *   node scripts/agent-status.mjs --report [session]       # run report: per agent + totals by agent_type
 *   node scripts/agent-status.mjs --report [session] --all-records   # include phantom records
 *
 * Options:
 *   --cwd <path>        project dir to filter agents by (default: process.cwd())
 *   --session <id>      filter by session id instead of cwd
 *   --all               ignore the cwd/session filter
 *   --dir <path>        heartbeat root (default: $CLAUDE_HEARTBEAT_DIR or ~/.claude/heartbeats)
 *   --silence <min>     minutes without a tool call that count as a stall (default 5)
 *   --poll <sec>        watch poll interval (default 30)
 *   --timeout <min>     watch gives up after this long (default 240)
 *   --grace <sec>       watch waits this long for the first heartbeat (default 120)
 *   --json              machine-readable output instead of the table
 *
 * --report aggregates one session's heartbeats (read-only): per agent its
 * agent_type, duration (ended_at − started_at; "-" while running), tool_calls,
 * files_written count and status, then totals grouped by agent_type. Without a
 * session id it reports the most recently active session of this project (the
 * same --cwd/--session/--all filter as the table). Add --json for JSON.
 * Pass the session id explicitly when you know it: it is the hook payload's
 * `session_id`, which Claude Code also exposes as $CLAUDE_CODE_SESSION_ID.
 *
 * Phantom records are left out of the report by default: an empty agent_type
 * AND 0 tool calls. Claude Code's internal side agents produce them (~40 per
 * session; started_at === ended_at, result_head is the user's prompt) and they
 * would drown the real agents. --all-records keeps them.
 *
 * --watch is designed for `Bash run_in_background`: it exits on the FIRST event worth
 * a notification and prints exactly one line, so the orchestrator gets one wake-up
 * instead of a stream (the Monitor-tool heartbeat loop in anthropics/claude-code#55151
 * is the failure this avoids). Exit codes in watch mode:
 *   0  STALL … / ALL_DONE / NO_HEARTBEAT — read the line, act on it
 *   1  bad arguments
 *
 * The recovery procedure for STALL lives in
 * skills/execute-tasks/references/AGENT-LIVENESS.md.
 */
import { readdirSync, readFileSync, statSync, rmSync, existsSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { homedir } from 'node:os'

const argv = process.argv.slice(2)
const has = (flag) => argv.includes(flag)
const opt = (flag, dflt) => {
  const i = argv.indexOf(flag)
  return i >= 0 && argv[i + 1] !== undefined ? argv[i + 1] : dflt
}
const num = (flag, dflt) => {
  const v = Number(opt(flag, dflt))
  if (!Number.isFinite(v) || v < 0) {
    console.error(`✗ ${flag} must be a non-negative number`)
    process.exit(1)
  }
  return v
}

const baseDir = resolve(opt('--dir', process.env.CLAUDE_HEARTBEAT_DIR || join(homedir(), '.claude', 'heartbeats')))
const cwdFilter = has('--all') ? null : resolve(opt('--cwd', process.cwd()))
const sessionFilter = opt('--session', null)
const silenceMs = num('--silence', 5) * 60_000
const pollMs = num('--poll', 30) * 1000
const timeoutMs = num('--timeout', 240) * 60_000
const graceMs = num('--grace', 120) * 1000
const progressPath = opt('--progress', null)
const asJson = has('--json')

// ---------- read heartbeats ----------
function readAgents(onlySession = sessionFilter) {
  if (!existsSync(baseDir)) return []
  const agents = []
  for (const session of readdirSync(baseDir)) {
    if (onlySession && session !== onlySession) continue
    const sdir = join(baseDir, session)
    let files
    try {
      files = readdirSync(sdir).filter((f) => f.endsWith('.json'))
    } catch {
      continue
    }
    for (const f of files) {
      try {
        const a = JSON.parse(readFileSync(join(sdir, f), 'utf8'))
        if (!onlySession && cwdFilter && a.cwd && resolve(a.cwd) !== cwdFilter) continue
        Object.defineProperty(a, 'sessionDir', { value: session, enumerable: false })
        agents.push(a)
      } catch {
        /* half-written or foreign file — skip */
      }
    }
  }
  return agents.sort((a, b) => String(a.started_at).localeCompare(String(b.started_at)))
}

const ageMs = (iso) => Date.now() - new Date(iso).getTime()
const fmtAge = (ms) => {
  const s = Math.max(0, Math.round(ms / 1000))
  if (s < 90) return `${s}s`
  const m = Math.round(s / 60)
  return m < 90 ? `${m}m` : `${Math.round(m / 60)}h`
}

/** running → working (fresh) | SILENT (past the threshold); done → done */
function classify(a) {
  if (a.status === 'done') return 'done'
  return ageMs(a.last_activity_at) > silenceMs ? 'SILENT' : 'working'
}

// ---------- progress from PROGRESS.md ----------
// Denominator = deliverable rows × 4 gate columns (Impl, Spec, Quality, Tests).
// A gate counts when its cell holds anything but `-` — SKIPPED (S) is a real value.
export function readProgress(text) {
  const rows = text
    .split('\n')
    .filter((l) => /^\|\s*D\d+\s*\|/.test(l))
    .map((l) => l.split('|').slice(1, -1).map((c) => c.trim()))
  // columns: # | Deliverable | Tier | Status | Impl | Spec | Quality | Tests
  const gateCols = [4, 5, 6, 7]
  let done = 0
  let deliverablesDone = 0
  for (const r of rows) {
    for (const c of gateCols) if (r[c] && r[c] !== '-') done++
    if (/^DONE/.test(r[3] ?? '')) deliverablesDone++
  }
  const total = rows.length * gateCols.length
  return {
    deliverables: rows.length,
    deliverables_done: deliverablesDone,
    gates_done: done,
    gates_total: total,
    percent: total ? Math.round((done / total) * 100) : 0,
  }
}

const progressLine = () => {
  if (!progressPath) return null
  let text
  try {
    text = readFileSync(resolve(progressPath), 'utf8')
  } catch {
    return `Progress: (could not read ${progressPath})`
  }
  const p = readProgress(text)
  return `Progress: ${p.gates_done}/${p.gates_total} gates (${p.percent}%) · ${p.deliverables_done}/${p.deliverables} deliverables DONE`
}

// ---------- modes ----------
if (has('--prune')) {
  const weekMs = 7 * 24 * 3600_000
  let removed = 0
  if (existsSync(baseDir)) {
    for (const session of readdirSync(baseDir)) {
      const sdir = join(baseDir, session)
      try {
        if (Date.now() - statSync(sdir).mtimeMs > weekMs) {
          rmSync(sdir, { recursive: true, force: true })
          removed++
        }
      } catch {
        /* skip */
      }
    }
  }
  console.log(`pruned ${removed} session dir(s) idle for more than 7 days`)
  process.exit(0)
}

// ---------- run report ----------
const fmtDuration = (ms) => {
  if (ms === null) return '-'
  const s = Math.round(ms / 1000)
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  return m < 60 ? `${m}m${s % 60}s` : `${Math.floor(m / 60)}h${m % 60}m`
}

/** Internal side-agent record: no agent_type and no tool call. */
export const isPhantom = (a) => !a.agent_type && !(a.tool_calls > 0)

/** Pure aggregation over one session's heartbeats. */
export function buildReport(agents) {
  const rows = agents.map((a) => {
    const start = Date.parse(a.started_at)
    const end = a.ended_at ? Date.parse(a.ended_at) : NaN
    return {
      agent_id: a.agent_id,
      agent_type: a.agent_type ?? '?',
      status: a.status ?? '?',
      duration_ms: Number.isFinite(start) && Number.isFinite(end) ? Math.max(0, end - start) : null,
      tool_calls: a.tool_calls ?? 0,
      files_written: Array.isArray(a.files_written) ? a.files_written.length : 0,
    }
  })
  const totals = {}
  for (const r of rows) {
    const t = (totals[r.agent_type] ??= { agents: 0, duration_ms: 0, tool_calls: 0, files_written: 0 })
    t.agents++
    t.duration_ms += r.duration_ms ?? 0
    t.tool_calls += r.tool_calls
    t.files_written += r.files_written
  }
  return { agents: rows, totals }
}

if (has('--report')) {
  const next = argv[argv.indexOf('--report') + 1]
  const keep = has('--all-records') ? () => true : (a) => !isPhantom(a)
  let session = next !== undefined && !next.startsWith('--') ? next : sessionFilter
  if (!session) {
    // Most recently active session among this project's (real) agents.
    const latest = readAgents().filter(keep).reduce(
      (best, a) => (!best || String(a.last_activity_at) > String(best.last_activity_at) ? a : best),
      null
    )
    session = latest?.sessionDir ?? null
  }
  const all = session ? readAgents(session) : []
  const agents = all.filter(keep)
  const hidden = all.length - agents.length
  const report = { session, ...buildReport(agents) }
  if (asJson) {
    console.log(JSON.stringify(report, null, 2))
  } else if (agents.length === 0) {
    console.log(`no agent heartbeats for ${session ? `session ${session}` : cwdFilter ?? 'any project'} under ${baseDir}`)
  } else {
    const table = (cols, rows) => {
      const width = Object.fromEntries(cols.map((c) => [c, Math.max(c.length, ...rows.map((r) => String(r[c]).length))]))
      const line = (r) => cols.map((c) => String(r[c]).padEnd(width[c])).join('  ')
      return [line(Object.fromEntries(cols.map((c) => [c, c]))), ...rows.map(line)].join('\n')
    }
    console.log(
      `Run report: session ${session} (${agents.length} agent(s)` +
        (hidden ? `; ${hidden} phantom record(s) hidden, --all-records shows them` : '') +
        ')\n'
    )
    console.log(
      table(
        ['agent', 'type', 'status', 'duration', 'tools', 'files'],
        report.agents.map((r) => ({
          agent: r.agent_id,
          type: r.agent_type,
          status: r.status,
          duration: fmtDuration(r.duration_ms),
          tools: r.tool_calls,
          files: r.files_written,
        }))
      )
    )
    console.log('\nTotals by agent_type (duration sums finished agents only)\n')
    console.log(
      table(
        ['type', 'agents', 'duration', 'tools', 'files'],
        Object.entries(report.totals).map(([type, t]) => ({
          type,
          agents: t.agents,
          duration: fmtDuration(t.duration_ms),
          tools: t.tool_calls,
          files: t.files_written,
        }))
      )
    )
  }
  process.exit(0)
}

if (has('--watch')) {
  const start = Date.now()
  const tick = () => {
    const agents = readAgents()
    const running = agents.filter((a) => a.status !== 'done')
    if (agents.length === 0) {
      if (Date.now() - start > graceMs) {
        console.log(`NO_HEARTBEAT no agent heartbeat under ${baseDir} for ${fmtAge(Date.now() - start)} — is hooks/agent-heartbeat.mjs installed, and does any agent run in this project?`)
        process.exit(0)
      }
      return setTimeout(tick, Math.min(pollMs, 1000))
    }
    const stalled = running.find((a) => ageMs(a.last_activity_at) > silenceMs)
    if (stalled) {
      console.log(
        `STALL agent=${stalled.agent_id} type=${stalled.agent_type ?? '?'} silent=${fmtAge(ageMs(stalled.last_activity_at))} tools=${stalled.tool_calls} files=${stalled.files_written.length} last_tool=${stalled.last_tool ?? '-'} — a tool call that never returned is the usual cause; see AGENT-LIVENESS.md`
      )
      process.exit(0)
    }
    if (running.length === 0) {
      console.log(`ALL_DONE ${agents.length} agent(s) finished${progressPath ? ` · ${progressLine()}` : ''}`)
      process.exit(0)
    }
    if (Date.now() - start > timeoutMs) {
      console.log(`WATCH_TIMEOUT ${running.length} agent(s) still working after ${fmtAge(timeoutMs)} — restart the watch if the fan-out continues`)
      process.exit(0)
    }
    setTimeout(tick, pollMs)
  }
  tick()
} else {
  const agents = readAgents()
  const rows = agents.map((a) => ({
    agent: a.agent_id,
    type: a.agent_type ?? '?',
    state: classify(a),
    tools: a.tool_calls,
    files: a.files_written.length,
    last_activity: fmtAge(ageMs(a.last_activity_at)) + ' ago',
    last_tool: a.last_tool ?? '-',
    result: a.result_head ? a.result_head.split('\n')[0].slice(0, 60) : '',
  }))
  const progress = progressLine()
  if (asJson) {
    console.log(JSON.stringify({ agents: rows, progress }, null, 2))
  } else {
    if (rows.length === 0) {
      console.log(`no agent heartbeats for ${sessionFilter ? `session ${sessionFilter}` : cwdFilter ?? 'any project'} under ${baseDir}`)
    } else {
      const cols = ['agent', 'type', 'state', 'tools', 'files', 'last_activity', 'last_tool', 'result']
      const width = Object.fromEntries(cols.map((c) => [c, Math.max(c.length, ...rows.map((r) => String(r[c]).length))]))
      const line = (r) => cols.map((c) => String(r[c]).padEnd(width[c])).join('  ')
      console.log(line(Object.fromEntries(cols.map((c) => [c, c]))))
      for (const r of rows) console.log(line(r))
      const silent = rows.filter((r) => r.state === 'SILENT').length
      if (silent) console.log(`\n${silent} agent(s) SILENT for more than ${silenceMs / 60_000} min — check for a tool call that never returned (AGENT-LIVENESS.md)`)
    }
    if (progress) console.log(progress)
  }
}
