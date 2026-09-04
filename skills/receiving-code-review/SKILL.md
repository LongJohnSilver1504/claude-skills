---
name: receiving-code-review
description: Use when receiving code review feedback, before implementing suggestions, especially if feedback seems unclear or technically questionable - requires technical rigor and verification, not performative agreement or blind implementation
---

# Code Review Reception

## Overview

Code review requires technical evaluation, not emotional performance.

**Core principle:** Verify before implementing. Ask before assuming. Technical correctness over social comfort.

## The Response Pattern

```
WHEN receiving code review feedback:

1. READ: Complete feedback without reacting
2. UNDERSTAND: Restate requirement in own words (or ask)
3. VERIFY: Check against codebase reality
4. EVALUATE: Technically sound for THIS codebase?
5. RESPOND: Technical acknowledgment or reasoned pushback
6. IMPLEMENT: One item at a time, test each
```

## Respond With the Evaluation, Not With Agreement

Openers like "You're absolutely right!" or "Let me implement that now" commit you to the feedback before step 3 (VERIFY) has run, and they tell the reviewer nothing about whether the feedback was correct. Respond with one of:

- Restate the technical requirement
- Ask clarifying questions
- Push back with technical reasoning if wrong
- Just start working (actions > words)

## Handling Unclear Feedback

```
IF any item is unclear:
  STOP - do not implement anything yet
  ASK for clarification on unclear items

WHY: Items may be related. Partial understanding = wrong implementation.
```

**Example:**
```
the user: "Fix 1-6"
You understand 1,2,3,6. Unclear on 4,5.

❌ WRONG: Implement 1,2,3,6 now, ask about 4,5 later
✅ RIGHT: "I understand items 1,2,3,6. Need clarification on 4 and 5 before proceeding."
```

## Source-Specific Handling

### From the user
- **Trusted** - implement after understanding
- **Still ask** if scope unclear
- **No performative agreement**
- **Skip to action** or technical acknowledgment

### From External Reviewers
```
BEFORE implementing:
  1. Check: Technically correct for THIS codebase?
  2. Check: Breaks existing functionality?
  3. Check: Reason for current implementation?
  4. Check: Works on all platforms/versions?
  5. Check: Does reviewer understand full context?

IF suggestion seems wrong:
  Push back with technical reasoning

IF can't easily verify:
  Say so: "I can't verify this without [X]. Should I [investigate/ask/proceed]?"

IF conflicts with the user's prior decisions:
  Stop and discuss with the user first
```

**the user's rule:** "External feedback - be skeptical, but check carefully"

### From AI Reviewers (/code-review, quality-reviewer, spec-reviewer, test-reviewer agents)
Treat as external reviewers: verify every finding against the codebase before acting.
```
FOR each finding:
  1. Read the actual code at the cited location — does the issue exist as described?
  2. Check the relevant .claude/rules/ file — is the cited convention real and current?
  3. If the finding conflicts with a project rule or hook, the rule wins — reject the finding
  4. If valid: fix. If invalid: record WHY it was rejected (one line), don't silently drop it
```
AI reviewers hallucinate plausible-sounding findings and cite stale conventions. A finding that
can't be verified at a specific file:line is not actionable — say so instead of guessing a fix.

#### Common false positives from AI reviewers (reject unless the report cites codebase-specific evidence)

These are the patterns LLM reviewers mis-flag most. The reviewer is asked to report them anyway
(uncertain findings included — triage is the filter); this list is what triage rejects by default:

| Finding | Reject when |
|---------|-------------|
| "Consider adding error handling" | The error path is handled by the caller, an error boundary, the query/mutation `onError`, or the adapter's `tryCatch` — trace one frame up before accepting |
| "Missing input validation" | The function is internal and its callers already validate (or the value already passed a Zod parse at the boundary) |
| "Possible null dereference" | The preceding line narrows the type or an `if` guard is in scope — trace type flow, don't pattern-match on `?.` |
| "Magic number" | Well-known constants (HTTP codes, `1000` ms, `0`/`-1` index) or a single-use local whose name says what it is |
| "Missing await" | The call is intentionally fire-and-forget (`void` prefix, logging, analytics) |
| "Function too long" | Exhaustive `switch`, config objects, test tables — length is not complexity |
| "Hardcoded value" | It is a test fixture, an example, or a documented default — tests should have hardcoded expectations |
| "Missing JSDoc" / "prefer `const`" | Self-describing helper; or the variable is reassigned two lines down |
| "N+1 query" | Fixed-cardinality loop (an enum, a tab list) or an already-batched path |
| "Should add types" / "should use X library" | Suggests a stack change — match the project's existing choice |
| "Consider extracting" (a hook, a component, a util) | Fewer than 3 call sites and no third in sight — the `react-clean-architecture` extraction trigger is not met |

