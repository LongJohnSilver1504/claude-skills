import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { readFileSync, rmSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { runHook, tempProject, writeAt } from './helpers.mjs'

const script = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'scripts', 'feature-map.mjs')
const run = (cwd, args) => {
  const r = spawnSync(process.execPath, [script, ...args, '--cwd', cwd], { encoding: 'utf8' })
  return { code: r.status, stdout: r.stdout ?? '', stderr: r.stderr ?? '' }
}

/** Two features, an app-router tree, and noise that must never be listed. */
const project = () => {
  const root = tempProject('feature-map-')
  writeAt(root, 'src/features/reservations/index.ts')
  writeAt(root, 'src/features/reservations/api/reservations.api.ts')
  writeAt(root, 'src/features/reservations/__tests__/x.test.ts')
  writeAt(root, 'src/features/customers/index.ts')
  writeAt(root, 'src/features/.cache/tmp.ts')
  writeAt(root, 'src/app/(dashboard)/reservations/page.tsx')
  writeAt(root, 'src/app/(dashboard)/reservations/list.tsx')
  writeAt(root, 'src/app/api/export/route.ts')
  writeAt(root, 'src/app/layout.tsx')
  return root
}
const ROOTS = ['--root', 'src/features', '--root', 'src/app files=page.tsx,route.ts']
const MAP = [
  '# Feature Map',
  '| Feature | Entry points | Directory |',
  '|---|---|---|',
  '| Reservations | `/reservations` · `GET /reservations` | `src/features/reservations` |',
  '| Customers | `/customers` | `src/features/customers` |',
].join('\n')

test('scan lists sub-directories for a dirs root and only the named files for a files root', () => {
  const root = project()
  const r = run(root, ['scan', ...ROOTS])
  assert.equal(r.code, 0, r.stderr)
  assert.deepEqual(JSON.parse(r.stdout), {
    'src/features': ['src/features/customers', 'src/features/reservations'],
    'src/app files=page.tsx,route.ts': ['src/app/(dashboard)/reservations/page.tsx', 'src/app/api/export/route.ts'],
  })
})

test('scan depth=2 descends one more level; plain "files" takes source files and skips tests', () => {
  const root = project()
  const out = JSON.parse(run(root, ['scan', '--root', 'src/features depth=2', '--root', 'src/features/reservations files']).stdout)
  assert.deepEqual(out['src/features depth=2'], ['src/features/customers', 'src/features/reservations', 'src/features/reservations/api'])
  assert.deepEqual(out['src/features/reservations files'], ['src/features/reservations/api/reservations.api.ts', 'src/features/reservations/index.ts'])
})

test('scan warns about a root that lists nothing and rejects an unknown flag', () => {
  const root = project()
  assert.match(run(root, ['scan', '--root', 'src/nope']).stderr, /lists nothing/)
  const bad = run(root, ['scan', '--root', 'src/features deep=2'])
  assert.equal(bad.code, 2)
  assert.match(bad.stderr, /unknown root flag/)
})

test('lock refuses until the map exists, names every feature directory, and names only real paths', () => {
  const root = project()
  assert.match(run(root, ['lock', ...ROOTS]).stderr, /does not exist/)

  writeAt(root, 'docs/agents/feature-map.md', MAP.replace(/\n\| Customers.*$/, ''))
  const unmapped = run(root, ['lock', ...ROOTS])
  assert.equal(unmapped.code, 1)
  assert.match(unmapped.stderr, /unmapped: src\/features\/customers/)

  writeAt(root, 'docs/agents/feature-map.md', `${MAP}\n| Ghost | — | \`src/features/ghost\` |`)
  const dead = run(root, ['lock', ...ROOTS])
  assert.equal(dead.code, 1)
  assert.match(dead.stderr, /dead: src\/features\/ghost/)

  writeAt(root, 'docs/agents/feature-map.md', MAP)
  const ok = run(root, ['lock', ...ROOTS])
  assert.equal(ok.code, 0, ok.stderr)
  const lock = JSON.parse(readFileSync(join(root, 'docs/agents/feature-map.lock.json'), 'utf8'))
  assert.deepEqual(lock.roots, ['src/features', 'src/app files=page.tsx,route.ts'])
  assert.equal(lock.entries['src/features'].length, 2)
})

