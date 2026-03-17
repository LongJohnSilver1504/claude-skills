---
name: feature-flow
description: Orchestrate the feature development pipeline from idea to implementation. Guides the user through PRD generation, clarification, UX spec, and retrospective — tracking progress and handling transitions between steps. Use when user says "start a feature", "new feature pipeline", "feature flow", "where was I", or wants to resume an interrupted feature workflow.

---

# Feature Flow

Orchestrate the feature pipeline: idea → PRD → clarification → UX spec → retrospective.

You own the flow between skills. Individual skills do their job; you track progress, handle transitions, and manage state.

## Pipeline Steps

| Step | Skill                   | Input                     | Output               |
| ---- | ----------------------- | ------------------------- | -------------------- |
| 1    | `generate-prd`          | Feature idea              | `PRD.md`             |
| 2    | `prd-clarifier`         | `PRD.md`                  | `*-clarification.md` |
| 3    | `prd-to-ux`            | `PRD.md` + clarifications | UX spec              |
| 4    | `feature-retrospective` | All artifacts             | Observation log      |

Steps 2–4 are optional. The user can skip, reorder, or stop at any point.

## State Tracking

Maintain a `PROGRESS.md` file in the feature directory:

```markdown
# Feature Flow: [feature-name]
**Started**: [date]
**Current step**: [step number and name]
**Directory**: src/new-app/features/[feature-name]/

## Completed Steps
- [x] Step 1: PRD generated → PRD.md
- [ ] Step 2: Clarification
- [ ] Step 3: UX spec
- [ ] Step 4: Retrospective

## Decisions
[Key decisions accumulated across steps — append after each step]
```

## Starting a Flow

1. Ask the user what feature they want to build (or read from context if already stated)
2. Create the feature directory: `src/new-app/features/{feature-name}/`
3. Create `PROGRESS.md` in that directory
4. Invoke `generate-prd` to create the PRD
5. When PRD is done, present next steps

## Transitions Between Steps

After each skill completes:

1. Update `PROGRESS.md` with what was completed
2. Append any key decisions to the Decisions section
3. Present the next step options using the AskUserQuestion tool

Always offer these options:

- The natural next step (e.g., "Clarify the PRD" after step 1)
- Skip to a later step
- Stop here — the user may not need the full pipeline
- Something else

## Resuming an Interrupted Flow

When the user returns or context was cleaned:

1. Look for `PROGRESS.md` files in `src/new-app/features/*/`
2. Read the most recent one to find current state
3. Read the artifacts for the current step (PRD, clarification doc, etc.)
4. Tell the user where they left off and ask how to continue

This is the **only** place resume logic lives. Individual skills do not handle resume.

## Context Management

After each step completes, report context usage:

> "PRD generated. Context usage: **X%**"

If context is above 70%, suggest the user could compact before the next step. Don't force it — just inform.

## Rules

- Never run a skill without telling the user which step they're on
- Never skip a step without asking
- Always update `PROGRESS.md` before presenting next steps
- If the user asks "where was I" or "resume", check for `PROGRESS.md` files
- Individual skills must NOT contain pipeline logic — that's your job
