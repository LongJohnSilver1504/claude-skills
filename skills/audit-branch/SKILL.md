---
name: audit-branch
description: One-command holistic audit of a branch — conventions + design + tests + correctness in one pass, then triage, fix loop, and fresh verification. Also the shared review-loop primitive execute-tasks delegates its post-execution phase to (Pipeline Mode). Use when the user asks to review a branch or diff as a whole ("audit this branch", "revisa el código", "revisa si sigue mis reglas", "check conventions + design + tests", "resuélvelo todo"), or after work was done WITHOUT the execute-tasks pipeline and needs post-hoc review. NOT for single-deliverable review during execute-tasks (the pipeline owns those gates per-deliverable), PR review of someone else's code (/review), or a quick correctness-only bug hunt (/code-review).
argument-hint: <base-ref (optional)>
---

# Audit Branch

Holistic quality audit of a branch: fan out every reviewer in parallel, triage the merged findings, fix what's approved, re-verify with fresh output. This skill owns the review loop — `execute-tasks` delegates its post-execution holistic phase here (see Pipeline Mode) instead of duplicating it.

Project commands (test, build) come from `docs/agents/project-conventions.md`; if it's missing, stop: "Run `/setup-daher-skills` first — missing `docs/agents/project-conventions.md`."

## Am I in the right skill?

| Situation | Route to |
|---|---|
| Deliverable review inside a running `execute-tasks` session | The pipeline — it owns those gates |
| Reviewing someone else's PR | `/review` |
| Quick correctness-only bug hunt on the diff | `/code-review` |
| Visual audit of one component/screen only | `refactoring-ui` (Audit) |
| Holistic post-hoc audit of an ad-hoc branch | **This skill** |

## Phase 1 — Scope the Diff

1. **Find the base.** Prefer the `Base Branch` field in the feature's `PROGRESS.md` if one exists; otherwise the base/integration branch from `docs/agents/project-conventions.md`; compute the merge-base: `git merge-base HEAD {base}`.
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
| `/code-review` skill | Always | Correctness bugs — races, null handling, stale closures, silent failures. The agents check conventions/design/tests; nothing else hunts logic bugs |
| `/security-review` skill | Any changed file matches a **security trigger**: auth/authorization, user-input handling, external HTML or URLs, token/PII storage, env access, file paths, external API calls | Vulnerabilities in the changed files only. Auditable rule: it ran **iff** a trigger file changed — say which files matched. If the command is unavailable in this environment, run `quality-reviewer` with `.claude/rules/frontend-security.md` over the trigger files instead and say so in the report |

Give each agent the changed-file list and the base ref — never "review the repo". Ask each to tag findings **TRIVIAL** or **ARCHITECTURAL**.

## Phase 3 — Triage

Process the merged findings per the `receiving-code-review` skill — **verify each finding against the actual code before acting**; reviewers hallucinate. A finding that conflicts with a project rule in `.claude/rules/` is rejected, not applied. Its "Common false positives from AI reviewers" list is the reject-by-default catalog: a finding matching one of those patterns needs codebase-specific evidence to survive triage. For `code-reviewer` output, that evidence is the `Trigger:` / `Why unguarded:` lines its contract requires — an ARCHITECTURAL correctness finding without them is downgraded to `(possible)`. `/code-review` is a built-in with its own format and never carries those lines, so for its findings triage supplies the trigger itself by reading the code; it is never deprioritised for lacking a field it cannot emit.

- **TRIVIAL** (mechanical, no design decision) → auto-fix: dispatch **one** `implementer` agent with the full consolidated list as its task spec — not one dispatch per finding.
- **ARCHITECTURAL** (design/structure/behavior tradeoff) → present each to the user: fix or accept. Dispatch the `implementer` with the approved fixes only.
- **Rejected** → record why (finding vs. code evidence or rule citation) for the report.

## Phase 4 — Re-verify

Fresh evidence per `verification-before-completion.md` — never reuse pre-fix output:

1. The project's test command scoped to every touched feature (e.g. `pnpm vitest run {feature-dir}`) — **0 matched test files = FAIL**, not a pass.
2. The project's build command (e.g. `pnpm build`). If it fails, dispatch one `implementer` under the **build-fix dispatch contract** defined in the `execute-tasks` skill (surgical, no suppression, re-run per fix, BLOCKED after 3 attempts) — a build-fix without that contract becomes a refactor or an `@ts-ignore`.
3. **If fixes were applied**, one re-review pass over the fixed files only (same reviewers, narrowed scope). **Cap: 2 rounds total** — after the second round, stop fixing and report whatever remains.

