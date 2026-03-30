---
name: prd-clarifier
description: Refine a PRD through structured questions that uncover ambiguities, missing edge cases, and hidden assumptions. Use after generating a PRD, when requirements feel vague, when user says "review my PRD", "clarify requirements", "what am I missing", or wants to improve spec quality before building.

---

# PRD Clarifier

Systematically improve a PRD by asking targeted questions that uncover ambiguities, gaps, and hidden assumptions. Each question should make the document more buildable.

## How It Works

1. Read the PRD
2. Ask user for session depth
3. Ask questions one at a time, adapting based on answers
4. Track Q&A as you go
5. **Update PRD.md directly** with all clarifications — no separate file

## Step 1: Setup

Find the PRD file. You will update it directly at the end — no separate clarification file.

## Step 2: Ask Depth

Analyze the PRD complexity (features, integrations, edge cases) and recommend a depth. Mark your recommendation with "(Recommended)".

| Depth    | Questions | When to use                            |
| -------- | --------- | -------------------------------------- |
| Quick    | 5         | Small feature, mostly clear PRD        |
| Standard | 10        | Typical feature with some gaps         |
| Thorough | 15        | Complex feature, multiple integrations |
| Deep     | 25        | Large scope, many unknowns             |

## Step 3: Ask Questions

### Prioritize by impact

1. **Blockers**: requirements that block other work or have safety/security implications
2. **Vague language**: missing acceptance criteria, undefined terms, "should be fast"
3. **Integration points**: APIs, third-party services, data dependencies
4. **Edge cases**: error handling, boundary conditions, empty states
5. **Missing non-functionals**: performance targets, accessibility, scalability

### Adapt after each answer

- Answer revealed a new ambiguity → prioritize it next
- Answer clarified related areas → skip redundant questions
- Answer contradicts an earlier one → address the conflict
- Answer introduced new scope → flag it, don't expand scope silently

### Question rules

- Reference specific sections or statements from the PRD
- One question per turn
- Don't suggest the "right" answer
- Provide selectable options when the answer space is bounded
- Acknowledge previous answers when building on them

### After each answer

Keep a running list of clarifications to merge into the PRD at the end. No separate tracking file — you will edit PRD.md directly in Step 4.

## Step 4: Merge Into PRD

After all questions:

1. **Update PRD.md directly** — merge all clarifications into the relevant sections:
   - Add missing edge cases to the requirements section
   - Refine vague language with concrete acceptance criteria
   - Add resolved ambiguities where they belong in the document
   - Add a `## Clarifications` section at the end listing key decisions made during this session
2. Summarize what changed for the user
3. List remaining ambiguities that weren't resolved (if any)
4. Use the `AskUserQuestion` tool to present next step options:

- **prd-to-ux** — translate requirements into UX specification
- **Something else** — do something different

Do NOT present numbered text options. Always use the `AskUserQuestion` tool for skill transitions.

**Important:** PRD.md is now the single source of truth. Do not create a separate `*-clarification.md` file. All downstream steps (prd-to-ux, plan-implementation) read only the PRD.

## Resume After Context Cleanup

If context was cleaned mid-pipeline:

1. Read the PRD (it may already contain some clarifications from a partial session)
2. Check the `## Clarifications` section at the end of the PRD for what's already been resolved
3. Continue from where you left off — don't repeat questions already answered

## Context Management

After completing, report context usage:

> "{Summary}. Context usage: **{X}%**"

Don't recommend cleaning — just show the percentage.
