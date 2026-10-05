# Prompting-coach skill ("help me communicate better with Claude")

**Decision:** not adopted (2026-10-01).

**Why:** a skill is loaded when *Claude* decides the request matches its description — but advice on how to prompt Claude is about what the *user* types, and about standing behaviour Claude should show on every turn. Neither fits a skill: the first never triggers at the right moment, the second belongs in context that is always loaded. The useful parts of Anthropic's *Getting the most out of Opus 5.5* went where they are read every session instead — the stop rule in `rules/working-principles.md`, three lines in the seeded CLAUDE.md block, and authoring checks in `writing-skills`.

**Revisit if:** there is a recurring, recognisable request shape ("rewrite this prompt for Opus", "review my CLAUDE.md") that `writing-skills` doesn't already own.
