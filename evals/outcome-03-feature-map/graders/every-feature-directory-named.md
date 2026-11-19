---
type: regex
target: { source: file, path: "docs/agents/feature-map.md" }
pattern: '(?=[\s\S]*src/features/reservations)(?=[\s\S]*src/features/customers)(?=[\s\S]*src/features/invoices)(?=[\s\S]*src/features/shared)'
weight: 2
---

All four directories under the features root appear, including the one that is not a feature.
