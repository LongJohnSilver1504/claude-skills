---
name: tdd
description: Opt-in RED-GREEN-REFACTOR test-driven development cycle. Strict discipline — write failing test first, minimal code to pass, then refactor. Use when user says "TDD", "test first", "red green refactor", or wants test-driven implementation for critical logic.
---

# Test-Driven Development

Strict RED-GREEN-REFACTOR cycle. Opt-in — use for critical logic, not for everything.

## When to Use

**Good candidates for TDD:**
- Domain services (`domain/*.service.ts`) — pure functions with clear inputs/outputs
- API mappers and Zod schemas (`api/*.schemas.ts`) — trust boundary validation
- Complex hooks with branching logic (`hooks/use-*.ts`) — multiple code paths
- Form validation schemas — business rules that must be correct
- State machines and condition logic — transitions that must be exhaustive

**Skip TDD for:**
- UI layout and styling
- Simple pass-through components with no logic
- Exploratory/prototyping code (spec still changing)
- Thin wrapper components
- i18n files, route definitions, config

## The Cycle

### RED: Write a Failing Test

1. Write ONE test that describes the next behavior to implement
2. The test name should describe what the user/developer experiences:
   - Good: `"returns expired state when end time is in the past"`
   - Bad: `"sets isExpired to true"`
3. Run the test:
   ```bash
   pnpm vitest run {test-file}
   ```
4. **Confirm it FAILS.** If it passes, either:
   - The feature already exists (you're done with this behavior)
   - The test is wrong (it's not testing what you think)

### GREEN: Write Minimal Code

5. Write the **minimum** code to make the test pass
   - Don't write the "right" solution yet — write the simplest thing that works
   - Don't handle edge cases that aren't tested yet
   - Don't add infrastructure "you'll need later"
6. Run the test:
   ```bash
   pnpm vitest run {test-file}
   ```
7. **Confirm it PASSES.** If it fails, fix the code (not the test).

### REFACTOR: Clean Up

8. Now improve the code — extract functions, rename variables, remove duplication
9. Run ALL tests for this file to confirm nothing broke:
   ```bash
   pnpm vitest run {test-file}
   ```
10. If the refactor is non-trivial (changing function signatures, extracting modules), briefly tell the user what you're doing

### REPEAT

11. Identify the next behavior to implement
12. Go back to RED

## Cycle Cadence

Each RED-GREEN-REFACTOR cycle should be short:
- RED: 1-3 minutes (write one test)
- GREEN: 1-5 minutes (write minimal code)
- REFACTOR: 0-3 minutes (clean up)

If GREEN takes more than 5 minutes, the test covers too much. Break it into smaller behaviors.

## Test Conventions

Follow the project's testing patterns:
- Query priority: `getByRole` > `getByLabelText` > `getByText` > `getByTestId`
- Behavioral assertions — test what the user sees, not internal state
- Shared factories for domain types used in 3+ test files
- All `userEvent` calls `await`ed
- No CSS value assertions
- No snapshot tests for styled components

## Commit Pattern

After each GREEN (or after a batch of cycles), pause and ask:

> "Cycle complete: {behavior}. Commit this, or continue to next behavior?"

Respect the user's commit granularity preference. Some users want to commit after every cycle, others want to batch.

Always run `pnpm build` before committing.

## Example Session

```
TDD for: computeBayCategory(reservation)

RED: Test "returns 'active' when reservation is in progress and not overstaying"
  → test fails (function doesn't exist yet)

GREEN: Create computeBayCategory, return 'active' for in-progress reservations
  → test passes

REFACTOR: none needed yet

RED: Test "returns 'overstay' when end time is past and no grace period"
  → test fails (no overstay logic)

GREEN: Add overstay check
  → test passes

REFACTOR: Extract time comparison to helper

RED: Test "returns 'upcoming' when start time is in the future"
  → test fails

GREEN: Add upcoming check
  → test passes

REFACTOR: Reorder conditions for clarity

...continue until all behaviors are covered
```

## Rules

- **Never write production code before a failing test.** If you catch yourself writing code first, stop, delete it, write the test.
- **Never write more than one test at a time.** One test → one behavior → one cycle.
- **The test drives the design.** If a function is hard to test, that's a design signal — simplify the interface.
- **Minimal code in GREEN.** The temptation to write the "full" solution is strong. Resist it. The next test will drive the next piece.
- **Refactor is optional per cycle.** If the code is clean after GREEN, skip REFACTOR.
- **Don't test private/internal methods.** Test the public interface. Internal methods emerge during REFACTOR.
