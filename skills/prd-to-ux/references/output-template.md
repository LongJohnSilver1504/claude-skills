# UX Specification Output Template

Use this template structure when generating the final UX specification document.

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

## Pass 6: Flow Integrity
**Flow risks:**
| Risk | Where | Mitigation |
|------|-------|------------|
| [Risk] | [Location] | [Guardrail/Nudge] |

**Visibility decisions:**
- Must be visible: [List]
- Can be implied: [List]

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

**Motion:**
- High-impact moment: [What animates]
- Micro-interactions: [Hover, focus, feedback]
- Easing / Duration: [Specifics]

**Spatial personality:**
- Density: [Airy / Balanced / Dense]
- Layout approach: [Grid style]
- Signature detail: [Distinctive element]

---

## Visual Specifications
[Only after passes complete]
```

## Motion Setup Reference

```bash
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

**Note:** `tw-animate-css` handles simple utility animations. Use Motion (motion.dev) for orchestrated reveals, exit animations, gestures, and scroll-driven effects.
