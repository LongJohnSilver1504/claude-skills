import { test } from 'node:test'
import assert from 'node:assert/strict'
import { runHook } from './helpers.mjs'

const bash = (command) => ({ tool_name: 'Bash', tool_input: { command } })
const run = (command) => runHook('block-no-verify.mjs', bash(command))

test('allows ordinary git commands', () => {
  for (const cmd of [
    'git commit -m "feat: add thing"',
    'git push origin feat/x',
    'git status && git log --oneline -3',
    'git commit -am "wip"',
    'git rebase -i main',
  ]) {
    assert.equal(run(cmd).code, 0, cmd)
  }
})

test('allows non-git commands that mention the flag', () => {
  assert.equal(run('echo "--no-verify is banned"').code, 0)
  assert.equal(run('pnpm test -- --no-verify').code, 0)
})

test('blocks --no-verify on commit, push, merge, rebase', () => {
  for (const cmd of [
    'git commit --no-verify -m "x"',
    'git commit -m "x" --no-verify',
    'git push --no-verify',
    'git merge --no-verify feat/x',
    'git rebase --no-verify main',
    'git add -A && git commit -m "x" --no-verify',
  ]) {
    const r = run(cmd)
    assert.equal(r.code, 2, cmd)
    assert.match(r.stderr, /no-verify/)
  }
})

test('blocks -n on commit, including inside a short-option cluster', () => {
  for (const cmd of ['git commit -n -m "x"', 'git commit -an -m "x"', 'git commit -sn']) {
    assert.equal(run(cmd).code, 2, cmd)
  }
})

test('does not treat the message or a value as a flag', () => {
  for (const cmd of [
    'git commit -m "fix: handle --no-verify in docs"',
    "git commit -m 'skip -n flag parsing'",
    'git commit -mn',            // -m consumes "n" as the message
    'git commit --author="n <n@x>" -m x',
  ]) {
    assert.equal(run(cmd).code, 0, cmd)
  }
})

test('blocks core.hooksPath overrides in any casing', () => {
  for (const cmd of [
    'git -c core.hooksPath=/dev/null commit -m x',
    'git -c core.HOOKSPATH=/tmp/none push',
    'git -ccore.hookspath=/x commit -m x',
  ]) {
    const r = run(cmd)
    assert.equal(r.code, 2, cmd)
    assert.match(r.stderr, /hooksPath/)
  }
})

test('ignores comments and exits 0 on malformed input', () => {
  assert.equal(run('# git commit --no-verify\ngit status').code, 0)
  assert.equal(runHook('block-no-verify.mjs', 'not json').code, 0)
  assert.equal(runHook('block-no-verify.mjs', {}).code, 0)
})

test('does not block prose that mentions git (echo, heredoc bodies, grep)', () => {
  for (const cmd of [
    'echo "Never use git commit --no-verify" >> notes.md',
    'echo git commit -n',
    "cat > docs/x.md <<'EOF'\n- git commit --no-verify is blocked\ngit push --no-verify\nEOF",
    'cat <<EOF > x.md\ngit commit -n\nEOF\ngit status',
    'grep -rn "git commit --no-verify" docs/',
  ]) {
    assert.equal(run(cmd).code, 0, cmd)
  }
})

test('does not misread inline option values as -n', () => {
  for (const cmd of [
    'git commit -uno -m "wip"',
    'git commit -Sanne@example.com -m x',
    'git commit -m msg#1 --amend',
    'git commit -m x 2>&1 | tee log.txt',
    'git -c core.hooksPath=/x status',   // status runs no hooks
  ]) {
    assert.equal(run(cmd).code, 0, cmd)
  }
})

test('catches wrapped, prefixed, subshell and prefix-flag variants', () => {
  for (const cmd of [
    '(git commit --no-verify -m x)',
    '$(git commit -n -m x)',
    'env FOO=1 git commit --no-verify -m x',
    'FOO=bar git push --no-verify',
    'sudo git commit -n -m x',
    'bash -c "git commit --no-verify -m x"',
    'git commit -m msg#1 --no-verify',      // # inside a word is not a comment
    'git commit --no-verif -m x',           // unique long-option prefix
    'git commit -m x 2>&1 -n',              // redirection must not split the segment
    'git --config-env=core.hooksPath=EMPTY commit -m x',
    'git config core.hooksPath /dev/null',
    'HUSKY=0 git commit -m x',
    'cd repo && git commit -m x --no-verify',
  ]) {
    assert.equal(run(cmd).code, 2, cmd)
  }
})
