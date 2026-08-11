# Cross-host portability via `.agents/skills` + `agents/openai.yaml`

**Decision:** not adopted.

**Why:** the `.agents/skills` directory convention with per-skill `agents/openai.yaml` interface metadata (as used by pingdotgg/t3code, adapted from OpenAI's plugin format) exists to make one skill set readable by multiple agent hosts (Codex, Claude Code). This plugin targets Claude Code only — multi-harness support is PRD non-goal A3. Maintaining a second metadata surface per skill adds drift risk (invariant: the router never lies) with zero consumers today. It also relies on relative cross-skill links (`../other-skill/SKILL.md`), which invariant 3 forbids because they break on plugin installs.

**Reconsider if:** the team starts running Codex (or another `.agents/skills`-aware host) against repos that consume this plugin — then write a separate PRD as A3 specifies.

**Previously requested:** analysis of pingdotgg/t3code `.agents/skills` (2026-08-11).
