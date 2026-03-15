---
name: prd-to-ux
description: Translate PRDs, feature specs, or product requirements into UX specifications. Use before creating visual designs, wireframes, or component specs. Must complete 8 passes before any visual work.
---

# PRD to UX Translation

## Overview

Translate product requirements into UX foundations through **8 structured passes**. Each pass asks different questions that visual-first approaches skip.

**Core principle:** UX foundations come BEFORE visual specifications. Mental models, information architecture, and cognitive load analysis prevent "pretty but unusable" designs.

## When to Use

- Translating PRD/spec to design tool input
- Creating UX specifications from feature requirements
- Preparing design handoff documents
- Before any visual design work

## Output Location

**Write the UX specification to a file in the same directory as the source PRD.**

Naming convention:
- If PRD is `feature-x.md` → output `feature-x-ux-spec.md`
- If PRD is `PRD.md` → output `UX-spec.md`
- If PRD is `requirements.md` → output `requirements-ux-spec.md`

Pattern: `{prd-basename}-ux-spec.md` (or just `UX-spec.md` if PRD has generic name)

**Do not output to conversation.** Always write to file so the spec is persistent.

## The Iron Law

```
NO VISUAL SPECS UNTIL ALL 8 PASSES COMPLETE
```

**Not negotiable:**
- Don't mention colors, typography, or spacing until Pass 6 is done
- Don't describe screen layouts until information architecture is explicit
- Don't design components until affordances are mapped

**No exceptions for urgency:**
- "I'm in a hurry" → Passes take 5 minutes; fixing bad UX takes days
- "Just give me screens" → Screens without foundations need rework
- "Skip the analysis" → Analysis IS the value; screens are just output
- "I know what I want" → Then passes will be fast; still do them

Skipping passes to "save time" produces specs that need redesign. The 6 passes ARE the shortcut.

## The 6 Passes

Execute these IN ORDER. Each pass produces required outputs before the next begins.

---

### Pass 1: User Intent & Mental Model Alignment

**Designer mindset:** "What does the user think is happening?"

**Force these questions:**
- What does the user believe this system does?
- What are they trying to accomplish in one sentence?
- What wrong mental models are likely?

**Required output:**
```markdown
## Pass 1: Mental Model

**Primary user intent:** [One sentence]

**Likely misconceptions:**
- [Misconception 1]
- [Misconception 2]

**UX principle to reinforce/correct:** [Specific principle]
```

---

### Pass 2: Information Architecture

**Designer mindset:** "What exists, and how is it organized?"

**Force these actions:**
1. Enumerate ALL concepts the user will encounter
2. Group into logical buckets
3. Classify each as: Primary / Secondary / Hidden (progressive)

**Required output:**
```markdown
## Pass 2: Information Architecture

**All user-visible concepts:**
- [Concept 1]
- [Concept 2]
- ...

**Grouped structure:**

### [Group Name]
- [Concept]: [Primary/Secondary/Hidden]
- Rationale: [One sentence why this grouping]

### [Group Name]
...
```

**This is where most AI UX attempts fail.** If you skip explicit IA, your visual specs will be disorganized.

---

### Pass 3: Affordances & Action Clarity

**Designer mindset:** "What actions are obvious without explanation?"

**Force explicit decisions:**
- What is clickable?
- What looks editable?
- What looks like output (read-only)?
- What looks final vs in-progress?

**Required output:**
```markdown
## Pass 3: Affordances

| Action | Visual/Interaction Signal |
|--------|---------------------------|
| [Action] | [What makes it obvious] |

**Affordance rules:**
- If user sees X, they should assume Y
- ...
```

No visuals required—just clarity on what signals what.

---

### Pass 4: Cognitive Load & Decision Minimization

**Designer mindset:** "Where will the user hesitate?"

**Force identification of:**
- Moments of choice (decisions required)
- Moments of uncertainty (unclear what to do)
- Moments of waiting (system processing)

**Then apply:**
- Collapse decisions (fewer choices)
- Delay complexity (progressive disclosure)
- Introduce defaults (reduce decision burden)

