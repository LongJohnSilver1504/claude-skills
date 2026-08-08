# PRD-FORMAT — the artifact `generate-prd` writes

Write in concise, builder-friendly language. No enterprise ceremony. Sections 1–7, in order.

## Template

### 1. Problem Statement

> [User] struggles to [do X] because [reason], resulting in [impact].

Pick the single most important problem. If multiple exist, note the others as "Related problems" in one line.

### 2. Success Criteria

What must work for this to be considered done:

- **Demo goal**: what outcome the demo clearly communicates
- **Acceptance criteria**: 2–4 testable statements (use "Given/When/Then" or plain assertions)
- **Non-goals**: what is intentionally out of scope

### 3. Target User

One primary user role. Include:

- Role and context
- Skill level
- Key constraint (time, knowledge, access)

No personas or demographics.

### 4. Core Use Case (Happy Path)

The single most important end-to-end flow:

- **Start condition**: what's true before the flow begins
- **Steps**: numbered sequence of user actions and system responses
- **End condition**: what's true when it succeeds

If this flow works, the feature works.

### 5. Functional Requirements

Only what the system must do. Use this table:

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|

Rules:

- Phrase as capabilities, not implementation ("supports X", not "use library Y")
- Priority: P0 (must-have) or P1 (important). No P2s — those belong in a backlog, not a PRD
- Keep the list tight — if it's longer than 10 rows, you're over-scoping

### 6. UX Decisions

Make implicit assumptions explicit so nothing is left to interpretation.

**Entry point**: How the user starts and what they see first.

**Inputs**: What the user provides (if anything).

**Outputs**: What the user receives and in what form.

**States**: How the system communicates loading, success, failure, partial results, and empty states.

**Error handling**: What happens when input is invalid, the system fails, or the user does nothing. Keep it minimal — just enough to not break.

### 7. Data Flow

**Sources**: Where data comes from (user input, API, static/mocked, generated). Mark each API source VERIFIED/UNVERIFIED per the Contract Reality Check in SKILL.md.

**Processing**: High-level logic only. Use the format: Input → transform → output.

**Destination**: Where results go (UI only, temporarily stored, logged).

## Rules

- Every requirement must be testable — you could write an assertion for it.
- No section says "TBD". Assumptions are labeled, not hidden.
- Contracts appear as **VERIFIED** (cite the file/source) or **UNVERIFIED** (state what was assumed) — never as unmarked facts.
