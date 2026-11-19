import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { join, resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { runHook, tempProject, writeAt } from './helpers.mjs'
import { commandVariants, globToRegExp, matchesAny, scanSecrets, validateConfig } from '../hooks/lib/guardrails.mjs'

const script = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'scripts', 'guardrails.mjs')
const cli = (cwd, args) => {
  const r = spawnSync(process.execPath, [script, ...args, '--cwd', cwd], { encoding: 'utf8' })
  return { code: r.status, stdout: r.stdout ?? '', stderr: r.stderr ?? '' }
}

const CONFIG = {
  version: 1,
  bash: [
    {
      id: 'no-force-push-base',
      action: 'deny',
      pattern: '^git\\s+push\\b(?=.*(?:--force|\\s-f\\b))(?=.*\\b(?:main|develop)\\b)',
      reason: 'Force-pushing a shared branch rewrites history other people have pulled.',
      examples: { block: ['git push --force origin main', 'git push origin develop -f'], allow: ['git push origin feat/x', 'git push --force origin feat/x'] },
    },
    {
      id: 'ask-migrations',
      action: 'ask',
      pattern: '\\b(?:sequelize|prisma)\\b.*\\b(?:db:migrate|migrate\\s+deploy)\\b',
      reason: 'Running migrations changes a database; confirm which one this points at.',
      examples: { block: ['npx sequelize db:migrate'], allow: ['npx sequelize migration:generate --name x'] },
    },
    {
      id: 'no-recursive-delete-outside',
      action: 'deny',
      pattern: '^rm\\s+(?:-[a-zA-Z]*r[a-zA-Z]*\\s+|--recursive\\s+)+(?:-\\S+\\s+)*(?:/|~|\\$HOME|\\.\\.)',
      reason: 'Recursive deletes outside the project directory are never part of a task here.',
      examples: { block: ['rm -rf /', 'rm -rf ~/work', 'rm -r ../other'], allow: ['rm -rf node_modules', 'rm -rf ./dist'] },
    },
  ],
  paths: [
    {
      id: 'env-files',
      action: 'deny',
      glob: ['.env', '.env.*'],
      except: ['.env.example'],
      reason: 'Environment files hold real credentials; declare the variable in the env schema and .env.example instead.',
      examples: { block: ['.env', 'apps/web/.env.local'], allow: ['.env.example', 'src/env.ts'] },
    },
    {
      id: 'ask-ci',
      action: 'ask',
      glob: ['.github/workflows/**'],
      reason: 'CI workflows run with repository secrets; confirm the change.',
      examples: { block: ['.github/workflows/release.yml'], allow: ['.github/pull_request_template.md'] },
    },
  ],
  content: [
    {
      id: 'no-hardcoded-api-host',
      action: 'deny',
      glob: ['src/**/*.ts', 'src/**/*.tsx'],
      except: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
      pattern: 'https?://api\\.[a-z0-9.-]+',
      reason: 'API hosts come from the validated env object, never from a literal.',
      examples: { block: ["fetch('https://api.example.com/v1/orders')"], allow: ['fetch(`${env.API_URL}/orders`)'] },
    },
  ],
  secrets: { scanWrites: true, scanCommits: true, allow: ['**/*.test.ts'] },
}

const project = (config = CONFIG) => {
  const root = tempProject('guardrails-')
  if (config !== null) writeAt(root, '.claude/guardrails.json', typeof config === 'string' ? config : JSON.stringify(config))
  return root
}
const bash = (cwd, command) => runHook('project-guardrails.mjs', { cwd, tool_name: 'Bash', tool_input: { command } })
const write = (cwd, file_path, content = '') => runHook('project-guardrails.mjs', { cwd, tool_name: 'Write', tool_input: { file_path, content } })
const edit = (cwd, file_path, new_string) => runHook('project-guardrails.mjs', { cwd, tool_name: 'Edit', tool_input: { file_path, old_string: 'x', new_string } })
const decision = (r) => (r.stdout ? JSON.parse(r.stdout).hookSpecificOutput : null)

test('inactive without .claude/guardrails.json', () => {
  const root = project(null)
  assert.equal(bash(root, 'git push --force origin main').code, 0)
  assert.equal(write(root, '.env', 'X=1').code, 0)
})

test('bash: a deny rule blocks with its reason; an ask rule returns permissionDecision "ask"', () => {
  const root = project()
  const blocked = bash(root, 'git push --force origin main')
  assert.equal(blocked.code, 2)
  assert.match(blocked.stderr, /no-force-push-base/)
  assert.match(blocked.stderr, /rewrites history/)

  const asked = bash(root, 'npx sequelize db:migrate')
  assert.equal(asked.code, 0)
  assert.equal(decision(asked).permissionDecision, 'ask')
  assert.match(decision(asked).permissionDecisionReason, /ask-migrations/)

  const fine = bash(root, 'git push origin feat/x')
  assert.equal(fine.code, 0)
  assert.equal(fine.stdout, '')
})

