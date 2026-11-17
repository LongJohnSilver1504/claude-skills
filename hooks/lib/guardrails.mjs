/**
 * Project guardrails — rule matching shared by the `project-guardrails` PreToolUse
 * hook and `scripts/guardrails.mjs`.
 *
 * One generic hook, tested once; what differs per project is data, in
 * `.claude/guardrails.json`:
 *
 *   { "version": 1,
 *     "bash":    [ { id, action, pattern, flags?, reason, examples: { block: [], allow: [] } } ],
 *     "paths":   [ { id, action, glob: [], except?: [], existingOnly?: true, reason, examples } ],
 *     "content": [ { id, action, glob: [], except?: [], pattern, flags?, reason, examples } ],
 *     "secrets": { "scanWrites": true, "scanCommits": true, "allow": [globs] } }
 *
 * action is "deny" (the call is blocked) or "ask" (the user confirms). Every rule
 * carries examples of what it must stop and what it must let through, so a project's
 * config tests itself (`guardrails.mjs test`).
 *
 * Text matching has known holes — an interpreter can build a command the pattern
 * never sees. The normalisation below closes the cheap ones (absolute binary paths,
 * `sudo`, `env X=…`, `bash -c "…"`, chained commands); the rest is why guardrails
 * ship with permission rules and a sandbox recommendation, not instead of them.
 */
import { existsSync, readFileSync } from 'node:fs'
import { isAbsolute, join, relative } from 'node:path'

export const CONFIG_FILE = '.claude/guardrails.json'
const ACTIONS = ['deny', 'ask']
const RANK = { ask: 1, deny: 2 }

// ---------- config ----------
export function validateConfig(config) {
  const errors = []
  const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v)
  if (!isObj(config)) return ['the file must hold a JSON object']
  if (config.version !== 1) errors.push('"version" must be 1')
  const ids = new Set()
  const strings = (v) => Array.isArray(v) && v.length > 0 && v.every((s) => typeof s === 'string' && s.length > 0)
  const regex = (where, pattern, flags) => {
    if (typeof pattern !== 'string' || !pattern) return errors.push(`${where}: "pattern" must be a non-empty string`)
    try {
      new RegExp(pattern, flags ?? '')
    } catch (e) {
      errors.push(`${where}: "pattern" is not a valid regular expression (${e.message})`)
    }
  }
  for (const section of ['bash', 'paths', 'content']) {
    const rules = config[section]
    if (rules === undefined) continue
    if (!Array.isArray(rules)) {
      errors.push(`"${section}" must be an array of rules`)
      continue
    }
    rules.forEach((rule, i) => {
      const where = `${section}[${i}]${isObj(rule) && typeof rule.id === 'string' ? ` (${rule.id})` : ''}`
      if (!isObj(rule)) return errors.push(`${where}: a rule must be an object`)
      if (typeof rule.id !== 'string' || !/^[a-z0-9][a-z0-9-]*$/.test(rule.id)) errors.push(`${where}: "id" must be lowercase letters, digits and hyphens`)
      else if (ids.has(rule.id)) errors.push(`${where}: duplicate id`)
      else ids.add(rule.id)
      if (!ACTIONS.includes(rule.action)) errors.push(`${where}: "action" must be "deny" or "ask"`)
      if (typeof rule.reason !== 'string' || rule.reason.length < 10) errors.push(`${where}: "reason" must say why, in a sentence the agent can act on`)
      if (section !== 'paths') regex(where, rule.pattern, rule.flags)
      if (section !== 'bash') {
        if (!strings(rule.glob)) errors.push(`${where}: "glob" must be a non-empty array of globs`)
        if (rule.except !== undefined && !strings(rule.except)) errors.push(`${where}: "except" must be an array of globs`)
        if (rule.existingOnly !== undefined && typeof rule.existingOnly !== 'boolean') errors.push(`${where}: "existingOnly" must be true or false`)
      }
      const ex = rule.examples
      if (!isObj(ex) || !strings(ex.block) || !Array.isArray(ex.allow) || !ex.allow.every((s) => typeof s === 'string')) {
        errors.push(`${where}: "examples" needs a non-empty "block" list and an "allow" list — a rule with no example of what it stops cannot be tested`)
      }
    })
  }
  if (config.secrets !== undefined) {
    if (!isObj(config.secrets)) errors.push('"secrets" must be an object')
    else if (config.secrets.allow !== undefined && !(Array.isArray(config.secrets.allow) && config.secrets.allow.every((s) => typeof s === 'string'))) {
      errors.push('"secrets.allow" must be an array of globs')
    }
  }
  return errors
}

