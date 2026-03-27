---
name: brainstorm
description: Explore a feature idea before writing a PRD. Adaptive depth — quick for clear features, deep for complex/ambiguous ones, grill for stress-testing formed plans. Use when the user has a vague idea, wants to compare approaches, says "brainstorm", "explore", "think through", "what are my options", "grill me", "stress-test", or "challenge this".
---

# Brainstorm

Explore a feature idea through structured questions before committing to a PRD. Three modes based on context: Quick (clear ideas), Deep (complex/ambiguous), Grill (stress-test a formed plan).

**When to use:** Before `generate-prd`. When the idea is vague, has multiple valid approaches, the user wants to think through options, or the user has a formed plan they want challenged.

**Not the same as `prd-clarifier`:** Brainstorm operates on a raw idea or pre-PRD plan with no document yet. `prd-clarifier` refines an existing PRD.

## Complexity Signals

Count how many of these apply to the user's idea:

1. User describes multiple valid implementation approaches
2. Feature crosses multiple existing sub-features or domains
3. User uses hedging language ("maybe", "not sure if", "could be X or Y")
4. Feature involves new external integrations or API surfaces
5. User asks "what do you think?" or "how would you approach this?"
6. Requirement is contradictory or ambiguous even after one question
7. Feature has significant cross-feature impact (touches shared infrastructure)

**0-1 signals → Quick mode. 2+ signals → Deep mode.**

**Grill mode** is triggered independently of complexity signals (see below).

## Quick Mode (5-10 min)

1. Ask 3-5 targeted questions, **one at a time**
2. After each answer, decide if the next question is still needed or if a different question is more valuable
3. After the last answer, propose a single recommended approach with brief justification
4. Get user sign-off
5. Save `DESIGN.md`
6. Hand off to `generate-prd`

## Deep Mode (15-30 min)

1. Ask 8-12 questions, **one at a time**, adapting based on answers
2. After gathering enough context (~5 questions), propose 2-3 alternative approaches
3. For each approach, discuss:
   - How it fits the existing architecture
   - Complexity and maintenance cost
   - User experience impact
   - Cross-feature implications
4. May reference existing code to ground the alternatives (use Grep/Read to show relevant patterns)
5. Help the user pick an approach through discussion
6. Save `DESIGN.md`
7. Hand off to `generate-prd`

## Grill Mode (stress-test a formed plan)

**Triggered when:**
- User says "grill me", "stress-test", "challenge this", "poke holes"
- User arrives with a fully formed plan or design (not a vague idea)
- An existing `DESIGN.md` is present and user wants it validated

**Claude's role:** Devil's advocate. You are not exploring — you are **challenging**. Walk down each branch of the decision tree, resolving dependencies between decisions one by one.

1. Identify all decisions in the user's plan (architecture, UX, data flow, edge cases, trade-offs)
2. For each decision, **ask one challenging question at a time**:
   - "You chose X — why not Y?" or "What happens when Z?"
   - **Provide your recommended answer** with each question — the user can agree, disagree, or refine
   - **If a question can be answered by reading the codebase**, read the code instead of asking — then present what you found and whether it supports or contradicts the plan
3. Adapt based on answers — if the user's reasoning is solid, move on; if it's weak, dig deeper into that branch
4. After all branches are resolved, summarize what held up and what changed
5. Save `DESIGN.md` (stress-tested version)
6. Hand off to `generate-prd`

**Question style for Grill mode:**
- Adversarial, not exploratory: "What breaks if...?" not "What about...?"
- Always include your recommendation: "I'd suggest X because... — do you agree?"
- Reference existing code when relevant: "I see the codebase does Y in `file.ts` — your plan assumes Z, which contradicts this"
- Resolve dependencies: if decision A affects decision B, grill A first before moving to B

## Mode Escalation

Start in Quick mode by default. After the first 2 answers, re-evaluate complexity signals. If the answers reveal 2+ signals that weren't apparent from the initial idea, escalate to Deep mode and tell the user:

> "This is more complex than it seemed — I'm seeing [signals]. Let me explore this more thoroughly."

## Question Approach

- **One question at a time.** Never present a wall of questions.
- **Multiple choice when possible.** "Would you prefer A, B, or C?" is easier to answer than "How should this work?"
- **Open-ended when needed.** "What happens when the user has no reservations?" — when the answer space is too wide for choices.
- **Build on previous answers.** Each question should reference what the user already said.
- **No leading questions.** Don't embed your preferred answer in the question.

## Output: DESIGN.md

Save to `.claude/pipeline/{feature}/DESIGN.md`:

```markdown
# Design Decisions: {Feature Name}
**Date**: {date}
**Mode**: Quick / Deep / Grill
**Complexity signals**: {list of signals that applied}

## Problem
{1-2 sentence problem statement distilled from the brainstorm}

## Approach Chosen
{Description of the selected approach and why}

## Alternatives Considered
{For Deep mode: 2-3 alternatives with why they were rejected}
{For Quick mode: "Quick mode — single approach recommended"}
{For Grill mode: decisions that were challenged and either held up or changed}

## Key Decisions
1. {Decision that should carry into the PRD}
2. {Decision that should carry into the PRD}

## Open Questions
{Anything unresolved that the PRD should address, or "None"}
```

## Transition

After saving `DESIGN.md`, present the next step using AskUserQuestion:

- **Generate PRD** — continue to `generate-prd` (natural next step)
- **Brainstorm more** — revisit or explore a different aspect
- **Stop here** — design doc is enough for now
- **Something else**

When handing off to `generate-prd`, mention that `DESIGN.md` exists so the PRD skill can read it for context.

## Rules

- Never jump to implementation or code during brainstorm — this is a thinking phase
- Never write a PRD during brainstorm — that's `generate-prd`'s job
- If the user says "just build it" or "skip brainstorm", respect that and hand off to `generate-prd` immediately
- Create the `.claude/pipeline/{feature}/` directory if it doesn't exist
- If a `DESIGN.md` already exists, read it and ask if the user wants to revise or start fresh
