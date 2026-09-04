---
paths: ["src/**/*.tsx"]
---

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

## What the Primitives Do NOT Give You

Radix/shadcn wire the composite widgets; on any hand-rolled or wrapped control (custom combobox, segmented control, date-picker trigger, dropzone) the items below stay yours. Each is checkable in review.

### 1. Link error text on custom widgets

```tsx
// ❌ Error is visible but unreachable for screen readers
<div role="combobox" aria-expanded={open} />
<p className="text-destructive">Pick a location</p>

// ✅ aria-describedby + aria-invalid connect the message to the control
<div role="combobox" aria-expanded={open} aria-invalid={!!error}
     aria-describedby={error ? errorId : undefined} />
{error && <p id={errorId} className="text-destructive">{error}</p>}
```

### 2. `role="status"` (polite) vs `role="alert"` (assertive)

- **Form validation, save confirmations, result counts → ✅ `role="status"`.** ❌ `role="alert"` here interrupts the user mid-keystroke and re-announces on every change.
- **Failed destructive action** — delete failed, payment declined, session expired — **→ ✅ `role="alert"`.** The action did NOT happen; the user must hear it before moving on. ❌ `role="status"` lets it pass unnoticed.
- Mount the live region **before** the message arrives — a region rendered together with its text is often never announced.

### 3. `useId` for every `aria-controls` / `aria-labelledby` pair

```tsx
// ❌ <button aria-controls="panel"> … <div id="panel">   — ids collide when the component renders twice on a screen
// ✅ const panelId = useId()  →  aria-controls={panelId} … id={panelId}   — unique per instance, stable across renders, SSR-safe
```

### 4. `autoComplete` + `inputMode` on mobile inputs

`type` alone does not settle the keyboard: `inputMode` picks the on-screen keypad and `autoComplete` enables OS autofill. Both are required on every text-entry field.

- Phone → `type="tel" inputMode="tel" autoComplete="tel"`; email → `type="email" inputMode="email" autoComplete="email"`
- Numeric code / quantity → `inputMode="numeric"` (OTP also `autoComplete="one-time-code"`); postal code → `inputMode="numeric" autoComplete="postal-code"`

### 5. Touch targets

The project standard is 44x44px (Hard Rule 1); WCAG 2.5.8 sets 24x24 CSS px as the absolute floor. **Under 24px is a WCAG failure; 24-43px is a finding against this project's standard.** Padding and a transparent `::before` overlay both count toward the hit area — the visual icon may stay small.

### 6. Focus is never removed, only replaced

```tsx
// ❌ <button className="outline-none">Save</button>                                              — keyboard users lose their place
// ✅ <button className="outline-none focus-visible:ring-2 focus-visible:ring-ring">Save</button>  — replacement ring on the same element
```

### 7. `inert` on background content behind custom overlays

```tsx
// ❌ <div className="fixed inset-0">{sheet}</div>                       — Tab walks straight into the page behind it
// ✅ <main inert={isSheetOpen ? '' : undefined}>{page}</main>  plus  role="dialog" aria-modal="true" on the sheet
```

The shadcn `Dialog`/`Sheet` handle this already; an overlay built without them sets `inert` on the background and returns focus to the trigger on close.
