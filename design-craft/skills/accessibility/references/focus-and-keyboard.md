# Focus and keyboard

## Focus rings

```css
/* Best: keep the browser ring, give it room */
:focus-visible { outline-offset: 2px; }

/* Custom ring only when the design requires one — project token, verified */
:focus-visible { outline: 2px solid var(--color-border-focus); outline-offset: 2px; }
```

```tsx
<button className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-border-focus)]">Save</button>
```

`outline: 2px solid` with no color renders `currentColor`, which is not automatically accessible where the outline crosses other fills. Inspect the whole perimeter against component fills, page surfaces, images, gradients, hover and selected states. In `forced-colors: active` keep the default adjustment or name a system color (`Highlight`); `forced-color-adjust: none` only where the control was checked. `:focus-within` lights a wrapper while an inner input has focus.

## Skip link

```css
.skip-link { position: absolute; inset-inline-start: -999px; }
.skip-link:focus { inset-inline-start: 16px; top: 16px; }
```

```html
<a class="skip-link" href="#main">Skip to content</a> … <main id="main">…</main>
```

Anchor targets under a sticky header get `scroll-margin-top: 80px`.

## tabindex

- `0`: join the natural order — only for custom interactive elements that are not natively focusable.
- `-1`: focusable via JavaScript only — headings you move focus to, modal containers, roving members.
- Positive: never.

Roving tabindex for composite widgets (tabs, menus, toolbars, radio groups):

```tsx
<div role="tablist">
  {tabs.map((tab, i) => (
    <button role="tab" tabIndex={i === activeIndex ? 0 : -1} aria-selected={i === activeIndex} onKeyDown={handleArrowKeys}>
      {tab.label}
    </button>
  ))}
</div>
```

## Focus trapping and restoration

```tsx
// open
document.getElementById("app-content").inert = true;
(dialog.querySelector("[autofocus]") ?? dialog.querySelector("button, [href], input, select, textarea"))?.focus();
// close
document.getElementById("app-content").inert = false;
triggerRef.current?.focus();
```

Prefer native `<dialog>` + `showModal()` (trap, inert background and Escape for free). A custom overlay needs `role="dialog"`, `aria-modal="true"` and `aria-labelledby`. Add `overscroll-behavior: contain`.

## APG keyboard patterns

| Widget | Keys |
| --- | --- |
| Dialog | Tab/Shift+Tab cycle inside; Escape closes |
| Tabs | Arrows move (wrapping); Tab exits to the panel; Home/End jump |
| Menu button | Enter/Space/ArrowDown opens and focuses first; ArrowUp opens and focuses last; Escape closes and refocuses |
| Disclosure / accordion | header is a `<button aria-expanded>`; Enter and Space toggle |
| Combobox | ArrowDown opens/moves; Enter accepts; Escape closes and returns to the input; typing filters |
| Listbox / radio group | Arrows move selection; one Tab stop |

Escape dismisses whatever opened last: tooltip, then menu, then dialog. Tabs pick automatic activation when panels render instantly, manual when switching is expensive. Enter submits the focused input's form; in `<textarea>` Enter inserts a newline and ⌘/Ctrl+Enter submits.

## SPA route changes

Update `document.title`, move focus to the new view's `<h1>` (given `tabindex="-1"`) or `<main>`, restore scroll on back/forward, scroll to top on forward navigation.
