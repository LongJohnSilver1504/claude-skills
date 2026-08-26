# Palette structure and generation

## What a system needs

| Ramp | How many | Notes |
| --- | --- | --- |
| Neutral | 1 | 80–90% of the interface: backgrounds, borders, body text |
| Accent | 1 | the brand hue; interactive and selected states |
| Status | 0–4 | `danger`, `warning`, `success`, `info` — only the ones the product renders |

## Every step has a job

| Role | Tailwind | Radix |
| --- | --- | --- |
| Page background | 50 | 1 |
| Subtle background | 50 | 2 |
| Component background | 100 | 3 |
| Component hover | 200 | 4 |
| Component active / selected | 200 | 5 |
| Subtle border | 200 | 6 |
| Border, separator | 300 | 7 |
| Strong border, focus ring | 400 | 8 |
| Solid fill | 500 | 9 |
| Solid fill hover | 600 | 10 |
| Low-contrast text | 700 | 11 |
| High-contrast text | 900 | 12 |

Radix defines steps **by role** (step 9 is always the solid fill; the dark scale is a separate ramp reusing the numbers, so component CSS never changes). Tailwind defines steps **by lightness** (`50` light, `950` dark; the mapping inverts in dark mode, so components read a semantic token that swaps once). For a new system prefer the role model; on Tailwind keep `50–950` and put the role mapping in the semantic tier. Tailwind's 11 steps cover 12 roles, so a design that needs a subtle border and a hover to be distinguishable needs a 12-step ramp.

## Neutrals

A pure grey ramp is a fine default under any accent. Tinting toward the accent hue by a few percent of its vividness puts the greys in the same family — enough to measure, not enough to name. Warm neutrals (toward orange) read approachable and editorial; cool ones (toward blue) read technical. Hold the temperature across the whole ramp: a warm border on a cool background is visible even when neither is nameable alone.

## Status colors

Red = danger, amber = warning, green = success by convention (see cultural exceptions below). Keep every status hue distinct from the accent, and pair every status color with an icon or text. Status ramps usually need only four roles: background, border, solid, text.

## Start from the brand color

Decide which step it occupies (a button/link brand belongs on the solid step) and whether it is **pinned** (contractually exact; the ramp builds outward and that step spaces slightly unevenly) or **snapped** onto the ramp (even spacing; looks better and nobody notices without a swatch). A brand color that fails behind white text is still the brand color — just not the solid-fill step. Put it where it lands and use a darker step for fills; never quietly darken the brand.

## A correct ramp, checkable in any notation

- Steps evenly spaced in perceived lightness.
- Hue constant end to end.
- Vividness peaks mid-ramp, nearly neutral at both extremes.
- Steps denser at the light end (`50–200` close, `800–950` further apart).
- No two adjacent steps indistinguishable — drop one if they are.
- Both ends stop short of pure black and white.

```js
import { formatHex, interpolate, samples } from 'culori'
const ramp = interpolate(['#eff6ff', '#3b82f6', '#172554'], 'lab')
const steps = samples(11).map((t) => formatHex(ramp(t)))
```

Several hues at once: match perceived lightness exactly per step, match vividness as a *proportion* of each hue's own maximum.

## Dark mode

```css
:root { --color-bg: var(--brand-50); --color-text: var(--brand-950); }
.dark { --color-bg: var(--brand-950); --color-text: var(--brand-50); }
```

Then hand-tune: vividness down a step or two (confident on white reads neon on near-black), more separation at the dark end, every pair remeasured. Switching mechanism — pick one:

- `prefers-color-scheme` alone: no toggle, nothing to persist.
- `.dark` class: required once users can override the system; the media query sets only the initial value; persist the choice and read it before first paint to avoid a flash.
- `light-dark()` with `color-scheme: light dark`: least code; a class toggle must set `color-scheme` too.

## Auditing an existing palette

1. Collect every literal: hex, `rgb(`, `hsl(`, `oklch(`, utility-class prefixes, SVG `fill`/`stroke`, chart configs, email templates.
2. Sort by perceived lightness within each hue family — duplicates surface as near-identical neighbors.
3. Collapse near-duplicates (closer than ~one ramp step): keep the most-used, retire the rest, never average.
4. Assign each survivor a role from the table; a color with no role is a missing token or a mistake — say which.
5. Count: more than one ramp per role means the palette outgrew its structure, not that the product needs more color.

Report the inventory before changing anything; consolidation changes screens nobody asked you to touch.

## Color across cultures

Red reads as gains in Chinese financial UIs and green as losses; white carries mourning in parts of East Asia. Where a color is load-bearing in finance, status or alerts, make it a per-locale token rather than a hardcoded value.
