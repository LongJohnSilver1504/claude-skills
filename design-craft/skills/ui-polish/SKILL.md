---
name: ui-polish
description: Design-engineering details that make an interface feel finished — concentric radii, optical alignment, shadows for elevation and borders for structure, a light source and elevation levels, image outlines, icon weight and states, theme-switch handling, and the finishing touches (supercharged defaults, accent borders, real empty states, fewer borders). Use when building or refining components, when something "feels off", "flat", "cheap" or "unfinished", when nested corners look wrong, when icons look mismatched, or before handoff as the polish pass. NOT for motion timing and easing (motion), text rendering (typography), color meaning and contrast (color-system), or hit areas and focus (accessibility).
---

# UI polish

Polish is a pile of small details that compound. Most users never consciously notice any one of them; when everything is right they proceed without a second thought, and that is the goal. This skill is the reference for which details are worth having and what values they take.

Keep the project's component library, tokens and density. Every value below is specific, not a range to approximate: `0.96` is not `0.95`, `oklch(0 0 0 / 0.1)` is not `slate-900/10`. Use what is written.

## Concentric border radius

Outer radius = inner radius + padding. Mismatched radii on closely nested surfaces are the single most common thing that makes an interface feel off. Past ~24px of padding the layers read as separate surfaces and each radius is chosen independently. Recipes in `references/surfaces.md`.

## Optical over geometric alignment

When geometric centering looks off, align optically. A button with a trailing icon takes ~2px less padding on the icon side; a play triangle shifts ~2px toward its point; asymmetric glyphs (stars, carets) are best fixed in the SVG itself. Mixed font sizes on one line align by baseline, not center.

## Shadows for elevation, borders for structure

Where a border exists only to create depth on a card, button or container, replace it with layered transparent `box-shadow` — transparency adapts to any background where a solid border never will. Keep borders that communicate structure or state: dividers, table cells, input outlines, selected and focus states. Never combine a background difference with a border that does the same job; one is redundant.

## Emulate a light source

Light comes from above: raised elements are lighter on top and cast a shadow below; inset elements are darker on top. Use a lighter same-hue token for a top edge, not white at opacity (it desaturates). Define ~5 elevation levels and use only those — buttons and cards low, popovers medium, modals high — and change elevation for feedback (a pressed button loses shadow, a dragged item gains it). Real shadows have two parts: a soft directional one and a tight contact one that disappears at higher elevations. Even flat designs carry depth: lighter = closer, a solid zero-blur offset shadow, elements that overlap a boundary.

## Image outlines

Every image gets a `1px` outline at low opacity, drawn just inside the edge: pure black `oklch(0 0 0 / 0.1)` in light mode, pure white `oklch(1 0 0 / 0.1)` in dark. Never a tinted near-black or near-white from the palette — it picks up the surface and reads as dirt on the image edge. User-uploaded images sit in fixed containers with `object-fit: cover`.

## Icons carry the text's weight

An icon beside text takes the text's optical weight: `1.5px` stroke beside regular (400) text, `2px` beside semibold (500–600), `2.5px` beside bold. One icon library per surface, one stroke convention per set, sized `1em–1.25em` when inline. One SVG per icon drawn in `currentColor`, recolored by CSS state — never separate assets for hover, selected and disabled. Outline is the default variant; fill marks the active state. Design and test at render size (16px), on the set's native grid. Direction-tied icons flip under RTL; logos, checkmarks and physical objects do not. Details in `references/icons.md`.

## Scale on press

`scale(0.96)` on `:active` gives any pressable element tactile feedback; below `0.95` feels exaggerated. CSS transitions so a mid-press release returns smoothly. Offer a `static` prop for the places where motion would distract. Timing and easing belong to motion.

## Suppress transitions on theme switch

A theme flip changes color, background, border and shadow on nearly every element at once, and every transition on those properties fires together, so the switch smears. Inject `*,*::before,*::after{transition:none !important}`, force a reflow, remove it on the next frame (`next-themes` ships this as `disableTransitionOnChange`). Recipe in `references/surfaces.md`.

## Transition only what changes; `will-change` sparingly

Always name the properties: `transition-property: scale, opacity`, never `transition: all`. `will-change` only for `transform`, `opacity` and `filter`, only when a first-frame stutter is visible, never `will-change: all`.

## Finishing touches

Before stopping, apply at least one where it earns its place — and delete anything that does not: replace default bullets with icons on a feature list; give block quotes size and a brand-colored mark; a thick branded underline on in-text links; custom checkbox and radio styling; an accent border on the top of a card, the left of an alert, under the active tab; alternating section backgrounds or a very low-contrast pattern to break a flat page; a dropdown with sections and supporting text, a table with merged columns, radios as selectable cards. An empty state is a designed component: illustration or large icon, a specific CTA ("Create your first invoice"), and secondary UI hidden until there is content. Details in `references/finishing-touches.md`.

## Before you finish

| Mistake | Fix |
| --- | --- |
| Same radius on a card and its nested inner surface | outer = inner + padding |
| Icon looks off-center in its button | Nudge padding on the icon side, or fix the SVG |
| Border and background difference both separating a card | Remove the border |
| Every shadow a unique value | ~5 elevation levels |
| Modal with a card's shadow | Match elevation to role |
| Hairline icon beside bold text | Match stroke width to text weight |
| Two icon libraries on one toolbar | One set per surface |
| Image outline in `slate-900/10` | `outline-black/10 dark:outline-white/10` |
| Theme toggle crossfades the whole page | Disable transitions for the swap, reflow, restore |
| `transition: all` | Name the properties |
| "No items" as the empty state | Illustration, specific CTA, hide useless chrome |
| Default browser bullets, quotes, checkboxes | Supercharge the defaults |

## Reporting

**Severity.** `HIGH` breaks an interaction or leaves a state distinguishable only by a detail that does not render. `MEDIUM` is a visible inconsistency in surfaces, depth or icons. `LOW` is isolated polish.

**Verification.** Without a browser: every state the component defines (hover, focus, active, disabled, loading, empty), radius math on nested surfaces, shadow tokens against the elevation scale, icon stroke against adjacent text weight. With one: walk each state and inspect nested corners and image edges at 200% zoom.

**Format.** Group findings under the principle each violates, ordered by severity, one row per root cause listing every location it appears in:

| Severity | Location | Before | After | Why |
| --- | --- | --- | --- | --- |

`Location` is `path/to/file:line`. `Why` names the principle and the user impact. Report every check you could not run as `Not verified`.

End with `Block` when any `HIGH` remains, `Approve` otherwise, leaving the rest in the table as work to do. Never `Approve` coverage you did not inspect. With nothing to report, say "No actionable findings" for this domain in one line and report verification.
