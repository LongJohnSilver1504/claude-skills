---
name: audit-branch
description: One-command holistic audit of an AD-HOC branch — conventions + design + tests + correctness in one pass, then triage, fix loop, and fresh verification. Use when the user asks to review a branch or diff as a whole ("audit this branch", "revisa el código", "revisa si sigue mis reglas", "check conventions + design + tests", "resuélvelo todo"), or after work was done WITHOUT the execute-tasks pipeline and needs post-hoc review. NOT for: single-deliverable review during execute-tasks (the pipeline owns those gates per-deliverable), PR review of someone else's code (/review), or a quick correctness-only bug hunt (/code-review).
---

# Audit Branch

Holistic quality audit of an ad-hoc branch: fan out every reviewer in parallel, triage the merged findings, fix what's approved, re-verify with fresh output. Pipeline branches don't need this — `execute-tasks` already runs these gates per deliverable. This skill exists for branches built outside the pipeline.

## Am I in the right skill?

| Situation | Route to |
|---|---|
| Deliverable review inside a running `execute-tasks` session | The pipeline — it owns those gates |
| Reviewing someone else's PR | `/review` |
| Quick correctness-only bug hunt on the diff | `/code-review` |
| Visual audit of one component/screen only | `refactoring-ui` (Audit) |
| Holistic post-hoc audit of an ad-hoc branch | **This skill** |

## Phase 1 — Scope the Diff

1. **Find the base.** Prefer the `Base Branch` field in the feature's `PROGRESS.md` if one exists; otherwise compute the merge-base against `develop` (or `main` if no develop): `git merge-base HEAD develop`.
2. **Enumerate changed files**: `git diff --name-only <base>...HEAD` plus uncommitted working-tree changes (`git status --porcelain`).
3. **Classify** each file:
   - **Source** — non-test `.ts`/`.tsx` under the app's new-code root
   - **Tests** — `*.test.ts` / `*.test.tsx`
   - **Visual components** — `.tsx` files that render UI (components, pages), not hooks/domain/api

The classification decides which reviewers run in Phase 2. An empty diff → report "nothing to audit" and stop.

## Phase 2 — Fan Out Reviewers (parallel, one message)

Dispatch all applicable reviewers **concurrently in a single message** — none depends on another:

| Reviewer | Runs when | Scope |
|---|---|---|
| `quality-reviewer` agent | Always (source files changed) | Conventions from `.claude/rules/` over the changed source files |
| `design-reviewer` agent | Visual components changed | Refactoring-UI audit of the changed visual components (the agent reads the refactoring-ui references itself) |
| `test-reviewer` agent | Test files changed | Test quality over changed test files + their sources; **also flag tests that no longer make sense** for the changed behavior (assert removed flows, pin obsolete copy, duplicate a deleted scenario) |
| `/code-review` skill | Always | Correctness bugs — races, null handling, stale closures. The agents check conventions/design/tests; nothing else hunts logic bugs |

Give each agent the changed-file list and the base ref — never "review the repo". Ask each to tag findings **TRIVIAL** or **ARCHITECTURAL**.

## Phase 3 — Triage

Process the merged findings per the `receiving-code-review` skill — **verify each finding against the actual code before acting**; reviewers hallucinate. A finding that conflicts with a project rule in `.claude/rules/` is rejected, not applied.

- **TRIVIAL** (mechanical, no design decision) → auto-fix: dispatch **one** `implementer` agent with the full consolidated list as its task spec — not one dispatch per finding.
- **ARCHITECTURAL** (design/structure/behavior tradeoff) → present each to the user: fix or accept. Dispatch the `implementer` with the approved fixes only.
- **Rejected** → record why (finding vs. code evidence or rule citation) for the report.

## Phase 4 — Re-verify

Fresh evidence per `verification-before-completion.md` — never reuse pre-fix output:

1. `pnpm vitest run {feature-dir}` for every touched feature — **0 matched test files = FAIL**, not a pass.
2. `pnpm build`.
3. **If fixes were applied**, one re-review pass over the fixed files only (same reviewers, narrowed scope). **Cap: 2 rounds total** — after the second round, stop fixing and report whatever remains.

## Phase 5 — Report & Next Step

Report with:

1. **Findings table**: source (which reviewer) → severity → status (`fixed` / `accepted` / `rejected` / `remaining`).
2. **Fresh verification output**: actual test counts and build result from Phase 4 — not "should pass".

Then use AskUserQuestion to offer:
- **Commit** — via the `git-commit` skill (it owns build-freshness, grouping, message format)
- **More fixes** — user wants to address `accepted`/`remaining` items after all
- **Done** — leave the working tree as is

## Rules

- **Never skip triage verification.** Reviewers hallucinate — every finding is checked against the code before any fix is dispatched.
- **Never auto-fix ARCHITECTURAL findings.** The user decides fix-or-accept, per finding.
- **Fix loops cap at 2 rounds.** Then report what remains — no endless review/fix cycles.
- **Fresh outputs before any claim** (`verification-before-completion.md`). No "tests pass" without the run in this session; no build claims from memory.
