---
name: execute-tasks
description: Execute an implementation plan using autonomous subagents. Reads the plan from plan-implementation, dispatches implementer + reviewer agents per deliverable, handles smart triage. Use when user says "execute the plan", "build it", "start implementing", or after plan-implementation completes.
---

# Execute Tasks

Execute an implementation plan by dispatching fresh subagents per deliverable with two-stage review (spec compliance, then code quality).

**Why subagents:** Each agent gets a fresh context with only the task spec and relevant conventions. No context pollution, no convention drift. The orchestrator (you) coordinates — agents implement and review.

## Input

The implementation plan markdown file produced by `plan-implementation`. Read it to extract:
- Ordered list of deliverables with specs
- Dependency order
- File paths per deliverable
- Shared infrastructure items

## Agents

Agents are defined in `.claude/agents/`. Each is dispatched via the Agent tool with task-specific context in the prompt:

| Agent | Purpose | Dispatched when |
|-------|---------|-----------------|
| `implementer` | Implements one deliverable | Every deliverable |
| `spec-reviewer` | Verifies code matches spec | After implementer reports DONE |
| `quality-reviewer` | Checks conventions from `.claude/rules/` | After spec passes |
| `test-reviewer` | Checks test quality | After quality passes, if tests exist |

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

Build the full paths: `{project-root}/.claude/rules/{rule-name}.md`

If a deliverable touches multiple types (e.g., a hook + component), combine the rule sets and deduplicate.

## Design Skill Injection

Visual components (`.tsx` with rendered UI) get two extra skill invocations to enforce Refactoring UI principles:

| Phase | Skill | Why |
|-------|-------|-----|
| Implementer (Step 2) | `refactoring-ui` (Build workflow) | Applies hierarchy / layout / typography / color / depth / polish principles BEFORE writing JSX. Prevents "looks generated" output. |
| Quality reviewer (Step 5) | `refactoring-ui` (Audit workflow) | Audits the built component against the full rule set with prioritized findings (🔴/🟡/🟢). |

**When to inject:**
- ✅ Component deliverables (`.tsx` files with rendered UI)
- ❌ Hooks-only deliverables, pure-logic deliverables, API adapters, type definitions — skip both

Pure layout/wrapper components (e.g., a `<div>` with `className` and `{children}`) may skip the designer skill but should still go through the reviewer at quality gate.

## Step 0: Create Feature Branch

Before starting execution, ensure work happens on an isolated branch:

1. **Check current branch** with `git branch --show-current`
2. **If on `main` or `develop`:** Create and checkout a feature branch:
   ```bash
   git checkout -b feat/{feature-name}
   ```
   Derive `{feature-name}` from the implementation plan title — sanitize to lowercase, hyphens, no special chars.
3. **If already on `feat/*`:** Ask the user: "Already on `{branch}`. Use this branch or create a new one?"
4. **Record in PROGRESS.md:**
   - `**Branch**: feat/{feature-name}`
   - `**Base Branch**: {branch you were on before checkout}`

The base branch is needed later by `finish-feature` for PR creation and merge targets.

## Model Selection

Use the least powerful model that can handle each role to conserve cost and speed.

| Role | Complexity Signal | Recommended Model |
|------|------------------|-------------------|
| implementer | 1-2 files, clear spec, no cross-feature imports | `sonnet` |
| implementer | 3+ files, integration concerns, shared infrastructure | `opus` or inherit |
| spec-reviewer | All tasks | `sonnet` or inherit |
| quality-reviewer | All tasks | `sonnet` or inherit |
| test-reviewer | All tasks | `sonnet` (checklist-based) |

When dispatching via Agent tool, set the `model` parameter based on the above. If an implementer reports BLOCKED with a fast model, re-dispatch with a more capable model before escalating to the user.

## Execution Loop

For each deliverable in implementation order:

### Step 1: Prepare

1. Parse the deliverable spec from the plan (full text block)
2. Identify file paths the deliverable will create or modify
3. Map deliverable type → relevant rule files (see table above)

### Step 2: Implement

