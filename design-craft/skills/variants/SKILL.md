---
name: variants
description: Answers "which of these?" rather than "is this right?" — builds three genuinely different versions of one piece of UI, each on a different position of one named axis, behind a picker in the real page, so the user can flip between them and promote the winner. Only runs when explicitly invoked.
disable-model-invocation: true
---

# Variants

Take one described piece of UI, build three versions that differ on purpose, put them behind a picker in the page that will contain the piece, hand the decision back. Every other skill here judges; this one produces candidates.

## Different answers, not different tints

Three variants that differ in accent color teach nothing. Each variant is a different answer to the same brief, on an axis one of the reference skills owns:

| Axis | Owner | What varies |
| --- | --- | --- |
| Structure | hierarchy-layout | grouping, order, column count, what collapses |
| Density | hierarchy-layout | spacing scale, hit areas, how much fits |
| Emphasis | color-system | where filled color goes, what recedes |
| Type | typography | scale steps, weight contrast, measure |
| Voice | interface-copy | labels, tone, how much copy |
| Motion story | motion | how state changes are bridged, how much moves |

Pick **one primary axis** and give each variant a different position on it. Secondary choices follow from the primary rather than varying independently — a dense variant may need a smaller type step, and that is coherence, not a second axis. Varying everything at once produces three results nobody can attribute: the user learns which they liked, not what made it work.

## The floor every variant clears

A variant that wins on looks and fails an escalation trigger is a bug with a nice surface. Before entering the picker, every variant clears the design-review skill's triggers: accessible names on every control, keyboard reaches everything a pointer does, visible focus, nothing clips at 320px, no meaning carried by color alone, motion within the motion skill's rules. The floor is identical across variants and never trades against an axis; where a direction only works by breaking it, drop the direction and say so.

## 1. Scope one piece

One piece per run. "The dashboard" is not a piece; the metric card is. When the brief spans several, name the one the others hang off, say why, offer the rest as later runs. Restate the brief in one sentence: what it is, where it renders, what it must do.

## 2. Learn the ground

Read `.design/style-lock.md` and the codebase: styling system, component library, motion library, tokens (color, spacing, radius, type, easing), the product's density and voice, and where the piece renders — against what background, beside which neighbors, at which widths. Variants share the tokens; that is not convergence, it is what lets them ship tomorrow. With no project to read, use neutral greys, one accent and the system font stack, and say so.

## 3. Name the set before writing code

Default three; up to five only when asked or when the space is genuinely wide. Write the set first — a name and an axis position each. Names describe the direction (`Quiet`, `Editorial`, `Dense`), never `Option A`. Done when no two variants share a position and each axis position fits in a phrase. Two directions that would differ only in accent or copy are one direction — replace one.

## 4. Build into the real page

Host the variants on the page that will contain the piece, with real chrome, real neighbors and realistic data: product-shaped copy, plausible names, the item count the page will really carry. Lorem ipsum and three rows make every structure look good. Where no page can host it, one self-contained HTML file with the same picker.

Select with a URL search param (`?variant=quiet`) so every variant is a link; a floating control sets it. Render one variant at a time, full size — thumbnails distort the spacing you are choosing between. Switching is instant (the highest-frequency action of the run gets no transition). The picker's exact spec is in `references/picker.md`: deliberately outside the design system, never restyled with project tokens, or you end up judging the harness. Until promotion, the harness never imports from production and production never imports from the harness.

## 5. Present the tradeoffs and stop

Flip through every variant yourself first: each renders, each interaction responds, the console is clean. Then:

| Variant | Axis position | Right when | Costs |
| --- | --- | --- | --- |
| Quiet | lowest visual weight | the page is used daily | least memorable |
| Editorial | largest type, most space | the moment deserves weight | eats vertical space |

Say where the picker runs, which keys flip it, and which width you judged at — the answer can change between 375px and 1440px. Never mark a favorite in the table. Asked directly, answer from how often the piece is seen and the product's personality, not from which you enjoyed building.

## 6. Promote one, delete the rest

On a choice: build that variant properly where it belongs, following the project's conventions, then delete the others and the harness unless asked to keep it. Asked for another round: keep the harness and rerun step 3, taking new positions around the direction the user leaned toward.

| Invocation | Behavior |
| --- | --- |
| `<description>` | full run, three variants |
| `<description> x5` | five variants |
| `riff <variant>` | new round diverging around that variant |
| `keep <variant>` | promote and delete the harness |
| `keep <variant>, leave the picker` | promote, keep the harness |

## Before you finish

| Mistake | Fix |
| --- | --- |
| Variants differ only in accent or copy | Move one to a different axis position, or cut it |
| Every axis varies at once | One axis; the rest follow |
| Judged on a blank route | Host on the containing page |
| Lorem ipsum, three rows, "Jane Doe" | Real copy and the real item count |
| The boldest variant skips keyboard or focus | Clear the floor or drop the direction |
| A favorite marked in the table | Costs and "right when"; the user chooses |
| Picker restyled with project tokens | Keep it visibly outside the system |
| Harness left behind after promotion | Delete it unless asked to keep |

**Done when:** every variant is reachable from the picker at a shareable URL, behaves correctly with a clean console, sits in the real page with real content, clears the floor, and the tradeoff table names each one's cost without a favorite.
