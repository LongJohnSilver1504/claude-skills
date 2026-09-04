---
name: design-help
description: Find out which design-craft skill fits the situation you are in, how the skills hand off to each other, and where the project's visual decisions live. Only runs when explicitly invoked.
disable-model-invocation: true
---

# Design help

Ask "what am I trying to do?", then route. State the recommendation in one or two lines and offer to run it — this skill routes, it does not design.

## Start here

Every project begins with a **style lock** — `.design/style-lock.md`, written once by `design-direction`, read by everything else. No lock yet → that is always the first step for anything bigger than one component.

## The main flow

```
design-direction  →  build with the reference skills  →  design-review  →  ship
   (lock it)          (hierarchy-layout, typography,        (Block / Approve)
                       color-system, ui-polish, motion,
                       interface-copy, accessibility,
                       pick-library)
```

Marketing pages take the same flow with `landing-page` as the build step. Exploration branches off anywhere: `variants` to choose between directions, `stress-states` to see what breaks.

## Routing table

| You want to… | Run |
| --- | --- |
| start UI in a project with no look yet, or the output feels generic / AI-made | `design-direction` |
| match a reference, an admired site, or "make it feel like X" | `design-direction` (study mode) |
| redesign or extend an existing UI without breaking it | `design-direction` (redesign protocol), then the reference skills |
| build a landing, product, pricing or campaign page | `landing-page` |
| improve an existing landing — generic, static, "looks AI-made" | `design-review` on it, then `landing-page` (redesign via `design-direction`'s protocol) |
| scroll storytelling, cinematic reveals, island nav, atmospheric hero effects | `landing-page` (motion-and-effects reference), scaled by the lock's motion dial |
| decide what is primary, space a form, choose what collapses | `hierarchy-layout` |
| pick or pair fonts, fix wrapping, widows, truncation, a type scale | `typography` |
| build or fix a palette, tokens, dark mode, a failing contrast pair | `color-system` |
| nested corners, shadows, icons, empty states, the finishing pass | `ui-polish` |
| animate something, review motion, or find where motion would help | `motion` |
| write or fix labels, errors, empty states, CTAs, marketing copy | `interface-copy` |
| keyboard, focus, screen readers, hit areas, ARIA | `accessibility` |
| a toast, drawer, command menu, chart, sortable or virtualized list | `pick-library` |
| choose between several directions for one piece of UI | `variants` |
| see every state a component can be pushed into | `stress-states` |
| review a screen, a flow, a branch or a PR for design quality | `design-review` |

## How the skills relate

- **Reference skills own the rules.** `design-review` routes to them and consolidates; `variants` and `stress-states` name them as owners; `landing-page` and `design-direction` hand execution to them. Nothing outside a reference skill restates its rules.
- **Shared reporting.** Every reference skill reports with the same `Severity | Location | Before | After | Why` table and a `Block`/`Approve` verdict, and marks unrun checks `Not verified`.
- **Cheaper fix first.** Delete → use the platform → reuse a project token → correct the value → add.
- **Memory.** `.design/style-lock.md` holds the visual system and the "Do not" list; `.design/log.json` holds the structural record of marketing builds so shapes rotate.

## Common confusions

| Looks like | Actually |
| --- | --- |
| "Make this look better" | `design-review` first, then the owning skills fix what it found |
| "Add some animation" | `motion` — which may correctly answer "no" |
| "Which option is best?" | `variants` builds them; you choose |
| "Does this handle long names?" | `stress-states`, not a code read |
| "Pick colors for my app" | `design-direction` on a cold project; `color-system` when a lock exists |
| "This dropdown is buggy" | `pick-library` before hand-fixing a `<div>` dropdown |
