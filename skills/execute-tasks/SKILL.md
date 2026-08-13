---
name: execute-tasks
description: Execute an implementation plan using autonomous subagents. Reads the plan from plan-implementation, dispatches implementer + reviewer agents per deliverable, handles smart triage. Use when user says "execute the plan", "build it", "start implementing", or after plan-implementation completes.
---

# Execute Tasks

Execute an implementation plan by dispatching fresh subagents per deliverable with parallel review gates (spec compliance, code quality, test quality).

**Why subagents:** Each agent gets a fresh context with only the task spec and relevant conventions. No context pollution, no convention drift. The orchestrator (you) coordinates — agents implement and review, and their reports come back condensed (findings only, ≤120 lines) so this session's context stays lean.

**Project commands** (build, test, package manager) come from `docs/agents/project-conventions.md`. If it or `.claude/rules/` is missing, stop: "Run `/setup-daher-skills` first — missing `<file>`."

## Input

The implementation plan markdown file produced by `plan-implementation`. Read it to extract:
- Ordered list of deliverables with specs
- Dependency order
- File paths per deliverable
- Shared infrastructure items

## Agents

Agents are dispatched via the Agent tool with task-specific context in the prompt. Reviewer `tools:` and `model:` are fixed in their frontmatter — do not override them at dispatch:

| Agent | Purpose | Dispatched when |
|-------|---------|-----------------|
| `implementer` | Implements one deliverable | Every deliverable |
| `spec-reviewer` | Verifies code matches spec | After implementer reports DONE — in parallel |
| `quality-reviewer` | Checks conventions from `.claude/rules/` | After implementer reports DONE — in parallel |
| `test-reviewer` | Runs + checks test quality | After implementer reports DONE, if tests exist — in parallel |
| `code-reviewer` / `design-reviewer` | Holistic post-execution review | Via the `audit-branch` skill's pipeline mode (see Post-Execution) |

## Rule File Mapping

Determine which `.claude/rules/` files are relevant for each deliverable based on what it touches:

| Deliverable touches | Rules to inject |
|---------------------|----------------|
| Components (.tsx) | component-hook-separation, react-components, layout-ownership, accessibility, color-usage, design-system-map |
| Hooks (use-*.ts) | component-hook-separation, tanstack-query, error-handling |
| API adapters (*.api.ts) | error-handling, centralized-links |
| Forms | form-patterns |
| Domain / pure logic | project-structure |
| Routes / links | centralized-links |
| Any new files | project-structure, package-manager |

Build the full paths: `{project-root}/.claude/rules/{rule-name}.md`. If a deliverable touches multiple types, combine the rule sets and deduplicate.

## Design Skill Injection

Visual components (`.tsx` with rendered UI) get the `refactoring-ui` skill injected:

- **Implementer (Step 2):** invoke `refactoring-ui` (Build workflow) BEFORE writing JSX — prevents "looks generated" output.
- **Quality reviewer (Step 4):** invoke `refactoring-ui` (Audit workflow) on each visual component, merging findings into the quality report.

Inject only for component deliverables with rendered UI. Skip for hooks-only, pure-logic, API adapters, and type definitions. Pure layout wrappers (a `<div>` with `className` and `{children}`) may skip the Build injection but still get the Audit at review.

## Step 0: Create Feature Branch

1. Check current branch with `git branch --show-current`
2. If on the base/integration branch (from `docs/agents/project-conventions.md`): `git checkout -b feat/{feature-name}` (derive the name from the plan title — lowercase, hyphens)
3. If already on `feat/*`: ask the user — use it or create a new one?
4. Record in PROGRESS.md: `**Branch**` and `**Base Branch**` (needed later by `finish-feature` and `audit-branch`)

**Done when:** `git branch --show-current` prints a feature branch and PROGRESS.md records both branch fields.

## Model Selection (implementer only)

Reviewers carry their model in frontmatter. For the implementer, pass `model` at dispatch:

| Complexity signal | Model |
|------------------|-------|
| 1-2 files, clear spec, no cross-feature imports | `sonnet` |
| 3+ files, integration concerns, shared infrastructure | `opus` or inherit |

If an implementer reports BLOCKED with a fast model, re-dispatch once with a more capable model before escalating to the user.

## Execution Loop

For each deliverable in implementation order:

Deliverables the plan marks independent **may** be implemented concurrently — fanning out
several `implementer` agents at once is the whole reason a 29-deliverable feature finishes
in an afternoon. What is not optional is the **join**:

> **Every `implementer` that returns triggers its own Step 4 immediately, for its own
> deliverable, without waiting for its siblings.** A deliverable is not complete until its
> `Spec` / `Quality` / `Tests` columns in PROGRESS.md hold a real result. **Do not enter
> Post-Execution while any row still shows `-` in a gate column.**