/** → { config: null } when the project has not opted in; { error } when the file is unusable. */
export function loadConfig(cwd) {
  const file = join(cwd, CONFIG_FILE)
  if (!existsSync(file)) return { config: null }
  let config
  try {
    config = JSON.parse(readFileSync(file, 'utf8'))
  } catch (e) {
    return { config: null, error: `not valid JSON (${e.message})` }
  }
  const errors = validateConfig(config)
  return errors.length ? { config: null, error: errors.join('; ') } : { config }
}

// ---------- globs ----------
export function globToRegExp(glob) {
  let re = ''
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i]
    if (c === '*') {
      if (glob[i + 1] === '*') {
        i++
        if (glob[i + 1] === '/') {
          i++
          re += '(?:.*/)?'
        } else re += '.*'
      } else re += '[^/]*'
    } else if (c === '?') re += '[^/]'
    else re += c.replace(/[.+^${}()|[\]\\]/g, '\\$&')
  }
  return new RegExp(`^${re}$`)
}

/** A glob with no slash matches the basename anywhere (".env.*" hits "apps/web/.env.local"). */
export function matchesAny(path, globs = []) {
  const base = path.split('/').pop()
  return globs.some((g) => (g.includes('/') ? globToRegExp(g).test(path) : globToRegExp(g).test(base)))
}

