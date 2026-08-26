# Surfaces

## Concentric border radius

```
outerRadius = innerRadius + padding
```

```css
/* Good */
.card { border-radius: 20px; padding: 8px; }   /* 12 + 8 */
.card-inner { border-radius: 12px; }

/* Bad: same radius on both */
.card { border-radius: 12px; padding: 8px; }
.card-inner { border-radius: 12px; }
```

```tsx
// Good: outer accounts for padding
<div className="rounded-2xl p-2">   {/* 16px radius, 8px padding */}
  <div className="rounded-lg">      {/* 8px = 16 − 8 */}…</div>
</div>
```

Apply where layers share a visible, even inset. Past ~24px of padding, or with deliberately asymmetric padding, treat the layers as independent surfaces and keep the component tokens. Where the math yields ≤2px, leave the inner shape square.

## Optical alignment

```css
/* Trailing icon: less padding on the icon side */
.button-with-icon { padding-inline-start: 16px; padding-inline-end: 14px; }

/* Play triangle: shift toward its point */
.play-button svg { transform: translateX(2px); }
```

```tsx
<button className="ps-4 pe-3.5 flex items-center gap-2"><span>Continue</span><ArrowRightIcon /></button>
```

Asymmetric glyphs: fix the SVG's viewBox or path so the component needs no margin hack; fall back to `translate-x-px`.

## Shadow as border

Three layers in light mode: a 1px ring, subtle lift, ambient depth. In dark mode simplify to one white ring — layered depth is invisible on dark backgrounds.

```css
:root {
  --shadow-border:
    0 0 0 1px oklch(0 0 0 / 0.06),
    0 1px 2px -1px oklch(0 0 0 / 0.06),
    0 2px 4px 0 oklch(0 0 0 / 0.04);
  --shadow-border-hover:
    0 0 0 1px oklch(0 0 0 / 0.08),
    0 1px 2px -1px oklch(0 0 0 / 0.08),
    0 2px 4px 0 oklch(0 0 0 / 0.06);
}
.dark {
  --shadow-border: 0 0 0 1px oklch(1 0 0 / 0.08);
  --shadow-border-hover: 0 0 0 1px oklch(1 0 0 / 0.13);
}
.card {
  box-shadow: var(--shadow-border);
  transition-property: box-shadow;
  transition-duration: 150ms;
  transition-timing-function: ease-out;
}
.card:hover { box-shadow: var(--shadow-border-hover); }
```

| Shadows | Borders |
| --- | --- |
| cards and containers with depth | dividers between list items |
| bordered button styles | table cell boundaries |
| elevated elements (menus, modals) | input outlines |
| elements over varied backgrounds | hairline separators in dense UI |
| hover/focus lift | selected and focus states |

## Elevation levels

```css
:root {
  --elevation-1: 0 1px 2px oklch(0 0 0 / 0.06);                                        /* resting card, button */
  --elevation-2: 0 1px 3px oklch(0 0 0 / 0.12), 0 1px 2px oklch(0 0 0 / 0.24);         /* raised: contact + directional */
  --elevation-3: 0 4px 12px -2px oklch(0 0 0 / 0.12), 0 2px 4px oklch(0 0 0 / 0.08);   /* popover, dropdown */
  --elevation-4: 0 12px 32px -8px oklch(0 0 0 / 0.20);                                 /* drawer, floating panel */
  --elevation-5: 0 24px 64px -12px oklch(0 0 0 / 0.28);                                /* modal — contact shadow gone */
}
```

Tint shadows toward the background hue rather than pure black when the surface is colored. Flat aesthetics: a solid offset shadow (`4px 4px 0 var(--color-border-strong)`), or lighter-equals-closer fills.

## Image outlines

```css
img { outline: 1px solid oklch(0 0 0 / 0.1); outline-offset: -1px; }
.dark img { outline-color: oklch(1 0 0 / 0.1); }
```

```tsx
<img className="outline outline-1 -outline-offset-1 outline-black/10 dark:outline-white/10" src={src} alt={alt} />
```

`outline` never affects layout, and the negative offset hugs the corner radius. Only `outline-black/10` and `outline-white/10` — never a tinted scale, never the accent.

## Suppress transitions on theme switch

```tsx
"use client";
import { useEffect } from "react";

export function DisableThemeTransitions() {
  useEffect(() => {
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      const style = document.createElement("style");
      style.append(document.createTextNode("*,*::before,*::after{transition:none !important}"));
      document.head.append(style);
      const _flush = document.body.offsetHeight; // force a synchronous style flush
      requestAnimationFrame(() => requestAnimationFrame(() => style.remove()));
    };
    mql.addEventListener("change", handleChange);
    return () => mql.removeEventListener("change", handleChange);
  }, []);
  return null;
}
```

An in-app toggle wraps its own flip the same way: apply, change, flush, remove.

## Glass and translucency

Translucent chrome (`backdrop-filter: blur(20px) saturate(180%)` over a semi-transparent background, a bright 1px top edge) reads as a floating functional layer. Never stack a light translucent surface on another; bigger surfaces read thicker (more blur, deeper shadow); put color on a solid layer, not the translucent foreground; honor `prefers-reduced-transparency` by raising opacity and dropping the blur. A grain overlay (`pointer-events: none`, fixed, low opacity) breaks digital flatness where a gradient would be the reflex.
