---
type: regex
target: { source: file, path: "DIAGNOSIS.md" }
pattern: '\b\d{1,3}\s*/\s*100\b[\s\S]*\b\d{1,2}\s*/\s*30\b[\s\S]*\b\d{1,2}\s*/\s*25\b[\s\S]*\b\d{1,2}\s*/\s*15\b[\s\S]*\b\d{1,2}\s*/\s*10\b[\s\S]*\b\d{1,2}\s*/\s*10\b[\s\S]*\b\d{1,2}\s*/\s*10\b'
weight: 2
---

The confidence is the six-line rubric with its total — a score out of 100 followed by lines scored out of 30, 25, 15, 10, 10 and 10 — not a bare number. Matched by structure, not by label: the run answers in the user's language, and the first version of this grader failed correct diagnoses because their headings were in Spanish.
