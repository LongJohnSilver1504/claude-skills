---
type: regex
target: { source: file, path: "REVIEW.md" }
pattern: '\*\*Status:\*\*\s*(?:FAIL|CONCERNS)[\s\S]*order-card\.tsx'
weight: 2
---

State and an effect in a component body is the rule's hard violation; the report carries the shared Status line and names the file.
