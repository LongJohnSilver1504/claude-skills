---
name: generate-test-plan
description: Generate a test plan from a UX spec. Produces a test matrix with interaction tests, state tests, and edge cases that the frontend-testing skill consumes. Use after prd-to-ux and before plan-implementation.
---

# Generate Test Plan

## Overview

Extract testable scenarios from a UX specification and produce a structured test matrix. This skill reads the UX spec (especially Passes 3, 5, and 6) and outputs a test plan that the `/frontend-testing` skill later implements.

**Position in pipeline:** `prd-to-ux` → **generate-test-plan** → `plan-implementation`

## Input

The UX spec file produced by `/prd-to-ux`. Specifically:

- **Pass 3 (Affordances)** — what actions exist and their signals
- **Pass 5 (State Design)** — states per element/screen + interactive element states matrix
- **Pass 6 (Flow Integrity)** — flow risks and mitigations
- **Pass 7 (Component Mapping)** — which shadcn components are used

## Output

Write the test plan to the same directory as the UX spec:

| UX Spec Name | Test Plan Name |
|-------------|----------------|
| `UX-spec.md` | `test-plan.md` |
| `feature-x-ux-spec.md` | `feature-x-test-plan.md` |

Pattern: `{ux-spec-basename}` with `-ux-spec` replaced by `-test-plan`

## Process

### Step 1: Extract Interactions from Pass 3

For every action in the affordances table, create an interaction test scenario:

```markdown
## Interaction Tests

| # | Interaction | Given | When | Then | Priority |
|---|-------------|-------|------|------|----------|
| I1 | [Action name] | [Precondition/state] | [User action] | [Expected result] | High/Medium/Low |
```

**Rules:**
- Every affordance in Pass 3 gets at least one test scenario
- Use Given/When/Then format — this maps directly to test code
- Priority based on: critical path = High, secondary flow = Medium, edge case = Low

### Step 2: Extract State Tests from Pass 5

For every row in the state design tables AND the interactive element states matrix:

```markdown
## State Tests

| # | Component | State | Expected Visual | Expected Behavior |
|---|-----------|-------|-----------------|-------------------|
| S1 | [Component] | Empty | [What user sees] | [What user can do] |
| S2 | [Component] | Loading | [Skeleton/spinner] | [Disabled interactions] |
| S3 | [Component] | Error | [Error display] | [Recovery action available] |
| S4 | [Component] | Disabled | [Visual treatment] | [Tooltip explaining why] |
```

**Rules:**
- Every state in the Pass 5 tables gets a test
- Empty and error states are always High priority
- Loading states are Medium priority

### Step 3: Extract Edge Cases from Pass 6

For every flow risk identified in Pass 6:

```markdown
## Edge Case Tests

| # | Scenario | Setup | Action | Expected | Priority |
|---|----------|-------|--------|----------|----------|
| E1 | [Risk description] | [How to reproduce] | [What triggers it] | [Expected guardrail/behavior] | High/Medium |
```

### Step 4: Accessibility Tests

Based on the component mapping (Pass 7) and the project's WCAG AA requirement:

```markdown
## Accessibility Tests

| # | Component | Check | Method |
|---|-----------|-------|--------|
| A1 | [Component] | Keyboard navigable | Tab + Enter/Space |
| A2 | [Component] | Screen reader label | aria-label or visible text |
| A3 | [Component] | Touch target ≥ 44px | Measure rendered size |
| A4 | [Form input] | Error announced | aria-invalid + FieldError |
```

### Step 5: Summary

```markdown
## Test Summary

| Category | Count | High Priority | Medium | Low |
|----------|-------|--------------|--------|-----|
| Interaction | {n} | {n} | {n} | {n} |
| State | {n} | {n} | {n} | {n} |
| Edge Case | {n} | {n} | {n} | {n} |
| Accessibility | {n} | {n} | {n} | {n} |
| **Total** | **{n}** | **{n}** | **{n}** | **{n}** |

**Minimum coverage:** All High priority tests must be implemented.
**Recommended coverage:** All High + Medium priority tests.
```

## Quality Checklist

Before finishing, verify:

- [ ] Every Pass 3 affordance has at least one interaction test
- [ ] Every Pass 5 state has a state test
- [ ] Every Pass 6 flow risk has an edge case test
- [ ] Empty, loading, and error states are covered for every screen/component
- [ ] All form inputs have accessibility tests
- [ ] All tests use Given/When/Then format
- [ ] No test references implementation details (class names, internal state)
- [ ] Tests describe user-visible behavior only

## Anti-Patterns

- **Testing implementation:** "useState updates to true" → test what the USER sees instead
- **Missing states:** Only testing happy path → cover empty, loading, error, disabled
- **Vague assertions:** "Page works correctly" → specify exactly what's visible/clickable
- **Skipping accessibility:** "We'll add a11y later" → a11y tests are part of the plan from the start

## Pipeline Artifact

This file is an **intermediate artifact** — it will be deleted by `generate-feature-doc` after the feature is complete. The test code (written by `/frontend-testing`) is the permanent artifact.

## Resume After Context Cleanup

If context was cleaned mid-pipeline, restore state before proceeding:

1. **Read DECISIONS.md** in the feature folder for accumulated context
2. **Read the relevant artifact** for this skill's input:
   - The UX spec file and any existing test plan draft
3. **Continue from where you left off** — don't restart the skill from scratch

## Next Step

After completing this skill, use the `AskUserQuestion` tool to present the next step options. Include a summary of what was completed in the question text.

Options to present:

- **plan-implementation** — bridge specs into a dependency-ordered implementation plan
- **Something else** — do something different

Do NOT present numbered text options and ask the user to "type a number." Always use the `AskUserQuestion` tool for skill transitions.

## Context Management

After completing this skill's work, report the **context usage percentage** so the user can decide whether to clean context:

> "{Skill output summary}. Context usage: **{X}%**"

Do NOT recommend cleaning context — just show the percentage. The user will decide.