test('check is fresh right after lock, then reports additions, removals, unmapped features and dead paths', () => {
  const root = project()
  writeAt(root, 'docs/agents/feature-map.md', MAP)
  run(root, ['lock', ...ROOTS])
  const fresh = run(root, ['check'])
  assert.equal(fresh.code, 0)
  assert.equal(fresh.stdout.trim(), 'fresh')

  writeAt(root, 'src/features/invoices/index.ts')
  writeAt(root, 'src/app/(dashboard)/invoices/page.tsx')
  rmSync(join(root, 'src/features/customers'), { recursive: true })
  const stale = run(root, ['check'])
  assert.equal(stale.code, 1)
  assert.match(stale.stdout, /stale: \+src\/app\/\(dashboard\)\/invoices\/page\.tsx \+src\/features\/invoices -src\/features\/customers/)
  assert.match(stale.stdout, /unmapped: src\/features\/invoices/)
  assert.match(stale.stdout, /dead: src\/features\/customers/)

  // Routes and endpoints in backticks are not paths, so they are never "dead".
  assert.doesNotMatch(stale.stdout, /\/reservations`|GET/)
})

test('lock with no roots reuses the recorded ones; check without a lock says how to start', () => {
  const root = project()
  const none = run(root, ['check'])
  assert.equal(none.code, 1)
  assert.match(none.stderr, /no feature map yet/)
  assert.equal(run(root, ['lock']).code, 2)

  writeAt(root, 'docs/agents/feature-map.md', MAP)
  run(root, ['lock', ...ROOTS])
  writeAt(root, 'src/features/invoices/index.ts')
  writeAt(root, 'docs/agents/feature-map.md', `${MAP}\n| Invoices | — | \`src/features/invoices\` |`)
  assert.equal(run(root, ['lock']).code, 0)
  assert.equal(run(root, ['check']).stdout.trim(), 'fresh')
})

test('hook: silent without a lock, silent when fresh, one line when the tree moved', () => {
  const root = project()
  const silent = runHook('feature-map-stale.mjs', { cwd: root, hook_event_name: 'SessionStart' })
  assert.equal(silent.code, 0)
  assert.equal(silent.stdout, '')

  writeAt(root, 'docs/agents/feature-map.md', MAP)
  run(root, ['lock', ...ROOTS])
  assert.equal(runHook('feature-map-stale.mjs', { cwd: root }).stdout, '')

  writeAt(root, 'src/features/invoices/index.ts')
  rmSync(join(root, 'src/features/customers'), { recursive: true })
  const stale = runHook('feature-map-stale.mjs', { cwd: root })
  assert.equal(stale.code, 0)
  assert.equal(stale.stdout.trim().split('\n').length, 1)
  assert.match(stale.stdout, /Feature map is stale/)
  assert.match(stale.stdout, /added: src\/features\/invoices/)
  assert.match(stale.stdout, /removed: src\/features\/customers/)
})

test('hook: a corrupt lock or an unreadable payload never fails the session', () => {
  const root = project()
  writeAt(root, 'docs/agents/feature-map.lock.json', '{ not json')
  const r = runHook('feature-map-stale.mjs', { cwd: root })
  assert.equal(r.code, 0)
  assert.equal(r.stdout, '')
  assert.equal(runHook('feature-map-stale.mjs', 'not json at all', { cwd: root }).code, 0)
})

test('area files under docs/agents/feature-map/ count as part of the map', () => {
  const root = project()
  writeAt(root, 'docs/agents/feature-map.md', '# Feature Map\n| Area | Directory |\n|---|---|\n| Booking | `src/features/reservations` |')
  assert.match(run(root, ['lock', ...ROOTS]).stderr, /unmapped: src\/features\/customers/)
  writeAt(root, 'docs/agents/feature-map/crm.md', '| Customers | `src/features/customers` |')
  assert.equal(run(root, ['lock', ...ROOTS]).code, 0)
  assert.equal(run(root, ['check']).stdout.trim(), 'fresh')
})
