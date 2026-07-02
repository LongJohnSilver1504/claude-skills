---
name: generate-prd
description: Convert a feature idea into a structured, builder-ready PRD. Use when planning a feature, creating specs, writing requirements, or when user mentions PRD, feature spec, requirements document, product spec, or "what should I build". Also use when the user has a vague idea and needs it sharpened into something buildable.
---

> **Path convention:** `{app}` is the project's new-code root from `.claude/rules/project-structure.md` (some projects use `src/new-app/`, others `src/` directly). Resolve it from the rule before writing any file — never assume.
> **If `project-structure.md` does not exist:** stop and ask the user (AskUserQuestion) to define the structure before scaffolding anything. For a **new project**, propose a sensible default (e.g., `src/features/` with `src/shared/` and `src/ui/`) as the recommended option; for an **existing project**, detect candidate roots from the actual tree (Glob for `features/`, `shared/`, `ui/`) and present them as options. Then offer to save the answer as `.claude/rules/project-structure.md` so no one has to ask again.
# Feature PRD Generator

Turn a feature idea into a document clear enough that a builder (human or AI) can start coding without guessing.

## Input

**First, check `.claude/pipeline/{feature}/DESIGN.md`.** If it exists (produced by `brainstorm`), read it before anything else:

- Its **Key Decisions** are constraints — the PRD must honor them, not relitigate them
- Its **Open Questions** become either explicit PRD assumptions or questions to defer to `prd-clarifier`

Then take the user's feature description — possibly vague or incomplete. Infer missing details, label assumptions explicitly, and optimize for production scale without overengineering.

If the input is extremely vague, ask **one** clarifying question max, then proceed with assumptions. Deeper ambiguity → suggest `brainstorm` (raw idea) or `prd-clarifier` (existing PRD) instead of asking more questions here.

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

### Contract Reality Check (before writing Data Flow)

Unverified API contracts are the pipeline's most recurrent bug source. Before writing section 7, verify **every** claimed API endpoint and response shape against reality:

1. Real code (existing API adapters, Zod schemas in `api/{feature}.schemas.ts`)
2. MSW mocks that mirror the backend
3. Backend docs (e.g., `docs/lpr/backend-requirements.md`) or a live response

Mark each contract in the PRD as **VERIFIED** (cite the file/source) or **UNVERIFIED** (state what was assumed). Never present an assumed endpoint or response shape as fact — UNVERIFIED contracts must be surfaced to `prd-clarifier` or checked against the backend before implementation.

### 7. Data Flow

**Sources**: Where data comes from (user input, API, static/mocked, generated). Mark each API source VERIFIED/UNVERIFIED per the Contract Reality Check above.

**Processing**: High-level logic only. Use the format: Input → transform → output.

**Destination**: Where results go (UI only, temporarily stored, logged).

---

## Output Location

Co-locate PRDs next to the code they describe:

| Scope | Location |
|-------|----------|
| Feature | `{features-root}/{feature}/PRD.md` |
| Shared module | `src/shared/{module}/PRD.md` |
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

1. **Read the feature's pipeline artifacts** (`.claude/pipeline/{feature}/` and the feature folder: DESIGN.md, PRD.md, UX-spec.md, PROGRESS.md — whichever exist) for accumulated context
2. **Read the relevant artifact** for this skill's input:
   - The feature folder in `src/features/{feature}/` for existing PRD drafts
3. **Continue from where you left off** — don't restart the skill from scratch

## Next Step

After completing this skill, use the `AskUserQuestion` tool to present the next step options. Include a summary of what was completed in the question text.

Options to present:

- **prd-clarifier** — refine requirements through structured questions
- **prd-to-ux** — skip clarification, go straight to UX spec
- **Something else** — do something different

Do NOT present numbered text options and ask the user to "type a number." Always use the `AskUserQuestion` tool for skill transitions.

