# Screen readers

## Visually hidden content

```css
.sr-only {
  position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
  overflow: hidden; clip: rect(0 0 0 0); clip-path: inset(50%); white-space: nowrap; border: 0;
}
```

`1px` boxes, not `0` (some readers skip zero-sized elements); `white-space: nowrap` keeps words from running together. Never `display: none` or `visibility: hidden` — they remove the content entirely. Tailwind: `sr-only`; skip links add `focus:not-sr-only`. Use for context sighted users get visually: `<span class="sr-only">Opens in new tab</span>`, table captions, an icon-only control's name where `aria-label` isn't an option.

## Choosing how to announce a change

1. **Focus moves there anyway** (opened modal, first invalid field) — nothing extra.
2. **Tied to a control** (field error, character count) — `aria-describedby` on the control.
3. **Non-urgent, untied** (toast, "Saved", result count, loading) — `role="status"`.
4. **Urgent, untied** (form-level failure, session expiry) — `role="alert"`.

## Live regions

| Mechanism | Politeness | Use for |
| --- | --- | --- |
| `role="status"` (= `aria-live="polite"` + `aria-atomic="true"`) | waits for a pause | toasts, "Saved", counts, loading |
| `role="alert"` (= `aria-live="assertive"` + atomic) | interrupts | errors and urgent problems only |

- Render a stable, empty polite region before changing its text; inserting a new region with content is announced inconsistently.
- Default to polite; overused `assertive` interrupts whatever the user was reading.
- Keep messages short and self-contained (`aria-atomic` re-reads the whole region).
- Never move focus to a toast; give it a generous timeout or a dismiss button; never put the only path to an action inside an auto-dismissing one.

```tsx
<div role="status" className="sr-only">{statusMessage}</div>
```

Loading: `aria-busy="true"` on the updating region, announce "Loading…" politely, then the outcome ("Loaded, 12 results").

## aria-hidden

Removes an element and its subtree from assistive tech. For decorative icons and visually duplicated content. Never on or above a focusable element — that creates Tab stops that don't exist for a reader.

## Alt text

| Purpose | Alt |
| --- | --- |
| Decorative or redundant with adjacent text | `alt=""` (present, empty) |
| Informative | the meaning it adds: `alt="Ticket QR code"` |
| Functional (image is the control) | the action: `alt="Search"` |
| Image of text | the exact text (better: real text) |
| Complex (chart) | short summary; full data nearby |

## SVG

Decorative: `aria-hidden="true" focusable="false"`. Meaningful inline: `role="img" aria-label="…"` or a `<title>` referenced by `aria-labelledby`. Simple cases: `<img src="icon.svg" alt="…">`.

```tsx
<button aria-label="Close"><svg aria-hidden="true" focusable="false">…</svg></button>
<svg role="img" aria-label="Verified account">…</svg>
```

## Media

Captions on prerecorded video; transcripts for audio; never autoplay with sound; always render controls.
