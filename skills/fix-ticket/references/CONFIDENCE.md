# Confidence — a rubric, not a feeling

The number answers one question: **how much of this plan rests on something that was observed, and how much on inference?** It is a checklist score out of 100, not a probability of success. Say so when you present it.

Each line is earned by evidence you can point at. No evidence, no points — partial credit only where the table offers it.

| Line | Points | Earned when |
|------|-------:|-------------|
| **Reproduced** | 30 | A failing test reproduces it (30) · reproduced in the running app or against a local backend (25) · not reproduced by you, but a recording shows the failing request and its response (15) · neither (0) |
| **Cause located** | 25 | `file:line`, with the path from trigger to symptom traced through the code (25) · the file is known and the path is inferred (12) · a hypothesis (0) |
| **Scope bounded** | 15 | Every call site of what the fix changes was grepped and the fix alters no shared contract (15) · it touches shared code or a contract and the consumers are listed (8) · consumers unknown (0) |
| **Regression test** | 10 | The test that will fail before the fix and pass after is identified and can be written with the project's test setup (10) · only a manual check is possible (4) |
| **Other side verified** | 10 | No request is involved (10) · the backend handler was read, or the contract was checked against a real response (10) · backend docs only (5) · UNVERIFIED (0) |
| **No open questions** | 10 | Nothing in the plan waits on a decision or a fact (10) · one open question that does not change the fix (5) · more (0) |

## Caps

A cap overrides the sum — some gaps cannot be bought back with points elsewhere.

| Situation | Cap |
|-----------|----:|
| Not reproduced by you, and no recording shows the failing request and response | 60 |
| Not reproduced by you, but a recording shows the failing request and response | 75 |
| Cause is a hypothesis | 50 |
| Cause is on the backend or in the contract, and the backend is UNVERIFIED | 65 |
| The fix cannot be tested automatically or walked in the running app | 70 |

## Bands

| Score | Meaning | Next |
|------:|---------|------|
| 80–100 | The plan rests on observation | Debate it (Step 7) |
| 60–79 | Sound direction, named gaps | Close the gaps you can, ask for the rest, recompute |
| below 60 | Not a fix plan yet | Propose the next investigation step, not a fix |

## How to present it

```
Confidence: 74 / 100 — a checklist score, not a probability
  Reproduced            25/30  walked in the running app with the reporter's steps; no test yet
  Cause located         25/25  reservation.mapper.ts:41 — `endDate` read before the null check
  Scope bounded         15/15  2 call sites, both inside the feature
  Regression test        4/10  mapper has no test file; needs the shared factory first
  Other side verified    0/10  backend UNVERIFIED — no checkout at the recorded path
  No open questions      5/10  one open question: is a null `endDate` valid for an open-ended booking?

Would raise it:
  +10  the backend checkout path, to read the handler            → 84
  +6   a mapper test with the recorded payload                    → 90
```

Rules:

- Never round up, and never report a score without its lines.
- Show what would raise it and by how much — that list is what the user acts on.
- Recompute after every new fact; an old number in a new plan is a wrong number.
- Two tickets with the same score can be very different risks. The lines carry the information; the total is only the summary.
- The score is about the plan, not the ticket. When the plan covers part of the ticket, the first line says which part: `Confidence: 82 / 100 for the error-message slice — the ticket's main ask is new behavior and is not in this plan`.
