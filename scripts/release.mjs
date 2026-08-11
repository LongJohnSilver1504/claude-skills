#!/usr/bin/env node
/**
 * Cut a release: validate, bump, changelog, commit, tag, push, GitHub Release.
 *
 * This script IS the release checklist — it runs the steps in an order that
 * works (validation both before and after the bump) so the checklist can't be
 * half-followed.
 *
 * Usage:
 *   node scripts/release.mjs patch              # 3.1.0 -> 3.1.1
 *   node scripts/release.mjs minor             # 3.1.0 -> 3.2.0
 *   node scripts/release.mjs major             # 3.1.0 -> 4.0.0
 *   node scripts/release.mjs 3.5.0             # explicit version
 *   node scripts/release.mjs minor --dry-run   # print every step, change nothing
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const pkgPath = resolve(root, 'package.json')
const changelogPath = resolve(root, 'CHANGELOG.md')

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const bump = args.find((a) => !a.startsWith('-'))

const die = (msg, fix) => {
  console.error(`\n✗ ${msg}${fix ? `\n  Fix: ${fix}` : ''}\n`)
  process.exit(1)
}

let step = 0
/** An action: in a dry run it is described rather than performed. */
const say = (msg) => console.log(`${dryRun ? '│ would' : '│'} ${msg}`)
/** An observation about current state — true in both modes. */
const note = (msg) => console.log(`│ ${msg}`)
const phase = (title) => console.log(`\n${++step}. ${title}`)

const run = (cmd, cmdArgs, { capture = false } = {}) =>
  execFileSync(cmd, cmdArgs, { cwd: root, encoding: 'utf8', stdio: capture ? 'pipe' : 'inherit' })
const git = (...a) => run('git', a, { capture: true }).trim()

/** Run a command only when this is a real release; otherwise describe it. */
const mutate = (label, fn) => {
  say(label)
  if (!dryRun) fn()
}

// ---------- Resolve the target version ----------
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))
const current = pkg.version
if (!bump) {
  die('No version bump given.', 'node scripts/release.mjs <patch|minor|major|X.Y.Z> [--dry-run]')
}

const nextVersion = (() => {
  if (/^\d+\.\d+\.\d+$/.test(bump)) return bump
  const [maj, min, pat] = current.split('.').map(Number)
  if (bump === 'patch') return `${maj}.${min}.${pat + 1}`
  if (bump === 'minor') return `${maj}.${min + 1}.0`
  if (bump === 'major') return `${maj + 1}.0.0`
  return die(`Unknown bump "${bump}".`, 'Use patch, minor, major, or an explicit X.Y.Z.')
})()

const tag = `claude-skills--v${nextVersion}`
const today = new Date().toISOString().slice(0, 10)

console.log(
  `\n${dryRun ? 'DRY RUN — ' : ''}Release claude-skills ${current} → ${nextVersion}  (tag ${tag}, date ${today})`
)

// ---------- 1. Guards ----------
phase('Guards')
const branch = git('rev-parse', '--abbrev-ref', 'HEAD')
if (branch !== 'main') {
  die(`On branch "${branch}" — releases are cut from main.`, 'Merge your PR first, then run this from main.')
}
if (git('status', '--porcelain', '--untracked-files=no')) {
  die('Working tree has uncommitted changes to tracked files.', 'Commit or stash them, then re-run.')
}
run('git', ['fetch', '--quiet', 'origin', 'main'], { capture: true })
const ahead = git('rev-list', '--count', 'origin/main..HEAD')
const behind = git('rev-list', '--count', 'HEAD..origin/main')
if (behind !== '0') die(`Local main is ${behind} commit(s) behind origin/main.`, 'git pull, then re-run.')
if (ahead !== '0') die(`Local main is ${ahead} commit(s) ahead of origin/main.`, 'Push them via a PR first.')
if (git('tag', '--list', tag)) die(`Tag ${tag} already exists.`, 'Pick a different version.')
note(`on main, clean, in sync with origin (HEAD ${git('rev-parse', '--short', 'HEAD')})`)