test('bash: wrappers, absolute binaries, chains and sh -c do not hide a command', () => {
  const root = project()
  for (const command of [
    'sudo rm -rf /',
    '/bin/rm -rf ~/work',
    'cd /tmp && rm -rf ../other',
    'FOO=1 git push -f origin main',
    'env CI=1 git push --force origin develop',
    'bash -c "git push --force origin main"',
    "sh -lc 'echo hi; rm -r ../x'",
    'echo $(rm -rf /)',
  ]) {
    assert.equal(bash(root, command).code, 2, command)
  }
  for (const command of ['rm -rf node_modules', 'echo "git push --force origin main is forbidden" > NOTES.md && git status', 'git log --grep "rm -rf /"']) {
    assert.equal(bash(root, command).code, 0, command)
  }
})

test('bash: deny wins over ask when both match', () => {
  const root = project({
    version: 1,
    bash: [
      { id: 'ask-push', action: 'ask', pattern: '^git\\s+push\\b', reason: 'Pushing publishes work; confirm.', examples: { block: ['git push'], allow: ['git status'] } },
      { id: 'deny-force', action: 'deny', pattern: '^git\\s+push\\b.*--force', reason: 'Force pushes are not allowed here.', examples: { block: ['git push --force'], allow: ['git push'] } },
    ],
  })
  assert.equal(bash(root, 'git push --force').code, 2)
  assert.equal(decision(bash(root, 'git push')).permissionDecision, 'ask')
})

test('writes: path rules match basenames anywhere, honour except, and resolve absolute paths', () => {
  const root = project()
  assert.equal(write(root, '.env', 'A=1').code, 2)
  assert.equal(write(root, join(root, 'apps/web/.env.local'), 'A=1').code, 2)
  assert.equal(write(root, '.env.example', 'A=').code, 0)
  assert.equal(decision(edit(root, '.github/workflows/release.yml', 'on: push')).permissionDecision, 'ask')
  assert.equal(write(root, 'src/a.ts', 'export const a = 1').code, 0)
})

test('writes: content rules apply only inside their globs and check Edit new_string too', () => {
  const root = project()
  const blocked = write(root, 'src/api/orders.api.ts', "fetch('https://api.example.com/v1/orders')")
  assert.equal(blocked.code, 2)
  assert.match(blocked.stderr, /no-hardcoded-api-host/)
  assert.equal(edit(root, 'src/api/orders.api.ts', "const u = 'http://api.internal.test/x'").code, 2)
  assert.equal(write(root, 'src/api/orders.api.test.ts', "fetch('https://api.example.com/v1/orders')").code, 0)
  assert.equal(write(root, 'docs/api.md', 'https://api.example.com').code, 0)
})

test('writes: an existingOnly path rule lets a new file through and catches an edit to one on disk', () => {
  const root = project({
    version: 1,
    paths: [{ id: 'protect-applied-migrations', action: 'ask', glob: ['migrations/**'], existingOnly: true, reason: 'An applied migration is history; write a new migration instead.', examples: { block: ['migrations/001-init.js'], allow: ['src/a.ts'] } }],
  })
  writeAt(root, 'migrations/001-init.js', 'old')
  assert.equal(decision(edit(root, 'migrations/001-init.js', 'changed')).permissionDecision, 'ask')
  const fresh = write(root, 'migrations/002-add-column.js', 'new')
  assert.equal(fresh.code, 0)
  assert.equal(fresh.stdout, '')
  assert.equal(cli(root, ['--cwd-first-is-fine']).code, 2)
  assert.match(spawnSync(process.execPath, [script, '--cwd', root, 'test'], { encoding: 'utf8' }).stdout, /behave as declared/)
})

test('secrets: a write that contains a credential is blocked without echoing it', () => {
  const root = project()
  const key = 'AKIA' + 'ABCDEFGHIJKLMNOP'
  const r = write(root, 'src/config.ts', `export const key = '${key}'`)
  assert.equal(r.code, 2)
  assert.match(r.stderr, /AWS access key id \(AKIA…\)/)
  assert.ok(!r.stderr.includes(key))
  assert.equal(write(root, 'src/x.test.ts', `const fixture = '${key}'`).code, 0) // secrets.allow
  assert.equal(write(root, 'src/config.ts', "export const key = env.AWS_KEY").code, 0)
})

