# Adaptivity recipes

## Progressive disclosure with an affordance

**Peeking scroller** — the next card's leading 16–32px stays visible past the container edge, so the row is obviously scrollable:

```css
.scroller {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding-inline: 24px;
  scroll-padding-inline: 24px;
  scroll-snap-type: x mandatory;
}
.scroller > * {
  flex: 0 0 calc(100% - 48px - 24px); /* container minus margins minus peek */
  scroll-snap-align: start;
}
```

```html
<div class="flex gap-3 overflow-x-auto px-6 [scroll-padding-inline:1.5rem] snap-x snap-mandatory">
  <div class="w-[80%] shrink-0 snap-start">…</div>
  <div class="w-[80%] shrink-0 snap-start">…</div>
</div>
```

**Disclosure controls** name what they hide: "Show 12 more results", never "More". **Clamped text** shows an ellipsis and a way to expand (mechanics belong to typography).

## Container queries over viewport queries for components

```css
/* Good: the card adapts to the column it is in */
.card-list { container-type: inline-size; }
@container (max-width: 400px) {
  .card { grid-template-columns: 1fr; }
}

/* Bad: a viewport query breaks the card inside a narrow sidebar */
@media (max-width: 768px) {
  .card { grid-template-columns: 1fr; }
}
```

Break where the layout actually stops fitting — where the sidebar squeezes content below its minimum measure, where the card grid drops below a usable column width — not at a preset. Collapse late; a layout that keeps its structure while it genuinely fits stays familiar.

## Plan for growth

```css
/* Good: the label defines the size */
.button { padding-inline: 16px; white-space: nowrap; }

/* Bad: German overflows or truncates */
.button { width: 96px; overflow: hidden; }
```

- No fixed widths sized to English labels — `max-width` plus wrapping.
- No fixed heights on text containers — `min-height` where a floor is needed.
- Test with pseudo-localization or one long-string locale; a one-word label is the riskiest thing on the screen.

## Clipping

Never park a critical action at the bottom of a resizable pane, below the fold of a fixed-height modal, or behind an expanding keyboard. Keep primary actions in stable chrome (a sticky footer with safe-area padding) or at the top of the view; where a modal's content scrolls, its action row does not.

## No horizontal scroll, 320–1920px

```css
html, body { overflow-x: clip; }            /* clip, not hidden — hidden breaks position: sticky */
.grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } /* bare 1fr takes an image's intrinsic width as its floor */
h1, h2 { min-width: 0; overflow-wrap: anywhere; }
```

Full-viewport sections use `min-height: 100dvh`, never `height: 100vh`, so iOS Safari's toolbars do not cause a jump.

## User-supplied images

Users upload whatever aspect ratio they have. Force images into a fixed container with `object-fit: cover`; never let them dictate the layout. Where an image's background may match the UI background, separate it with a low-opacity outline (see ui-polish), not a colored border.
