# AGENT-LIVENESS — knowing the 100% before the run, and seeing every agent move

`execute-tasks` fans out agents that run for minutes to hours in the background. Two
questions have to stay answerable while they run, without reading a single transcript:

1. **How far along is the run?** — a fraction with a denominator fixed *before* the first
   dispatch, not a percentage an agent estimates about itself.
2. **Is each agent still doing anything?** — a liveness signal that distinguishes *slow*
   from *stuck*, because "running" in the task panel means neither.

This document is the design record: what is measured, why these mechanisms and not others,
the recovery procedure, and what to improve next. The mechanics themselves are three small
pieces: `hooks/agent-heartbeat.mjs`, `scripts/agent-status.mjs`, and a paragraph in
`SKILL.md` (Execution Loop → Liveness and progress).

## The incident that motivated it (2026-09-07)

A 19-deliverable run dispatched up to six agents at once. Seven of them stopped producing
anything and sat "running" for between 19 minutes and 2 hours before being killed by hand.
The first diagnosis blamed a transcript-size ceiling and a saturated machine; both were
wrong, and both were wrong in a way that only cost time because nobody could see the
agents' actual activity. What had happened:

- every hung agent's last transcript entry was a **single Bash `tool_use` with no
  `tool_result`** — a `grep`, usually behind `cd <path>;`;
- Claude Code 2.1.259 applied `Read()` deny rules to Bash arguments (reverted in 2.1.260),
  so those commands **asked for permission even under `--dangerously-skip-permissions`**;
