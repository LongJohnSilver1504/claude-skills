#!/usr/bin/env node
/**
 * PreToolUse hook (matcher: Bash).
 * Blocks git hook bypasses: `--no-verify` / `-n` on commit, `--no-verify` on
 * push/merge/rebase/cherry-pick/am, `-c core.hooksPath=…` / `--config-env=core.hooksPath=…`
 * overrides, `git config core.hooksPath …`, and `HUSKY=0` prefixes on those subcommands.
 *
 * Failure this prevents: a project's pre-commit / commit-msg / pre-push hooks
 * are the deterministic quality gates it chose. When one of them fails, the
 * fastest way "past" it is to skip it — and the failure it was catching ships.
 * The fix belongs in the code (or in a user decision), not in a bypass flag.
 *
 * Behavior:
 * - Splits the command on `;`, `&&`, `||`, `|`, newlines (outside quotes, not
 *   inside `2>&1`-style redirections) and skips comments and heredoc bodies.
 * - A segment is a git invocation only when `git` is its first word after
 *   `NAME=value` assignments and wrappers (`env`, `sudo`, `command`, `exec`,
 *   `nice`, `time`, `nohup`, `xargs`). `echo "git commit -n"` and prose in a
 *   heredoc are not invocations. `bash -c "…"` / `sh -c "…"` are recursed into.
 * - Quoted tokens stay one word, so `-m "fix --no-verify bug"` is a message.
 *   Values of value-taking commit options (`-m`, `-F`, `-C`, `-c`, `-t`, `-u`,
 *   `-S`, `--author`, …) are skipped for the same reason.
 * - `-n` on commit counts inside a short-option cluster (`-an` = `-a -n`); the
 *   scan stops at the first value-taking option (`-mn` is the message "n",
 *   `-uno` is `--untracked-files=no`).
 * - Unique long-option prefixes git accepts (`--no-veri`, `--no-verif`) count.
 * - Everything else exits 0. Malformed input exits 0 (never break the session).
 *
 * Not covered (documented, not silently missed): `SKIP_SIMPLE_GIT_HOOKS=1`,
 * `GIT_CONFIG_KEY_0=core.hooksPath`, editing `.husky/` files, `chmod -x .git/hooks/*`.
 *
 * Adapted from affaan-m/ECC `scripts/hooks/block-no-verify.js` (MIT), trimmed
 * to the parts a Claude Code Bash hook needs.
 */
import { readFileSync } from 'node:fs'

const SUBCOMMANDS = new Set(['commit', 'push', 'merge', 'rebase', 'cherry-pick', 'am'])
const WRAPPERS = new Set(['env', 'sudo', 'command', 'exec', 'nice', 'time', 'nohup', 'xargs', 'builtin'])
const SHELLS = new Set(['bash', 'sh', 'zsh', 'dash'])
const GIT_GLOBAL_WITH_VALUE = new Set(['-c', '-C', '--work-tree', '--git-dir', '--namespace', '--exec-path'])
const COMMIT_WITH_VALUE = new Set([
  '-m', '--message', '-F', '--file', '-C', '--reuse-message', '-c', '--reedit-message',
  '--author', '--date', '--template', '-t', '--fixup', '--squash', '--pathspec-from-file',
  '-u', '--untracked-files', '--cleanup', '--trailer', '-S', '--gpg-sign',
])
// Short options whose value is attached or next: the scan for `n` stops here,
// because the rest of the cluster is that option's value (-uno, -Skeyid, -mn).
const COMMIT_SHORT_WITH_VALUE = new Set(['m', 'F', 'C', 'c', 't', 'u', 'S'])
const NO_VERIFY = /^--no-veri(?:f|fy)?$/ // git accepts any unambiguous prefix

/** Split a shell string into command segments, honoring quotes, comments and heredocs. */
export function splitSegments(cmd) {
  const segments = []
  let cur = ''
  let quote = null
  let heredoc = null // terminator word we are skipping until
  let pendingHeredoc = null // terminator seen on this line; body starts at next newline
  const push = () => { if (cur.trim()) segments.push(cur); cur = '' }

  for (let i = 0; i < cmd.length; i++) {
    const ch = cmd[i]
    if (heredoc !== null) {
      // Inside a heredoc body: consume whole lines until the terminator line.
      const nl = cmd.indexOf('\n', i)
      const line = cmd.slice(i, nl === -1 ? cmd.length : nl)
      if (line.trim() === heredoc) heredoc = null
      i = nl === -1 ? cmd.length : nl
      continue
    }
    if (quote) {
      cur += ch
      if (ch === quote) quote = null
      else if (ch === '\\' && quote === '"') cur += cmd[++i] ?? ''
      continue
    }
    if (ch === '"' || ch === "'") { quote = ch; cur += ch; continue }
    if (ch === '\\') { cur += ch + (cmd[++i] ?? ''); continue }
    if (ch === '#' && (i === 0 || /\s/.test(cmd[i - 1]))) { // comment starts at a word boundary only
      while (i < cmd.length && cmd[i] !== '\n') i++
      i-- // let the newline be handled as a separator
      continue
    }
    if (ch === '<' && cmd[i + 1] === '<' && cmd[i + 2] !== '<') {
      // `<<[-]['"]WORD['"]` — remember the terminator; the body starts after this line.
      const m = /^<<-?\s*(?:"([^"]+)"|'([^']+)'|([^\s;&|<>]+))/.exec(cmd.slice(i))
      if (m) { pendingHeredoc = m[1] ?? m[2] ?? m[3]; cur += m[0]; i += m[0].length - 1; continue }
    }
    if (ch === '\n') {
      push()
      if (pendingHeredoc !== null) { heredoc = pendingHeredoc; pendingHeredoc = null }
      continue
    }
    if (ch === ';') { push(); continue }
    if ((ch === '|' || ch === '&') && !/[<>]/.test(cmd[i - 1] ?? '') && !(ch === '&' && cmd[i + 1] === '>')) {
      push()
      if (cmd[i + 1] === ch) i++
      continue
    }
    cur += ch
  }
  push()
  return segments
}

