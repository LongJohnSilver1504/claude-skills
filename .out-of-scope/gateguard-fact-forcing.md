# GateGuard-style "fact-forcing" hook (deny the first edit of every file)

**Decision:** not adopted.

**Why:** the hook (affaan-m/ECC `gateguard-fact-force.js`) denies the first Write/Edit of each file per session and demands the model list importers, affected schemas and the user's verbatim instruction before retrying. It is a flat tax on every turn — including the ones where the model already did that work — and it is skipped for subagents, which is where this pipeline's edits actually happen (`implementer`), so in `execute-tasks` it would be inert. The same evidence is demanded here at the right granularity: per deliverable, by read-only reviewers with a structured contract (`spec-reviewer`'s compliance matrix, `quality-reviewer`'s rule citations), and per finding at triage ("Trigger / Why unguarded"). Hooks in this plugin block a specific, deterministic failure (stale build, bypassed git hooks, weakened lint config, raw palette, unverified DONE) — not "did you think first".

**Reconsider if:** a measured run shows implementers editing files whose importers they never read, and the spec/quality gates did not catch the fallout.

**Previously requested:** ECC comparison (2026-09-04).
