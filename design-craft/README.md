# design-craft

Design skills for Claude Code that give an agent the taste of a senior design engineer — 15 skills that lock a visual direction, build with exact values instead of approximations, and review with evidence instead of preference.

Agents don't have great taste by default: `ease-in` on an entrance, a solid border where a soft shadow belongs, Inter plus an indigo gradient on every hero, a proof bar full of invented metrics. All the small mistakes compound into interfaces that are fine and forgettable. These skills list those mistakes and how to avoid them, and they remember the decisions so the second screen matches the first.

Separate from the `claude-skills` pipeline plugin in this repo — install either, both, or neither.

## Install

```text
/plugin marketplace add LongJohnSilver1504/claude-skills
/plugin install design-craft@claude-skills
```

Skills run namespaced: `/design-craft:design-help`.

**First run in a project:** `/design-craft:design-direction`. It reads your codebase, proposes a system, waits for your confirmation, and writes `.design/style-lock.md`. Every other skill reads that file instead of re-deriving your look.

## Start here

| Skill | Purpose |
| --- | --- |
| `design-help` | Find out which skill fits the situation you are in. |

## The main flow

```
design-direction  →  build (reference skills)  →  design-review  →  ship
```

| Skill | Purpose |
| --- | --- |
| `design-direction` | Lock the visual direction once: design read + dials, grounding in code, assets, a reference or a mood, anti-default rules, `.design/style-lock.md`. Also studies references (grammar, not pixels) and runs redesigns without breaking contracts. |
| `landing-page` | Build or upgrade a marketing page with a real argument (narrative arc), a non-generic rotated page shape, conversion copy, a hero that passes the five-second test, real assets, ship-completeness — and marketing-tier motion and effects (scroll choreography, word reveals, pinned sequences, island nav, gradient borders, atmospheric surfaces) scaled by the lock's motion dial. |
| `design-review` | Cross-discipline review of a screen, flow, branch or PR: every reference skill, escalation triggers, cheaper-fix ladder, one ranked Before/After/Why table, Block or Approve. |

## Shaping

| Skill | Purpose |
| --- | --- |
| `variants` | Three genuinely different versions of one piece of UI on one named axis, behind a picker in the real page. You choose. |
| `stress-states` | One component rendered under every state real use can reach — the page is the report of what broke, each break named with its owner. |

## Reference skills

The reusable layer the flow skills route to and cite. Each owns one domain, says what belongs elsewhere, and reports in the same `Severity | Location | Before | After | Why` table.

| Skill | Purpose |
| --- | --- |
| `hierarchy-layout` | Rank elements, emphasize by de-emphasizing, one primary action, group with space (2× rule), align to shared edges, breakpoints from content, plan for growth. |
| `typography` | Faces and pairing, a role-based scale, line-height and tracking by size, measure, wrapping, truncation, tabular numbers, underlines, iOS input zoom. |
| `color-system` | Perceptual ramps, two-tier tokens by role, one color one meaning, one filled action, measured contrast (APCA and WCAG), dark and increased-contrast modes, gradient spaces. |
| `ui-polish` | Concentric radii, optical alignment, shadows for elevation and borders for structure, a light source, image outlines, icon weight and states, theme-switch handling, finishing touches and real empty states. |
| `motion` | Should it animate at all → purpose → tool → properties → curve and duration or spring → interruption → reduced motion. Build, review and scout modes, with recipes. |
| `interface-copy` | Voice and tone, verb-first buttons, links that name destinations, errors that say how to fix, empty states that point forward, real content over lorem ipsum and clichés. |
| `accessibility` | Native elements first, visible focus, full keyboard support, hit areas, labeled forms, accessible names, color never alone, reduced motion, live regions, structure, zoom. |
| `mobile-web` | The phone-browser platform layer: tap highlight, `dvh`/`svh` instead of `100vh`, `viewport-fit=cover` and safe-area insets, overscroll and pull-to-refresh, `touch-action` and the tap delay, callouts on controls, carousel axis, `theme-color` per scheme, and verifying on a real device. |
| `pick-library` | The right library for toasts, primitives, command menus, motion, numbers, charts, drag and drop, virtualization, state and theming — instead of hand-rolling. |

## Agent

| Agent | Purpose |
| --- | --- |
| `design-critic` | Read-only reviewer that runs `design-review` for pipelines that need a design gate without write access. |

## How it fits together

- **Memory.** `.design/style-lock.md` holds the system, the color contract and the "Do not" list. `.design/log.json` records marketing builds so shapes rotate instead of repeating.
- **Evidence, not taste.** Reviews cite `file:line`, show Before and After, measure contrast rather than eyeballing it, and mark unrun checks `Not verified`.
- **Cheaper fix first.** Delete → use the platform → reuse a project token → correct the value → add.
- **Exact values.** `scale(0.96)`, `cubic-bezier(0.23, 1, 0.32, 1)`, `oklch(0 0 0 / 0.1)` — never a familiar-looking substitute.
- **Render before you judge.** A review opens the interface, captures the viewport tiers, walks the keyboard, the states and the console, and reports which rung of that ladder it reached. A static review is valid; a static review claiming a runtime-decided domain is not.

## Routing evals

The boundaries between these skills live entirely in their descriptions — nothing but a `NOT for` clause keeps a dark-mode token question out of `accessibility`. `evals/` checks that mechanically: one case per skill carrying the clause, each graded deterministically (the owning skill fires, the competitor it names does not). No LLM judge.

```bash
npm run eval   # 12 cases, ~45s, ~$1.57 — run from design-craft/
```

`node scripts/validate.mjs` runs the free half: a skill with a `NOT for` clause and no case fails. It is a regression gate on descriptions, not a quality measure — see `evals/README.md`.

## Sources

Synthesized from seven public, MIT-licensed collections — the strongest material from each, rewritten into one coherent system: [Jakub Krehel](https://github.com/jakubkrehel/skills) (review architecture, domain skills, variant, break), [Emil Kowalski](https://github.com/emilkowalski/skill) (motion framework, recipes, scout mode and vocabulary, library picks, Apple fluid interfaces, mobile-web platform fixes), [tastemaker](https://github.com/codeswithroh/tastemaker) (style lock, anti-slop gates, narrative arc, page shapes, diversification), [ConardLi](https://github.com/ConardLi/garden-skills) (design read and dials, checkpoints, redesign protocol), [Meng To](https://github.com/MengTo/Skills) (reference-inspired brand worlds), [elayadesign](https://github.com/elayadesign/ai-design-skills) (landing-page structure, conversion copy, content realism), and Refactoring UI as condensed in `claude-skills`. Two mechanisms — the browser-driven review loop and keying a cold start to product type — are adapted from [ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill); none of its palette, font-pairing or style data was copied. Organization follows [Matt Pocock's](https://www.aihero.dev/skills) router → main flow → shaping → reference layer.

## Maintaining

See `CLAUDE.md`. Run `node scripts/validate.mjs` after any change.
