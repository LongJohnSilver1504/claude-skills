# Refactoring UI — Audit Checklist

Run this checklist when reviewing a component or screen. For each chapter, scan for the failure modes listed. Cite the specific rule (e.g. "2.3 grey on color") in findings so the user can look up the underlying principle in `principles.md`.

Severity tiers (use these labels in the audit output):
- **🔴 Critical** — actively hurts usability or hierarchy. Fix first.
- **🟡 Important** — noticeable polish issue. Fix in this pass.
- **🟢 Nitpick** — minor refinement. Note but don't block on it.

---

## Chapter 1 — Starting from Scratch

These are project-level concerns, less applicable to a single-component audit. Check when reviewing a screen or feature.

- [ ] **1.4 Personality consistency** — does the typography, color, radius, and language all point at the same personality, or do they conflict (e.g. friendly rounded corners + cold corporate copy)?
- [ ] **1.5 Use of design tokens** — are colors, spacing, font sizes pulled from a defined system (Tailwind theme, CSS variables, design tokens), or are there raw arbitrary values (`text-[13px]`, `bg-[#3a7bd5]`, `mt-[18px]`)?

## Chapter 2 — Hierarchy

This is where most fixable issues live. Spend time here.

- [ ] **2.1 Clear primary action / focus** — when you squint, what stands out? Is there one obvious primary element per area, or does everything compete?
- [ ] **2.2 Hierarchy by weight + color, not just size** — are headlines huge to compensate for being styled identically to body text? Is secondary text tiny instead of just being a softer color? Are there more than 2 font weights or more than 3 text colors?
- [ ] **2.2 Font weights ≥ 400** — any text under 400 weight at sizes under ~24px?
- [ ] **2.3 Grey text on colored backgrounds** — any grey or low-opacity-white text sitting on a colored panel? Should be hand-picked same-hue color.
- [ ] **2.4 Emphasis by addition only** — does the primary thing pop because of itself, or because competitors are softer? If primary doesn't pop, try subtracting from the competition.
- [ ] **2.5 `Label: value` patterns** — any `Email: x`, `Status: y`, `Bedrooms: 3` patterns that could lose the label or fold it into the value?
- [ ] **2.5 Labels not de-emphasized** — when labels are genuinely needed, are they styled smaller/lighter than the value?
- [ ] **2.6 Heading element ≠ heading size** — are `<h1>`, `<h2>` rendered visually huge just because they're semantic headings, even when they function as labels?
- [ ] **2.7 Heavy icons next to text** — solid/filled icons paired with regular text at full contrast? They should be desaturated/lighter to balance.
- [ ] **2.7 Thin border too soft** — borders that are invisible but darkening them looks harsh? Try increasing border width instead.
- [ ] **2.8 Button hierarchy** — multiple solid-filled buttons of equal weight on the same page? Only the primary action should look primary; secondary should be outline, tertiary should look like a link.
- [ ] **2.8 Destructive ≠ primary** — is the destructive action visually loud even when it's not the primary action of the page?

## Chapter 3 — Layout and Spacing

