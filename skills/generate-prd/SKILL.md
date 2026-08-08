---
name: generate-prd
description: Convert a feature idea into a structured, builder-ready PRD. Use when planning a feature, creating specs, writing requirements, or when user mentions PRD, feature spec, requirements document, product spec, or "what should I build". Also use when the user has a vague idea and needs it sharpened into something buildable.
---

> **Project config:** `{app}` is the project's new-code root from `.claude/rules/project-structure.md`; project values (package manager, commands, base branch, error surface) come from `docs/agents/project-conventions.md`. Resolve both before writing any file — never assume. If a needed file is missing, stop: "Run `/setup-daher-skills` first — missing `<file>`."
# Feature PRD Generator

Turn a feature idea into a document clear enough that a builder (human or AI) can start coding without guessing.

## Input

**First, check `.claude/pipeline/{feature}/DESIGN.md`.** If it exists (produced by `brainstorm`), read it before anything else:

- Its **Key Decisions** are constraints — the PRD must honor them, not relitigate them
- Its **Open Questions** become either explicit PRD assumptions or questions to defer to `prd-clarifier`

Then take the user's feature description — possibly vague or incomplete. Infer missing details, label assumptions explicitly, and optimize for production scale without overengineering.

If the input is extremely vague, ask **one** clarifying question max, then proceed with assumptions. Deeper ambiguity → suggest `brainstorm` (raw idea) or `prd-clarifier` (existing PRD) instead of asking more questions here.

## Output

Generate a PRD with sections 1–7 as specified in [references/PRD-FORMAT.md](references/PRD-FORMAT.md) — read it before writing. Concise, builder-friendly language; no enterprise ceremony.

**Done when:** every section 1–7 exists, every requirement is testable, and no section says "TBD".

### Contract Reality Check (before writing Data Flow)

Unverified API contracts are the pipeline's most recurrent bug source. **If the project documents a local backend checkout (see the project's CLAUDE.md), read its source directly** (controllers, DTOs, routes) to verify — do NOT ask the user to relay questions to the backend team unless the answer genuinely isn't in the code. Before writing section 7, verify **every** claimed API endpoint and response shape against reality:

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

Read the feature's existing artifacts (`.claude/pipeline/{feature}/` and the feature folder: DESIGN.md, PRD.md, UX-spec.md, the implementation plan, PROGRESS.md — whichever exist), then this skill's own input, and continue from where they leave off — never restart from scratch.

## Next Step

Use the `AskUserQuestion` tool for the transition (never numbered text options), with a one-line summary of what was completed. Options:

- **prd-clarifier** — refine requirements through structured questions
- **prd-to-ux** — skip clarification, go straight to UX spec
- **Something else** — do something different

