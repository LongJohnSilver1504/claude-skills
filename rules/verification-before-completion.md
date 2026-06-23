# Verification Before Completion

> **Scope:** All agents and skills in `src/`. Applies to any claim that code works, tests pass, or a task is done.

No completion claims without fresh verification evidence. If you have not run the verification command in THIS response, you cannot claim it passes.

## The Iron Law

**Before claiming any status (DONE, tests pass, build succeeds, bug fixed), you must:**

1. **Identify** the command that proves the claim
2. **Run** it fresh — not from a previous run, not from memory
3. **Read** the full output
4. **Verify** the output confirms the claim
5. **Only then** make the claim

## Verification Mapping

| Claim | Required Proof |
|-------|---------------|
| "Tests pass" | `pnpm vitest run {path}` output showing 0 failures |
| "Build passes" | `pnpm build` output showing exit 0 |
| "Bug is fixed" | Test of original symptom passing |
| "Agent completed successfully" | Read the actual changed files — do not trust the agent's self-report alone |
| "No type errors" | `pnpm build` output (TypeScript runs during build) |

## Red Flags

Never use these phrases without running the verification first:

- "should pass"
- "should work"
- "probably works"
- "tests are likely passing"
- "I believe this is correct"
- Expressing satisfaction or confidence before running commands

## What This Means in Practice

**For the implementer agent:** Re-run tests fresh before reporting DONE. Include the actual test command and result count in the report. "Tests pass" without output is not DONE.

**For the orchestrator (execute-tasks):** When an agent reports DONE, the spec-reviewer reads the actual code. Don't propagate unverified claims.

**For finish-feature:** Run `pnpm build` and tests before offering commit/PR options. Report actual results, not assumptions.
