# Autonomous loop skills (continuous-agent-loop, ralph-style loops, loop operators)

**Decision:** not adopted.

**Why:** the reference implementations (affaan-m/ECC `autonomous-loops`, `continuous-agent-loop`, `loop-operator`, `santa-loop`) are pattern catalogs — Kanban schemas, recovery ladders, "freeze / audit / reduce scope / replay" — with no gate the model can be held to and no join semantics. This pipeline's loop is `execute-tasks`: bounded fan-out (3 in flight), a per-deliverable join ledger (`PROGRESS.md` gate columns, no `-` allowed), capped fix rounds (2), and human stops at BLOCKED / spec FAIL / ARCHITECTURAL — the parts that make an autonomous run auditable after the fact. An "autonomous loop" skill layered on top would either duplicate that or remove the stops. Scheduled re-runs of a fixed task are a Claude Code built-in (`/loop`), not a skill.

**Reconsider if:** a feature needs a run that outlives one session by design (nightly re-audit, dependency bump sweep) and `/loop` + `audit-branch` cannot express it.

**Previously requested:** ECC comparison (2026-09-04). Related: [agent-teams.md](agent-teams.md), [headless-fanout.md](headless-fanout.md).