This is stated as an invariant rather than a sequencing rule because the invariant is
auditable after the fact and a rule about ordering is not. It is also the exact thing that
broke: measured over four real runs, 78 deliverables produced 16 spec reviews. One run
dispatched six implementers in 105 seconds and then, with six reports in flight and no
defined join, degraded to a single reviewer covering six deliverables — and from there to
no reviewers at all for 19 consecutive deliverables, leaving only the closing
`audit-branch` pass. Nothing looked wrong at any point.

So: fan out freely across independent deliverables, but track them individually. If you
cannot say which gate result belongs to which deliverable, you have fanned out wider than
you can join, and the fix is a narrower batch — not a skipped gate.

### Step 1: Prepare

1. Parse the deliverable spec from the plan (full text block)
2. Identify file paths the deliverable will create or modify
3. Map deliverable type → relevant rule files (see table above)

**Done when:** you hold the spec text, the target paths, and the rule-file list for this deliverable.

### Step 2: Implement

Dispatch the `implementer` agent:

```
Agent tool:
  description: "Implement D{N}: {deliverable name}"
  prompt: |
    ## Deliverable Spec
    {full deliverable spec from plan}

    ## Convention Files to Read
    {absolute paths to relevant .claude/rules/ files, one per line}

    ## Files to Work With
    {target file paths}

    ## Skills to Invoke
    {only for visual components:}
    - Invoke the refactoring-ui skill (Build workflow) BEFORE writing JSX. Sketch
      hierarchy (primary/secondary/tertiary), pick layout, then generate JSX
      following its cheatsheet patterns. Run its self-review checklist before
      reporting DONE.

    ## Report Requirements
    Your DONE report MUST include the exact test command you ran and its
    pass count, from THIS session (fresh verification — no claim without
    output). A DONE report without fresh test output is not accepted.
```

**Done when:** the agent's report is back with a status and (for DONE) fresh verification output quoted in it.

### Step 3: Handle Implementer Status

- **DONE** → Step 4.
- **DONE_WITH_CONCERNS** → log concerns in PROGRESS.md, proceed to Step 4; evaluate alongside review results.
- **NEEDS_CONTEXT** → stop. Report what's missing, ask the user. Never re-dispatch without new information.
- **BLOCKED** → stop. Report; offer: provide context and retry / skip deliverable / modify plan / stop.

### Step 4: Review Gates (parallel, one message)

**Every deliverable gets a spec review. There is no throughput reason that justifies
skipping this, no batching one reviewer across several deliverables, and no deferring it
to the closing `audit-branch` pass** — that pass looks for cross-deliverable consistency,
not spec compliance, so a deliverable that misses this gate is never checked against its
spec at all. If you are about to move on without dispatching these, you have left the
loop.

Dispatch ALL applicable reviewers for **this one deliverable** **concurrently in a single message** — they are independent and read-only:

```
Agent tool (spec-reviewer):
  description: "Review spec compliance for D{N}"
  prompt: |
    ## Deliverable Spec
    {full deliverable spec from plan}

    ## Implementer's Report
    {the implementer agent's full response}

    ## Files to Review
    {files the implementer reported as changed}

    {for API-adapter deliverables, add:}
    Verify the Zod schemas match the MSW mock or real API response used in
    the tests — field names, optionality/nullability, and nesting must agree.
    Schema/response drift is a recurring bug class.

Agent tool (quality-reviewer):
  description: "Review code quality for D{N}"
  prompt: |
    ## Convention Files to Read
    {absolute paths to relevant .claude/rules/ files, one per line}

    ## Files to Review
    {files the implementer changed}

    ## Skills to Invoke
    {only for visual components:}
    - Invoke the refactoring-ui skill (Audit workflow) on each visual component.
      Merge its findings into your report: ARCHITECTURAL when they affect
      hierarchy/layout (rules 2.x, 3.x), TRIVIAL for token/weight cleanup.

Agent tool (test-reviewer — only if the deliverable includes test files):
  description: "Review test quality for D{N}"
  prompt: |
    ## Convention Files to Read
    - {path to .claude/rules/component-hook-separation.md}

    ## Test Files to Review
    {test file paths from implementer's report}

    ## Source Files (for reference)
    {corresponding source files}
```

Triage the merged results (spec dominates):

- **spec FAIL** → stop. Report the compliance matrix; ask how to proceed. Quality/test findings wait until spec is resolved.
- **spec CONCERNS** → report; ask: fix and re-review, or accept and continue?
- **quality/test CONCERNS (only TRIVIAL findings)** → auto-fix: dispatch ONE `implementer` with the consolidated trivial-fix list as its task spec.
- **quality/test FAIL (ARCHITECTURAL findings)** → report each finding; ask per finding: fix or accept. Dispatch `implementer` with approved fixes only.
- **all PASS** → Step 5.

**The fix→re-review cycle caps at 2 rounds per deliverable** (mirroring `audit-branch`'s
holistic cap). A trivial fix that spawns new findings twice is not trivial — after round 2,
present what remains to the user as if it were ARCHITECTURAL instead of dispatching a third
implementer.

**Done when:** every dispatched reviewer returned a Status, and any fixes were applied and re-verified.

