---
name: systematic-debugging
description: Structured 4-phase debugging process — reproduce, isolate, identify root cause, verify with test. Use when user says "debug", "investigate", "figure out why", "root cause", "why is this broken", or has a bug that needs systematic analysis rather than quick fixes.
---

# Systematic Debugging

4-phase root cause process. Each phase has explicit exit criteria — never skip ahead.

**When to use:** Bugs that aren't immediately obvious. If a bug can be fixed by reading one file and spotting the issue, just fix it. This process is for when you need to investigate.

## Phase 1: Reproduce

**Goal:** Get a reliable, minimal reproduction of the bug.

1. Ask the user (or read from context):
   - What happens? (actual behavior)
   - What should happen? (expected behavior)
   - Steps to reproduce (if known)
   - When did it start? (recent change, always been there, intermittent)

2. Find the reproduction:
   - If there's an error message → Grep the codebase for it
   - If there's a failing test → Read it and run it
   - If no test exists → Try to create a minimal one
   - If it's UI-only → Identify the component and its hook

3. Document:
   ```
   **Expected:** {what should happen}
   **Actual:** {what happens}
   **Reproduction:** {steps or test command}
   ```

**Exit criteria:** The bug can be reliably triggered — you can show it happening.

## Phase 2: Isolate

**Goal:** Narrow down WHERE the bug lives using the project's layer architecture.

The project has clear layers. Check them in this order (domain bugs are cheapest to test):

### Layer 1: Domain (pure functions)
- Files: `features/{feature}/domain/*.ts`
- Test: Call the function directly with the reproduction input
- These are pure functions — if the bug is here, it's the easiest to verify and fix

### Layer 2: API / Mappers
- Files: `features/{feature}/api/*.ts`, `*.schemas.ts`
- Test: Check response shapes, Zod parsing, error mapping
- Common bugs: wrong field mapping, missing null handling, schema mismatch

### Layer 3: Hooks (business logic)
- Files: `features/{feature}/hooks/use-*.ts`
- Test: Check query keys, mutation logic, state transitions
- Common bugs: stale closures, wrong dependency arrays, race conditions

### Layer 4: Components (rendering)
- Files: `features/{feature}/components/*.tsx`
- Test: Check conditional rendering, props flow, event handlers
- Common bugs: wrong props passed, missing loading/error states

**Isolation technique:**
- Start at the layer closest to the symptom
- Add assertions or logging at layer boundaries
- Binary search: if the data is correct at layer 2 but wrong at layer 3, the bug is in layer 3
- Each check should take 1-2 minutes — don't spend 10 minutes on one layer

**Exit criteria:** Bug is localized to a specific file and function. You can say: "The bug is in `{file}:{function}` because `{reason}`."

## Phase 3: Identify Root Cause

**Goal:** Understand WHY the bug happens, not just WHERE.

1. Read the isolated function/component carefully
2. Trace the data flow through it — what comes in, what goes out
3. Check common root causes:
   - **Wrong assumption:** Code assumes a value is always present, but it can be null/undefined
   - **Missing edge case:** Code handles the happy path but not this specific input
   - **Stale state:** React hook captures an old value due to closure or missing dependency
   - **Race condition:** Two async operations complete in unexpected order
   - **Type mismatch:** Runtime type differs from TypeScript type (often at API boundary)
   - **Off-by-one:** Index, pagination, or range calculation is wrong
   - **Wrong merge:** Recent change introduced a regression (check git blame)

4. Read existing tests for the isolated area — what IS tested vs what ISN'T?

5. State the root cause in one sentence:
   > "The bug occurs because `{function}` assumes `{assumption}`, but when `{condition}`, the value is actually `{actual}`."

**Exit criteria:** Root cause can be stated in one sentence with specific code references.

## Phase 4: Verify

**Goal:** Prove the fix works and nothing else broke.

1. **Write a failing test** that captures the bug:
   - The test should fail BEFORE the fix and pass AFTER
   - Follow the project's testing conventions (behavioral focus, query priority)
   - Use shared factories if the type appears in 3+ test files

2. **Apply the fix:**
   - Minimal change — fix the root cause, don't refactor surrounding code
   - If the fix requires touching multiple files, list them all before starting

3. **Run the test:** `pnpm vitest run {test-file}`
   - Confirm the new test passes
   - Confirm existing tests still pass

4. **Run the feature tests:** `pnpm vitest run src/new-app/features/{feature}/`
   - No regressions in the feature

5. **Run the build:** `pnpm build`
   - No type errors introduced

**Exit criteria:** New test passes, existing tests pass, build passes.

## Reporting

After each phase, briefly report what you found:

> **Phase 1:** Reproduced — {description}
> **Phase 2:** Isolated to `{file}:{function}`
> **Phase 3:** Root cause — {one sentence}
> **Phase 4:** Fixed — test passes, build passes

## Rules

- **Never skip phases.** A fix without reproduction is a guess. A fix without a test can regress.
- **Never guess.** If you can't reproduce it, say so. If you can't isolate it, ask for help.
- **Minimal fixes.** Fix the root cause. Don't refactor, don't "improve" nearby code.
- **Always verify.** Don't declare victory until the test confirms the fix.
- If Phase 2 takes more than 3 isolation attempts at the same layer, step back and try a different layer.
- If the bug involves runtime state you can't reproduce in tests (e.g., specific API responses, browser-specific behavior), tell the user and ask for guidance.

## Anti-Patterns

- **Shotgun debugging:** Changing random things and seeing if the bug goes away. Never do this.
- **Fix the symptom:** Adding a null check without understanding why the value is null. Find the root cause.
- **Skip the test:** "It works now" without a test means it can break again silently.
- **Blame the framework:** Before assuming React/Next.js/library is buggy, verify your usage is correct.
