# Page shapes and archetypes

A **shape** is the whole-page skeleton: heading placement, section rhythm, how the fold hands off to the scroll, where proof and CTA live, the divider language. Two pages can share a palette and still be structurally different — or share the generic template and read as one site in two color swaps. Pick one by name, out loud, before building; the reflexive reach is always the generic one.

## The twelve shapes

| # | Shape | The shape | Reach for it when | Affinity |
| --- | --- | --- | --- | --- |
| 1 | **Feature Stack** | hero, then features one full-width band at a time, alternating text/visual — bands, not a 3-up grid, each leading with a real visual | 3–6 distinct capabilities that each deserve a visual | any; the workhorse — and the reflexive pick to check yourself on |
| 2 | **Bento Showcase** | asymmetric grid of mixed-span tiles, each a small live-looking UI fragment; rhythm from tile size | many small features better shown at a glance than in sequence | premium, technical, playful |
| 3 | **Editorial Index** | masthead, numbered or categorized list of work/sections, generous type, hairline rules; content-led | portfolios, agencies, publications, "who we are" | elegant, premium |
| 4 | **Long-Scroll Narrative** | the arc told top to bottom, one full-section beat at a time, scroll-linked reveals between | a non-obvious product that needs explaining; a launch; a manifesto with structure | any |
| 5 | **Stat-Led** | one dominant real number or a tight row of metrics is the hero and spine | the story is genuinely quantitative **and the numbers are real** | premium, technical |
| 6 | **Gallery Grid** | real photography, product shots or case tiles fill the page; minimal chrome | commerce, food, travel, physical product — imagery sells | elegant, warm, playful |
| 7 | **Product Demo / Workbench** | the product in use is the hero (annotated capture, interactive-looking demo); organized around doing | dev tools, apps — seeing it work is the argument | technical, premium |
| 8 | **Split Diptych** | two-column composition: a persistent statement/nav column beside a scrolling content column, or a hard split fold | studios, single-voice products, an art-directed feel | elegant, premium, playful |
| 9 | **Conversational FAQ** | built around real audience questions answered directly, proof and CTA folded into answers | a trust gap or one specific objection (regulated, high-consideration) | warm, technical |
| 10 | **Manifesto** | type-forward, few images, one point of view carried by big statements and short lines | brand-led launches, opinionated products | elegant, premium, technical |
| 11 | **Catalogue** | structured, near-tabular listing (plans, SKUs, specs, releases) with editorial care | pricing-as-page, changelogs, spec-heavy products | technical, elegant |
| 12 | **Poster Fold** | one full-bleed art-directed fold carries the first screen; the page below goes quiet | the brand or one image *is* the message — events, fashion, a launch moment | elegant, playful, warm |

Match shape to argument: "look how much people use this" → Stat-Led; "look at the work" → Gallery Grid; "let me explain why this matters" → Long-Scroll Narrative. A vague brief gets three offered shapes from different groups (one grid-led, one document-led, one poster-led), not a survey of twelve. App shells (dashboards behind a sidebar) don't take a marketing shape — the sidebar-plus-topbar frame is theirs.

## Archetype families

Names are short IDs so a build can be recorded and rotated.

**Nav** — N1 minimal bar (wordmark, ≤2 links, one button — only for pages with ≤2 destinations) · N2 balanced product bar · N3 floating pill, detached from the top · N4 masthead with a rule · N5 side rail (diptych pages).

**Hero** — H1 statement (type only, oversized) · H2 split: copy beside a product capture · H3 centered stack with one visual below (max two centered elements) · H4 full-bleed poster · H5 bento fold · H6 letter/manifesto (one paragraph, typed sign-off) · H7 workbench (the product, annotated).

**Feature / solution** — F1 alternating bands · F2 bento tiles · F3 spec sheet · F4 numbered step sequence · F5 annotated capture · F6 comparison / before-after.

**Proof** — P1 logo wall · P2 pull quote with portrait · P3 single case with a real chart · P4 stat strip (real numbers only) · P5 wall of short quotes.

**Close** — C1 inline form · C2 statement + action · C3 pricing recap + action · C4 sticky bar.

**Footer** — Ft1 masthead footer (big wordmark, few links) · Ft2 single-row utility footer · Ft3 statement footer (one line + legal) · Ft4 four-column farm (docs roots only).

**Section heads** — S1 stacked eyebrow over heading · S2 heading with a hairline · S3 number + heading. Never eyebrow-left / heading-right in two columns; never the same pill eyebrow on every section.

## Cross-cutting rules

- No two sections of one page use the same archetype.
- No section headline outside the hero exceeds ~50–65% of the hero display size (one deliberate large statement moment in Long-Scroll or Manifesto is the exception, stated).
- Nav N1 and footer Ft4 are the reflexive defaults; rotate deliberately through the others.
- One intentional rule-break per page: a bleed past the column, an oversized number, an asymmetric moment.

## Rotation and the log

`.design/log.json`, newest first, one entry per build, trimmed to ~20:

```json
[
  { "date": "2026-08-25", "page": "landing", "shape": "Long-Scroll Narrative", "nav": "N3", "hero": "H6", "footer": "Ft3",
    "knobs": "hero=letter/1-para/typed-signoff", "arc": "hook(H6)->problem(prose+F6)->solution(F1)->how(F4)->proof(P4)->close(C2)",
    "brief": "Tracejam · observability" }
]
```

Rule, over the last 3–5 entries: shape ≠ last; nav ≠ last; footer ≠ last; hero ≠ last; a reused archetype changes a knob and says which. Palette does not rotate — it is per project. The CSS stamp on the first line of the built stylesheet records the same fields plus `contrast: measured` and the six critique scores, so a later audit can check whether the stamp still matches what shipped.
