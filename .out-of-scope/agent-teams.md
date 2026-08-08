# Agent teams / multi-session orchestration

**Decision:** not adopted.

**Why:** the current orchestrator-workers shape (execute-tasks as coordinator + fresh-context subagents per deliverable, PROGRESS.md as external memory) is the simplest thing that works — Anthropic's own guidance for decomposable tasks. Multi-session agent teams add coordination overhead, shared-state hazards, and debugging surface without a bottleneck to justify them: the pipeline's constraint is review quality and human decisions, not orchestration throughput.

**Reconsider if:** deliverable counts per feature grow to where a single orchestrator session can't hold the coordination state even with PROGRESS.md.

**Previously requested:** informe-mejora-claude-skills adenda (2026-08-08).
