# Tailwind v4 + shadcn/ui — Refactoring UI Translation

Concrete mappings from the book's principles to the classes and components you'll actually write.

**Viewport:** this app is mobile-only. Every page renders inside `AppContainer` (~350–400px wide). Never use `sm:`/`md:`/`lg:` breakpoint prefixes — there is exactly one layout. Width capping (rule 3.3) is already handled by `AppContainer`; inside it, think in vertical rhythm, not columns.

## Spacing (rule 3.2)

Tailwind's default scale already follows the "no two values closer than 25%" rule. Use it directly. Avoid arbitrary spacing values (`mt-[18px]`).

| Use | Class | Pixels |
|---|---|---|
| Tight intra-component (icon ↔ text) | `gap-1` `gap-2` | 4–8 |
| Within a group (label ↔ input) | `gap-2` `space-y-2` | 8 |
| Between elements in a section | `gap-4` `space-y-4` | 16 |
| **Between groups** (form sections) | `gap-6` `space-y-6` `gap-8` | 24–32 |
| Between major sections | `space-y-12` `space-y-16` | 48–64 |
| Page-level | `py-16` `py-24` | 64–96 |

Rule 3.6: spacing **between** groups should be visibly larger than spacing **within** a group. A form with `space-y-4` on the wrapper and `space-y-2` on each field is the canonical pattern.

## Typography (rules 2.2, 4.1, 4.5)

Use built-in size tokens. Default body should be `text-base` (16px).

| Role | Class | Notes |
|---|---|---|
| Page hero headline | `text-3xl font-bold tracking-tight` | tight tracking on big text (rule 4.8); mobile ratios are closer (rule 3.5), so hero ≠ huge |
| Section heading | `text-2xl font-semibold` | usually NOT bigger |
| Subsection / card title | `text-lg font-semibold` | |
| Body | `text-base` | leading-relaxed for paragraphs |
| Helper / metadata | `text-sm text-muted-foreground` | |
| Microcopy / labels | `text-xs uppercase tracking-wider text-muted-foreground` | letter-spacing for all-caps (rule 4.8) |

**Line-height (rule 4.5):**
- Headlines: `leading-tight` (1.25) or `leading-none` (1)
- Body paragraphs: `leading-relaxed` (1.625) or `leading-loose` (2) for wide content
- UI labels / short text: default `leading-normal` is fine

**Line length (rule 4.3):** at ~350px, `text-base` lines land around 40–50 characters — already in range. No line-length capping needed; if text feels cramped, the fix is padding, not width.

**Never use `font-thin`, `font-extralight`, `font-light` for UI text** (rule 2.2). `font-normal` (400) is the lightest. Two-weight system: `font-normal` + `font-semibold` covers most UI.

## Color & text hierarchy (rules 2.2, 2.3, 5.2, 5.6)

All colors come from the semantic tokens in `src/styles/globals.css` — never raw palette classes (`text-gray-500`, `bg-blue-100`); a hook blocks them. The tokens already encode hierarchy:

| Need | Token | Tailwind class |
|---|---|---|
| Primary text | `--foreground` | `text-foreground` |
| Secondary text | `--muted-foreground` | `text-muted-foreground` |
| Disabled / very subtle | mix muted with opacity | `text-muted-foreground/70` |
| Brand / primary action | `--primary` | `text-primary` `bg-primary` |
| Destructive | `--destructive` | `text-destructive` |
| Success / warning / info | `--success` `--warning` `--info` | `text-success` `bg-warning` `text-info` |

**Rule 2.3 (grey on colored bg):** never put grey text (`text-muted-foreground`) on a colored surface. Colored surfaces come as token **pairs** with a same-hue readable counterpart — use the pair: `text-warning-foreground` on `bg-warning`, `text-success-foreground` on `bg-success`, `text-destructive-foreground` on `bg-destructive`, `text-primary-foreground` on `bg-primary`. If a colored panel needs a text shade that no existing pair covers, add a new same-hue token to `globals.css` per `color-usage.md` — don't approximate with opacity (`text-white/80` desaturates) and never with a raw palette class.

For new kinds of colored panels, define them as themed surfaces — a `--x` / `--x-foreground` token pair — rather than dropping greys onto colored regions.

## Buttons & button hierarchy (rule 2.8)

Use shadcn `<Button>` variants by **role**, not by visual preference:

