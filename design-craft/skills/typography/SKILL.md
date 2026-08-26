---
name: typography
description: Web typography — choosing and pairing faces, a role-based type scale, line-height and tracking by size, measure, wrapping, truncation, tabular numbers, underlines, iOS input zoom, smoothing and bidi behavior. Use when picking or pairing fonts, setting up a type scale, styling headings and text in components, fixing widows, orphans, overflow or truncation, or when text "looks off", "too wide", "too tight", or "wobbles" as values change. NOT for the words themselves (interface-copy), heading semantics (accessibility), contrast measurement (color-system), or grouping and spatial RTL (hierarchy-layout).
---

# Typography

Typography is mostly restraint: a sensible scale, comfortable spacing, enough contrast. A label, a table cell, a marketing headline and an article paragraph do not share one set of rules.

When reviewing, read the rendered page rather than the code — bad wrapping, widows and truncation only show at real content lengths. Write every fix in the project's styling system with the exact values below; `references/scale-and-fonts.md` maps declarations to Tailwind.

## Fewer fonts, sizes and weights

Rarely more than three families (display, body, one outlier in at most two slots). Pair for contrast, not similarity — a serif display over a sans body reads as deliberate; two near-identical sans faces read as a mistake. Never introduce a paid or proprietary face to satisfy a checklist; a type change is a brand decision the user asked for. Below `18px`, stay at weight `400` or heavier; weights under `300` are display-only at `28px`+.

## A role-based scale with descending headings

Define a small set of sizes and deviate as little as possible; hard-coded one-offs (`text-[19px]`, `1.4rem`) break down at scale. A role pairs size, line-height and weight so one decision replaces three:

| Role | Size | Line-height | Weight |
| --- | --- | --- | --- |
| Display | 2.25rem (36px) | 1.1 | 600 |
| Title | 1.5rem (24px) | 1.2 | 600 |
| Heading | 1.125rem (18px) | 1.3 | 600 |
| Body | 1rem (16px) | 1.5 | 400 |
| Caption | 0.8125rem (13px) | 1.4 | 400 |

Emphasis within a role is one weight step up, not a size change. Map heading levels to descending steps so a child heading never overpowers its parent; adjacent deep levels may share a size if weight or tracking keeps them distinct. Pick the heading element for semantics, then set its size — never the reverse. Use `px` or `rem`, never `em` — it compounds in nested elements.

## Line-height by role, tracking by size

Headings around `1.1`; body `1.5–1.6`; small text on wide lines up to `1.7`. Unitless values scale with the font. Anything wrapping to three or more lines needs at least `1.4`, even in a constrained row. A bold display headline never drops below `1.0`.

Large headings take slightly negative tracking (`-0.02em`); small uppercase labels take positive tracking (`0.05–0.1em`) because capitals lack the variety of lowercase; body copy is left alone. Kerning is the font's job — never disable it by accident.

## Cap the measure

Long lines make the eye lose the next line. Long-form text lands at 60–75 characters per line; `max-width: 65ch` or the equivalent pixel cap both work. Mix narrower paragraphs with wider images or code blocks in the same column rather than stretching the paragraph.

## Wrap deliberately

- `text-wrap: balance` on headings.
- `text-wrap: pretty` on descriptions, so no lone word ends a paragraph.
- `overflow-wrap: break-word` where a long word, URL or ID could escape.
- `white-space: nowrap` on labels and badges where a break looks broken — no clickable text wraps to two lines.

Skip `balance` and `pretty` in long-form text. Center only text of two or three lines; rewrite a centered line that wraps rather than letting it. Right-align numbers in tables.

## Tabular numbers on anything that changes

Default digits differ in width, so timers, prices and counters shift the layout as they update. `font-variant-numeric: tabular-nums` on every changing value and on numeric table columns.

## Truncate without losing content

Single line: `overflow: hidden; white-space: nowrap; text-overflow: ellipsis`. Several lines: `line-clamp`. Truncation hides content — when the missing text matters, keep the full value reachable in a tooltip or an expanded view.

## Write copy naturally, style with CSS

Store text in natural case and apply `text-transform`, so a redesign never rewrites copy. Render smart punctuation: curly quotes in prose (straight in code), an en dash for ranges (`2010–2020`), the single ellipsis character, `&nbsp;` to hold `16 px` together, `&shy;` to mark where a long word may break.

## Underlines from the font

`text-underline-position: from-font` and `text-decoration-thickness: from-font`, or tune with `text-underline-offset` and `text-decoration-skip-ink: auto`. A dotted underline marks an abbreviation or defined term. In interfaces where nearly everything is clickable, blue-underlined links are noise: navigation links get weight or a darker color; ancillary links show their underline on hover.

## Inputs at 16px on mobile

iOS Safari zooms the page when an input's text is under `16px`. Either size the input up on small screens (`text-base sm:text-sm`) or keep `font-size: 16px` and render the design size with a transform (recipe in `references/wrapping-and-details.md`). Ask which look the design wants; both are correct.

## Size and contrast floors

Long-form body starts at `16px`; move off it only for a nameable reason. UI text: `14px` for inputs and menus, `13px` for captions, rarely below `12px`. Text that looks low-contrast is measured by color-system and classified by accessibility — leave the colors alone unless asked.

## Root-level details

`-webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale` once on the root, never per component (Tailwind `antialiased`). Serve `.woff2`; load the weights and styles the design uses so the browser never synthesizes a fake bold or italic. Set `lang` and `dir`; isolate mixed-direction values with `<bdi>`; never reverse digits. Keep text selectable — `user-select: none` belongs only on drag surfaces.

## Before you finish

| Mistake | Fix |
| --- | --- |
| Child heading larger than its parent | Map the section's levels to descending scale steps |
| Heading element chosen for its default size | Semantics first; size in CSS |
| Lone word on the last line | `text-wrap: pretty` |
| Lopsided two-line heading | `text-wrap: balance` |
| Paragraph past 75 characters per line | Cap the measure at ~65ch |
| Proportional digits in a timer or table | `tabular-nums` |
| `leading-none` on a three-line description | At least `1.4` on any text that wraps to 3+ lines |
| Thin weight at 14px | 400+ below 18px |
| Mixed sizes on one line centered vertically | `align-items: baseline` |
| All-caps label at default tracking | `letter-spacing: 0.05em`+ |
| `em` in a type scale | `rem` or `px` |
| Justified text in an interface | `text-align: start` |

## Reporting

**Severity.** `HIGH` makes text unreadable or truncates content with no way to recover it. `MEDIUM` breaks the type system or the heading hierarchy. `LOW` is isolated polish.

**Verification.** Without a browser: computed size and weight per heading level, checked descending; declared line-height and measure; truncation rules against realistic string lengths. With one: resize the viewport to catch wrapping, widows and truncation at real content lengths.

**Format.** Group findings under the principle each violates, ordered by severity, one row per root cause listing every location it appears in:

| Severity | Location | Before | After | Why |
| --- | --- | --- | --- | --- |

`Location` is `path/to/file:line`. `Why` names the principle and the user impact. Report every check you could not run as `Not verified`.

End with `Block` when any `HIGH` remains, `Approve` otherwise, leaving the rest in the table as work to do. Never `Approve` coverage you did not inspect. With nothing to report, say "No actionable findings" for this domain in one line and report verification.