export function toRelative(cwd, filePath) {
  if (!filePath) return ''
  const rel = isAbsolute(filePath) ? relative(cwd, filePath) : filePath
  return rel.split('\\').join('/').replace(/^\.\//, '')
}

// ---------- bash ----------
/**
 * Every string a rule should be tried against: the command, each chained segment,
 * and the body of a `sh -c '…'` / `bash -lc "…"`, with wrappers and absolute binary
 * paths removed.
 */
export function commandVariants(command) {
  const seen = new Set()
  const add = (s) => {
    const t = s.replace(/\s+/g, ' ').trim()
    if (!t || seen.has(t)) return false
    seen.add(t)
    return true
  }
  const unwrap = (s) => {
    let t = s.trim()
    for (let i = 0; i < 6; i++) {
      const next = t
        .replace(/^(?:sudo|command|exec|nohup|time)\s+(?:-\S+\s+)*/, '')
        .replace(/^env\s+(?:-\S+\s+)*/, '')
        .replace(/^(?:[A-Za-z_][A-Za-z0-9_]*=(?:"[^"]*"|'[^']*'|\S*)\s+)+/, '')
        .replace(/^(?:\/[\w.+-]+)+\/([\w.+-]+)(?=\s|$)/, '$1')
      if (next === t) break
      t = next
    }
    return t
  }
  const visit = (s, depth) => {
    if (depth > 3) return
    for (const piece of [s, ...s.split(/\s*(?:&&|\|\||;|\||\n)\s*/)]) {
      const plain = unwrap(piece)
      for (const candidate of [piece, plain]) {
        if (!add(candidate)) continue
        const inner = candidate.match(/^(?:ba|z|da|k)?sh\s+(?:-[a-z]*c[a-z]*)\s+(['"])([\s\S]*)\1\s*$/)
        if (inner) visit(inner[2], depth + 1)
        for (const m of candidate.matchAll(/\$\(([^()]*)\)|`([^`]*)`/g)) visit(m[1] ?? m[2], depth + 1)
      }
    }
  }
  visit(String(command ?? ''), 0)
  return [...seen]
}

const strongest = (hits) => hits.sort((a, b) => RANK[b.action] - RANK[a.action])[0] ?? null
const hit = (rule, section) => ({ action: rule.action, id: rule.id, reason: rule.reason, section })

export function matchBashRule(rule, command) {
  const re = new RegExp(rule.pattern, rule.flags ?? '')
  return commandVariants(command).some((v) => re.test(v))
}

export function evaluateBash(config, command) {
  return strongest((config.bash ?? []).filter((rule) => matchBashRule(rule, command)).map((r) => hit(r, 'bash')))
}

// ---------- writes ----------
/** `exists` is whether the target file is already on disk; an `existingOnly` rule lets new files through. */
export const matchPathRule = (rule, relPath, exists = true) =>
  matchesAny(relPath, rule.glob) && !matchesAny(relPath, rule.except) && !(rule.existingOnly && !exists)
export const matchContentRule = (rule, relPath, content) =>
  matchPathRule(rule, relPath) && new RegExp(rule.pattern, rule.flags ?? '').test(content ?? '')

export function evaluateWrite(config, relPath, content, exists = true) {
  const hits = [
    ...(config.paths ?? []).filter((r) => matchPathRule(r, relPath, exists)).map((r) => hit(r, 'paths')),
    ...(config.content ?? []).filter((r) => matchContentRule(r, relPath, content)).map((r) => hit(r, 'content')),
  ]
  if (config.secrets?.scanWrites && !matchesAny(relPath, config.secrets.allow)) {
    const found = scanSecrets(content)
    if (found.length) {
      hits.push({ action: 'deny', id: 'secrets', section: 'secrets', reason: `this write contains what looks like ${describeSecrets(found)}. Secrets belong in the environment or a secret manager, never in a file the repository tracks.` })
    }
  }
  return strongest(hits)
}

// ---------- secrets ----------
const SECRET_PATTERNS = [
  ['an AWS access key id', /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/g],
  ['a GitHub token', /\b(?:gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{60,})\b/g],
  ['an Anthropic API key', /\bsk-ant-[A-Za-z0-9_-]{24,}\b/g],
  ['an OpenAI API key', /\bsk-(?:proj-)?[A-Za-z0-9_-]{40,}\b/g],
  ['a Stripe live key', /\b(?:sk|rk)_live_[A-Za-z0-9]{20,}\b/g],
  ['a Slack token', /\bxox[abprs]-[A-Za-z0-9-]{20,}\b/g],
  ['a Google API key', /\bAIza[0-9A-Za-z_-]{35}\b/g],
  ['a private key', /-----BEGIN (?:[A-Z]+ )?PRIVATE KEY-----/g],
]

/** → [{ kind, preview }] — the preview shows four characters, never the secret. */
export function scanSecrets(text) {
  const found = []
  for (const [kind, re] of SECRET_PATTERNS) {
    for (const m of String(text ?? '').matchAll(re)) found.push({ kind, preview: `${m[0].slice(0, 4)}…` })
  }
  return found
}

export const describeSecrets = (found) =>
  [...new Set(found.map((f) => `${f.kind} (${f.preview})`))].slice(0, 3).join(', ')

// ---------- self-test ----------
/** Run every rule against its own examples. → [{ id, example, expected, got }] */
export function runExamples(config) {
  const failures = []
  const check = (rule, matcher) => {
    for (const example of rule.examples.block) {
      if (!matcher(example)) failures.push({ id: rule.id, example, expected: rule.action, got: 'allowed' })
    }
    for (const example of rule.examples.allow) {
      if (matcher(example)) failures.push({ id: rule.id, example, expected: 'allowed', got: rule.action })
    }
  }
  for (const rule of config.bash ?? []) check(rule, (cmd) => matchBashRule(rule, cmd))
  for (const rule of config.paths ?? []) check(rule, (path) => matchPathRule(rule, path))
  // A content example is the text that would be written, into a file the glob covers.
  for (const rule of config.content ?? []) check(rule, (text) => new RegExp(rule.pattern, rule.flags ?? '').test(text))
  return failures
}
