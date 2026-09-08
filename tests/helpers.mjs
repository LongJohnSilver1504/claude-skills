import { spawnSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, writeFileSync, utimesSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export const hooksDir = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'hooks')

/** Run a hook script with a JSON payload on stdin, the way Claude Code does. */
export function runHook(script, payload, { cwd, env } = {}) {
  const input = typeof payload === 'string' ? payload : JSON.stringify(payload)
  const r = spawnSync(process.execPath, [join(hooksDir, script)], {
    input,
    encoding: 'utf8',
    cwd: cwd ?? process.cwd(),
    env: { ...process.env, CLAUDE_PLUGIN_ROOT: resolve(hooksDir, '..'), ...env },
  })
  return { code: r.status, stderr: r.stderr ?? '', stdout: r.stdout ?? '' }
}

/** Fresh temp project dir; returns its path. */
export function tempProject(prefix = 'claude-skills-hook-') {
  return mkdtempSync(join(tmpdir(), prefix))
}

/** Write a file (creating parents) and optionally pin its mtime (seconds since epoch). */
export function writeAt(root, rel, content = '', mtimeSec) {
  const p = join(root, rel)
  mkdirSync(dirname(p), { recursive: true })
  writeFileSync(p, content)
  if (mtimeSec !== undefined) utimesSync(p, mtimeSec, mtimeSec)
  return p
}
