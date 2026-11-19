---
type: regex
target: { source: file, path: "src/features/reservations/reservations-export-implementation-plan.md" }
pattern: '\|\s*S1\s*\|[\s\S]*Covers\*{0,2}:?\*{0,2}[^\n]*S\d'
weight: 1
---

Specs carry `S#` ids and at least one deliverable names the ids it covers.
