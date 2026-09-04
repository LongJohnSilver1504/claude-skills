---
name: color-system
description: Color systems for product and marketing UI — ramps built in perceptual space, two-tier tokens named by role, one color one meaning, one filled action per view, measured contrast, dark and increased-contrast appearances, gradients. Use when creating or extending a palette, theming light and dark, naming color tokens, auditing the colors in a codebase, fixing a failing contrast pair, or when the user says the colors look "flat", "muddy", "AI-ish", or a button "disappears" in dark mode. NOT for which WCAG requirement applies (accessibility), shadows and image outlines (ui-polish), or picking the overall direction (design-direction).
---

# Color system

A color system is a small set of ramps, named by role and verified against the backgrounds they actually render on. Most color bugs are system bugs: a value picked in isolation, a token borrowed because it looked right, a pair nobody measured.

Colors are one of the few interface concerns with an exact answer. Never report a contrast value you did not measure, and never estimate a color you could compute.

## Match the project's notation and tokens

Reuse the project's tokens and notation. A single `oklch()` dropped into a hex codebase makes the palette harder to reason about, not better. For a new system `oklch()` is the best default because its numbers behave the way the ramp rules below describe; everywhere else a color library produces the same ramp in the project's notation.

## A system is ramps, not colors

One neutral ramp, one accent ramp, and only the status ramps the product renders (`danger`, `warning`, `success`, `info` — a ramp nothing imports is maintenance for zero pixels). A second accent hue earns its place only when two things must be told apart at a glance, and never adjacent to the first.

Every step has a job — page background, subtle background, component background, hover, selected, subtle border, border, strong border and focus ring, solid fill, solid hover, low-contrast text, high-contrast text. Generate the steps roles need and skip the rest. Neutrals carry the most roles and need the most steps. Structure in `references/palette.md`.

## Hold the hue across the ramp

A well-formed ramp: steps evenly spaced in *perceived* lightness (not HSL's number), hue constant end to end, vividness peaking mid-ramp and falling at both ends, steps denser at the light end, both ends stopping short of pure black and white. Build with a color library (`culori`, `colorjs.io`), never by eye. Ramps for several hues match perceived lightness exactly step for step and vividness *proportionally* — yellows and cyans peak lower than reds and blues, so a copied saturation number leaves the warning color washed out. Recipes in `references/palette.md`.

## Two tiers: primitives by hue, semantics by role

Primitives name a value (`--blue-500`, `--neutral-200`) and are never applied in a component. Semantics name a job (`--color-text-secondary`, `--color-bg-surface`) and are the only tier components reference. That seam is what makes dark mode, a white-label theme and increased contrast possible without touching a component. Grammar `--color-{role}-{variant}-{state}`, one word per concept, `accent` for the brand so `primary` can mean "most prominent of its group". Inventory and anti-patterns in `references/tokens.md`.

## Use a token only in its role

Never borrow a token because its value is right today. A separator used as a text color works until borders get lighter, then the text goes with them. A role with no token gets a token.

## One color, one meaning

Anything within ~15° of hue reads as the same color. If the accent means interactive, that hue on a static heading tells users to click something that is not clickable — and an interactive element rendered neutral misleads just as badly. Status hues stay visibly distinct from the accent (a red brand moves danger toward crimson and checks them side by side). Color is never the only carrier of meaning; accessibility owns that requirement.

## Fill exactly one action per view

When filled color encodes primary emphasis, one action gets the fill and peers stay neutral. Put the color on the background, not the label — accent-colored text on a neutral button reads as a link. Several colored backgrounds are fine when they encode distinct states or categories. Selected states may carry the accent on glyph and label: that is state, not emphasis.

## No grey text on colored backgrounds

Grey on white works by lowering contrast; on a colored surface it looks dirty, and white at reduced opacity looks washed out. Text on a colored surface takes the **same hue at a different lightness** — the surface's paired on-color token. Give greys themselves a trace of chroma (cool toward blue, warm toward orange) and hold that temperature across the whole ramp; a deliberately monochrome lane may keep zero-chroma neutrals.

## Measure the rendered pair, then report

Measure a foreground against the background it actually renders on — the card, not the page; the rendered result of `color-mix()`, opacity modifiers and translucent surfaces, not the declaration; the worst region of a gradient or image. When a pair fails, report the pair, the measured value and the missed threshold, then **leave the colors alone** — they are a design decision. Fix only when asked: change lightness first (the channel contrast responds to), hold hue, remeasure. Thresholds and approximations in `references/contrast.md`.

## Dark mode is not the light mode reversed

Swap the semantic roles as a starting point, then bring the accent's vividness down a step or two, widen the separation at the dark end, and recheck every pair — contrast is not symmetric. Pick one switching mechanism (`prefers-color-scheme` alone, a `.dark` class, or `light-dark()` with `color-scheme`) and use it for every token. Increased contrast (`prefers-contrast: more`) widens the foreground/background gap by at least 15 points of perceived lightness and is remeasured.

## Gradients: the space is a look

`in oklab` is the best default (even brightness, no surprises). `in oklch` travels around the hue wheel, staying vivid and sweeping every hue between the stops — the fix for a two-hue gradient that goes grey in the middle, and a source of hues nobody asked for. The sRGB default darkens and mutes the midpoint. Large low-contrast gradients band; keep text off gradients or measure the worst region. The indigo→purple diagonal on a hero or button is the most recognizable generated-UI tell; a gradient the lock did not call for is not added by habit.

## Before you finish

| Mistake | Fix |
| --- | --- |
| Raw value where the project has a token | Reuse or add the role token, in the project's notation |
| `--blue-500` used directly in a component | Point a semantic token at it |
| Token named for appearance (`--color-blue-button`) or first use (`--color-sidebar-gray`) | Name the role: `--color-accent-solid`, `--color-bg-surface` |
| `--color-primary` (brand) beside `--color-text-primary` (body) | `accent` for the brand |
| Separator token used as text | Add the missing role token |
| Ramp built by varying HSL lightness | Rebuild against perceived lightness with constant hue |
| Even spacing across the whole ramp | Tighten the light end until `50` and `100` read as two surfaces |
| Status hue colliding with the accent | Move it until destructive and primary read apart |
| Grey text on a colored panel | The surface's same-hue on-color token |
| Dark mode by mechanical reversal | Reverse, then reduce vividness, widen the dark end, remeasure |
| Media query for some tokens, `.dark` class for others | One mechanism throughout |
| Contrast "fixed" by changing hue | Change lightness |
| P3 color with no sRGB fallback | sRGB first, override inside `@media (color-gamut: p3)` |

## Reporting

**Severity.** `HIGH` makes content unreadable or assigns a misleading semantic color. `MEDIUM` is a noticeable theme, token or gamut failure. `LOW` is isolated polish.

**Verification.** Without a browser: token values, gamut of every declared color, both appearance blocks present, contrast computed from the declared token pair. With one: the background actually rendered behind the text, including opacity and any image beneath, measured in both appearances. A failing pair is reported, not repainted.

**Format.** Group findings under the principle each violates, ordered by severity, one row per root cause listing every location it appears in:

| Severity | Location | Before | After | Why |
| --- | --- | --- | --- | --- |

`Location` is `path/to/file:line`. `Why` names the principle and the user impact. Report every check you could not run as `Not verified`.

End with `Block` when any `HIGH` remains, `Approve` otherwise, leaving the rest in the table as work to do. Never `Approve` coverage you did not inspect. With nothing to report, say "No actionable findings" for this domain in one line and report verification.
