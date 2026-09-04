# Hit areas and forms

## Target sizes

| Standard | Minimum |
| --- | --- |
| WCAG 2.5.8 (AA) | 24×24px — the hard floor |
| WCAG 2.5.5 (AAA) | 44×44px |
| Apple HIG | 44×44pt |
| Material | 48×48dp |

Treat 44px as the touch target for primary controls and 40px as the desktop target where density permits. Undersized targets pass under the spacing exception when a 24px circle centered on the target intersects no other target (20px targets need a 4px gap). Anything that looks clickable is clickable across its whole visual extent; a checkbox and its label share one target.

## Expanding the hit area

On the wrapping `<label>` or `<button>`, never on the `<input>` (replaced elements don't render pseudo-elements reliably):

```css
.checkbox-label { position: relative; width: 20px; height: 20px; }
.checkbox-label::after {
  content: ""; position: absolute; top: 50%; left: 50%;
  transform: translate(-50%, -50%); width: 44px; height: 44px;
}
```

```tsx
<button className="relative size-5 after:absolute after:top-1/2 after:left-1/2 after:size-11 after:-translate-1/2"><CheckIcon /></button>
```

Where the element can afford real box size, give it the box (`min-width: 44px; min-height: 44px; display: inline-grid; place-items: center`) — real geometry for scrolling and gestures.

**Collision rule:** two interactive elements never have overlapping hit areas; shrink the pseudo-element to the largest size that does not collide.

## Decorative layers

A scrim, glow, sheen or full-bleed `::after` over interactive content absorbs every pointer event its box covers:

```css
.card-glow { position: absolute; inset: 0; pointer-events: none; }
```

plus `aria-hidden="true"`. A modal scrim that dismisses on click is a control, not decoration — it keeps its events.

## Touch behavior

- `touch-action: manipulation` on interactive elements removes the double-tap-to-zoom delay.
- `touch-action: none` only on a surface implementing its own pan, zoom or drag.
- `-webkit-tap-highlight-color` matched to the design.
- Hover-only styling behind `@media (hover: hover)` — on touch, `:hover` latches after a tap.

## Forms

- `<label for>` or a wrapping `<label>` on every input. Placeholder ≠ label.
- `autocomplete` with a meaningful `name`; `type="email"`, `inputmode="numeric"` etc. summon the right keyboard.
- Never block paste (passwords, one-time codes).
- Submit stays enabled until the request starts; then disabled with a spinner and the original label.
- Validate on submit: `aria-invalid="true"` on failing fields, `aria-describedby` pointing at the inline error, focus the first invalid field.
- `disabled` when genuinely unavailable; `aria-disabled="true"` only when it must stay focusable (a tooltip explaining why), with pointer, keyboard and submit blocked in code and the state styled explicitly.
- Disabled state signaled by three channels: opacity, `cursor: not-allowed`, the attribute.
