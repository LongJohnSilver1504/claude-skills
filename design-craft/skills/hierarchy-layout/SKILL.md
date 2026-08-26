---
name: hierarchy-layout
description: Visual hierarchy, grouping, spacing, alignment and adaptive structure for screens and components — what is primary, how groups read, how space carries structure, what collapses at small widths. Use when composing a new screen or component, ranking elements, spacing a form or list, deciding the button pyramid, choosing breakpoints, or when a layout "feels flat", "cramped", "busy", or "everything competes". NOT for how text renders and wraps (typography), color meaning and contrast (color-system), radius, shadows and icons (ui-polish), or hit areas and focus (accessibility).
---

# Hierarchy and layout

Position, size, weight, color and space carry hierarchy before a word is read. "Designed" mostly means deliberately weighted: one thing leads, the rest supports. This skill decides the weighting and the structure that holds it, then stress-tests the structure — resize it, translate it, mirror it.

Write every fix in the project's styling system and spacing scale. The numbers below are starting points for projects with no density system; a locked `.design/style-lock.md` wins.

## Rank before you draw

Before any markup, answer three questions about the screen or component:

1. **What is the one primary thing?** The number the user came for, the main action, the headline.
2. **What is secondary?** Supporting facts, secondary actions.
3. **What is tertiary?** Metadata, fine print, ancillary links.

A component with no answer to the first question will be rebuilt. Ask the user rather than guess.

## Emphasize by de-emphasizing

When the primary element does not lead, subtract from its competition before adding to it. Soften inactive nav items instead of shouting the active one; remove a sidebar's background instead of boxing the main content. Ask "what can I take from the competitors?" before "what can I add?"

## Size is not the only lever

Carrying hierarchy with font size alone produces oversized headings and unreadable secondary text. Use **weight** and **color**: two weights (400/500 and 600/700) and three text colors (primary, secondary, faint) do most of the work at sensible sizes. A section title functioning as a label is styled small even when the markup is `<h2>` — pick the element for semantics and the style for hierarchy.

Weight and contrast are interchangeable: soften a heavy icon by lowering its contrast; strengthen a faint border by widening it rather than darkening it.

## Labels are a last resort

`Label: value` gives every datum equal weight. Drop the label when the format implies it (`jane@example.com`, `$19.99`), when context implies it ("Customer Support" under a name), or fold it into the value ("12 left in stock"). When labels stay (spec sheets, scannable dashboards), style them smaller and lighter than the value.

## One primary action per view

Every view has a pyramid: one primary action (solid, high contrast), a few secondary (outline or low-contrast fill), several tertiary (styled as links). Style by hierarchy, not by semantics — a destructive action is a quiet tertiary link until it is the primary action of its own confirmation dialog. Group secondary actions behind a menu once they exceed two or three.

## Group with space, not lines

Three tools, in order: negative space; a background shape when a group must read as one unit (a selectable row, a card); a separator line only in dense data where space costs too much. The gap between groups is at least **2×** the gap within one — `8px` inside, `16px`+ between — or the grouping reads as noise. When a separator stays, keep it a low-contrast hairline and never pair it with a gap that already did the job.

## Start with too much white space

White space gets added to designs, so most end up with the minimum that does not look broken. Reverse it: start with far too much, remove until it feels right. Dense operational UI is a deliberate choice, not the default. Take spacing from a scale whose adjacent steps differ by at least ~25% (`4, 8, 12, 16, 24, 32, 48, 64, 96`); arbitrary in-between values are a tell. Recipes in `references/spacing.md`.

## Give things the width they need

A 1400px canvas does not mean 1400px of content. Forms, cards and articles get a `max-width` at their optimal size and the surrounding space flexes. Sidebars are a fixed width tuned to their content, not a percentage of the viewport. Design at ~400px first and widen only when the content asks for it.

## Keep controls distinct from content

Every interactive element gets a background, a border, an underline or a consistent control zone (toolbar, footer row). A control styled like the static text beside it is invisible; a non-clickable badge shaped like the buttons beside it collects dead clicks.