### Step 5: Commit Checkpoint

After every 2-3 deliverables pass all reviews (and after any single large one), offer a commit checkpoint via the `git-commit` skill — multi-day runs have carried ALL work uncommitted across dozens of compactions. The user decides; never checkpoint silently.

### Step 6: Mark Complete

Update PROGRESS.md (format: [references/PROGRESS-FORMAT.md](references/PROGRESS-FORMAT.md)) — deliverable statuses, concerns log, files changed. Move to the next deliverable.

Write this row as soon as **this** deliverable's gates return, even if siblings from the
same fan-out are still running. The table is the join ledger; filling it in batches at the
end is how gate results get attributed to the wrong deliverable, or lost.

**Done when:** this deliverable's row carries a real result in `Impl`, `Spec`, `Quality` and
`Tests` — no `-` left behind.

## Build Verification

Run the project's build at two checkpoints:

1. **After the final deliverable** passes all reviews (mandatory)
2. **After any shared infrastructure deliverable** (modifies `shared/`, installs packages, or changes type definitions)

If the build fails, dispatch the `implementer` with the build errors as the task spec, then re-run. Do NOT build after every deliverable — the two checkpoints catch issues early enough.

## Post-Execution: Holistic Review

**Entry check first — read the PROGRESS.md deliverable table and confirm no row has `-` in
`Spec`, `Quality` or `Tests`.** Any row that does never cleared its Step 4; give it its
gates now, before this phase, or hand the gap to `audit-branch` explicitly (below). This
phase looks for cross-deliverable concerns and *assumes* the per-deliverable gates ran — an
unchecked deliverable arriving here is never checked against its spec by anything.

Then, with all deliverables complete and the final build passing, run the **`audit-branch`
skill in pipeline mode** — it owns the shared review loop (parallel reviewer fan-out,
finding triage per `receiving-code-review`, implementer fix dispatch, fresh re-verification,
iteration caps). Pass it:

- The changed-file list and Base Branch from PROGRESS.md
- Pipeline-mode reviewer set: `code-reviewer` (cross-deliverable concerns) + `/code-review` (correctness bugs) + `design-reviewer` (only if the feature has visual components)
- **Any deliverable whose Step 4 gate did not run**, by name — pipeline mode drops
  `quality-reviewer`/`test-reviewer` on the assumption those gates already passed, so it has
  to be told when that is untrue

When the loop finishes, record its results in PROGRESS.md (Post-Execution Review table) and return here — the commit/PR offer belongs to `finish-feature`, not the audit.

### User Flow Verification

After the review loop, walk each user flow from the UX spec through the code:

1. Read the UX spec to identify all user flows
2. For each flow, trace: component exists → hook wired → route registered in centralized links → loading/error/empty states handled → data flows API → hook → component
3. Report only gaps, with concrete examples ("Flow 2: missing empty state for no assignments. Fix or accept?")

**Done when:** every flow in the UX spec has been traced and each gap has a user decision.

## Continuous Execution

Do NOT ask user permission between deliverables. Run continuously. Only stop for:

- BLOCKED or NEEDS_CONTEXT from implementer
- spec-reviewer FAIL
- ARCHITECTURAL findings awaiting a user decision
- The audit-branch loop hit its iteration cap with findings remaining
- User interruption
- Context above 80% (mandatory pause — update PROGRESS.md first)

Projects that opted into the Iron-Law Stop hook (`.claude/iron-law.json`, seeded by `/setup-daher-skills`) get a mechanical gate on top of this: the turn cannot end with modified source files until the project's verify command passes.

## Resuming After Context Clean

If the user says "resume" or "continue executing": find the most recent PROGRESS.md under the features root (`.claude/rules/project-structure.md`), read the plan it references, and continue the loop from the first deliverable with status != DONE.

## Edge Cases

- **Deliverable depends on a failed one:** mark BLOCKED ("depends on D{N} which failed"), continue with the next independent deliverable.
- **All remaining deliverables blocked:** stop, report full status.
- **Implementer modified files outside scope:** the spec-reviewer flags it as "extras found" — report to user.

## Rules

- Create a feature branch before execution starts; record branch + base branch in PROGRESS.md
- Never modify the implementation plan — it's the source of truth
- Never skip the spec review — every deliverable gets reviewed (stated at Step 4 too, where
  it is actually load-bearing; this list is read once and the loop is read many times)
- Independent deliverables may be implemented concurrently, but each one joins to its own
  Step 4 and its own PROGRESS.md row — no gate column may stay `-` (see Execution Loop)
- Dispatch the per-deliverable reviewers in parallel, in one message
- Update PROGRESS.md before moving to the next deliverable
- Run build verification after the final deliverable and after shared-infra changes
- Post-execution holistic review goes through `audit-branch` pipeline mode — never re-implement its loop here
- Always ask the user before committing; ensure a fresh successful build before any commit (the plugin's `check-build-before-commit` hook enforces staleness)
- Use implementer model selection to optimize cost — sonnet for simple tasks, opus for complex
