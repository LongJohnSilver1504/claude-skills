# Icons

## Stroke matches text weight (24px grid)

| Adjacent text | Stroke |
| --- | --- |
| Regular (400), 14–16px | 1.5px |
| Medium / semibold (500–600) | 2px |
| Bold (700) or emphasized standalone | 2.5px |

```html
<!-- Good -->
<button class="flex items-center gap-2 font-semibold"><PlusIcon stroke-width="2" class="size-4" />New project</button>
<!-- Bad: default 1.5px stroke beside bold -->
<button class="flex items-center gap-2 font-bold"><PlusIcon stroke-width="1.5" class="size-4" />New project</button>
```

One optical strategy per surface: never mix libraries with incompatible stroke conventions on one toolbar. Size inline icons at `1em–1.25em` so the pair scales together.

## One SVG, recolored per state

```css
.icon-button { color: var(--color-text-secondary); }
.icon-button:hover { color: var(--color-text-primary); }
.icon-button[aria-pressed="true"] { color: var(--color-accent-text); }
.icon-button:disabled { opacity: 0.4; }
```

Strip hardcoded `fill="#666"` to `currentColor` on import. Never ship separate assets per state.

## Outline default, fill active

```tsx
<TabIcon variant={isActive ? "solid" : "outline"} />
```

Filled icons everywhere leave the active tab with no state signal. The swap between variants is a contextual icon animation (motion skill).

## Design at render size

An icon that reads at 48px collapses at 16px. Test at the smallest size it renders; prefer simplified glyphs for small contexts; stay on the set's native grid (16, 20, 24) rather than fractional scaling; always SVG.

## RTL

| Flip | Don't flip |
| --- | --- |
| back/forward arrows, navigation chevrons | logos, brand marks |
| text-block glyphs (alignment, lists, indent) | checkmarks |
| speaker/volume waves | physical objects (clocks, cups) |
| "send" style directional glyphs | media playback (tape-direction convention) |

```html
<ChevronRightIcon class="rtl:-scale-x-100" />
```

Analyze composite icons part by part — a badge overlay may keep its position while the base glyph flips.

## Semantics

Decorative icons: `aria-hidden="true" focusable="false"`. Meaningful standalone icons: `role="img" aria-label`. Icon-only buttons carry their name on the button (accessibility skill). Avoid the cliché metaphors — rocket for launch, shield for security — when a more specific glyph exists.
