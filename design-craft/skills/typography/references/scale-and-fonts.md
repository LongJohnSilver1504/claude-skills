# Scale, fonts and the Tailwind map

## Choosing a typeface

| Category | Traits | Use for |
| --- | --- | --- |
| Serif | strokes guide the eye along a line | long passages, editorial |
| Sans-serif | even shapes, crisp at small sizes | default for interfaces |
| Monospace | fixed-width glyphs | code, tabular data — never body copy |
| Display | drawn for large sizes | marketing headlines, hero text |

"Display" in a name does not make a display face; SF Pro and Heldane ship `Display` and `Text` variants — use the variant that matches the size. Filter font lists by five or more weights; carefully made families tend to have them. Headline faces have tighter spacing and shorter x-heights; UI faces the opposite — don't set body UI in a condensed headline face.

Two fonts at the same `font-size` look different sizes because of x-height; a large x-height reads bigger.

```css
/* System-native feel */
html { font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }

/* Brand face with a fallback stack */
html { font-family: "Helvetica Now", "Helvetica Neue", Arial, sans-serif; }
```

## Formats and loading

`.woff2` on the web (Brotli, broad support). `.woff` only for very old browsers. `.ttf`/`.otf` are desktop formats. Load every weight and style the design uses; `font-synthesis: none` turns fake bold off but erases emphasis where the real face is missing — set it only after checking every bold, italic and small-cap form stays distinct.

Prefer CSS properties over raw OpenType tags: `font-weight: 650` over `font-variation-settings: "wght" 650`; `font-optical-sizing: auto` over `"opsz"`; `font-variant-numeric: tabular-nums` over `"tnum" 1`. Raw tags only for custom axes (`"GRAD" 80`) and niche features (`"ss01" 1`).

## The scale

```css
:root {
  --text-xs: 0.75rem;    /* 12 */
  --text-sm: 0.875rem;   /* 14 */
  --text-base: 1rem;     /* 16 */
  --text-lg: 1.125rem;   /* 18 */
  --text-xl: 1.25rem;    /* 20 */
  --text-2xl: 1.5rem;    /* 24 */
  --text-3xl: 1.875rem;  /* 30 */
  --text-4xl: 2.25rem;   /* 36 */
  --text-5xl: 3rem;      /* 48 */
}
```

Hand-pick; modular ratios produce fractional values that are not flexible enough for UI. Solo, default names (`text-sm`) are fine; on a team name by use (`text-body-sm`). Headings:

```css
h1 { font-size: var(--text-2xl); }
h2 { font-size: var(--text-xl); }
h3 { font-size: var(--text-lg); }
```

Centralize per-level styles in a component or `@layer base`, never repeated inline.

## Text trimming

Fonts reserve space above and below letters, which is why text sits low in buttons and badges. `text-box: trim-both cap alphabetic` trims it (Chromium 133+, Safari 18.2+; progressive enhancement).

## Tailwind cheat sheet

| Declaration | Tailwind |
| --- | --- |
| `text-wrap: balance` | `text-balance` |
| `text-wrap: pretty` | `text-pretty` |
| `overflow-wrap: break-word` | `wrap-break-word` |
| `white-space: nowrap` | `whitespace-nowrap` |
| `font-variant-numeric: tabular-nums` | `tabular-nums` |
| single-line ellipsis | `truncate` |
| `line-clamp: 3` | `line-clamp-3` |
| `letter-spacing: -0.025em` | `tracking-tight` |
| `letter-spacing: 0.05em` | `tracking-wider` |
| `line-height: 1.1` | `leading-tight` (1.25) / `leading-none` (1) — check the value |
| `line-height: 1.5` | `leading-normal` |
| `text-underline-position: from-font` | `underline-offset-auto` + `[text-underline-position:from-font]` |
| `text-decoration-skip-ink: auto` | `decoration-skip-ink` (default) |
| `max-width: 65ch` | `max-w-[65ch]` or `max-w-prose` |
| `-webkit-font-smoothing: antialiased` + moz | `antialiased` |
| `text-align: start` | `text-start` |
| `font-weight: 500` | `font-medium` |
| `user-select: none` | `select-none` |
