---
type: llm
focus: { source: file, path: "src/features/reservations/reservations-export-implementation-plan.md" }
weight: 2
---

This file is an implementation plan written from a user request. Look only at the `## Specs` table and its `Must not` column; ignore every other section.

The request stated exactly two limits: the export must not include cancelled reservations, and there are no new screens.

PASS if every `Must not` cell is empty, a dash, or restates one of those two limits (in any wording or language).
FAIL if any `Must not` cell introduces a prohibition the request never stated (for example about performance, permissions, pagination, formats or error handling).