## Pipeline Mode (called by `execute-tasks`)

When `execute-tasks` delegates its post-execution holistic review here, the loop mechanics are identical (fan-out → triage → fix → fresh re-verify) with these overrides:

- **Scope**: the changed-file list and `Base Branch` handed over from PROGRESS.md — skip Phase 1 discovery.
- **Reviewer set**: `code-reviewer` (cross-deliverable concerns) + `/code-review` (correctness) + `design-reviewer` (only if the feature has visual components). Still parallel, one message.

  `quality-reviewer`/`test-reviewer` are dropped here **only because the per-deliverable
  gates already covered them — verify that against PROGRESS.md rather than assuming it.**
  Any deliverable whose Step 4 gate did not run gets `quality-reviewer` added to this
  fan-out, scoped to its files — and so does **every tier-S deliverable** (`SKIPPED (S)` in
  the Quality column), all of them in one batched `quality-reviewer` dispatch. Left as an
  assumption, a run that lost its Step 4 gates reaches this phase, which skips convention
  review *because it believes it already happened* — those files are never checked against
  `.claude/rules/` at all.
- **Design fix loop**: `design-reviewer` findings triage by priority — 🔴/🟡 auto-fix via `implementer` (for visual ARCHITECTURAL findings, instruct it to invoke the `refactoring-ui` Build workflow before editing JSX; surgical diffs, no behavior change); 🟢 auto-fix in the final fix batch (see Autonomy below — standalone mode presents them instead). After each fix batch, re-dispatch `design-reviewer` on **all** visual components (cross-screen consistency — a fix in one component can break alignment with another). Cap: **3 iterations**, then record what remains in Decisions and report.
- **Autonomy**: pipeline mode never asks mid-loop — it follows `execute-tasks`' Autonomy
  Contract. ARCHITECTURAL findings: **fix** what violates a `.claude/rules/` file or the
  spec (cite which), **accept-and-log** in PROGRESS.md Decisions only for genuine tradeoffs
  neither constrains; when in doubt, fix. Design 🟢 nitpicks: auto-fix them in the final
  fix batch instead of presenting them. Everything decided lands in Decisions and the
  final report. (Standalone mode — a user-invoked `/audit-branch` — keeps its interactive
  asks; the user is present by definition there.)
- **Exit**: skip Phase 5's commit offer — report the findings table + fresh verification back to `execute-tasks`, which records it in PROGRESS.md and continues (commit/PR belongs to `finish-feature`).

## Phase 5 — Report & Next Step

Report with:

1. **Findings table**: source (which reviewer) → severity → status (`fixed` / `accepted` / `rejected` / `remaining`).
2. **Fresh verification output**: actual test counts and build result from Phase 4 — not "should pass".
3. **Overall status**, capped: the audit cannot report better than **CONCERNS** if any of these hold, whatever the findings table says — Phase 4 verification did not run in this session; a `/security-review` trigger matched and the review did not run; any `remaining` ARCHITECTURAL finding; (pipeline mode) any PROGRESS.md gate column still `-` or any deliverable shipped against an `UNVERIFIED` contract. The cap turns four prose rules into one checkable line.

Then use AskUserQuestion to offer:
- **Commit** — via the `git-commit` skill (it owns build-freshness, grouping, message format)
- **More fixes** — user wants to address `accepted`/`remaining` items after all
- **Done** — leave the working tree as is

## Rules

- **Never skip triage verification.** Reviewers hallucinate — every finding is checked against the code before any fix is dispatched.
- **Never auto-fix ARCHITECTURAL findings.** The user decides fix-or-accept, per finding. (Exception: pipeline-mode design 🔴/🟡 — visual-only, no behavior change.)
- **Only correctness- or requirement-affecting gaps are findings.** Reviewers asked to find gaps will find some even in clean work — chasing every one produces abstraction layers, defensive code, and tests for impossible cases. Everything else is optional, not a finding.
- **Fix loops cap at 2 rounds** (3 for the pipeline-mode design loop). Then report what remains — no endless review/fix cycles.
- **Fresh outputs before any claim** (`verification-before-completion.md`). No "tests pass" without the run in this session; no build claims from memory.
