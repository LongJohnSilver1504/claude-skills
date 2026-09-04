# Continuous learning / "instincts" mined from tool traces

**Decision:** not adopted.

**Why:** the pattern (seen in affaan-m/ECC `continuous-learning-v2`, `learn`, `evolve`, `instinct-*`) records every PreToolUse/PostToolUse event to a local store, has a background model cluster them into "instincts", and injects the high-confidence ones into every future session. Three problems: (1) it injects un-reviewed heuristics — behavior drift with no gate, the opposite of this repo's "conventions live in `.claude/rules/`, seeded once, edited by humans"; (2) in the reference implementation the analyzer ships disabled (`observer.enabled: false`) and the collector still runs, so the default state is a data sink with no output; (3) it needs a Python CLI plus XDG state directories — a runtime this plugin (Node-only hooks, zero dependencies) does not carry. Our equivalents already exist at the right granularity: `PROGRESS.md` (What Did NOT Work / Exact Next Step) for session memory, `.claude/rules/` for durable conventions, and the `writing-skills` "test before trusting" rule for turning a repeated win into a skill deliberately.

**Reconsider if:** Claude Code ships a first-party, reviewable memory mechanism that hooks can write to and the user can audit before it loads.

**Previously requested:** ECC comparison (2026-09-04).
