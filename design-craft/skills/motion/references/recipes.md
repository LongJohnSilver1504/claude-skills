# Motion recipes

Curves are the `--ease-out`, `--ease-in-out` and `--ease-drawer` tokens from the skill. Start from the recipe, adapt to the project's idiom, keep the values.

## Button press

```css
.button { transition: transform 160ms var(--ease-out); }
.button:active { transform: scale(0.96); }
```

`scale()` scales children too — label and icon come along, which is what reads as a physical press. `:active` is a real press on touch; no hover gating needed here. Offer a `static` prop to switch it off where motion would distract.

## Dropdown, popover, menu, select

```css
.popover {
  transform-origin: var(--transform-origin); /* Base UI supplies this */
  transition: opacity 200ms var(--ease-out), transform 200ms var(--ease-out);
}
.popover[data-starting-style], .popover[data-ending-style] { opacity: 0; transform: scale(0.95); }
```

The origin is the point: the panel looks like it came out of the thing you clicked.

## Tooltip

```css
.tooltip {
  transform-origin: var(--transform-origin);
  transition: transform 125ms var(--ease-out), opacity 125ms var(--ease-out);
}
.tooltip[data-starting-style], .tooltip[data-ending-style] { opacity: 0; transform: scale(0.97); }
.tooltip[data-instant] { transition-duration: 0ms; } /* once one is open, neighbours open instantly */
```

Hover tooltips delay ~800ms before the first appearance; focus tooltips 0ms.

## Modal

```css
.modal {
  transform-origin: center; /* exempt — not anchored to a trigger */
  transition: opacity 250ms var(--ease-out), transform 250ms var(--ease-out);
}
.modal[data-starting-style], .modal[data-ending-style] { opacity: 0; transform: scale(0.96); }
.backdrop { transition: opacity 250ms var(--ease-out); }
```

## Drawer / sheet

```css
.drawer { transform: translateY(0); transition: transform 500ms var(--ease-drawer); }
.drawer[data-closed] { transform: translateY(100%); }
```

Add drag and it becomes a gesture problem — see `gestures-and-springs.md`.

## Toast

```css
.toast {
  opacity: 1; transform: translateY(0);
  transition: opacity 400ms ease, transform 400ms ease;
  @starting-style { opacity: 0; transform: translateY(100%); }
}
```

`ease` and a slightly longer duration than typical UI — the motion matches the component's elegant personality. Fallback without `@starting-style`: a `data-mounted` flag set in an effect. A toast carrying an action or an error stays until dismissed.

## Accordion / collapse

```css
.content { overflow: hidden; transition: height 200ms var(--ease-out), opacity 200ms var(--ease-out); }
```

One of the few animations that costs layout every frame — keep it short. Measure the content height (or use a primitive that supplies it) instead of animating to `auto`.

## Stagger a group entrance (occasional views only)

```css
.item { opacity: 0; transform: translateY(8px); filter: blur(4px); animation: fadeIn 300ms var(--ease-out) forwards; }
.item:nth-child(2) { animation-delay: 50ms; }
.item:nth-child(3) { animation-delay: 100ms; }
.item:nth-child(4) { animation-delay: 150ms; }
@keyframes fadeIn { to { opacity: 1; transform: translateY(0); filter: blur(0); } }
```

30–80ms between items; ~100ms between semantic chunks of a hero (title, description, actions). Stagger is decorative and never blocks interaction. In Motion, `initial={false}` on `AnimatePresence` keeps enter animations off the first render where the component has a default state — never where a first-time entrance is the point.

## Exit

```tsx
// Subtle exit (default): a small fixed rise, shorter than the enter
<motion.div exit={{ opacity: 0, y: -12, filter: "blur(4px)", transition: { duration: 0.15, ease: "easeOut" } }} />
// Full exit only when spatial context matters (a drawer closing, a card returning to a list)
<motion.div exit={{ opacity: 0, x: "-100%", transition: { duration: 0.2, ease: "easeOut" } }} />
```

## Hold to confirm

```css
.overlay { clip-path: inset(0 100% 0 0); transition: clip-path 200ms var(--ease-out); } /* release: snappy */
.button:active .overlay { clip-path: inset(0 0 0 0); transition: clip-path 2s linear; }  /* press: deliberate */
.button:active { transform: scale(0.96); }
```

`linear` is right here — the fill is a progress indicator.

## Tab indicator with a perfect color transition

Duplicate the tab list, style the copy as the active state, clip it to the active tab and animate the clip:

```css
.tabs-active-copy { clip-path: inset(0 60% 0 20%); transition: clip-path 250ms var(--ease-in-out); }
```

Text and background change together because one element is revealed rather than two colors interpolated.

## Icon swap

Both icons in the DOM, one absolutely positioned; cross-fade with scale `0.25→1`, opacity `0→1`, blur `4px→0`. With Motion: `transition: { type: "spring", duration: 0.3, bounce: 0 }`. Without: `cubic-bezier(0.2, 0, 0, 1)` on the same three properties.

## Scroll reveal (marketing only)

```css
.reveal { clip-path: inset(0 0 100% 0); transition: clip-path 600ms var(--ease-in-out); }
.reveal[data-visible] { clip-path: inset(0 0 0 0); }
```

Trigger with `IntersectionObserver` or `useInView({ once: true, margin: "-100px" })`, once. Never an unthrottled `scroll` listener. A fade-up alternative: `translateY(16px)` + `blur(8px)` + `opacity: 0` → settled, 600–800ms with `--ease-drawer`. Never on functional UI a user visits daily.

## Masking a crossfade that won't settle

```css
.content { transition: filter 200ms ease, opacity 200ms ease; }
.content.transitioning { filter: blur(2px); opacity: 0.7; }
```

Blur blends two overlapping states into one perceived transformation. Keep it under 20px; heavy blur is expensive in Safari.

## Programmatic without a library — WAAPI

```js
element.animate(
  [{ clipPath: "inset(0 0 100% 0)" }, { clipPath: "inset(0 0 0 0)" }],
  { duration: 1000, fill: "forwards", easing: "cubic-bezier(0.77, 0, 0.175, 1)" }
);
```

Hardware-accelerated, interruptible, zero bundle cost.

## Debugging

Play at 2–5× duration or slow the Animations panel to 10%: do colors transition smoothly or do two states overlap? Does the origin look right? Are opacity, transform and color in sync? Step frame by frame for coordinated properties. Test drawers and swipes on a real device over the local network. Look again the next day with fresh eyes.