| Tier | shadcn variant | When |
|---|---|---|
| Primary | `default` | The one main action of the area/page |
| Secondary | `outline` or `secondary` | Supporting actions |
| Tertiary | `ghost` or `link` | Nav, dismissals, "Cancel" |
| Destructive | `destructive` (only when destructive IS primary) | Confirmation modals |

**Anti-pattern:** three `<Button>` (default variant) side by side. One should be `default`, others `outline` / `ghost`.

**Destructive-but-not-primary:** "Delete account" in a settings page should be `variant="ghost" className="text-destructive"`, not big and red. Save the loud destructive button for the confirmation modal.

**Touch targets:** every interactive element needs ≥ 44×44px (`min-h-11`, `size-11` for icon buttons) — mobile-only app, accessibility rule 1.

## Borders & separation (rule 8.5)

Before adding `border`, try:
- `bg-muted` or `bg-card` vs the page `bg-background` — color difference alone may be enough.
- `shadow-sm` — softer than a border.
- Larger gap (`gap-8` instead of `gap-4` + `border`).

If you have **both** different background colors AND a border between elements, the border is redundant — remove it.

## Shadows & elevation (rules 6.1, 6.2, 6.3)

Tailwind's defaults work, but map them by elevation:

| Elevation | Tailwind | When |
|---|---|---|
| Resting on surface | `shadow-none` or `shadow-xs` | Inputs, default cards |
| Slightly raised | `shadow-sm` | Buttons (default), cards |
| Hover lift | `shadow-md` | Card on hover, draggable item |
| Floating | `shadow-lg` | Dropdowns, popovers |
| Modal-level | `shadow-xl` `shadow-2xl` | Dialog, command palette |

**Avoid mixing elevations randomly.** A dropdown and a modal should not share a shadow. Pick a level per component primitive and stick to it.

**Press state (rule 6.2):** for clickable cards or buttons that should feel "pressed," reduce shadow on `:active` — `active:shadow-none` paired with the resting shadow.

## Borders for accent (rule 8.2)

A simple win — colored bar across the top of a card or left of an alert:

```tsx
<div className="border-t-4 border-primary bg-card rounded-md p-6">...</div>
```

Or under an active nav item:

```tsx
<button className="border-b-2 border-transparent hover:border-primary aria-current:border-primary">...</button>
```

## Forms (rules 3.6, 2.5)

Canonical form structure that satisfies rule 3.6 (more space between groups than within):

```tsx
<form className="space-y-6">           {/* between groups */}
  <div className="space-y-2">          {/* within a group */}
    <Label htmlFor="email">Email</Label>
    <Input id="email" />
    <p className="text-sm text-muted-foreground">We'll never share it.</p>
  </div>
  <div className="space-y-2">
    <Label htmlFor="password">Password</Label>
    <Input id="password" type="password" />
  </div>
</form>
```

The `space-y-6` outer ≫ `space-y-2` inner is the key. If they're equal, the form reads as a flat list.

## Empty states (rule 8.4)

Don't just show "No items." Pattern:

```tsx
<div className="flex flex-col items-center justify-center py-16 text-center">
  <Icon className="size-12 text-muted-foreground mb-4" />
  <h3 className="text-lg font-semibold mb-2">No invoices yet</h3>
  <p className="text-muted-foreground mb-6">
    Create your first invoice to start tracking payments.
  </p>
  <Button>Create invoice</Button>
</div>
```

Also: hide the filter/sort/tab UI that does nothing until there's content.

## Aligning mixed-size text (rule 4.4)

When the same horizontal row has different font sizes, use baseline alignment:

```tsx
<div className="flex items-baseline gap-2">
  <span className="text-3xl font-bold">$249</span>
  <span className="text-sm text-muted-foreground">/month</span>
</div>
```

`items-baseline` instead of `items-center` is almost always right for price + unit, title + metadata, headline + timestamp.

## Numbers in tables (rule 4.7)

Right-align numeric columns and use tabular figures:

```tsx
<td className="text-right tabular-nums">
  $1,249.00
</td>
```

(`tabular-nums` is the Tailwind class.)

## Dark mode

The semantic tokens (`--foreground`, `--muted-foreground`, `--primary`, `--warning`, etc.) carry both light and dark values in `globals.css`, so dark mode is automatic. If you find yourself writing `dark:` overrides in a component, you're bypassing tokens — fix or add the token instead.
