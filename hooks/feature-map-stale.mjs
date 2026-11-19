#!/usr/bin/env node
/**
 * SessionStart hook. Tells the session, in one line, when the project's feature map
 * no longer matches the tree — a feature directory or a route was added or removed
 * since `docs/agents/feature-map.lock.json` was written.
 *
 * Opt-in by project: silent unless that lock file exists (the `feature-map` skill
 * writes it). Never blocks and never fails the session: any error exits 0 with no
 * output. It only compares directory listings — no file contents, no model call.
 */
import { readFileSync } from 'node:fs'
import { diffLock, readLock, summarize } from './lib/feature-map.mjs'

try {
  let input = {}
  try {
    input = JSON.parse(readFileSync(0, 'utf8'))
  } catch {
    /* no payload — fall back to the process cwd */
  }
  const cwd = input?.cwd ?? process.cwd()
  const lock = readLock(cwd)
  if (lock) {
    const { added, removed } = diffLock(cwd, lock)
    if (added.length || removed.length) {
      const parts = []
      if (added.length) parts.push(`added: ${summarize(added)}`)
      if (removed.length) parts.push(`removed: ${summarize(removed)}`)
      console.log(
        `Feature map is stale (docs/agents/feature-map.md) — ${parts.join('; ')}. ` +
          `Trust the code over the map for those paths, and refresh it with the feature-map skill before this branch ships.`
      )
    }
  }
} catch {
  /* a broken lock must not cost the user a session */
}
process.exit(0)
