# Contrast

Measured between a foreground (text, icon, UI element) and the background it **actually renders on** — the nearest ancestor that paints one. Measuring against the page when the element sits on a card gives the wrong answer.

**Report, don't repaint.** A failing pair is reported with its measured value and the missed threshold; the colors change only on request.

## APCA (recommended for design decisions)

| Content | Minimum | Preferred |
| --- | --- | --- |
| Body text (blocks, columns) | Lc 75 | Lc 90 |
| Non-body text (labels, headlines) | Lc 60 | Lc 75 |
| Large text (≥36px) | Lc 45 | Lc 60 |
| UI components | Lc 30 | — |

Lc 30 is also the floor for disabled and placeholder text; Lc 15 the floor for a non-text element to be discernible. Lc is signed (positive = dark on light); compare the absolute value.

## WCAG 2 (required for conformance claims)

| Content | AA | AAA |
| --- | --- | --- |
| Normal text (<24px, <18.5px bold) | 4.5:1 | 7:1 |
| Large text (≥24px or ≥18.5px bold) | 3:1 | 4.5:1 |
| UI components and graphical objects | 3:1 | — |

When a project must claim WCAG conformance, WCAG is the gate and APCA the tiebreaker above it.

## The pairs that ship broken most often

- **Label on accent solid** — an accent that reads fine as a swatch clears ~3:1 with white text. Measure it; white is not automatically the label color.
- **A dark panel whose text stayed dark** — any surface below ~50% lightness swaps its text to a light token in the same rule, and nested children inherit it.
- **Accent fill visibility on a dark page** — the fill itself needs 3:1 against the page or the button disappears.
- **State-carrying borders** (focus, error, selected) need 3:1; purely decorative hairlines are exempt and recorded as such.

## Fixing a failing pair (on request)

Change **lightness** first; hue and saturation move the value far less. Move the foreground away from the background in perceived lightness, hold hue, remeasure.

```css
/* Failing (Lc ≈ 50) */
color: #7d93b0; background: #eef2f7;
/* Fixed, same hue (Lc ≈ 90) */
color: #2b3a4f; background: #eef2f7;
```

Constraints: a background near 75% lightness caps even black text at ~Lc 60 — body text needs a background near an extreme, so the background is what changes. Pushing lightness can leave the gamut; reduce saturation to stay renderable.

Two more levers when lightness alone won't reach the floor: **flip the pair** (dark color on a light tint of the same hue instead of white on the dark color), or **rotate the hue** in the token definition toward a brighter hue (cyan, magenta, yellow) by no more than ~20–30°.

## Quick approximations (then measure)

For body text at |Lc| ≥ 75: on a light background (>~90% lightness) the foreground sits below ~35%; on a dark one (<~25%) above ~90%. The light/dark crossover for "which text color scores higher" is around 73% background lightness — higher than intuition; between 60% and 73% white text still measures better than black.

## What to check

- Every pair in every appearance — light and dark are not mirrors.
- Translucent surfaces (`backdrop-filter` headers, scrims) against the lightest and darkest content that can sit behind them.
- Computed colors (`color-mix()`, relative color syntax, opacity modifiers) at render time.
- Text over images: the worst region, or a scrim that guarantees one.
- `prefers-contrast: more`: at least 15 points more perceived-lightness gap, re-verified at the preferred thresholds.
