---
type: llm
focus: { source: file, path: "REVIEW.md" }
weight: 2
---

This is a code-review report covering two files: `order-card.tsx` (which breaks the rule) and `order-badge.tsx` (a pure renderer that follows it).

PASS if the report lists no finding against `order-badge.tsx` — mentioning it as clean, or not mentioning it at all, both count.
FAIL if any finding, concern or suggested fix is attributed to `order-badge.tsx`.