/** Tokenize one segment into words, dropping quotes but keeping quoted content whole. */
export function tokenize(segment) {
  const tokens = []
  let cur = null
  let quote = null
  for (let i = 0; i < segment.length; i++) {
    const ch = segment[i]
    if (quote) {
      if (ch === quote) quote = null
      else if (ch === '\\' && quote === '"') cur += segment[++i] ?? ''
      else cur += ch
      continue
    }
    if (ch === '"' || ch === "'") { quote = ch; cur ??= ''; continue }
    if (ch === '\\') { cur = (cur ?? '') + (segment[++i] ?? ''); continue }
    if (/\s/.test(ch)) { if (cur !== null) tokens.push(cur); cur = null; continue }
    cur = (cur ?? '') + ch
  }
  if (cur !== null) tokens.push(cur)
  return tokens.map((t) => t.replace(/^(?:\$\(|[({])+/, '').replace(/[)}]+$/, '')).filter(Boolean)
}

const isGit = (t) => t === 'git' || t === 'git.exe' || t.endsWith('/git')

/** Returns a block reason for one segment, or null. */
export function checkSegment(segment) {
  const tokens = tokenize(segment)
  let i = 0
  let husky = false
  // Leading `NAME=value` assignments and wrappers; `git` must be the command word.
  while (i < tokens.length) {
    const t = tokens[i]
    if (/^[A-Za-z_][A-Za-z0-9_]*=/.test(t)) { if (/^HUSKY=0$/.test(t)) husky = true; i++; continue }
    if (WRAPPERS.has(t)) { i++; continue }
    if (SHELLS.has(t) && tokens[i + 1] === '-c' && typeof tokens[i + 2] === 'string') {
      return checkCommand(tokens[i + 2]) // recurse into `bash -c "…"`
    }
    break
  }
  if (i >= tokens.length || !isGit(tokens[i])) return null
  i++

  // Global options between `git` and the subcommand.
  let hooksPathOverride = false
  let sub = null
  while (i < tokens.length) {
    const t = tokens[i]
    const lower = t.toLowerCase()
    if (t === '-c' || (lower.startsWith('-c') && !lower.startsWith('--'))) {
      const value = t === '-c' ? (tokens[i + 1] ?? '') : t.slice(2)
      if (value.toLowerCase().startsWith('core.hookspath=')) hooksPathOverride = true
      i += t === '-c' ? 2 : 1
      continue
    }
    if (lower.startsWith('--config-env=core.hookspath=')) { hooksPathOverride = true; i++; continue }
    if (t.startsWith('-')) { i += GIT_GLOBAL_WITH_VALUE.has(t) ? 2 : 1; continue }
    sub = t
    i++
    break
  }
  if (!sub) return null

  if (sub === 'config') {
    if (tokens.slice(i).some((t) => t.toLowerCase() === 'core.hookspath')) {
      return 'Setting core.hooksPath via `git config` is blocked: git hooks must not be bypassed. If the project really wants a different hooks dir, that is a user decision.'
    }
    return null
  }
  if (!SUBCOMMANDS.has(sub)) return null

  if (hooksPathOverride) return `Overriding core.hooksPath on \`git ${sub}\` is blocked: git hooks must not be bypassed.`
  if (husky) return `HUSKY=0 on \`git ${sub}\` is blocked: it skips the project's husky hooks. Fix what the hook reports, or ask the user to skip it explicitly.`

  for (; i < tokens.length; i++) {
    const t = tokens[i]
    if (t === '--') break
    if (NO_VERIFY.test(t)) {
      return `--no-verify is blocked on \`git ${sub}\`: the project's git hooks are its quality gates. Fix what the hook reports, or ask the user to skip it explicitly.`
    }
    if (sub !== 'commit') continue
    if (COMMIT_WITH_VALUE.has(t)) { i++; continue } // skip the value token
    if (t.startsWith('--')) continue
    if (t.startsWith('-') && t.length > 1) {
      for (const ch of t.slice(1)) {
        if (ch === 'n') {
          return '`-n` (--no-verify) is blocked on `git commit`: the project\'s git hooks are its quality gates. Fix what the hook reports, or ask the user to skip it explicitly.'
        }
        if (COMMIT_SHORT_WITH_VALUE.has(ch)) break // rest of the cluster is this option's value
      }
    }
  }
  return null
}

/** Returns the first block reason found in a full command string, or null. */
export function checkCommand(command) {
  for (const segment of splitSegments(command)) {
    const reason = checkSegment(segment)
    if (reason) return reason
  }
  return null
}

// Hook entry point — only when run directly (tests import the functions).
if (process.argv[1] && /block-no-verify\.mjs$/.test(process.argv[1])) {
  let input
  try {
    input = JSON.parse(readFileSync(0, 'utf8'))
  } catch {
    process.exit(0)
  }
  const command = input?.tool_input?.command
  if (typeof command !== 'string' || !/\bgit\b/.test(command)) process.exit(0)
  const reason = checkCommand(command)
  if (reason) {
    console.error(reason)
    process.exit(2)
  }
  process.exit(0)
}
