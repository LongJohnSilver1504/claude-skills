#!/usr/bin/env node
/**
 * guardrails — validate, self-test and explain a project's `.claude/guardrails.json`
 * (the data the `project-guardrails` hook enforces). Run from the project root, or
 * pass --cwd.
 *
 *   node scripts/guardrails.mjs check
 *       The file parses, every rule is well-formed, every pattern compiles.
 *
 *   node scripts/guardrails.mjs test
 *       Every rule against its own examples: each "block" example must match the
 *       rule, each "allow" example must not. Exit 1 on the first config that lies.
 *
 *   node scripts/guardrails.mjs explain --bash "<command>"
 *   node scripts/guardrails.mjs explain --write <path> [--content "<text>"]
 *       What the hook would decide for that call, and which rule decides it.
 *
 * Exit codes: 0 ok · 1 the config is wrong or a rule fails its examples · 2 bad usage.
 */
import { resolve } from 'node:path'
import { CONFIG_FILE, evaluateBash, evaluateWrite, loadConfig, runExamples, toRelative } from '../hooks/lib/guardrails.mjs'

const argv = process.argv.slice(2)
const opt = (flag) => {
  const i = argv.indexOf(flag)
  return i >= 0 && argv[i + 1] !== undefined ? argv[i + 1] : undefined
}
const cwd = resolve(opt('--cwd') ?? process.cwd())
// The mode is the first bare word, wherever --cwd sits.
const cwdAt = argv.indexOf('--cwd')
const mode = argv.find((a, i) => !a.startsWith('--') && !(cwdAt >= 0 && i === cwdAt + 1))
const die = (msg, code = 1) => {
  console.error(`✗ ${msg}`)
  process.exit(code)
}

if (!['check', 'test', 'explain'].includes(mode)) {
  die('usage: guardrails.mjs check | test | explain --bash "<command>" | explain --write <path> [--content "<text>"]   [--cwd <project>]', 2)
}

const { config, error } = loadConfig(cwd)
if (error) die(`${CONFIG_FILE}: ${error.split('; ').join('\n  ')}`)
if (!config) die(`no ${CONFIG_FILE} in ${cwd} — this project has no guardrails yet (run the project-guardrails skill)`)

const count = (section) => (config[section] ?? []).length

if (mode === 'check') {
  console.log(`✓ ${CONFIG_FILE}: ${count('bash')} bash, ${count('paths')} path, ${count('content')} content rule(s)` +
    `; secrets: writes ${config.secrets?.scanWrites ? 'on' : 'off'}, commits ${config.secrets?.scanCommits ? 'on' : 'off'}`)
} else if (mode === 'test') {
  const failures = runExamples(config)
  const total = ['bash', 'paths', 'content'].reduce((n, s) => n + (config[s] ?? []).reduce((m, r) => m + r.examples.block.length + r.examples.allow.length, 0), 0)
  if (failures.length) {
    for (const f of failures) console.error(`✗ ${f.id}: expected ${f.expected}, got ${f.got} — ${JSON.stringify(f.example)}`)
    die(`${failures.length} of ${total} example(s) failed — the rule's pattern and its examples disagree; fix the pattern, not the example`)
  }
  console.log(`✓ ${total} example(s) across ${count('bash') + count('paths') + count('content')} rule(s) behave as declared`)
} else {
  const bash = opt('--bash')
  const write = opt('--write')
  if (bash === undefined && write === undefined) die('explain needs --bash "<command>" or --write <path>', 2)
  const decision = bash !== undefined ? evaluateBash(config, bash) : evaluateWrite(config, toRelative(cwd, write), opt('--content') ?? '')
  console.log(decision ? `${decision.action}: ${decision.id} (${decision.section}) — ${decision.reason}` : 'allow: no rule matches')
}
