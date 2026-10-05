<!-- BEGIN claude-skills plugin block (managed by /setup-daher-skills — edits inside will be replaced on update) -->

## Feature Development Pipeline (claude-skills plugin)

Project values (package manager, commands, base branch, error surface, viewport policy) live in:

@docs/agents/project-conventions.md

Convention rules live in `.claude/rules/` — they are the single source of truth for code style and architecture; skills and agents read them at run time.

**Pipeline:** `/brainstorm` → `/generate-prd` → `/prd-clarifier` → `/prd-to-ux` → `/plan-implementation` → `/execute-tasks` → `/finish-feature` → `/generate-feature-doc`. Run `/pipeline-help` for the full guide.

**Working with the user:**
- When a step doesn't need the user, keep going; put status notes in the same message as the next action. Stop and ask only when you can't continue without them, or before anything destructive, outside this repo, or not asked for (a commit or push included). Full rule: `.claude/rules/working-principles.md`.
- Once a question is answered, treat that answer as done — don't reopen it unless the user asks.
- In research answers, mark anything you couldn't confirm and say where you looked.

**When compacting context:** always preserve the current `PROGRESS.md` state, the list of modified files, and the project's test commands.

<!-- END claude-skills plugin block -->
