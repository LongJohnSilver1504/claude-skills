# Change scope

The author is asking "did I make this worse?". Report what the change caused and stay mostly quiet about what it merely touched. Read the change before forming an opinion of it — the stated intent decides what counts as incomplete, and a skimmed diff produces findings about code the next hunk already fixed.

## Resolving the target

Accepted targets: `working` (uncommitted), `staged`, `branch`, `pr <n>`, a ref, a range (`a1b2c3d..e4f5g6h`). With no target, resolve in this order and stop at the first match:

1. `HEAD` is ahead of `git merge-base origin/<default-branch> HEAD` → that range **plus** any uncommitted changes, with the commit count and the uncommitted file count stated separately.
2. The working tree is dirty → the uncommitted changes.
3. Neither → there is no change to review. Stop and ask.

Order matters: check the tree first and one stray formatting edit shadows a twelve-commit branch while the report still claims full coverage.

Exclude lockfiles, snapshots, generated output, vendored code and binaries, and name what you excluded. An empty scope after exclusions reaches "nothing to review" too.

## Nothing to review

Never fall back to `HEAD~1..HEAD` on your own — the last commit is whatever happened to land, often a merge, often someone else's. State the facts and offer the routes:

- **The last commit**, named by short SHA and subject.
- **A target they name**: `pr <n>`, a branch, a ref, a range.
- **A whole-repository audit** — a screen-scope review with no statuses and no pre-existing section, since with no change every finding is pre-existing.

Check for an open pull request on the current branch before asking and offer it first. Never report a review of nothing as `Approve`.

## A diff is not a surface

A changed file is evidence; its **blast radius** — the surfaces it renders in — is the review subject. Expand one hop by default (direct importers and callers), a second hop only for tokens, theme values and shared primitives, where one line reaches the whole product. Review at most five consumers, ordered by how many users pass through them, then state how many you did not expand.

## Read the removed lines

Regressions are invisible in the post-change state. Search the `-` side:

```bash
git diff -U0 "$BASE"...HEAD -- '*.tsx' '*.css' | grep -E '^-[^-]' | grep -E 'aria-|role=|alt=|focus|tabindex|prefers-|lang=|dir=|text-wrap|line-clamp|tabular'
```

| Removed | Owner | Check |
| --- | --- | --- |
| `aria-label`, `aria-describedby`, `aria-live`, `role=`, `alt=`, `<label`, `for=` | accessibility | lost name, description, announcement or association |
| `<button>`, `<a>`, `<nav>`, `<main>` replaced by `div`/`span` | accessibility | keyboard and AT behavior traded for styling |
| `:focus-visible`, `outline`, `tabindex` | accessibility | focus indicator or tab order lost |
| `prefers-reduced-motion`, `prefers-contrast` | accessibility / motion | preference now ignored |
| logical properties swapped for `left`/`right` | hierarchy-layout | direction-aware layout dropped |
| `lang=`, `dir=`, `text-wrap`, `line-clamp`, `tabular-nums` | typography | rendering or bidi silently changed |
| a color token swapped for a literal or a lighter token | color-system | the rendered pair may now fail — measure |
| a user-facing string deleted or shortened | interface-copy | a label, error or empty state lost information |
| a transition or `@starting-style` removed | motion | a bridge became a teleport |

A signal is a lead, not a finding. Equivalent replacements clear it: `aria-label` → `aria-labelledby` on visible text; a `role` dropped because the element became native; `outline` → a box-shadow ring that still meets the rule; `tabindex="0"` dropped from a now-native element; a literal → a token measuring the same pair; a physical → logical property; a string moved into the translation catalogue. Route each unmatched removal to its owner and report only what that skill confirms, statused `Regression`.

## Status every finding

- `Introduced` — the change created it.
- `Regression` — the change weakened something previously correct.
- `Pre-existing` — present in touched code but not caused by this change.

Status by what the diff touched, not by which file it sits in: a line the change never touched is `Pre-existing` even three lines from a hunk. Confirm with `git blame -L <line>,<line> "$BASE" -- path` when it matters.

## Hold the change to its stated intent

Read the PR title and body, the linked issue and the commit messages. This surfaces the **incomplete** change a surface review cannot see: a new variant applied to some states but not hover/focus/active/disabled/loading; a new user-facing string with no translation entry; a new component with no empty, loading, error or narrow-width state; a control added to one surface but not its siblings. Do not report scope creep — whether a change does too much is a process question.

## Never mutate the checkout

`git fetch` is fine. `gh pr checkout`, `git checkout`, `git switch`, `git stash` rewrite the files the author has open and are never permitted. Rendered verification is opt-in: mark visual and runtime claims `Not verified` unless the project exposes a cheap preview or the user asks; then use an isolated worktree (`git worktree add /tmp/review-<n> refs/remotes/pr/<n>`) and remove it when done.
