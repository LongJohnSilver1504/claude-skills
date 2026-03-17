---
name: ux-to-prompt
description: Transform UX specifications into self-contained, build-order prompts for UI generation tools. Use when user has a UX spec, PRD, or feature doc and needs sequential coding prompts for tools like v0, Bolt, Cursor, or Claude. Also triggers on "build prompts from spec", "implementation prompts", "coding prompts from design", or "prompt sequence".
---

# UX Spec to Build-Order Prompts

Transform detailed UX specifications into a sequence of self-contained prompts optimized for UI generation tools. Each prompt builds one discrete feature/view with full context included.

## When to Use

- User has a UX spec, PRD, or detailed feature documentation
- Output needs to feed into UI generation tools (v0, Bolt, Claude, etc.)
- User wants build-order sequencing (foundations → features → polish)
- Large specs that would overwhelm a single prompt

**Not for:** Quick component requests, already-atomic features, specs that fit in one prompt.

## Related Skills

- **shadcn-ui**: Component patterns, form validation, accessibility
- **tailwindcss-fundamentals-v4**: OKLCH colors, fluid typography, @theme configuration
- **react-clean-architecture**: Layer separation, component responsibilities
- **create-feature**: Feature scaffolding after prompts are generated

## Core Pattern

```
UX Spec → Extract Atomic Units → Sequence by Dependencies → Generate Self-Contained Prompts
```

## Build Order Strategy

Generate prompts in this order:

| Phase | What to Include | shadcn/ui & Tailwind Focus |
|-------|-----------------|---------------------------|
| **1. Foundation** | Design tokens, typography, color palette, shared types, base styles | @theme config, CSS variables, cn() utility, next/font, design language tokens |
| **2. Layout Shell** | Page structure, navigation, panels | Sheet, NavigationMenu, Sidebar patterns |
| **3. Core Components** | Primary UI elements (nodes, cards, inputs) | Card, Form, Input, Select, Button |
| **4. Interactions** | Drag-drop, connections, pickers | Dialog, Popover, DropdownMenu, Command |
| **5. States & Feedback** | Empty, loading, error, success states | Skeleton, Alert, Toast (sonner), Progress |
| **6. Polish** | Animations, responsive, edge cases | Motion (motion.dev), tw-animate-css, motion-reduce, responsive breakpoints |

## Prompt Structure Template

Each generated prompt follows this structure:

```markdown
## [Feature Name]

### Context
[What this feature is and where it fits in the app]

### Requirements
- [Specific behavior/appearance requirement]
- [Include relevant specs: dimensions, colors, states]

### shadcn/ui Components
- [Primary component]: [e.g., Card, Dialog, Form]
- [Supporting components]: [e.g., Button, Input, Select]
- [Feedback components]: [e.g., Toast, Alert, Skeleton]

### Tailwind Styling
- [Layout]: [e.g., flex, grid patterns]
- [Spacing]: [e.g., gap-4, p-6]
- [Colors]: [e.g., bg-primary, text-muted-foreground]
- [Responsive]: [e.g., md:grid-cols-2, lg:px-8]

### Design Language
- [Typography]: [Inter weight/size/tracking for this component]
- [Color accent]: [Accent colors from design language applied here]
- [Motion]: [Animations — easing, duration, trigger]
- [Signature detail]: [Distinctive visual element from Pass 8]

### States
- Default: [description]
- Loading: [Skeleton pattern]
- Empty: [EmptyState pattern]
- Error: [Alert destructive variant]
- Success: [Toast notification]

### Interactions
- [How user interacts]
- [Keyboard support if applicable]
- [Form validation rules if applicable]

### Verification
- [ ] [Given X state, when user does Y, then Z happens]
- [ ] [Given empty data, component shows empty state]
- [ ] [Given error response, user sees recovery action]

### Constraints
- [Technical or design constraints]
- [What NOT to include]
```

## Extraction Process

### Step 1: Identify Atomic Units

Read through the spec and list discrete buildable features:
- Each screen/view
- Each reusable component
- Each interaction pattern
- Each state variation

### Step 2: Map Dependencies

For each unit, note what it requires:
- "Node card requires design tokens"
- "Connection lines require nodes to exist"
- "Lens picker requires prompt field"

### Step 3: Sequence by Dependency Graph

Order units so dependencies come first. Group related items into single prompts when they're tightly coupled.

### Step 4: Write Self-Contained Prompts

For each prompt:
1. **Re-state relevant context** — Don't assume reader saw previous prompts
2. **Include specific measurements** — Extract from spec (dimensions, spacing)
3. **Include all states** — Pull from state design section
4. **Include interaction details** — Pull from affordances section
5. **Include verification criteria** — Testable assertions for this prompt
6. **Set boundaries** — What this prompt does NOT include

## Self-Containment Rules

Each prompt MUST include:
- Enough context to understand the feature in isolation
- All visual specs (colors, spacing, dimensions) relevant to that feature
- All states that feature can be in
- All interactions for that feature
- Verification criteria (Given/When/Then or checkbox assertions)

Each prompt MUST NOT:
- Reference "see previous prompt" or "as described earlier"
- Assume knowledge from other prompts
- Leave specs vague ("appropriate styling")

## Example

See [references/example-prompt.md](references/example-prompt.md) for a complete before/after transformation from UX spec to self-contained prompt.

## Output Format

Generate a markdown document with:

```markdown
# Build-Order Prompts: [Project Name]

## Source Documents
- **PRD**: [path]
- **UX Specification**: [path]

## Tech Stack
- **Components**: shadcn/ui
- **Styling**: Tailwind CSS v4
- **Forms**: React Hook Form + Zod
- **State**: TanStack Query (server) + Zustand (UI, if needed)

## Build Sequence
1. [Prompt name] — [brief description] — [shadcn components]
2. [Prompt name] — [brief description] — [shadcn components]
...

---

## Prompt 1: [Feature Name]
[Full self-contained prompt]

---

## Prompt 2: [Feature Name]
[Full self-contained prompt]
```

## Quality Checklist

Before finalizing:

- [ ] Every measurement from spec is captured in a prompt
- [ ] Every state from spec is captured in a prompt
- [ ] Every interaction from spec is captured in a prompt
- [ ] No prompt references another prompt
- [ ] Build order respects dependencies
- [ ] Each prompt could be given to someone with no context
- [ ] Each prompt has verification criteria (testable assertions)
- [ ] shadcn/ui components specified for each UI element
- [ ] Tailwind classes included for styling
- [ ] Form prompts include React Hook Form + Zod patterns
- [ ] Accessibility included (focus states, ARIA, keyboard nav)
- [ ] Design language from Pass 8 reflected (typography, color, motion)
- [ ] Foundation prompt includes font loading and CSS tokens
- [ ] At least one component has a signature visual detail
