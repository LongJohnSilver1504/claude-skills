---
type: regex
target: { source: file, path: ".claude/guardrails.json" }
pattern: '(?=[\s\S]*"examples")(?=[\s\S]*develop)(?=[\s\S]*db:migrate)(?=[\s\S]*\.env)'
weight: 2
---

Rules name this project's branch, its migration script and its env files, and carry examples.
