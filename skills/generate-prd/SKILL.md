---
name: generate-prd
description: Convert a feature idea into a structured, builder-ready PRD. Use when planning a feature, creating specs, writing requirements, or when user mentions PRD, feature spec, requirements document, product spec, or "what should I build". Also use when the user has a vague idea and needs it sharpened into something buildable.
---

# Feature PRD Generator

Turn a feature idea into a document clear enough that a builder (human or AI) can start coding without guessing.

## Input

The user provides a feature description — possibly vague or incomplete. Infer missing details, label assumptions explicitly, and optimize for production scale without overengineering.

If the input is extremely vague, ask **one** clarifying question max, then proceed with assumptions.

## Output

Generate a PRD with sections 1–7 below. Write in concise, builder-friendly language. No enterprise ceremony.

---

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

**Sources**: Where data comes from (user input, API, static/mocked, generated).

**Processing**: High-level logic only. Use the format: Input → transform → output.

**Destination**: Where results go (UI only, temporarily stored, logged).

---

## Output Location

Co-locate PRDs next to the code they describe:

| Scope | Location |
|-------|----------|
| Feature | `src/new-app/features/{feature}/PRD.md` |
| Shared module | `src/new-app/shared/{module}/PRD.md` |
| Project-wide (rare) | `PRD.md` at repo root |

## Quality Check

Before delivering, verify the PRD passes this test:

- A builder could read it and start coding without asking questions
- Every requirement is testable (you could write an assertion for it)
- No section says "TBD" or "to be determined"
- Assumptions are labeled, not hidden

## After PRD Generation

Once you have generated the complete PRD (sections 1-7), proceed to the Next Step below.

## Resume After Context Cleanup

If context was cleaned mid-pipeline, restore state before proceeding:

1. **Read DECISIONS.md** in the feature folder for accumulated context
2. **Read the relevant artifact** for this skill's input:
   - The feature folder in `src/new-app/features/{feature}/` for existing PRD drafts
3. **Continue from where you left off** — don't restart the skill from scratch

## Next Step

After completing this skill, use the `AskUserQuestion` tool to present the next step options. Include a summary of what was completed in the question text.

Options to present:

- **prd-clarifier** — refine requirements through structured questions
- **prd-to-ux** — skip clarification, go straight to UX spec
- **Something else** — do something different

Do NOT present numbered text options and ask the user to "type a number." Always use the `AskUserQuestion` tool for skill transitions.

## Context Management

After completing this skill's work, report the **context usage percentage** so the user can decide whether to clean context:

> "{Skill output summary}. Context usage: **{X}%**"

Do NOT recommend cleaning context — just show the percentage. The user will decide.
