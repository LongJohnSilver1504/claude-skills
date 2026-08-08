# Reviewer voting (N identical reviewers + cross-check)

**Decision:** not adopted.

**Why:** "Building effective agents" (Anthropic): add complexity only when it demonstrably improves results. The pipeline already has redundancy through four *specialized* reviewers with disjoint concerns plus mandatory finding verification (`receiving-code-review` — every finding is checked against the code before acting). Running the same reviewer N times and voting would roughly N× review cost with no evidence of better outcomes, and diversity of lens beats redundancy of identical lenses for this workload.

**Reconsider if:** confirmed false-positive/false-negative rates from single reviewers become a measured problem the triage verification step doesn't catch.

**Previously requested:** informe-mejora-claude-skills adenda (2026-08-08).
