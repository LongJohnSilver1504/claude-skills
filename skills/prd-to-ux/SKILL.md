---
name: prd-to-ux
description: Translate PRDs or feature specs into UX specifications through 9 structured passes (mental model, IA, affordances, cognitive load, state design, flow integrity, component mapping, design language, test matrix). Use when user says "design the UX", "UX for this feature", "how should this look", before creating wireframes or component specs, or when translating requirements into design handoff documents.
---

# PRD to UX Translation

Translate product requirements into UX foundations through **9 structured passes**. Each pass asks different questions that visual-first approaches skip.

**Core principle:** UX foundations come BEFORE visual specifications. Mental models, information architecture, and cognitive load analysis prevent "pretty but unusable" designs. Do all 9 passes in order — skipping passes to "save time" produces specs that need redesign. The passes ARE the shortcut.

## Output Location

Write the UX specification to a file in the same directory as the source PRD.

- If PRD is `feature-x.md` → output `feature-x-ux-spec.md`
- If PRD is `PRD.md` → output `UX-spec.md`

Always write to file, not to conversation.

## The 9 Passes

Execute IN ORDER. No visual specs (colors, typography, layouts) until all 9 are complete.

---

### Pass 1: User Intent & Mental Model Alignment

**"What does the user think is happening?"**

Force these questions:
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

**"What exists, and how is it organized?"**

1. Enumerate ALL concepts the user will encounter
2. Group into logical buckets
3. Classify each as: Primary / Secondary / Hidden (progressive)

**Required output:**
```markdown
## Pass 2: Information Architecture

**All user-visible concepts:**
- [Concept 1]
- [Concept 2]

**Grouped structure:**

### [Group Name]
- [Concept]: [Primary/Secondary/Hidden]
- Rationale: [One sentence why this grouping]
```

**This is where most AI UX attempts fail.** If you skip explicit IA, your visual specs will be disorganized.

---

### Pass 3: Affordances & Action Clarity

**"What actions are obvious without explanation?"**

Force explicit decisions:
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
```

---

### Pass 4: Cognitive Load & Decision Minimization

**"Where will the user hesitate?"**

Identify:
- Moments of choice (decisions required)
- Moments of uncertainty (unclear what to do)
- Moments of waiting (system processing)

Then apply: collapse decisions, delay complexity (progressive disclosure), introduce defaults.

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

**"How does the system talk back?"**

Enumerate states for EACH major element: Empty, Loading, Success, Partial, Error.

For each state: What does the user see? What do they understand? What can they do next?

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
```

**Interactive Element States Matrix** — for EVERY interactive element:

```markdown
| Element | Default | Hover | Focus | Disabled | Loading | Error |
|---------|---------|-------|-------|----------|---------|-----|
| [Button] | [Visual] | [Change] | [Ring] | [When + tooltip] | [Spinner/label?] | [Recovery] |
```

Rules:
- Every interactive element gets a row
- "Disabled" must include WHEN and what tooltip explains why
- "Loading" must specify what replaces the element
- "Error" must specify how the user recovers
- N/A with a reason if state doesn't apply

---

### Pass 6: Flow Integrity Check

**"Does this feel inevitable?"**

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

**Testability check:**
For each interaction in Passes 3-5, verify it's expressible as "Given [state], when [action], then [result]". Flag any that aren't:

**Non-testable requirements (must be rewritten):**
- [Requirement]: [Why] → [Suggested rewrite]
```

---

### Pass 7: shadcn/ui Component Mapping

**After Passes 1-6 are complete**, map UX decisions to shadcn/ui components.

**Reference:** Before mapping, read `.claude/rules/design-system-map.md` for the complete inventory of installed components.

**Required output:**
```markdown
## Pass 7: Component Mapping (shadcn/ui)

### Data Display
| UX Element | shadcn Component | Notes |
|------------|------------------|-------|
| [List view] | DataTable | With @tanstack/react-table |

### Forms & Inputs
| UX Element | shadcn Component | Notes |
|------------|------------------|-------|
| [Form] | Form | With react-hook-form + zod |

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

### State Management Notes
- Server state: TanStack Query
- UI state: Zustand store
- Form state: react-hook-form
```

**Visual Integration Checklist** — for every component mapped above:

| Component | Question | Answer |
|-----------|----------|--------|
| Dialog/Sheet | Close button visible or hidden? | |
| Dialog/Sheet | Who owns the trigger — parent or dialog? | |
| Dialog/Sheet | Fixed height or content-driven? | |
| Dialog/Sheet | Action buttons use `size="hero"` (44px+ touch targets)? | |
| Carousel/Stepper | Custom `renderIndicator` needed? | |
| Carousel/Stepper | Constrained inside a modal? If yes: `overflow-hidden` + `min-w-0` | |
| ScrollArea (horizontal) | Content has unpredictable width? If yes: use plain `div` with `overflow-auto`, NOT Radix ScrollArea. | |
| Side-sheet with `<pre>` | Overflow containment: every flex/grid ancestor needs `min-w-0 overflow-hidden`. | |
| Flex + scroll child | Needs `min-h-0` to prevent `min-height: auto` from breaking containment. | |

If a render prop component is used inside a constrained container, explicitly specify the render prop configuration — never rely on defaults.

**Figma Cross-Check** (when Figma node is referenced in PRD):

Fetch the design context using Figma MCP tool before finalizing. Compare against your mapping for: card/container structure, typography, section layout, spacing, icon sizes. If Figma diverges, update the spec to match Figma for visual details. The UX spec owns behavior/states; Figma owns visual treatment.

---

### Pass 8: Design Language

**"What makes this look intentional, not generated?"**

**Required output:**
```markdown
## Pass 8: Design Language

