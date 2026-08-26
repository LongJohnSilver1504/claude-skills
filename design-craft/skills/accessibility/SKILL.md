---
name: accessibility
description: Accessibility engineering for product interfaces — native elements first, visible focus, full keyboard support, focus trapping, hit areas, labeled forms and announced errors, accessible names, color never alone, reduced motion, live regions, alt text, heading structure and zoom survival. Use when building or reviewing components and custom widgets, when a user reports a keyboard or screen-reader problem, or on terms like a11y, WCAG, aria, focus ring, tabindex, sr-only, alt text, hit area, hover on touch, skip link, "not keyboard accessible". NOT for measuring contrast values (color-system, which this skill calls), text sizing and iOS input zoom (typography), or spatial RTL (hierarchy-layout).
---

# Accessibility

Most accessibility is free when you use the platform: native elements ship keyboard support, real labels announce themselves, a visible focus ring is one CSS rule. When unsure, take the platform default over a custom rebuild, and remove ARIA rather than add it.

Reviewing means two walks: keyboard-only, where every flow completes without a mouse; then screen-reader, where every control announces a name, a role and its state. Write every fix in the project's styling system.

## Native elements first

`<button>` for actions, `<a href>` for navigation (a real link supports Cmd/Ctrl/middle-click), never `<div onClick>`. Don't use ARIA when a native element exists; no ARIA is better than bad ARIA. A role is a promise — `role="tab"` commits you to the full tab keyboard model.

## Visible focus rings

Style `:focus-visible`, not bare `:focus`. Prefer the browser's unmodified indicator (add only `outline-offset: 2px`). A custom ring uses a project focus token, at least a `2px` solid perimeter, verified against every adjacent color it crosses, and never `outline: none` without a verified replacement. Preserve system colors in forced-colors mode. Focus rings appear instantly — never fade in. Recipes in `references/focus-and-keyboard.md`.

## Full keyboard support

Every pointer interaction has a keyboard path, per the ARIA APG patterns: Escape closes what opened last; arrow keys move within a composite widget, Tab moves between widgets; Enter and Space activate. Only `tabindex="0"` (join the order) and `tabindex="-1"` (programmatic focus); positive values never. Composite widgets use roving tabindex.

## Trap and restore focus

Modals set `inert` on the background, move focus inside on open (the least destructive action for destructive confirmations) and return focus to the trigger on close; `overscroll-behavior: contain` stops background scroll. Prefer native `<dialog>` with `showModal()`. On SPA route changes, update `document.title` and move focus to the new view's `<h1>` or `<main>`.

## Minimum hit area

WCAG 2.5.8 AA: a 24×24px target, or one of its exceptions. Aim for 44×44px on touch and 40×40px on desktop where density permits; extend a small visible element with a pseudo-element on the wrapping `<label>` or `<button>`. Extended hit areas never overlap. Decorative layers over controls get `pointer-events: none` and `aria-hidden="true"`. Sizes and collision rules in `references/hit-areas-and-forms.md`.

## Label and type every control

Every input has a `<label for>` or a wrapping `<label>`; a placeholder is never a label; label and control share one hit target. Add `autocomplete` with a meaningful `name`, plus the `type` and `inputmode` that summon the right keyboard. Never block paste.

## Errors that announce

Keep submit enabled until the request starts, then disable with a spinner and the original label. Validate on submit, mark failing fields `aria-invalid="true"`, point `aria-describedby` at the inline error, focus the first invalid field. Native `disabled` when a control is genuinely unavailable; `aria-disabled="true"` only when it must stay focusable, with pointer, keyboard and form behavior blocked in code.

## Accessible names everywhere

Icon-only buttons carry a descriptive `aria-label`; visible label text appears in the accessible name; decorative elements get `aria-hidden="true"`, never on anything focusable.

## Color is never the only carrier

Status needs a redundant cue — icon, text, shape or underline — beside the color. Decide which contrast requirement applies (body text, large text, UI component, focus indicator), then have color-system measure the rendered pair; report a failing pair with its requirement and leave the colors alone unless asked.

## Honor reduced motion

Wrap motion in `@media (prefers-reduced-motion: no-preference)` so it is opt-in; under reduce, replace slides and scales with opacity crossfades and kill parallax and autoplay. Regardless of preference, autoplaying media has a visible pause control and toasts carrying an action or an error stay until dismissed. Hover-only styling sits behind `@media (hover: hover)` so a tap never leaves a stuck hover state.

## Announce dynamic content

Work down: focus moves there anyway (nothing extra) → tied to a control (`aria-describedby`) → non-urgent and untied (`role="status"`, a polite region rendered stable and empty before its text changes) → urgent and untied (`role="alert"`, errors only). Never move focus to a toast. Details in `references/screen-readers.md`.

## Alt text by purpose

Decorative `alt=""` (present, empty); informative describes the meaning; functional describes the action (`alt="Search"`, not "magnifying glass"); images of text carry the text; complex charts get a short `alt` and the data nearby. A missing `alt` reads the file name aloud.

## Structure is navigation

One `<h1>`, levels nested without skipping, headings that describe their sections. One visible `<main>`; a "Skip to content" link first in the tab order when chrome precedes it; `scroll-margin-top` on anchored headings under sticky headers.

## Survive zoom and reflow

Works at 200% zoom and reflows at 320px without horizontal scroll: `min-height` rather than fixed `height` on text containers, no viewport meta that caps zoom.

## Before you finish

| Mistake | Fix |
| --- | --- |
| `<div onClick>` | `<button>` or `<a href>` |
| `outline: none` with no replacement | Keep the ring; offset it |
| Custom focus color assumed to work everywhere | Verify against every adjacent color and forced-colors |
| Positive `tabindex` | Fix the DOM order |
| Placeholder as the label | A visible `<label>` |
| Submit disabled until the form is valid | Enabled; validate on submit; focus the first error |
| `assertive` for a routine toast | `polite`; `alert` for errors only |
| `aria-hidden="true"` on a focusable element | Remove it or make the element non-focusable |
| Hover state stuck after a tap | `@media (hover: hover)` |
| Tooltip on a natively `disabled` control | Text beside it, or `aria-disabled` |
| Glow overlay swallowing clicks | `pointer-events: none` |

## Reporting

**Severity.** `HIGH` prevents a task, hides content from assistive technology, or creates a systemic failure. `MEDIUM` makes an interaction meaningfully harder. `LOW` is isolated polish.

**Verification.** Without a browser: accessible names on every interactive element, keyboard handlers on non-native controls, focus styles, `prefers-reduced-motion` guards, labels bound to inputs. With one: tab the flow in order, read computed names and roles from the accessibility tree, confirm a visible indicator at every stop, run an automated audit.

**Format.** Group findings under the principle each violates, ordered by severity, one row per root cause listing every location it appears in:

| Severity | Location | Before | After | Why |
| --- | --- | --- | --- | --- |

`Location` is `path/to/file:line`. `Why` names the principle and the user impact. Report every check you could not run as `Not verified`.

End with `Block` when any `HIGH` remains, `Approve` otherwise, leaving the rest in the table as work to do. Never `Approve` coverage you did not inspect. With nothing to report, say "No actionable findings" for this domain in one line and report verification.
