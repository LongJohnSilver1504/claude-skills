# Token naming

## Two tiers

```css
:root {
  /* Tier 1: primitives, named by appearance. Never used directly in a component. */
  --blue-500: #3b82f6;
  --neutral-200: #e5e7eb;
  --neutral-700: #374151;

  /* Tier 2: semantics, named by role. The only tier components reference. */
  --color-accent-solid: var(--blue-500);
  --color-border: var(--neutral-200);
  --color-text-secondary: var(--neutral-700);
}
```

Dark mode, a white-label theme and an increased-contrast variant repoint the semantic tier and leave every component untouched. A codebase applying `--blue-500` in components has no theming seam and gets one later by auditing every usage.

A third, component tier (`--color-button-danger-bg`) only where a component genuinely diverges from the system. One is a documented exception; twenty mean the semantic tier is missing roles.

## The role inventory

A system is complete when every role has a token. Build against the list, not against whichever screen came first.

| Group | Roles |
| --- | --- |
| Surfaces | page background, surface, raised (menus, popovers), sunken (inputs, wells), overlay scrim |
| Text | primary, secondary, disabled, inverse, on-accent |
| Borders | subtle, default, strong, focus ring, separator |
| Accent | subtle background, border, solid, solid hover, text |
| Status | per status shipped: subtle background, border, solid, text |

Separator and border are separate roles even when they share a value today — they diverge the first time someone restyles inputs.

## Grammar

`--color-{role}-{variant}-{state}`: `--color-bg-surface`, `--color-text-secondary`, `--color-border-strong`, `--color-accent-solid-hover`. One word per concept, never mixed:

| Concept | Pick one | Never mix in |
| --- | --- | --- |
| Foreground | `text` | `fg`, `foreground`, `content`, `ink` |
| Background | `bg` | `background`, `fill`, `surface` as a synonym |
| Edge | `border` | `stroke`, `outline`, `line` |
| Brand | `accent` | `primary`, `brand`, `theme` interchangeably |

Reserve `primary` for one meaning. `--color-text-primary` (body) beside `--color-primary` (brand) is the most common collision; `accent` for the brand lets `primary` mean "most prominent of its group".

## Anti-patterns

| Name | Problem | Instead |
| --- | --- | --- |
| `--color-blue-button` | appearance at the semantic tier; lies when the brand changes | `--color-accent-solid` |
| `--color-sidebar-gray` | named for first use; nonsense at the second | `--color-bg-surface` |
| `--color-light-gray` | lies in dark mode | `--neutral-200` as a primitive |
| `--color-text-2` | numbers carry no meaning | `--color-text-secondary` |
| `--color-gray-hover` | mixes hue with state; belongs to no tier | `--color-bg-surface-hover` |
| `--blue-500` in a component | skips the semantic tier | point a semantic token at it |

## In Tailwind v4

`@theme` names become utilities; the `--color-*` namespace produces `bg-*`, `text-*`, `border-*`:

```css
@theme {
  --color-brand-50: #eff6ff;
  --color-brand-500: #3b82f6;
  --color-accent-solid: var(--color-brand-500);
  --color-text-secondary: var(--color-neutral-700);
}
```

Both `bg-accent-solid` and `bg-brand-500` are reachable, so the discipline is a convention: templates use semantic utilities, and a raw `bg-brand-500` (or `text-gray-500`) in a component is the thing to flag. Opacity modifiers (`bg-accent-solid/50`) cannot be contrast-checked against a static background — use solid tokens for anything with text on it.
