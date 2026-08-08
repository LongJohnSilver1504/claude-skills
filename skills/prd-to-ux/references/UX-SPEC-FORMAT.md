# UX Specification Output Template

Use this template structure when generating the final UX specification document. It contains all 9 pass sections from SKILL.md — do not omit any.

```markdown
# UX Specification: [Product Name]

## Pass 1: Mental Model
**Primary user intent:** [One sentence]

**Likely misconceptions:**
- [Misconception 1]
- [Misconception 2]

**UX principle to reinforce/correct:** [Specific principle]

## Pass 2: Information Architecture
**All user-visible concepts:**
- [Concept 1]
- [Concept 2]

**Grouped structure:**

### [Group Name]
- [Concept]: [Primary/Secondary/Hidden]
- Rationale: [One sentence why this grouping]

## Pass 3: Affordances
| Action | Visual/Interaction Signal |
|--------|---------------------------|
| [Action] | [What makes it obvious] |

**Affordance rules:**
- If user sees X, they should assume Y

## Pass 4: Cognitive Load
**Friction points:**
| Moment | Type | Simplification |
|--------|------|----------------|
| [Where] | Choice/Uncertainty/Waiting | [How to reduce] |

**Defaults introduced:**
- [Default 1]: [Rationale]

## Pass 5: State Design
### [Element/Screen]
| State | User Sees | User Understands | User Can Do |
|-------|-----------|------------------|-------------|
| Empty | | | |
| Loading | | | |
| Success | | | |
| Partial | | | |
| Error | | | |

### Interactive Element States Matrix

Every interactive element gets a row. Mobile-only, touch-only — specify Pressed/Active, not Hover.

| Element | Default | Pressed/Active | Focus | Disabled | Loading | Error |
|---------|---------|----------------|-------|----------|---------|-------|
| [Button] | [Visual] | [Change] | [Ring] | [When + tooltip] | [Spinner/label?] | [Recovery] |

Rules:
- Every interactive element gets a row
- "Disabled" must include WHEN and what tooltip explains why
- "Loading" must specify what replaces the element
- "Error" must specify how the user recovers
- N/A with a reason if state doesn't apply

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

## Pass 7: Component Mapping (shadcn/ui)
### Data Display
| UX Element | shadcn Component | Notes |
|------------|------------------|-------|

### Forms & Inputs
| UX Element | shadcn Component | Notes |
|------------|------------------|-------|

### Feedback & States
| State | shadcn Component | Pattern |
|-------|------------------|---------|

### Navigation & Layout
| UX Element | shadcn Component |
|------------|------------------|

### State Management Notes
- Server state: TanStack Query
- UI state: Zustand store
- Form state: react-hook-form

### Visual Integration Checklist

For every component mapped above:

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

## Pass 8: Design Language
**Aesthetic vision:** [One sentence]

**Typography (Inter):**
- Weights: [Which weights per level]
- Size scale: [How sizes create hierarchy]
- Tracking: [Letter-spacing adjustments]
- Personality lever: [What makes Inter feel crafted]

**Color direction:**
- Dominant: [Token or OKLCH value] — [Role]
- Accent: [Token or OKLCH value] — [Where/why]
- Strategy: [Monochromatic / complementary / etc.]
- New tokens: [Additions to globals.css or "none — existing palette sufficient"]

**Motion (opt-in — default is CSS transitions only):**
- Default: CSS transitions / `tw-animate-css` — no library
- High-impact moment: [Key animation, or "none — transitions sufficient"]
- Micro-interactions: [Pressed/active, focus, feedback]
- Easing / Duration: [e.g., ease-out 150-300ms for feedback, 400-600ms for reveals]
- Library: [Usually "none". Propose the `motion` package only if the PRD justifies an orchestrated reveal — cite the PRD requirement]

**Spatial personality:**
- Density: [Airy / Balanced / Dense]
- Layout approach: [Grid style]
- Signature detail: [Distinctive element]

**Anti-generic checkpoint — revise if ANY is true:**
- A user would guess this was AI-generated at first glance
- It looks like every other shadcn/ui site
- Inter is used with default weights — no typographic hierarchy documented
- Color is evenly distributed — no clear dominant
- No animation beyond browser defaults

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

---

## Visual Specifications
[Only after all 9 passes complete. Single mobile viewport — no responsive breakpoints.]
```

## Motion Setup Reference (opt-in only)

**Default: CSS transitions and `tw-animate-css` — no package install.** Only use the snippets below when the PRD justifies an orchestrated reveal (staggered lists, exit animations, gestures, scroll-driven effects). Do NOT add `motion` as a routine step for every feature.

```bash
# Only when the PRD justifies orchestrated motion:
pnpm add motion
```

```tsx
// Orchestrated page-load reveal
import { motion } from 'motion/react'

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.4, ease: 'easeOut' }}
>
  {children}
</motion.div>
```

```tsx
// Staggered list reveal
import { motion } from 'motion/react'

<motion.ul initial="hidden" animate="visible" variants={{
  visible: { transition: { staggerChildren: 0.06 } },
}}>
  {items.map(item => (
    <motion.li key={item.id} variants={{
      hidden: { opacity: 0, y: 10 },
      visible: { opacity: 1, y: 0 },
    }} />
  ))}
</motion.ul>
```

**Note:** `tw-animate-css` handles simple utility animations. Reach for Motion (motion.dev) only for orchestrated reveals, exit animations, gestures, and scroll-driven effects that CSS transitions cannot express.