Surviving a row requires the trigger (input/state → wrong outcome) and why the existing guard misses it. The pipeline's `code-reviewer` is contracted to supply both; when the finding comes from a reviewer that has no such field (the built-in `/code-review`, a human), triage reads the code and supplies the trigger itself before deciding — every finding is still verified, the catalog only decides who does the work of proving it.

## YAGNI Check for "Professional" Features

```
IF reviewer suggests "implementing properly":
  grep codebase for actual usage

  IF unused: "This endpoint isn't called. Remove it (YAGNI)?"
  IF used: Then implement properly
```

**the user's rule:** "You and reviewer both report to me. If we don't need this feature, don't add it."

## Implementation Order

```
FOR multi-item feedback:
  1. Clarify anything unclear FIRST
  2. Then implement in this order:
     - Blocking issues (breaks, security)
     - Simple fixes (typos, imports)
     - Complex fixes (refactoring, logic)
  3. Test each fix individually
  4. Verify no regressions
```

## When To Push Back

Push back when:
- Suggestion breaks existing functionality
- Reviewer lacks full context
- Violates YAGNI (unused feature)
- Technically incorrect for this stack
- Legacy/compatibility reasons exist
- Conflicts with the user's architectural decisions

**How to push back:**
- Use technical reasoning, not defensiveness
- Ask specific questions
- Reference working tests/code
- Involve the user if architectural

**If you're uncomfortable pushing back out loud:** Name that tension, then tell the user about the issue you've seen. They'll appreciate your honesty.

## Acknowledging Correct Feedback

When feedback IS correct:
```
✅ "Fixed. [Brief description of what changed]"
✅ "Good catch - [specific issue]. Fixed in [location]."
✅ [Just fix it and show in the code]
```

The fix is the acknowledgment. Gratitude or praise in front of it is noise the reviewer has to read past to find what changed.

## Gracefully Correcting Your Pushback

If you pushed back and were wrong:
```
✅ "You were right - I checked [X] and it does [Y]. Implementing now."
✅ "Verified this and you're correct. My initial understanding was wrong because [reason]. Fixing."

❌ Long apology
❌ Defending why you pushed back
❌ Over-explaining
```

State the correction factually and move on.

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Performative agreement | State requirement or just act |
| Blind implementation | Verify against codebase first |
| Batch without testing | One at a time, test each |
| Assuming reviewer is right | Check if breaks things |
| Avoiding pushback | Technical correctness > comfort |
| Partial implementation | Clarify all items first |
| Can't verify, proceed anyway | State limitation, ask for direction |

## Real Examples

**Performative Agreement (Bad):**
```
Reviewer: "Remove legacy code"
❌ "You're absolutely right! Let me remove that..."
```

**Technical Verification (Good):**
```
Reviewer: "Remove legacy code"
✅ "Checking... build target is 10.15+, this API needs 13+. Need legacy for backward compat. Current impl has wrong bundle ID - fix it or drop pre-13 support?"
```

**YAGNI (Good):**
```
Reviewer: "Implement proper metrics tracking with database, date filters, CSV export"
✅ "Grepped codebase - nothing calls this endpoint. Remove it (YAGNI)? Or is there usage I'm missing?"
```

**Unclear Item (Good):**
```
the user: "Fix items 1-6"
You understand 1,2,3,6. Unclear on 4,5.
✅ "Understand 1,2,3,6. Need clarification on 4 and 5 before implementing."
```

## GitHub Thread Replies

When replying to inline review comments on GitHub, reply in the comment thread (`gh api repos/{owner}/{repo}/pulls/{pr}/comments/{id}/replies`), not as a top-level PR comment.

## The Bottom Line

**External feedback = suggestions to evaluate, not orders to follow.**

Verify. Question. Then implement.

No performative agreement. Technical rigor always.