## Align to shared edges, in logical properties

Pick a small set of alignment edges and put everything on them; every stray edge reads as noise even when nobody can name it. One spacing step per level of subordination. Numbers align to the trailing edge in tables, text to the leading edge. Express horizontal position as `margin-inline-start` / `padding-inline-end` / `inset-inline-start` so the layout mirrors under `dir="rtl"`; keep physical `left`/`right` for genuinely physical geometry.

## Order by importance

Readers scan top-to-bottom, leading-to-trailing. The one fact the user came for sits near the top and the leading edge with room around it; identifying content leads a row, metadata and actions trail. The first screenful is a table of contents, not the whole book — a short view that links deeper beats a long view that shows everything at level one.

## Hint at hidden content

Progressive disclosure needs a visible affordance: the project's established cue, the next item peeking `16–32px` past a scroll edge, or a disclosure control labeled with what it hides ("Show 12 more results", not "More"). Content hidden with zero cue does not exist. Recipes in `references/adaptivity.md`.

## Breathing room, insets and edges

Without a density system: `12px` between adjacent bordered or filled controls, `24px` around borderless text and icon buttons (the space *is* their boundary). Full-width buttons in content layouts stay inside the layout margins (~`16px` inline on mobile) with a visible radius; edge-to-edge actions are valid only as deliberate platform chrome that honors safe areas. Backgrounds and media bleed to the viewport edges; text and controls float inside the margins and `env(safe-area-inset-*)`.

## Hold structure until it breaks

Breakpoints come from the content, not from device presets. Keep the expanded layout while it genuinely fits, collapse late, prefer container queries for components, and test the smallest and largest sizes first. Put no fixed width or height on anything that holds text — translations grow, and short labels grow most. Never park a critical action where a resize or a keyboard clips it; keep it in normal flow or in stable chrome.

## Build workflow

1. Write the three ranks. 2. Pick the layout shape and the vertical rhythm (what stacks, what separates, what scrolls). 3. Apply the spacing scale with the 2× rule. 4. Set the button pyramid. 5. Squint: does the right thing stand out, and do groups read as groups? Fix before delivering.

## Before you finish

| Mistake | Fix |
| --- | --- |
| Everything the same visual weight | Rank; soften the secondary and tertiary tiers |
| Hierarchy carried by size alone | Weight and color at smaller sizes |
| Three solid buttons side by side | One primary; outline and link for the rest |
| Label gap equals group gap | Groups need ≥2× the intra-group gap |
| Separator lines doing what space could | Remove the line, widen the gap |
| `margin-left` / `padding-right` in localizable layout | `margin-inline-start` / `padding-inline-end` |
| Breakpoints at 768/1024 because presets say so | Break where the content stops fitting |
| Fixed width sized to the English label | `max-width` and wrapping; test a long locale |
| Primary action at a clip-prone bottom edge | Sticky chrome with safe-area padding, or top of view |

## Reporting

**Severity.** `HIGH` blocks content or an action at a supported viewport, or leaves the view with no discernible primary element. `MEDIUM` harms hierarchy, grouping, reading order or adaptability. `LOW` is isolated alignment or spacing polish.

**Verification.** Without a browser: the three ranks are answerable from the markup, spacing values come from the scale, groups clear the 2× rule, logical properties replace physical ones, DOM order matches reading order. With one: every supported width, 200% zoom and the RTL mirror.

**Format.** Group findings under the principle each violates, ordered by severity, one row per root cause listing every location it appears in:

| Severity | Location | Before | After | Why |
| --- | --- | --- | --- | --- |

`Location` is `path/to/file:line`. `Why` names the principle and the user impact. Report every check you could not run as `Not verified`.

End with `Block` when any `HIGH` remains, `Approve` otherwise, leaving the rest in the table as work to do. Never `Approve` coverage you did not inspect. With nothing to report, say "No actionable findings" for this domain in one line and report verification.
