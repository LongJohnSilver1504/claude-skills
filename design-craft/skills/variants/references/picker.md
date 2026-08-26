# The picker

The control that switches variants. Its appearance is not a design decision: it sits on top of the thing being judged, so it stays deliberately outside the design system — one dark neutral surface, the system font stack, no project variables. Dark reads as chrome over both light and dark pages, which is why it does not follow the theme.

## Behavior

- Sets a `variant` search param and reads the active variant back from it; the URL is the source of truth and every variant is a link.
- Left and right arrows step through the set; number keys jump directly.
- The active item carries `aria-current="true"`; the container carries an `aria-label`.
- Switching is instant — no transition.
- Survives a resize, so a variant can be held while the window is dragged.

## Structure

```html
<nav class="variant-picker" aria-label="Variants">
  <button type="button" data-variant="quiet" aria-current="true">Quiet</button>
  <button type="button" data-variant="editorial">Editorial</button>
  <button type="button" data-variant="dense">Dense</button>
</nav>
```

Add a replay button only where a variant has an entrance worth re-triggering.

## Placement and styling

Fixed, bottom center, above everything the page can stack. Where the variants themselves live at the bottom of the viewport, move it to top center and say so.

```css
.variant-picker {
  position: fixed;
  bottom: 24px;
  left: 50%;
  translate: -50% 0;
  z-index: 2147483647;
  display: flex;
  gap: 2px;
  padding: 4px;
  border-radius: 999px;
  background: rgb(20 20 20 / 0.9);
  box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.1), 0 8px 24px rgb(0 0 0 / 0.25);
  font: 13px/1 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  user-select: none;
}
.variant-picker button {
  padding: 7px 14px;
  border: 0;
  border-radius: 999px;
  background: none;
  color: rgb(255 255 255 / 0.6);
  cursor: pointer;
}
.variant-picker button:hover { color: rgb(255 255 255 / 0.85); }
.variant-picker button[aria-current="true"] { background: rgb(255 255 255 / 0.14); color: rgb(255 255 255); }
.variant-picker button:focus-visible { outline: 2px solid rgb(255 255 255 / 0.7); outline-offset: 2px; }
```

```js
const params = new URLSearchParams(location.search);
const current = params.get("variant") ?? variants[0];
function select(name) {
  params.set("variant", name);
  history.replaceState(null, "", `?${params}`);
  render(name);
}
document.addEventListener("keydown", (e) => {
  const i = variants.indexOf(current);
  if (e.key === "ArrowRight") select(variants[(i + 1) % variants.length]);
  if (e.key === "ArrowLeft") select(variants[(i - 1 + variants.length) % variants.length]);
  if (/^[1-9]$/.test(e.key) && variants[+e.key - 1]) select(variants[+e.key - 1]);
});
```

In a framework, keep the class names and structure and change only the rendering syntax. In a project with a dev server, the harness is an isolated route (`/prototypes/<slug>` or the framework's equivalent) with one file per variant plus the harness; nothing imports from it into production.
