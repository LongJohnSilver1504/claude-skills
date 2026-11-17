# DIAGNOSIS-FORMAT — what `fix-ticket` presents

Lead with the finding. The user reads the first three lines and the confidence block; everything else is there to be checked.

## One ticket

```markdown
## {ID} — {title}

**Finding:** {one sentence — what is broken and why}
**Side:** frontend | backend | contract | data | environment | not a bug | new behavior
**Tier:** Small | Standard | Large — {one clause why}
**Covers:** the whole ticket | {the part this plan delivers — and what it leaves for whom}

### What happens
- Expected: {…}
- Actual: {…}
- Where: {page / endpoint / environment / version}

### Evidence
- {source} — {the one fact it gave, with timestamp or file:line}

### Reproduction
{rung reached: failing test (path, command) | running app (steps) | local backend (request) | not reproduced (what was tried, what would make it reproducible)}

### Cause
{one sentence} — `{file}:{line}`
{2–4 lines tracing trigger → symptom through the code}

### Plan
1. {file} — {change}
2. Regression test: {test file} — {what it asserts}
Out of scope: {what you noticed and will not touch}

### Confidence
{the block from CONFIDENCE.md, with "Would raise it"}

### Not checked
- {source} — {why}
```

Keep the cause trace to what a reader needs to verify it. A section with nothing to say is dropped, except *Not checked*, which reads "nothing — every source was read" when that is true.

## Several tickets

One table first, then the per-ticket blocks in the order of the table.

```markdown
| Ticket | Finding | Side | Reproduced | Confidence | Blocked by |
|--------|---------|------|------------|-----------:|------------|
| ABC-101 | `endDate` read before the null check | frontend | failing test | 92 | — |
| ABC-104 | 422 on an edit the client should not offer | contract | recording only | 65 | backend checkout path |
| ABC-109 | Already fixed in `a1b2c3d` | — | — | — | — |
```

Say which ones you recommend proceeding with now and which need an answer first. Tickets that share a cause share a row.

## Investigation note (cause in another repo)

When the fix belongs to the backend or another service and nobody asked for that change. Saved where the project keeps such notes (see `project-conventions.md`), otherwise offered as a ticket comment.

```markdown
# {date} — {ID}: {title}

**Finding:** {one sentence}
**Where the fix belongs:** {repo / service} — {handler file}
**Evidence:** {request, response, the handler lines read}
**What the client does today:** {how the frontend behaves, and whether it should change too}
**Proposed change:** {the smallest change on the owning side}
**Open questions for the owner:** {…}
```

## Ticket comment (only after the user says yes)

Short, for the people on the ticket — not the investigation log.

```markdown
**Cause:** {one sentence}
**Fix:** {PR link} — {one line}
**Verified:** {how: the test, the ticket's steps walked}
```

No personal data from a recording, no session URLs that carry a token.
