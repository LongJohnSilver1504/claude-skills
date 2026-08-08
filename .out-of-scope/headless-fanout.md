# Headless fan-out (`claude -p` loops for mass migrations)

**Decision:** not in v3.0 — different use case, candidate for a future `migrate-batch` skill.

**Why:** the pipeline is optimized for one feature at a time with human design gates. Mass mechanical migrations (rename across 300 files, dependency bumps) want headless parallel invocations with programmatic verification — a separate harness with its own error handling, not a bolt-on to `execute-tasks`.

**Reconsider if:** a real migration need appears; then design it as its own skill with its own PRD.

**Previously requested:** informe-mejora-claude-skills adenda (2026-08-08).
