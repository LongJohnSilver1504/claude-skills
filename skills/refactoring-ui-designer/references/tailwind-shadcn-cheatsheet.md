# Tailwind v4 + shadcn/ui — Refactoring UI Translation

Concrete mappings from the book's principles to the classes and components you'll actually write.

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
| Page hero headline | `text-4xl md:text-5xl font-bold tracking-tight` | tight tracking on big text (rule 4.8) |
| Section heading | `text-2xl font-semibold` | usually NOT bigger |
| Subsection / card title | `text-lg font-semibold` | |
| Body | `text-base` | leading-relaxed for paragraphs |
| Helper / metadata | `text-sm text-muted-foreground` | |
| Microcopy / labels | `text-xs uppercase tracking-wider text-muted-foreground` | letter-spacing for all-caps (rule 4.8) |

**Line-height (rule 4.5):**
- Headlines: `leading-tight` (1.25) or `leading-none` (1)
- Body paragraphs: `leading-relaxed` (1.625) or `leading-loose` (2) for wide content
- UI labels / short text: default `leading-normal` is fine

**Line length (rule 4.3):** cap paragraph width with `max-w-prose` (~65 chars) or `max-w-2xl` (672px). Body inside wider containers — wrap the paragraph, not the container.

**Never use `font-thin`, `font-extralight`, `font-light` for UI text** (rule 2.2). `font-normal` (400) is the lightest. Two-weight system: `font-normal` + `font-semibold` covers most UI.

## Color & text hierarchy (rules 2.2, 2.3, 5.2, 5.6)

shadcn/ui's tokens already encode hierarchy. Use them:

| Need | Token | Tailwind class |
|---|---|---|
| Primary text | `--foreground` | `text-foreground` |
| Secondary text | `--muted-foreground` | `text-muted-foreground` |
| Disabled / very subtle | mix muted with opacity | `text-muted-foreground/70` |
| Brand / primary action | `--primary` | `text-primary` `bg-primary` |
| Destructive | `--destructive` | `text-destructive` |

**Rule 2.3 (grey on colored bg):** never use raw `text-gray-400` on `bg-blue-600`. Two correct approaches in Tailwind:
1. Use a same-hue lighter shade: `text-blue-100` or `text-blue-200` on `bg-blue-600`.
2. Use Tailwind v4's color mixing: `text-white/80` works visually but desaturates. Hand-pick when possible.

For colored panels in shadcn, define them as themed surfaces — e.g. a `--info-foreground` token on `--info` background — rather than dropping greys onto colored regions.

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
  <p className="text-muted-foreground max-w-sm mb-6">
    Create your first invoice to start tracking payments.
  </p>
  <Button>Create invoice</Button>
</div>
```

Also: hide the filter/sort/tab UI that does nothing until there's content.

## Width constraints (rules 3.3, 4.3)

Don't go full-width by default. Cap content widths:

| Content type | Class |
|---|---|
| Long-form article | `max-w-prose` (~65ch) |
| Form, settings panel | `max-w-md` or `max-w-lg` |
| Dashboard / app shell | `max-w-7xl` |
| Marketing page section | `max-w-6xl` |

Pair with `mx-auto` to center. The page nav can be full-width; the content inside doesn't have to be.

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
<td className="text-right font-variant-numeric-tabular-nums tabular-nums">
  $1,249.00
</td>
```

(`tabular-nums` is the Tailwind class.)

## Dark mode

shadcn tokens (`--foreground`, `--muted-foreground`, `--primary`, etc.) handle dark mode automatically when the theme is set up. If you find yourself writing `dark:text-gray-X` everywhere, you're probably bypassing tokens — fix the theme instead.
