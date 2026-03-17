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
4. Save all Q&A to a tracking file next to the PRD
5. Summarize clarifications and offer to update the PRD

## Step 1: Setup

Find the PRD file. Create a tracking document in the **same directory**:

- PRD is `auth-feature.md` → create `auth-feature-clarification.md`

Initialize it:

```markdown
# PRD Clarification Session
**Source**: [filename]
**Depth**: [pending]
**Progress**: 0/[pending]
---
```

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

Append to the tracking document:

```markdown
## Q[N] — [Category]
**Gap**: [what's ambiguous]
**Question**: [what you asked]
**Answer**: [what they said]
**Clarified**: [how this resolves the gap]
---
```

## Step 4: Wrap Up

After all questions:

1. Summarize key clarifications (what changed)
2. List remaining ambiguities that surfaced but weren't resolved
3. Suggest priority order for unresolved items
4. Offer to update the PRD with clarified requirements
5. Use the `AskUserQuestion` tool to present next step options:

- **feature-retrospective** — start pipeline observer to track requirements
- **prd-to-ux** — translate requirements into UX specification
- **Something else** — do something different

Do NOT present numbered text options. Always use the `AskUserQuestion` tool for skill transitions.

## Resume After Context Cleanup

If context was cleaned mid-pipeline:

1. Check for in-progress pipeline: `.claude/pipeline/*/OBSERVATION-LOG.md` with `Status: In Progress`
2. Read DECISIONS.md in the feature folder
3. Read the PRD and any existing `*-clarification.md` tracking document
4. Resume the observer if an OBSERVATION-LOG.md exists and is in progress
5. Continue from where you left off — don't restart

## Context Management

After completing, report context usage:

> "{Summary}. Context usage: **{X}%**"

Don't recommend cleaning — just show the percentage.