Dispatch the `implementer` agent with the deliverable context:

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
    {if deliverable is a visual component:}
    - Invoke /refactoring-ui (Build workflow) BEFORE writing JSX. Read its
      principles.md + tailwind-shadcn-cheatsheet.md, sketch hierarchy
      (primary/secondary/tertiary), pick layout, then generate JSX
      following the cheatsheet patterns. Run its self-review checklist
      before reporting DONE.

    ## Report Requirements
    Your DONE report MUST include the exact test command you ran and its
    pass count, from THIS session (fresh verification — no claim without
    output). A DONE report without fresh test output is not accepted.
```

Only include the "Skills to Invoke" block when the deliverable matches the Design Skill Injection criteria above. Omit entirely for hooks, API adapters, pure logic, types.

### Step 3: Handle Implementer Status

Read the agent's response. Handle based on status:

**DONE** → Proceed to Step 4 (spec review).

**DONE_WITH_CONCERNS** → Log the concerns in PROGRESS.md. Proceed to Step 4. The concerns will be evaluated alongside review results.

**NEEDS_CONTEXT** → Stop execution. Report to user what context is missing. Ask how to proceed. Do NOT re-dispatch without new information.

**BLOCKED** → Stop execution. Report to user what's blocking. Present options:
- Provide more context and retry
- Skip this deliverable and continue
- Modify the plan
- Stop execution

### Step 4: Spec Review

Dispatch the `spec-reviewer` agent:

```
Agent tool:
  description: "Review spec compliance for D{N}"
  prompt: |
    ## Deliverable Spec
    {full deliverable spec from plan}

    ## Implementer's Report
    {the implementer agent's full response}

    ## Files to Review
    {files the implementer reported as changed}
```

**For API-adapter deliverables**, add to the spec-reviewer prompt: verify the Zod schemas match the MSW mock or real API response used in the tests — field names, optionality/nullability, and nesting must agree. Schema/response drift is a recurring bug class in this project.

Handle result:
- **PASS** → Proceed to Step 5 (quality review)
- **CONCERNS** → Report concerns to user. Ask: fix and re-review, or accept and continue?
- **FAIL** → Stop. Report the compliance matrix to user. Ask how to proceed.

### Step 5: Quality Review

Dispatch the `quality-reviewer` agent:

```
Agent tool:
  description: "Review code quality for D{N}"
  prompt: |
    ## Convention Files to Read
    {absolute paths to relevant .claude/rules/ files, one per line}

    ## Files to Review
    {files the implementer changed}

    ## Skills to Invoke
    {if deliverable is a visual component:}
    - Invoke /refactoring-ui (Audit workflow) on each visual component file.
      Read its principles.md + checklist.md, run the full checklist,
      output findings as 🔴 Critical / 🟡 Important / 🟢 Nitpick with
      rule citations. Merge these findings into your quality review
      output. Tag visual findings as ARCHITECTURAL when they affect
      hierarchy/layout (rules 2.x, 3.x), TRIVIAL when they're color
      token or weight cleanup.
```

Only include the "Skills to Invoke" block when the deliverable matches the Design Skill Injection criteria above.

Handle result using **smart triage**:
- **PASS** → Proceed to Step 6 (test review) or mark complete
- **CONCERNS** (only TRIVIAL findings) → Auto-fix: dispatch the `implementer` agent with the list of trivial fixes as the task spec. Then mark complete.
- **FAIL** (ARCHITECTURAL findings) → Report each architectural finding to user. Ask per finding: fix it, or accept it. If user wants fixes, dispatch `implementer` again with the specific fixes as the task spec.

### Step 6: Test Review (optional)

Only run if the deliverable includes test files (check implementer's report for `.test.ts` or `.test.tsx` files).

Dispatch the `test-reviewer` agent:

```
Agent tool:
  description: "Review test quality for D{N}"
  prompt: |
    ## Convention Files to Read
    - {path to .claude/rules/component-hook-separation.md}

    ## Test Files to Review
    {test file paths from implementer's report}

    ## Source Files (for reference)
    {corresponding source files}
```

Handle result:
- **PASS** → Mark deliverable complete
- **CONCERNS** → Log for user awareness, mark complete
- **FAIL** → Report to user. Ask: fix tests, or accept?

### Step 6.5: Commit Checkpoint

After every 2-3 deliverables pass all reviews (and after any single large one), offer a commit checkpoint via the git-commit skill — session mining found multi-day runs carrying ALL work uncommitted in the working tree across dozens of compactions. The user decides; never checkpoint silently.

### Step 7: Mark Complete

Update PROGRESS.md. Move to next deliverable.

## Progress Tracking

Maintain `PROGRESS.md` in the same directory as the implementation plan:

```markdown
# Execution Progress: {Feature Name}
**Started**: {date}
**Plan**: {path to implementation plan}
**Branch**: feat/{feature-name}
**Base Branch**: {branch execution started from}
**Status**: In Progress | Complete | Blocked

## Deliverables

| # | Deliverable | Status | Impl | Spec | Quality | Tests |
|---|-------------|--------|------|------|---------|-------|
| D1 | {name} | DONE | DONE | PASS | PASS | N/A |
| D2 | {name} | DONE | DONE_WITH_CONCERNS | PASS | CONCERNS (1 trivial, auto-fixed) | PASS |
| D3 | {name} | IN_PROGRESS | - | - | - | - |
| D4+ | {name} | PENDING | - | - | - | - |

## Concerns Log
### D2 — Implementer Concern
{concern text}

### D2 — Quality: TRIVIAL (auto-fixed)
{what was fixed}

## Blocked Items
{empty or description}

## Design Review
| Iteration | 🔴 fixed | 🟡 fixed | 🟢 fixed | Result |
|-----------|----------|----------|----------|--------|
| 1 | n | n | n | FINDINGS |
| 2 | n | n | n | PASS |
```

Update this file after EVERY deliverable — it's the resume state if context is cleaned.

## Build Verification

Run `pnpm build` at two checkpoints:

1. **After the final deliverable** passes all reviews (mandatory)
2. **After any shared infrastructure deliverable** (deliverables that modify `shared/`, install packages, or change type definitions)

If the build fails, dispatch the `implementer` agent with the build errors as the task spec — fix type errors before marking complete. Re-run the build after fixes.

Do NOT run build after every single deliverable — it's slow. The two checkpoints above catch issues early enough.

## Post-Execution: Code Review + Design Review + User Flow Verification

After ALL deliverables are complete and the final build passes:

### Code Review

Dispatch the `code-reviewer` agent on the full feature diff:

```
Agent tool:
  description: "Holistic code review for {feature-name}"
  prompt: |
    Review all files changed during this feature implementation.

    ## Convention Files to Read
    {absolute paths to ALL .claude/rules/ files}

    ## Files to Review
    {all files changed across all deliverables, from PROGRESS.md}
```

**Also run the built-in `/code-review` skill** on the feature diff, alongside the code-reviewer agent. The agent suite checks spec, conventions, and tests — but nothing in it hunts logic bugs. `/code-review` covers correctness: race conditions, null handling, stale closures. Merge its findings into the same triage below.

Handle findings using smart triage:
- **TRIVIAL** → Auto-fix by dispatching implementer
- **ARCHITECTURAL** → Report to user, ask: fix or accept?

Process findings per the `receiving-code-review` skill — verify each finding against the codebase before implementing; a finding that conflicts with a project rule is rejected, not applied.

### Final Design Review & Polish

Run **only if the feature produced visual components** (`.tsx` with rendered UI). Runs once, holistically, after Code Review passes. Catches **cross-screen** problems — inconsistent spacing/typography/hierarchy/color across the whole feature — that the per-deliverable `refactoring-ui` audit at the quality gate cannot see because it audits one component in isolation.

**1. Audit.** Dispatch the `design-reviewer` agent on every visual component in the feature:

```
Agent tool:
  description: "Holistic design review for {feature-name}"
  prompt: |
    Audit the design of all visual components built in this feature.

    ## Design rule files to read
    {absolute paths to .claude/rules/: color-usage, design-system-map, layout-ownership, accessibility}

    ## Visual component files to review (from PROGRESS.md)
    {ALL .tsx files with rendered UI built in this feature}

    ## Skill to invoke
    - Invoke /refactoring-ui (Audit workflow). Read its principles.md + checklist.md,
      run the full checklist ACROSS ALL components holistically, and output
      findings as 🔴 Critical / 🟡 Important / 🟢 Nitpick with rule citations
      and file:line. Tag each ARCHITECTURAL or TRIVIAL.

    ## Focus
    - Prioritize CROSS-SCREEN inconsistencies (spacing/typography/hierarchy/color
      drift between components). Do NOT re-litigate single-component findings already
      resolved at the quality gate.
```

**2. Triage-aligned fix loop** (mirrors the quality gate — capped at **3 iterations**):
- **🔴 Critical / 🟡 Important** → auto-fix: dispatch the `implementer` agent with the findings as the task spec. For ARCHITECTURAL/visual findings, instruct it to **invoke `/refactoring-ui` (Build workflow)** before editing JSX (re-derive hierarchy/layout, then apply the cheatsheet patterns). Keep the diff surgical — visual treatment only, no behavior change. Preserve i18n keys, design tokens (no raw Tailwind colors), and update Storybook stories if states change.
- **🟢 Nitpick** → do **not** auto-fix. Accumulate across iterations and present them to the user **once** at the end: "N nitpicks found — fix all or accept?" Apply only what the user accepts.

**3. Re-review (holistic).** After each batch of fixes, re-dispatch the `design-reviewer` on **all visual components again** (not just the changed files — the point is cross-screen consistency, and a fix to one component can break alignment with another). Repeat steps 2–3 until **PASS** (zero 🔴/🟡) or the **3-iteration cap** is hit.

**4. Cap reached.** If iteration 3 still returns 🔴/🟡, **stop the loop** and report the remaining findings to the user — do not keep looping. Ask: keep iterating, fix manually, or accept.

**5. Build check.** Run `pnpm build` after the design fixes (visual changes can introduce type errors via prop changes). If it fails, dispatch `implementer` with the build errors before continuing.

**6. Update `PROGRESS.md`** — add the "Design Review" table (iterations run, findings fixed by 🔴/🟡/🟢, final result).

### User Flow Verification

After code review, walk through each user flow from the UX spec:

1. Read the UX spec to identify all user flows
2. For each flow, trace through the code:
   - Does the component exist?
   - Is the hook wired and exporting the right data?
   - Is the route registered in centralized links?
   - Are loading, error, and empty states handled?
   - Does the data flow from API → hook → component correctly?
3. Present findings to user with concrete examples:

> "Verified 3 user flows:
> - Flow 1 (FM creates reservation): All components wired, route works
> - Flow 2 (Driver views reservation): Missing empty state for no assignments
> - Flow 3 (Error handling): Network error shows notification correctly
>
> Flow 2 has a gap. Fix or accept?"

Only report issues — don't list every passing check.


## Continuous Execution

Do NOT ask user permission between deliverables. Run continuously. Only stop for:
- BLOCKED or NEEDS_CONTEXT from implementer
- FAIL from spec reviewer
- ARCHITECTURAL findings from quality reviewer
- FAIL from test reviewer (if user hasn't said to accept)
- 🟢 nitpicks pending user decision in the final design review
- Final design review hit its 3-iteration cap with 🔴/🟡 remaining
- User interruption
- Context above 80% (mandatory pause)

## Resuming After Context Clean

If the user says "resume" or "continue executing":
1. Find the most recent `PROGRESS.md` under the features root defined in `.claude/rules/project-structure.md`
2. Read the implementation plan it references
3. Find the first deliverable with status != DONE
4. Continue the loop from that deliverable

## Edge Cases

**Deliverable depends on a previous one that failed:** Skip it, mark as BLOCKED with reason "depends on D{N} which failed". Continue to the next independent deliverable if one exists.

**All remaining deliverables are blocked:** Stop execution. Report the full status to user.

**Implementer modifies files outside scope:** The spec reviewer should catch this as "extras found". Report to user.

## Rules

- Create a feature branch before execution starts if not already on one
- Record branch name and base branch in PROGRESS.md
- Never modify the implementation plan — it's the source of truth
- Never skip the spec review — every deliverable gets reviewed
- Quality review only runs after spec passes
- Test review only runs when test files exist
- Always update PROGRESS.md before moving to the next deliverable
- Run build verification after final deliverable and after shared infra changes
- Run holistic code review + user flow verification after all deliverables complete
- Run the final holistic design review after code review when the feature has visual components — triage-aligned (auto-fix 🔴/🟡, ask once on 🟢), holistic re-review each round, capped at 3 iterations
- Always ask user before committing (respect existing user feedback)
- Run `pnpm build` before any commit (respect existing user feedback)
- Use model selection to optimize cost — sonnet for simple tasks, opus for complex