// ---------- 2. Validate before touching anything ----------
// Two invocations, deliberately: `.` resolves to the MARKETPLACE manifest and
// never looks at skills (it exited 0 on a skill whose frontmatter didn't parse),
// while the plugin.json path validates the plugin and every SKILL.md. The
// plugin path runs without --strict because the root CLAUDE.md is a maintainer
// guide, not shipped context, and --strict turns that warning into an error.
phase('Validate (pre-bump)')
run('node', ['scripts/validate-skills.mjs'])
run('node', ['scripts/sync-version.mjs', '--check'])
run('claude', ['plugin', 'validate', '.claude-plugin/plugin.json'])
run('claude', ['plugin', 'validate', '.', '--strict'])

// ---------- 3. Require release notes ----------
phase('Release notes')
const changelog = readFileSync(changelogPath, 'utf8')
const unreleasedRe = /^## \[Unreleased\]\s*$/m
const unreleasedMatch = changelog.match(unreleasedRe)
if (!unreleasedMatch) {
  die('CHANGELOG.md has no `## [Unreleased]` section.', 'Add one under the preamble and record what changed.')
}
const afterHeading = changelog.slice(unreleasedMatch.index + unreleasedMatch[0].length)
const nextHeadingIdx = afterHeading.search(/^## /m)
const notes = (nextHeadingIdx === -1 ? afterHeading : afterHeading.slice(0, nextHeadingIdx)).trim()
if (!notes) {
  die('`## [Unreleased]` is empty — nothing to release.', 'Record what changed (and why) under it first.')
}
note(`${notes.split('\n').filter((l) => l.trim()).length} line(s) of notes found under [Unreleased]`)

// ---------- 4-5. Bump + changelog ----------
phase(`Bump package.json to ${nextVersion} and sync plugin.json`)
mutate(`write version ${nextVersion}`, () => {
  writeFileSync(pkgPath, readFileSync(pkgPath, 'utf8').replace(`"version": "${current}"`, `"version": "${nextVersion}"`))
  run('node', ['scripts/sync-version.mjs'])
})

phase(`Cut CHANGELOG [Unreleased] → ## ${nextVersion} (${today})`)
mutate('rewrite the heading and open a fresh [Unreleased]', () => {
  writeFileSync(
    changelogPath,
    changelog.replace(unreleasedRe, `## [Unreleased]\n\n## ${nextVersion} (${today})`)
  )
})

// ---------- 6. Validate again, now that counts and versions moved ----------
phase('Validate (post-bump)')
if (dryRun) say('re-run validate-skills.mjs + sync-version.mjs --check')
else {
  run('node', ['scripts/validate-skills.mjs'])
  run('node', ['scripts/sync-version.mjs', '--check'])
}

// ---------- 7-9. Commit, tag, push ----------
phase(`Commit chore(release): v${nextVersion}`)
mutate('stage package.json, plugin.json, CHANGELOG.md and commit', () => {
  run('git', ['add', 'package.json', '.claude-plugin/plugin.json', 'CHANGELOG.md'], { capture: true })
  run('git', ['commit', '--quiet', '-m', `chore(release): v${nextVersion}`], { capture: true })
})

// `claude plugin tag` reads the version from plugin.json, so it can only be
// invoked after the bump is written — in a dry run it would tag the current
// (already tagged) version. Manifest agreement is covered by the strict
// `claude plugin validate` in step 2.
phase(`Tag ${tag} via \`claude plugin tag\` (validates plugin.json ↔ marketplace entry)`)
mutate(`claude plugin tag --push -m "claude-skills %s"`, () =>
  run('claude', ['plugin', 'tag', '--push', '-m', 'claude-skills %s'])
)

phase('Push main')
mutate('git push origin main', () => run('git', ['push', 'origin', 'main']))

// ---------- 10. GitHub Release ----------
phase(`Publish GitHub Release ${tag}`)
mutate('gh release create with the CHANGELOG section as notes', () =>
  run('gh', ['release', 'create', tag, '--title', `v${nextVersion}`, '--notes', notes])
)

console.log(
  dryRun
    ? `\n✓ Dry run complete — nothing was written, committed, tagged, or published.\n  Re-run without --dry-run to release ${nextVersion}.\n`
    : `\n✓ Released ${nextVersion} (${tag}).\n  Consumers: \`claude plugin update claude-skills\` (restart required), or \`git pull\` for symlink installs.\n  See the changes: npm run changes -- ${current} ${nextVersion}\n`
)