**Required output:**
```markdown
## Pass 4: Cognitive Load

**Friction points:**
| Moment | Type | Simplification |
|--------|------|----------------|
| [Where] | Choice/Uncertainty/Waiting | [How to reduce] |

**Defaults introduced:**
- [Default 1]: [Rationale]
```

---

### Pass 5: State Design & Feedback

**Designer mindset:** "How does the system talk back?"

**Force enumeration of states for EACH major element:**
- Empty
- Loading
- Success
- Partial (incomplete data)
- Error

**For each state, answer:**
- What does the user see?
- What do they understand?
- What can they do next?

**Required output:**
```markdown
## Pass 5: State Design

### [Element/Screen]

| State | User Sees | User Understands | User Can Do |
|-------|-----------|------------------|-------------|
| Empty | | | |
| Loading | | | |
| Success | | | |
| Partial | | | |
| Error | | | |

**Mandatory: Interactive Element States Matrix**

For EVERY interactive element (buttons, links, inputs, toggles, cards with actions), enumerate all visual states in a table:

```markdown
### Interactive Element States

| Element | Default | Hover | Focus | Disabled | Loading | Error |
|---------|---------|-------|-------|----------|---------|-------|
| [Button name] | [Visual description] | [Change] | [Ring style] | [When disabled + tooltip text] | [Spinner? Label change?] | [Recovery action] |
| [Input name] | [Visual description] | [Change] | [Ring style] | [When disabled] | N/A | [Error message style] |
```

**Rules for the states matrix:**
- Every interactive element gets a row — no exceptions
- "Default" must describe the visual appearance (variant, color, size)
- "Disabled" must include WHEN it's disabled and what tooltip/message explains why
- "Loading" must specify what replaces the element (spinner? skeleton? label change?)
- "Error" must specify how the user recovers
- If a state doesn't apply, write "N/A" with a reason
```

This prevents "dead UX"—screens with no feedback.

---

### Pass 6: Flow Integrity Check

**Designer mindset:** "Does this feel inevitable?"

**Final sanity check:**
- Where could users get lost?
- Where would a first-time user fail?
- What must be visible vs can be implied?

