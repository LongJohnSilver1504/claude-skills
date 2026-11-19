---
type: regex
target: { source: file, path: "src/features/reservations/reservations-export-implementation-plan.md" }
pattern: '## Request[\s\S]*reservas-YYYY-MM-DD\.csv[\s\S]*## Specs'
weight: 2
---

Direct mode copies the request verbatim — the exact file name the user will check against survives — and derives numbered specs from it.
