# Finishing touches

Applied after hierarchy, type and color are right. Each one earns its place or is deleted — the deletion test is "does the design get worse without it?"

## Supercharge the defaults

- Feature lists: icons instead of bullets (checkmarks for benefits, locks for security points).
- Block quotes: larger type, an accent-colored oversized quotation mark.
- In-text links: a thick branded underline that partially overlaps descenders (`text-decoration-thickness`, `text-underline-offset`).
- Checkboxes, radios, selects: brand-colored custom styling.

## Accent borders

A thin colored bar adds personality cheaply: top edge of a card, leading edge of an alert, under a section heading, under the active nav tab, top of the whole page. Never a border on only one side of a card *as structure* — an accent bar is decoration on top of a full boundary or none.

## Backgrounds

Alternate section backgrounds; a subtle gradient between two hues no more than ~30° apart; a repeating pattern at very low contrast; one geometric shape or illustration in a hero corner; a fixed grain overlay. Never a background gradient by reflex.

## Empty states

The zero-state is the first thing a new user sees.

```html
<!-- Bad -->
<p>No results.</p>

<!-- Good -->
<div class="grid place-items-center gap-4 py-16 text-center">
  <InboxIcon class="size-12 text-secondary" aria-hidden="true" />
  <p class="font-medium">No projects yet</p>
  <p class="text-sm text-secondary">Projects keep your tasks and files together.</p>
  <button class="mt-2">Create a project</button>
</div>
```

Hide filters, sort and tabs that are useless until content exists. A search/filter empty state names the query and offers an exit ("No results for 'quarterly'. Clear filters").

## Fewer borders

Alternatives to a line: a box shadow (subtler outline), a different background on adjacent elements, more spacing. A different background **and** a border is one too many.

## Think outside the default component

A dropdown with columns, sections, icons and supporting text. A table that merges related columns and puts an avatar in the cell. Radios as selectable cards. A pricing table that emphasizes the recommended tier with color and weight, not extra height. Cards used only where elevation communicates hierarchy — a generic "border + shadow + white" card on everything is a tell.

## Loading and skeletons

Skeleton loaders shaped like the real layout, not a spinner in a void. Input border width stays constant across states (state goes to color, outline or shadow — a changing `border-width` shifts layout). Disabled is signaled by three channels: opacity, `cursor: not-allowed` and the native attribute. Input height matches adjacent button height.

## Ship-completeness

Favicon, `<title>`, meta description and social tags; legal links in the footer; a branded 404; client-side validation for required fields and email format; a skip link; alt text on meaningful images; semantic landmarks; a way back from every page; the current nav item indicated; no button pointing at `#`.