- a third-party `PermissionRequest` hook (GitKraken's, `--blocking`, `timeout: 86400`) held
  the request for up to 24 h waiting for a UI nobody had open;
- a background subagent shows no prompt, so nothing on screen changed.

Contexts were between 52k and 340k tokens: no ceiling. The machine was loaded but three
agents with the same brief finished fine. The only reliable signal was one nobody was
looking at: **minutes since the agent's last tool call**. A 5-minute threshold would have
caught all seven with margin; a healthy implementer never goes more than 1–2 minutes
between tool calls (D18 that day: 137 tool calls in 22 minutes).

## What is measured

### Progress (the 100% is fixed at Step 0)

| Level | Denominator | Numerator |
|---|---|---|
| Run | deliverables in the plan × 4 gate columns (`Impl`, `Spec`, `Quality`, `Tests`) | gate cells in the PROGRESS.md table that hold a real value (anything but `-`; `SKIPPED (S)` counts) |
| Agent | files the plan's `Files:` list names for that deliverable | files the agent has written (`Write`/`Edit` calls in its heartbeat) |

The run-level fraction is written into the PROGRESS.md header as `**Progress**: 0/76 gates
(0%)` when the branch is created and recomputed every time a row lands. It reuses the join
ledger the loop already maintains, so it costs nothing and cannot drift from the table.
`scripts/agent-status.mjs --progress <PROGRESS.md>` prints the same line from the file.

Agents are **never asked to estimate their own progress** — the answer is noise. Files
written against files predicted is the one per-agent number the plan makes checkable.

### Liveness (the heartbeat)

`hooks/agent-heartbeat.mjs` runs on `SubagentStart`, `PostToolUse`, `PostToolUseFailure` and
`SubagentStop`. Hooks fire inside subagents too, and their payload carries `agent_id`,
`agent_type`, `session_id` and `cwd`, so each event updates one file:

```
${CLAUDE_HEARTBEAT_DIR:-~/.claude/heartbeats}/<session_id>/<agent_id>.json
{ agent_type, cwd, status: running|done, started_at, last_activity_at, ended_at,
  tool_calls, last_tool, files_written: [...], result_head }
```

Why a hook and not the transcript: a stuck agent's transcript stops changing too, so its
mtime records the kill, not the stall. Why a file per agent and not a database or a
dashboard: it must be readable with `cat`, writable in under 5 ms from a hook with a 5 s
timeout, and it must never be able to fail a tool call. The hook exits 0 on every path and
prints nothing.

## The watchdog: one notification, never a stream

After each fan-out the orchestrator starts, **once**, in the background:

```bash
node "<plugin-root>/scripts/agent-status.mjs" --watch --silence 5 --poll 30 --progress <PROGRESS.md>
```

It blocks and exits on the **first** event worth a wake-up, printing exactly one line:

| Line | Meaning | Orchestrator's move |
|---|---|---|
| `STALL agent=… silent=9m tools=56 last_tool=Bash` | an agent passed the silence threshold | recovery procedure below |
| `ALL_DONE n agent(s) finished · Progress: …` | every heartbeat is `done` | continue the loop |
| `NO_HEARTBEAT …` | no heartbeat appeared within the grace period | the hook is not installed in this session (plugin outdated, or hooks disabled) — say so, fall back to `ls -lT` on the deliverable's files |
| `WATCH_TIMEOUT …` | agents still working after `--timeout` (default 240 min) | restart the watch if the fan-out continues |

This shape is deliberate. The `Monitor` tool, used as a heartbeat, produces a notification
per event, each notification opens a model turn, and the model's reflex is to spawn another
Monitor — one recorded session reached 309 Monitors in 90 minutes
([anthropics/claude-code#55151](https://github.com/anthropics/claude-code/issues/55151)).
`Bash run_in_background` with a command that exits on the first event gives one
`<task-notification>` and nothing else.

## Recovery procedure for STALL

1. **Confirm it is a tool call that never returned.** The agent's transcript is the
   `.output` symlink in the session's `tasks/` directory; its last entry is an `assistant`
   message whose content ends in a `tool_use` with no matching `tool_result`. Do not
   `Read` the whole file — `tail -c 4000` it, or check the heartbeat: `last_tool` names
   the call.
2. **Do not `SendMessage`.** A message is delivered at the agent's next tool round, and a
   stuck agent has no next round. Two attempts in the incident proved it.
3. **`TaskStop` the agent.** Then check the working tree: a reviewer killed mid-mutation
   may have left a source file altered (`git status`, `git diff --stat`).
4. **Record it** under *What Did NOT Work* in PROGRESS.md with the exact command that
   hung — a resumed session must not re-issue it — and **re-dispatch** the deliverable with
   a note to avoid that command shape (typically: absolute paths, no `cd …;` prefix,
   `grep` scoped to `src/` rather than `.`).
5. **Look for the systemic cause once**, not per agent: `ps -Ao ppid,etime,command | grep
   "hook run"` finds a blocking permission hook; a Claude Code version between 2.1.257 and
   2.1.259 explains permission prompts in bypass mode; a machine load above the core count
   explains slow-but-alive, which is *not* a STALL and needs no kill.

## Reporting cadence

- **Every row that lands** (Step 6): the one-line report carries the fraction —
  `D15 [L]: impl DONE · spec PASS · quality PASS · tests PASS · 61/76 gates (80%)`.
- **On demand or on a timer**: `node <plugin-root>/scripts/agent-status.mjs --progress
  <PROGRESS.md>` prints the per-agent table plus the fraction. `/loop 15m` with that
  command is the "every X minutes" view; it is a Claude Code built-in, so the skill does
  not schedule it itself.

## Thresholds and their reasoning

| Setting | Default | Why |
|---|---|---|
| `--silence` | 5 min | healthy agents: ≤ 2 min between tool calls; the incident's hangs: ≥ 19 min. Raise it on a machine whose load exceeds its core count (turns took ~40 s under load 8.19 on 8 cores) |
| `--poll` | 30 s | cheap; a stall is minutes long, a 30 s detection lag is irrelevant |
| `--grace` | 120 s | an agent's first tool call lands within seconds; two minutes of nothing means the hook is absent |
| `--timeout` | 240 min | bounds the background task; a fan-out longer than four hours is restarted, not trusted |
| hook `timeout` | 5 s | the hook does one read and one atomic write; 5 s is generous by three orders of magnitude |

Projects that need other values pass them on the command line; `docs/agents/project-conventions.md`
is the place to record a project-wide override.

## Housekeeping

Heartbeat files are small (~400 bytes) and accumulate per session.
`scripts/agent-status.mjs --prune` removes session directories idle for more than 7 days.
Nothing depends on old files; the status table filters by `cwd`, so a stale session of the
same project can appear as `done` rows — harmless, and `--session <id>` narrows it.

## What to improve next (and what was considered)

- **Per-agent "files predicted → written".** The heartbeat already holds `files_written`;
  the plan holds the prediction. Wiring the two into the status table needs the plan path
  and the deliverable ↔ agent mapping, which only the orchestrator has. A `--plan` option
  that parses `### D{N}` sections and their `Files:` lists is the natural next step.
- **Detecting the *cause* of a stall automatically.** The transcript's last `tool_use`
  without a `tool_result` is a mechanical check; a `--diagnose <agent_id>` mode could read
  the `tasks/*.output` symlink and print the pending command. Left out to keep the script
  free of assumptions about Claude Code's transcript layout, which is undocumented.
- **A `SubagentStop`-driven join.** `SubagentStop` carries `last_assistant_message`; the
  heartbeat keeps its head. A future version could refuse to mark a PROGRESS.md row `DONE`
  while the matching heartbeat is not `done` (the "receipt" pattern from
  [cc-safe-setup](https://github.com/yurukusa/cc-safe-setup)'s dispatch-receipt hook).
- **Workflow tool instead of hand-rolled fan-out.** Claude Code's dynamic workflows declare
  every agent up front and show phases, agent counts, tokens and elapsed time in
  `/workflows`, with per-agent stop and restart — the built-in answer to both questions.
  Not adopted for `execute-tasks` because a workflow takes no user input mid-run and
  Claude's context holds only the final answer, while this loop's value is the
  per-deliverable triage and the amendments approved along the way. Revisit if the
  triage ever moves into the reviewers themselves. See also `.out-of-scope/autonomous-loops.md`.
- **`TeammateIdle` hook.** Fires only for agent teams, not for `Agent`-tool subagents;
  irrelevant until the pipeline uses teams (`.out-of-scope/agent-teams.md`).
- **A dashboard.** Community projects (e.g. Claude-Code-Agent-Monitor) consume the same
  hook events into a web UI. The heartbeat directory is a stable enough interface for one;
  the plugin does not ship one because Orca and the task panel already show session state,
  and the gap was the *signal*, not the screen.
