# Scenario axes

Each axis carries a cue. Cue matches → the axis stays and contributes its scenarios plus any value the component's own props make obviously worse (the longest option in a real dataset). Cue fails → the axis is dropped and the drop is named.

## Content length

**Cue: the component renders text it does not author** — user input, CMS content, API data, translations. A fixed label the codebase controls fails the cue.

| Scenario | Catches |
| --- | --- |
| Empty string | collapsed boxes, floating labels with nothing to float over, placeholder-only inputs |
| One word | buttons and badges sized to their longest expected content |
| Typical content | the baseline |
| Several sentences | wrapping, line-height at multiple lines, containers that assumed one line |
| One unbreakable string (`Donaudampfschiffahrtsgesellschaft`, a long URL) | overflow with no wrap opportunity |

Owners: typography (wrapping, truncation), hierarchy-layout (no room), interface-copy (the source copy).

## Content shape

**Cue: text can come from users or locales the team does not write in.**

| Scenario | Catches |
| --- | --- |
| Emoji, alone and mixed | line-height jumps, broken centering, truncation splitting a character |
| RTL text | direction handling, punctuation on the wrong side |
| Mixed direction (an LTR product name in an RTL sentence) | bidi isolation |
| Diacritics and tall scripts | clipped ascenders and descenders in tight line boxes |
| Numbers where columns align | proportional figures wobbling in tables and timers |

Owners: typography; spatial mirroring → hierarchy-layout.

## Quantity

**Cue: the component repeats over items** — lists, tables, grids, tag rows, avatar stacks.

| Scenario | Catches |
| --- | --- |
| Zero items | blank regions, missing empty states |
| One item | grids designed around plural content |
| The realistic count | the baseline |
| Ten times the realistic count | missing scroll or pagination, performance collapse, sticky elements unsticking |

Owners: interface-copy (the empty state), hierarchy-layout (the rest).

## Container

**Cue: always.** The component does not choose its container. Each width is a fixed container on the page.

| Scenario | Catches |
| --- | --- |
| A 320px container | clipping, horizontal scroll, controls escaping |
| Squeezed by a flex or grid sibling | min-content blowout, refusing to shrink |
| A very wide container | unbounded measure, stretched controls, content pinned to opposite edges |

Owner: hierarchy-layout.

## State

**Cue: the component has the state.** Render only states that arrive as props.

| Scenario | Catches |
| --- | --- |
| Loading | layout shift when content arrives, spinners with no accessible name |
| Error | overflowing messages, color as the only signal |
| Disabled | contrast collapse, focus behavior |

Focus and hover are the user's to try while viewing the page — invite them to tab through instead of simulating focus. Owners: accessibility; purely visual state polish → ui-polish; motion of state changes → motion.

## Environment

**Cue: the project supports the mode.** Viewing modes, not page content — the page renders nothing for them. Name them in the report for the user to toggle: OS dark mode where a dark theme exists, browser zoom to 200%, reduced motion. Simulating one on the page (re-declaring dark tokens under a class) observes a different component.

Owners: color-system (dark mode), accessibility (zoom, motion preference).
