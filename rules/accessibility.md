# Accessibility Standard

> **Scope:** Project-wide. Applies to all new code in `src/`.

## Compliance Level

**WCAG 2.1 AA** — all new features must meet this standard.

## Hard Rules

1. **Touch targets:** Minimum 44x44px for all interactive elements (mobile-only app).
2. **Color contrast:** Minimum 4.5:1 for normal text, 3:1 for large text (OKLCH palette must pass).
3. **Focus indicators:** Visible focus ring on all interactive elements (`focus-visible:ring-2 focus-visible:ring-ring`).
4. **Semantic HTML:** Use correct elements (`button` for actions, `a` for navigation, `input` for data entry).
5. **ARIA labels:** All icon-only buttons must have `aria-label`. All form inputs must have associated labels.
6. **Keyboard navigation:** All interactive elements reachable and operable via keyboard.
7. **Screen reader:** Content order must make sense when read linearly.

## shadcn/ui Components

shadcn/ui components are built on Radix UI primitives which handle most accessibility out of the box:
- Focus management in dialogs/sheets
- Arrow key navigation in selects/menus
- Escape to close overlays
- ARIA attributes on composite components

**Your responsibility:** Provide labels, descriptions, and correct semantic structure around these components.
