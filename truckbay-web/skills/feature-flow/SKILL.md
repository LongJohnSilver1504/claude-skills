---
name: feature-flow
description: Orchestrate the full feature development pipeline from idea to merge. Guides the user through brainstorming, PRD, design, planning, autonomous execution, testing, documentation, retrospective, and finalization. Use when user says "start a feature", "new feature pipeline", "feature flow", "where was I", or wants to resume an interrupted feature workflow.
---

# Feature Flow

Orchestrate the full feature pipeline: idea → brainstorm → PRD → design → plan → build → test → document → retro → finish.

You own the flow between skills. Individual skills do their job; you track progress, handle transitions, and manage state.

## Pipeline Steps

| Step | Skill | Input | Output | Autonomy |
|------|-------|-------|--------|----------|
| 0 | `brainstorm` | Feature idea | `DESIGN.md` | Human-in-the-loop |
| 1 | `generate-prd` | Idea + DESIGN.md | `PRD.md` | Human-in-the-loop |
| 2 | `prd-clarifier` | `PRD.md` | `*-clarification.md` | Human-in-the-loop |
| 3 | `prd-to-ux` | PRD + clarifications | UX spec | Human-in-the-loop |
| 4 | `generate-test-plan` | UX spec | Test plan | Human-in-the-loop |
| 5 | `ux-to-prompt` | UX spec | Build prompts | Human-in-the-loop |
| 6 | `plan-implementation` | All design artifacts | Implementation plan | Human-in-the-loop |
| 7 | `execute-tasks` | Implementation plan | Working code | Autonomous (smart triage) |
| 8 | `frontend-testing` | Working code | Test files | Human-in-the-loop |
| 9 | `generate-feature-doc` | All artifacts + code | README.md | Human-in-the-loop |
| 10 | `feature-retrospective` | All artifacts | RETRO.md | Human-in-the-loop |
| 11 | `finish-feature` | Complete feature | Commit / PR | Human-in-the-loop |

All steps are optional. The user can skip, reorder, or stop at any point.

**Step 0 recommendation:** If the user's idea is clear and specific, suggest skipping to Step 1. If it's vague or has multiple approaches, recommend starting with brainstorm.

**Step 7 is autonomous:** `execute-tasks` dispatches subagents and runs continuously. It only stops for blockers, architectural concerns, or user interruption. After Step 7, context will likely be high — recommend compacting before Step 8.

## State Tracking

Maintain a `PROGRESS.md` file in the feature directory:

```markdown
# Feature Flow: [feature-name]
**Started**: [date]
**Current step**: [step number and name]
**Directory**: src/new-app/features/[feature-name]/

## Completed Steps
- [ ] Step 0: Brainstorm → DESIGN.md
- [ ] Step 1: PRD → PRD.md
- [ ] Step 2: Clarification
- [ ] Step 3: UX spec
- [ ] Step 4: Test plan
- [ ] Step 5: Build prompts
- [ ] Step 6: Implementation plan
- [ ] Step 7: Execution (autonomous)
- [ ] Step 8: Testing
- [ ] Step 9: Documentation
- [ ] Step 10: Retrospective
- [ ] Step 11: Finish

## Decisions
[Key decisions accumulated across steps — append after each step]
```

## Starting a Flow

1. Ask the user what feature they want to build (or read from context if already stated)
2. Create the feature directory: `src/new-app/features/{feature-name}/`
3. Create `PROGRESS.md` in that directory
4. Evaluate the idea's clarity:
   - Clear and specific → suggest skipping to Step 1 (`generate-prd`)
   - Vague or multiple approaches → recommend Step 0 (`brainstorm`)
5. Offer to start `feature-retrospective` observer alongside the pipeline (per existing user feedback — always offer at PRD start)

## Transitions Between Steps

After each skill completes:

1. Update `PROGRESS.md` with what was completed
2. Append any key decisions to the Decisions section
3. Present the next step options using the AskUserQuestion tool

Always offer these options:

- The natural next step (e.g., "Clarify the PRD" after Step 1)
- Skip to a later step (with justification if skipping multiple)
- Stop here — the user may not need the full pipeline
- Something else

### Key Transitions

**After Step 0 (brainstorm):** Hand off to `generate-prd`. Mention that `DESIGN.md` exists in `.claude/pipeline/{feature}/` so the PRD skill reads it for context.

**After Step 6 (plan-implementation):** This is the shift from human-driven design to autonomous execution. Inform the user:

> "Implementation plan ready. Step 7 (`execute-tasks`) will dispatch autonomous agents to build each deliverable. You'll only be interrupted for blockers or architectural decisions. Ready to start?"

**After Step 7 (execute-tasks):** Context will likely be high. Recommend compacting:

> "Execution complete. Context at **X%**. Recommend compacting before continuing — PROGRESS.md and the execution log have the full state."

**After Step 10 (retrospective):** Suggest `finish-feature` to close out.

## Resuming an Interrupted Flow

When the user returns or context was cleaned:

1. Look for `PROGRESS.md` files in `src/new-app/features/*/`
2. Read the most recent one to find current state
3. Read the artifacts for the current step
4. Also check for `execute-tasks` PROGRESS.md (execution state) if Step 7 was in progress
5. Tell the user where they left off and ask how to continue

This is the **only** place resume logic lives. Individual skills do not handle resume.

## Context Management

After each step completes, report context usage:

> "Step {N} complete. Context usage: **X%**"

Guidelines:
- Below 50%: Continue normally
- 50-70%: Mention it, let user decide
- 70-80%: Recommend compacting before next step
- Above 80%: Strongly recommend compacting — PROGRESS.md has full state to resume

## Rules

- Never run a skill without telling the user which step they're on
- Never skip a step without asking
- Always update `PROGRESS.md` before presenting next steps
- If the user asks "where was I" or "resume", check for `PROGRESS.md` files
- Individual skills must NOT contain pipeline logic — that's your job
- Always offer `feature-retrospective` when starting a new pipeline (per user feedback)
- After Step 7, always mention context usage and recommend compacting if above 70%
