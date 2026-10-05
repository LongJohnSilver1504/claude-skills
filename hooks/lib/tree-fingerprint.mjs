/**
 * treeFingerprint(cwd) — a content hash of the working tree, for "has anything
 * changed since the last passing run?" checks (iron-law-stop, verify-stamp,
 * check-build-before-commit).
 *
 * sha256 over:
 *   1. the git tree id of the working tree's content: the real index is copied
 *      to a temp file, `git add -A` runs against that copy (GIT_INDEX_FILE), and
 *      `git write-tree` names the result. Tracked edits (staged or not) and
 *      untracked non-ignored files all land in it, by content. HEAD is not an
 *      input, so committing the same content leaves the fingerprint unchanged.
 *      The real index is never touched; the copy keeps its stat cache (and the
 *      original's mtime, for git's racy-clean check), so only changed files are
 *      re-hashed.
 *   2. submodules (only when `.gitmodules` exists): each one's HEAD and
 *      `git diff HEAD --binary` — the parent tree records only the gitlink.
 *   3. root `.env*` files (of the repo and of `cwd`) by content, even when
 *      gitignored — a different env is a different run.
 *   4. the package manager's install marker, if present (size + mtime):
 *      node_modules/.package-lock.json, node_modules/.pnpm/lock.yaml,
 *      node_modules/.yarn-state.yml — a reinstall changes the fingerprint.
 *   5. `process.version`.
 *
 * Not covered: other gitignored inputs (codegen output, caches), untracked files
 * inside submodules, and environment variables. Callers document that limit.
 *
 * The marker files (verify stamps, iron-law pass) live in the git dir
 * (see markerPath), outside the working tree, so they never affect the hash.
 *
 * Returns null outside a git repo or when git fails. Never throws.
 */
import { execFileSync } from 'node:child_process'
import { readFileSync, readdirSync, statSync, copyFileSync, existsSync, mkdtempSync, rmSync, utimesSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { createHash } from 'node:crypto'

const INSTALL_MARKERS = ['node_modules/.package-lock.json', 'node_modules/.pnpm/lock.yaml', 'node_modules/.yarn-state.yml']

const git = (cwd, args, env) =>
  execFileSync('git', args, {
    cwd,
    env: env ?? process.env,
    stdio: ['ignore', 'pipe', 'ignore'],
    maxBuffer: 1024 * 1024 * 1024,
  })

const gitLine = (cwd, args) => git(cwd, args).toString('utf8').trim()

/**
 * Absolute path of a plugin marker file inside this worktree's git dir
 * (`<git-dir>/claude/<name>`) — never part of the working tree, so it needs no
 * gitignore entry. Per worktree: a linked worktree gets its own
 * `.git/worktrees/<name>/claude/`. Returns null outside a git repo.
 */
export function markerPath(cwd, name) {
  try {
    const gitDir = gitLine(cwd, ['rev-parse', '--git-dir'])
    return gitDir ? join(resolve(cwd, gitDir), 'claude', name) : null
  } catch {
    return null
  }
}

/** Content tree id of the working tree, via a throwaway copy of the index. */
function worktreeTreeId(top) {
  // --git-path resolves the per-worktree index (and honours GIT_INDEX_FILE).
  const realIndex = resolve(top, gitLine(top, ['rev-parse', '--git-path', 'index']))
  const tmp = mkdtempSync(join(tmpdir(), 'claude-fp-'))
  try {
    const tmpIndex = join(tmp, 'index')
    if (existsSync(realIndex)) {
      copyFileSync(realIndex, tmpIndex)
      // Keep git's racy-clean protection: an entry is re-hashed when its file is
      // not older than the index. A copy stamped "now" would make git trust stale
      // stat data for files edited in the same second as the last index write, so
      // give the copy the original's mtime, rounded down (more re-hashing, never less).
      const st = statSync(realIndex)
      const mtime = new Date(Math.floor(st.mtimeMs / 1000) * 1000)
      utimesSync(tmpIndex, mtime, mtime)
    }
    const env = { ...process.env, GIT_INDEX_FILE: tmpIndex }
    git(top, ['add', '-A', '--', '.'], env)
    return git(top, ['write-tree'], env).toString('utf8').trim()
  } finally {
    rmSync(tmp, { recursive: true, force: true })
  }
}

const envFiles = (dir) => {
  try {
    return readdirSync(dir, { withFileTypes: true })
      .filter((e) => e.isFile() && e.name.startsWith('.env'))
      .map((e) => e.name)
      .sort()
  } catch {
    return []
  }
}

export function treeFingerprint(cwd) {
  try {
    const top = gitLine(cwd, ['rev-parse', '--show-toplevel'])
    if (!top) return null
    const hash = createHash('sha256')

    hash.update(`tree\0${worktreeTreeId(top)}\0`)

    if (existsSync(join(top, '.gitmodules'))) {
      hash.update('submodules\0')
      hash.update(
        git(top, [
          'submodule',
          'foreach',
          '--recursive',
          '--quiet',
          'echo "$displaypath"; git rev-parse HEAD; git diff HEAD --binary',
        ])
      )
      hash.update('\0')
    }

    const dirs = [...new Set([top, resolve(cwd)])]
    for (const dir of dirs) {
      for (const name of envFiles(dir)) {
        hash.update(`env\0${dir}/${name}\0`)
        try {
          hash.update(readFileSync(join(dir, name)))
        } catch {
          hash.update('unreadable')
        }
        hash.update('\0')
      }
      for (const rel of INSTALL_MARKERS) {
        try {
          const st = statSync(join(dir, rel))
          hash.update(`install\0${dir}/${rel}\0${st.size}\0${st.mtimeMs}\0`)
        } catch {
          /* absent */
        }
      }
    }

    hash.update(`node\0${process.version}\0`)
    return hash.digest('hex')
  } catch {
    return null
  }
}