- [ ] **3.1 Tight white space** — does the design feel cramped? When in doubt, more padding.
- [ ] **3.2 Spacing scale** — are spacings drawn from a consistent scale (Tailwind's `gap-2`, `p-4`, etc.) or are there arbitrary values?
- [ ] **3.2 Adjacent values too close** — any two spacing values < 25% apart being used to mean different things (e.g. `mt-3` here, `mt-3.5` there)?
- [ ] **3.3 Forced full-width** — components stretched to 100% width when 600–800px would be better. Especially: forms, cards, articles.
- [ ] **3.4 Misuse of grid** — sidebars sized as % of viewport instead of fixed width? Elements scaling fluidly when they should have an optimal size with `max-width`?
- [ ] **3.5 Relative sizing across breakpoints** — `em` units defining cross-breakpoint relationships? Button padding scaled `em`-relative to font size?
- [ ] **3.6 Ambiguous grouping spacing** — in label-input pairs, lists, etc., is the spacing within a group ≥ the spacing between groups?

## Chapter 4 — Typography

- [ ] **4.1 Type scale violations** — are there text sizes that don't appear elsewhere in the system (e.g. one-off `text-[13px]`)?
- [ ] **4.1 `em` units in type sizes** — any `1.25em`, `0.875em`? Should be `rem` or fixed.
- [ ] **4.3 Line length** — any paragraphs running wider than ~75 characters per line?
- [ ] **4.3 Body content too narrow** — paragraphs squeezed below ~45 chars?
- [ ] **4.4 Mixed font sizes centered, not baselined** — title + metadata on the same line center-aligned vertically instead of `items-baseline`?
- [ ] **4.5 Line height** — headlines at 1.5+ line-height (should be ~1.1); body at < 1.4 for long-form (should be ~1.5–1.6); wide-line body at 1.5 (should be ~1.7+).
- [ ] **4.6 Every link is blue/underlined** — link styling appropriate for paragraph context applied indiscriminately to navigation/UI links?
- [ ] **4.7 Centered long text** — center-aligned text running ≥ 3 lines.
- [ ] **4.7 Numbers left-aligned in tables** — should be right-aligned (or tabular figures with `font-variant-numeric: tabular-nums`).
- [ ] **4.8 All-caps without extra letter-spacing** — uppercase text at default tracking is harder to read.

## Chapter 5 — Color

- [ ] **5.2 Too-thin palette** — only 2–3 greys defined, hitting "I need something between these two" friction?
- [ ] **5.3 Ad-hoc shade creation** — using `lighten()`, `color-mix()`, or one-off opacity layers instead of a defined shade?
- [ ] **5.4 Washed-out edges of palette** — very light or very dark shades that look grey/dirty? May need saturation bumped.
- [ ] **5.5 Sterile greys** — pure 0%-saturation greys throughout?
- [ ] **5.6 Contrast fails** — text below 4.5:1 ratio against its background? (3:1 for ≥18px or bold ≥14px.) Run a contrast checker on every text/background pair.
- [ ] **5.7 Color as sole signal** — status, change direction, categories conveyed only by color? Need a second channel (icon, label, shape).

## Chapter 6 — Depth

- [ ] **6.1 Light from wrong direction** — shadows above elements? Highlights on the bottom of raised elements?
- [ ] **6.1 Semi-transparent white overlays** as "lighter" — desaturates the underlying color. Hand-pick instead.
- [ ] **6.2 No elevation system** — every shadow a unique value? Should be ~5 defined levels.
- [ ] **6.2 Wrong elevation for purpose** — modal with a subtle shadow? Button with a huge shadow?
- [ ] **6.3 Single-layer shadows** for cards/modals — opportunity to use the two-shadow contact + directional technique.
- [ ] **6.4 Flat with no depth cues** — a flat design that reads as a wall of equal-weight rectangles? Use lighter/darker fills or solid offset shadows.
- [ ] **6.5 Everything boxed inside its parent** — no overlap or layer interplay where it could add interest?

## Chapter 7 — Images

- [ ] **7.1 Placeholder / smartphone-quality images** — bad photography ruining an otherwise good design.
- [ ] **7.2 Text on photos with no contrast treatment** — text laid directly on a varied background without overlay, contrast reduction, or text shadow.
- [ ] **7.3 Tiny icons blown up** — 16/24px icons used at 64px+ without being wrapped in a colored container.
- [ ] **7.3 Screenshots scaled to illegible sizes** — text in the screenshot too small to read.
- [ ] **7.3 Logo shrunk for favicon** — should be a hand-redrawn 16px version.
- [ ] **7.4 User images at intrinsic aspect ratio** — breaking layout instead of being clipped to a container.
- [ ] **7.4 Borders around images** — should usually be inner box-shadow instead, especially for user content.

## Chapter 8 — Finishing Touches

- [ ] **8.1 Default browser styling** — vanilla bullet lists, default checkbox/radio, default `<blockquote>` indented quotation. Opportunities to "supercharge."
- [ ] **8.2 No accent color usage** — could a thin colored border (top of card, left of alert, under active nav) add personality cheaply?
- [ ] **8.3 Plain backgrounds everywhere** — would alternating section colors, a gradient, or a subtle pattern break monotony?
- [ ] **8.4 Generic empty states** — "No items" with no illustration, no specific CTA, secondary UI still visible.
- [ ] **8.5 Border overload** — borders + different background colors (one is redundant); cards with borders that could use shadows instead.
- [ ] **8.6 Stock-default components** — dropdowns / tables / radio groups in their most boring possible form when the UI would benefit from something more deliberate.

---

## Output structure for an audit

Group findings by severity, not by chapter. Within each severity, cite the rule by number. Example:

```
🔴 Critical (3)
- 2.8 Three solid-filled primary-style buttons in the card header — only "Save" should be primary; "Cancel" should be outline, "Delete" tertiary.
- 5.6 The grey-on-blue helper text fails WCAG AA (2.1:1 ratio). Hand-pick a darker shade with the same hue as the background.
- 3.6 Label and input have 8px gap, but form groups also have 8px between them — groups don't read as connected.

🟡 Important (4)
- 2.2 Page title is 36px regular weight — could be 24px semibold and still feel like the primary heading.
- 2.5 "Status: Active" pattern in the user row. Either drop the label (status is implied by an active dot) or fold it ("Active user").
- 4.3 Article body is 1024px wide — about 110 chars/line. Cap at ~680px (~70 chars).
- 6.2 Button and modal both use the same `shadow-md`. The modal should be at a much higher elevation.

🟢 Nitpick (2)
- 4.8 The all-caps section labels could use a touch of letter-spacing (tracking-wider).
- 8.5 The card has both a border and a different background color from the page — one is redundant.
```

Keep each finding to one sentence of diagnosis + one sentence of fix. Don't pad with the principle explanation; the rule number does that work.