**Aesthetic vision:** [One sentence]

**Typography (Inter):**
- Weights: [Per level — e.g., 700 headings, 400 body, 300 captions]
- Size scale: [How sizes create hierarchy]
- Tracking: [Letter-spacing adjustments]
- Personality lever: [What makes Inter feel crafted]

**Color direction:**
- Dominant: [Token or OKLCH value] — [Role]
- Accent: [Token or OKLCH value] — [Where and why]
- Strategy: [Monochromatic / complementary / etc.]
- New tokens: [Additions to globals.css or "none — existing palette sufficient"]

**Motion:**
- High-impact moment: [Key animation]
- Micro-interactions: [Hover, focus, feedback]
- Easing + Duration: [e.g., ease-out 150-300ms for feedback, 400-600ms for reveals]
- Library: Motion (motion.dev) for orchestrated — CSS transitions for simple

**Spatial personality:**
- Density: [Airy / Balanced / Dense]
- Layout approach: [Asymmetric / Grid-breaking / Strict grid]
- Signature detail: [One distinctive visual element]
```

**Anti-generic checkpoint — revise if ANY is true:**
- A user would guess this was AI-generated at first glance
- It looks like every other shadcn/ui site
- Inter is used with default weights — no typographic hierarchy documented
- Color is evenly distributed — no clear dominant
- No animation beyond browser defaults

**Motion setup:** See [references/output-template.md](references/output-template.md) for motion code examples.

---

### Pass 9: Test Matrix

**"How do we verify this works?"**

Derive testable scenarios from Passes 3, 5, 6, and 7. This matrix becomes the input for `/frontend-testing` later.

**Required output:**

```markdown
## Pass 9: Test Matrix

### Interaction Tests (from Pass 3)

| # | Interaction | Given | When | Then | Priority |
|---|-------------|-------|------|------|----------|
| I1 | [Action name] | [Precondition] | [User action] | [Expected result] | High/Medium/Low |

### State Tests (from Pass 5)

| # | Component | State | Expected Visual | Expected Behavior |
|---|-----------|-------|-----------------|-------------------|
| S1 | [Component] | Empty | [What user sees] | [What user can do] |
| S2 | [Component] | Loading | [Skeleton/spinner] | [Disabled interactions] |
| S3 | [Component] | Error | [Error display] | [Recovery action available] |

### Edge Case Tests (from Pass 6)

| # | Scenario | Setup | Action | Expected | Priority |
|---|----------|-------|--------|----------|----------|
| E1 | [Risk description] | [How to reproduce] | [Trigger] | [Expected guardrail] | High/Medium |

### Accessibility Tests (from Pass 7)

| # | Component | Check | Method |
|---|-----------|-------|--------|
| A1 | [Component] | Keyboard navigable | Tab + Enter/Space |
| A2 | [Icon button] | aria-label present | Inspect attribute |
| A3 | [Touch target] | ≥ 44px | Measure rendered size |
| A4 | [Form input] | Error announced | aria-invalid + FieldError |

### Test Summary

| Category | Count | High | Medium | Low |
|----------|-------|------|--------|-----|
| Interaction | {n} | {n} | {n} | {n} |
| State | {n} | {n} | {n} | {n} |
| Edge Case | {n} | {n} | {n} | {n} |
| Accessibility | {n} | {n} | {n} | {n} |
| **Total** | **{n}** | **{n}** | **{n}** | **{n}** |
```

**Rules:**
- Every Pass 3 affordance gets at least one interaction test
- Every Pass 5 state gets a state test (Empty + Error always High, Loading Medium)
- Every Pass 6 flow risk gets an edge case test
- All tests use Given/When/Then format — maps directly to test code
- Priority: critical path = High, secondary = Medium, pure edge case = Low
- Tests describe user-visible behavior only — never implementation details (class names, internal state)

**Coverage policy:** Minimum = all High priority. Recommended = High + Medium.

**Anti-patterns to avoid:**
- Testing implementation (`useState updates to true`) → test what the user sees
- Only happy path → cover empty, loading, error, disabled
- Vague assertions ("page works") → be specific about what's visible/clickable
- Skipping accessibility → a11y is part of the matrix from the start

---

## THEN: Visual Specifications

Only after all 9 passes, create: screen layouts, component specifications, interaction specifications, responsive breakpoints. The 9 passes inform every visual decision.

## Output Template

See [references/output-template.md](references/output-template.md) for the complete markdown template with all 8 pass sections pre-formatted.

## Related Skills

- **shadcn-ui**: Component patterns, form validation, accessibility
- **tailwindcss-fundamentals-v4**: OKLCH colors, fluid typography, custom utilities
- **react-clean-architecture**: Layer separation, component responsibilities
- **create-feature**: Scaffolding features after UX spec is complete