test('secrets: git commit is blocked when the staged diff adds a credential', () => {
  const root = project()
  const git = (...args) => spawnSync('git', args, { cwd: root, encoding: 'utf8' })
  git('init', '-q')
  writeAt(root, 'src/ok.ts', 'export const a = 1\n')
  git('add', 'src/ok.ts')
  assert.equal(bash(root, 'git commit -m "ok"').code, 0)

  writeAt(root, 'src/leak.ts', `export const token = 'ghp_${'a'.repeat(36)}'\n`)
  git('add', 'src/leak.ts')
  const r = bash(root, 'git commit -m "leak"')
  assert.equal(r.code, 2)
  assert.match(r.stderr, /GitHub token/)
  assert.equal(bash(root, 'git status').code, 0)
})

test('editing the guardrails file always asks; an invalid config blocks everything else and says how to fix it', () => {
  const root = project()
  assert.equal(decision(edit(root, '.claude/guardrails.json', '{}')).permissionDecision, 'ask')

  const broken = project('{ not json')
  const r = bash(broken, 'ls')
  assert.equal(r.code, 2)
  assert.match(r.stderr, /not usable: not valid JSON/)
  assert.equal(write(broken, 'src/a.ts', 'x').code, 2)
  assert.equal(decision(write(broken, '.claude/guardrails.json', '{"version":1}')).permissionDecision, 'ask')

  const invalid = project({ version: 1, bash: [{ id: 'x', action: 'block', pattern: '(', reason: 'short' }] })
  const v = bash(invalid, 'ls')
  assert.equal(v.code, 2)
  assert.match(v.stderr, /"action" must be "deny" or "ask"/)
  assert.match(v.stderr, /not a valid regular expression/)
  assert.match(v.stderr, /"examples" needs/)
})

test('lib: globs, command variants, secret patterns, config validation', () => {
  assert.ok(globToRegExp('src/**/*.ts').test('src/a/b/c.ts'))
  assert.ok(globToRegExp('src/**/*.ts').test('src/c.ts'))
  assert.ok(!globToRegExp('src/*.ts').test('src/a/c.ts'))
  assert.ok(matchesAny('apps/web/.env.local', ['.env.*']))
  assert.ok(!matchesAny('apps/web/env.ts', ['.env.*']))
  assert.ok(commandVariants('sudo -E /usr/bin/git push').includes('git push'))
  assert.ok(commandVariants('a && b | c').includes('b'))
  assert.deepEqual(scanSecrets('nothing here'), [])
  assert.equal(scanSecrets('-----BEGIN RSA PRIVATE KEY-----')[0].kind, 'a private key')
  assert.deepEqual(validateConfig(CONFIG), [])
  assert.match(validateConfig({ version: 2 })[0], /version/)
  const dup = { version: 1, paths: [CONFIG.paths[0], CONFIG.paths[0]] }
  assert.ok(validateConfig(dup).some((e) => /duplicate id/.test(e)))
})

test('cli: check summarises, test runs every example, explain names the deciding rule', () => {
  const root = project()
  assert.match(cli(root, ['check']).stdout, /3 bash, 2 path, 1 content rule\(s\); secrets: writes on, commits on/)
  const t = cli(root, ['test'])
  assert.equal(t.code, 0, t.stderr)
  assert.match(t.stdout, /example\(s\) across 6 rule\(s\) behave as declared/)
  assert.match(cli(root, ['explain', '--bash', 'git push -f origin main']).stdout, /^deny: no-force-push-base \(bash\)/)
  assert.match(cli(root, ['explain', '--write', '.env.local']).stdout, /^deny: env-files \(paths\)/)
  assert.equal(cli(root, ['explain', '--bash', 'git status']).stdout.trim(), 'allow: no rule matches')
})

test('cli: test fails when a rule and its examples disagree; check fails on a broken config; no config is an error', () => {
  const lying = structuredClone(CONFIG)
  lying.bash[0].examples.block.push('git push origin feat/x')
  lying.paths[0].examples.allow.push('.env.production')
  const t = cli(project(lying), ['test'])
  assert.equal(t.code, 1)
  assert.match(t.stderr, /no-force-push-base: expected deny, got allowed/)
  assert.match(t.stderr, /env-files: expected allowed, got deny/)
  assert.match(t.stderr, /2 of \d+ example\(s\) failed/)

  assert.equal(cli(project('{ nope'), ['check']).code, 1)
  const none = cli(project(null), ['check'])
  assert.equal(none.code, 1)
  assert.match(none.stderr, /no guardrails yet/)
  assert.equal(cli(project(), ['explain']).code, 2)
  assert.equal(cli(project(), ['nonsense']).code, 2)
})