**Required output:**
```markdown
## Pass 6: Flow Integrity

**Flow risks:**
| Risk | Where | Mitigation |
|------|-------|------------|
| [Risk] | [Location] | [Guardrail/Nudge] |

**Visibility decisions:**
- Must be visible: [List]
- Can be implied: [List]

**UX constraints:** [Any hard rules for the visual phase]

**Testability check:**
For each interaction defined in Passes 3-5, verify it's testable:
- Can it be expressed as "Given [state], when [action], then [result]"?
- If not, the interaction is too vague — rewrite it before proceeding

Flag any requirement from the PRD that cannot be verified:
```markdown
**Non-testable requirements (must be rewritten):**
- [Requirement]: [Why it's not testable] → [Suggested rewrite]
```
```

---

## Pass 7: shadcn/ui Component Mapping

**After all 6 UX passes are complete**, map UX decisions to shadcn/ui components.

**Reference:** Before mapping, read `.claude/rules/design-system-map.md` for the complete inventory of installed components. Use exact component names and import paths from the map. If a needed component is not in the map, flag it as "needs installation" in the mapping table.

**Required output:**
```markdown
## Pass 7: Component Mapping (shadcn/ui)

### Data Display
| UX Element | shadcn Component | Notes |
|------------|------------------|-------|
| [List view] | DataTable | With @tanstack/react-table |
| [Card grid] | Card + ScrollArea | |

### Forms & Inputs
| UX Element | shadcn Component | Notes |
|------------|------------------|-------|
| [Form] | Form | With react-hook-form + zod |
| [Select] | Select / Combobox | |

### Feedback & States
| State | shadcn Component | Pattern |
|-------|------------------|---------|
| Loading | Skeleton | |
| Empty | Custom EmptyState | |
| Error | Alert (destructive) | |
| Success | Toast (sonner) | |

### Navigation & Layout
| UX Element | shadcn Component |
|------------|------------------|
| [Tabs] | Tabs |
| [Modal] | Dialog / Sheet |
| [Menu] | DropdownMenu |

### State Management Notes
- Server state: TanStack Query
- UI state (filters, selection, modals): Zustand store
- Form state: react-hook-form

### Visual Integration Checklist
For every component mapped above, answer these explicitly:

| Component | Question | Answer |
|-----------|----------|--------|
| Dialog/Sheet | Close button visible or hidden (`showCloseButton`)? | |
| Dialog/Sheet | Who owns the trigger — parent or dialog itself (`DialogTrigger`)? | |
| Dialog/Sheet | Fixed height or content-driven? | |
| Carousel/Stepper | Custom `renderIndicator` needed or default OK? | |
| Carousel/Stepper | Constrained inside a modal? If yes: needs `overflow-hidden` + `min-w-0` | |
| Any scrollable | Container has `overflow-hidden`? Flex children have `min-w-0`? | |
| ScrollArea (horizontal) | Content has unpredictable width (`<pre>`, wide tables)? If yes: use plain `div` with `overflow-auto`, NOT Radix ScrollArea. ScrollArea is for vertical scroll in fixed-height containers only. | |
| Side-sheet with `<pre>` | Overflow containment chain: every flex/grid ancestor up to scroll container needs `min-w-0 overflow-hidden`. | |
| Flex + scroll child | Flex children with scroll need `min-h-0` to prevent `min-height: auto` from breaking containment. | |

If a render prop component (Stepper, Carousel) is used inside a constrained container (Dialog, Sheet, Popover), explicitly specify the render prop configuration — never rely on defaults matching the UX spec.
```

---

## Pass 8: Design Language

**Designer mindset:** "What makes this look *intentional*, not *generated*?"

This pass happens AFTER component mapping (Pass 7). You now know what components exist — decide how they should look and feel.

**Force these decisions:**
1. What is the one-sentence aesthetic vision?
2. What typographic hierarchy makes Inter feel intentional?
3. How does the color palette reinforce the tone?
4. Where does motion create delight or communicate meaning?
5. What spatial choice makes this interface memorable?

**Required output:**
```markdown
## Pass 8: Design Language

**Aesthetic vision:** [One sentence, e.g., "Industrial precision with warm accents" or "Soft editorial with generous whitespace"]

**Typography (Inter):**
- Weights: [Which weights per level — e.g., 700 headings, 400 body, 300 captions]
- Size scale: [How sizes create hierarchy — e.g., 3xl display, xl headings, base body, sm captions]
- Tracking: [Letter-spacing adjustments — e.g., tight for large headings, normal for body]
- Personality lever: [What makes Inter feel crafted — weight contrast, size jumps, spacing rhythm]

**Color direction:**
- Dominant: [Existing token or new OKLCH value] — [Its role in the design]
- Accent: [Existing token or new OKLCH value] — [Where and why it appears]
- Strategy: [Monochromatic / complementary / triadic / etc.]
- New tokens: [Additions to globals.css @theme block, or "none — existing palette is sufficient"]

**Motion:**
- High-impact moment: [What animates on page load or key interaction]
- Micro-interactions: [Hover, focus, feedback animations]
- Easing: [e.g., ease-out for entrances, ease-in-out for transforms]
- Duration: [e.g., 150–300ms for UI feedback, 400–600ms for reveals]
- Library: Motion (motion.dev) for orchestrated animations — CSS transitions for simple hover/focus

**Spatial personality:**
- Density: [Airy / Balanced / Dense]
- Layout approach: [Asymmetric / Grid-breaking / Overlapping / Strict grid]
- Signature detail: [One distinctive visual element someone would remember]
```

**Anti-generic checkpoint — revise if ANY box is checked:**
- [ ] A user would guess this was AI-generated at first glance
- [ ] It looks like every other shadcn/ui site
- [ ] Inter is used with default weights and sizes — no typographic hierarchy documented
- [ ] Color is evenly distributed — no clear dominant
- [ ] No animation beyond browser defaults

**Motion setup:** See [references/output-template.md](references/output-template.md) for motion code examples (`motion.dev` for orchestrated reveals, `tw-animate-css` for simple utilities).

---

## THEN: Visual Specifications

Only after all 8 passes are complete, create:
- Screen layouts
- Component specifications
- Interaction specifications
- Responsive breakpoints

The 8 passes inform every visual decision.

## Red Flags - STOP and Restart

If you catch yourself doing any of these, STOP and return to the passes:

| Violation | What You're Skipping |
|-----------|---------------------|
| Describing colors/fonts during Passes 1-7 | Pass 8 — aesthetic decisions have a designated pass |
| "The main screen shows..." | Pass 1-2 (mental model, IA) |
| Designing components before actions mapped | Pass 3 (affordances) |
| No friction point analysis | Pass 4 (cognitive load) |
| States only in component specs | Pass 5 (holistic state design) |
| No "where could they fail?" | Pass 6 (flow integrity) |
| "User is in a hurry" | ALL passes — urgency is a trap |
| "Just this once, skip to visuals" | ALL passes — exceptions become habits |
| "The PRD is simple enough" | ALL passes — simple PRDs still need mental model analysis |
| Default fonts/colors with no documented rationale | Pass 8 — design language requires intentional choices |
| No signature detail or spatial personality | Pass 8 — distinctiveness requires deliberate decisions |

## Common Mistakes

**Merging passes:** "I'll cover mental model while doing IA" → You won't. Separate passes force separate thinking.

**Skipping to visuals:** "The PRD is clear, I can design screens" → Baseline testing shows agents skip 4+ passes when allowed.

**Implicit affordances:** "Buttons are obviously clickable" → Map EVERY action explicitly. What's obvious to you isn't obvious to users.

**Scattered state design:** "I'll add states to each component" → Holistic state table in Pass 5 catches gaps.

## Output Template

See [references/output-template.md](references/output-template.md) for the complete markdown template with all 8 pass sections pre-formatted.

## Related Skills

This skill works best when combined with:

- **shadcn-ui**: Use for component mapping in Pass 7. Reference `.cursor/skills/shadcn-ui/SKILL.md` for detailed component patterns, form validation with React Hook Form + Zod, and accessibility patterns.
- **tailwindcss-fundamentals-v4**: Use for styling specifications. Reference `.cursor/skills/tailwindcss-fundamentals-v4/SKILL.md` for OKLCH colors, fluid typography, custom utilities, and CSS-first configuration.
- **react-clean-architecture**: Use for understanding layer separation and component responsibilities. Reference `.cursor/skills/react-clean-architecture/SKILL.md` for when to extract hooks, validation boundaries, and architectural decisions.
- **create-feature**: Use for scaffolding features after UX spec is complete. Reference `.cursor/skills/create-feature/SKILL.md` for the implementation structure.

## Resume After Context Cleanup

If context was cleaned mid-pipeline, restore state before proceeding:

1. **Check for in-progress pipeline:** Look for `.claude/pipeline/*/OBSERVATION-LOG.md` with `Status: In Progress`
2. **Read DECISIONS.md** in the feature folder for accumulated context
3. **Read the relevant artifact** for this skill's input:
   - The PRD file and any existing UX spec draft (`*-ux-spec.md` or `UX-spec.md`)
4. **Resume the observer** if an OBSERVATION-LOG.md exists and is in progress
5. **Continue from where you left off** — don't restart the skill from scratch

## Next Step

After completing this skill, use the `AskUserQuestion` tool to present the next step options. Include a summary of what was completed in the question text.

Options to present:

- **ux-to-prompt** — generate build-order prompts for implementation
- **Something else** — do something different

Do NOT present numbered text options and ask the user to "type a number." Always use the `AskUserQuestion` tool for skill transitions.

## Context Management

After completing this skill's work, report the **context usage percentage** so the user can decide whether to clean context:

> "{Skill output summary}. Context usage: **{X}%**"

Do NOT recommend cleaning context — just show the percentage. The user will decide.
