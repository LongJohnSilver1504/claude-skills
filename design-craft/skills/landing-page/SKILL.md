---
name: landing-page
description: Build or upgrade a high-converting landing or marketing page with a real argument and a non-generic shape — intake, one offer → one audience → one action, a narrative arc, a named page shape rotated against previous builds, conversion copy, a hero that passes the five-second test, real assets, marketing-tier motion and effects (scroll choreography, word reveals, pinned sequences, island nav, atmospheric surfaces) scaled by the lock's motion dial, ship-completeness, and the visual system from the project's style lock. Use when asked for a landing page, marketing site, product page, pricing page, launch page, waitlist or campaign page, a "cinematic", "premium" or "awwwards-style" site, scroll storytelling, or when an existing marketing page "looks like every other SaaS site". NOT for app screens and dashboards (hierarchy-layout and the reference skills), or for locking the visual direction itself (design-direction, which runs first on a cold project).
---

# Landing page

A landing page is not a homepage. A homepage serves many intents; a landing page wins one: **one offer → one audience → one primary action.** Two things make generated landing pages read as generated even with a perfect palette: the same page shape every time (hero → three feature cards → testimonial → CTA → footer), and sections that don't add up to an argument. This skill fixes both, then hands visual execution to the reference skills.

## Step 0 — Direction first

Read `.design/style-lock.md`. Missing → run the design-direction skill first; a landing page built with no locked system is where Inter-plus-indigo comes from. Then read `.design/log.json` (previous builds' shapes) if it exists.

## Step 1 — Intake, in one batch

Ask only for what is missing, all at once, and proceed on stated assumptions when answers don't come:

- **Purpose:** the ONE primary action (trial, demo, buy, waitlist, download); the exact offer; what counts as a conversion.
- **Audience:** the ICP; the problem they are trying to solve; the top three objections; the traffic source (ads, search, social, email) and what visitors already know when they land.
- **Proof and assets:** logos, testimonials, numbers, case studies; screenshots, demo video, product shots; guarantees and cancellation terms; the logo file.
- **Constraints:** voice, mobile priority, index or not.

Never invent proof. A metric, logo or quote the user did not supply is a `—` "metric to confirm" placeholder or a section that needs no proof slot.

## Step 2 — The argument before the shape

Work out the narrative arc, then pick the shape that carries it. Default beats, adapted from StoryBrand and PAS:

1. **Hook** — the promise, for whom.
2. **Problem / stakes** — what is actually broken or at risk, specific to *this* product; "teams struggle with X" is a placeholder, not a beat.
3. **Solution / mechanism** — how it fixes it, *shown* (a mockup, a chart, a before/after), not asserted.
4. **How it works** — three to five steps, not a manual.
5. **Proof** — real evidence next to the claim it supports.
6. **Close** — the ask, echoing the hook's promise; identical CTA to the top.

Minimum four distinct beats; five by default. Merging "how it works" into "solution" for a simple product is a stated choice, never a section that quietly never got built. Objections (FAQ, risk reversal) get a section, not a footnote; move them up for high-friction offers. Details in `references/narrative-arc.md`.

## Step 3 — Pick a named shape and rotate

Choose one page shape by name from `references/page-shapes.md` (Feature Stack, Bento Showcase, Editorial Index, Long-Scroll Narrative, Stat-Led, Gallery Grid, Product Demo, Split Diptych, Conversational FAQ, Manifesto, Catalogue, Poster Fold), matched to the argument, not to habit. Then pick nav, hero, feature, proof, CTA and footer archetypes to fill it.

**Rotation rule:** the shape, the nav, the footer and the hero each differ from the last build recorded in `.design/log.json`; a reused archetype changes at least one knob (alignment, media type, density). State the rotation out loud before code: *"Last build: Feature Stack, N2 nav, H2 hero. Picking Long-Scroll Narrative — the product needs explaining; N3 floating pill; H6 statement hero."* First build in a project: just the pick and the reason. Within one site, pages share nav, footer and type frame — rotation is about not repeating a *build*, not about making one site's pages look unrelated.

## Step 4 — Copy

Headline formulas: "{Outcome} without {pain}", "The {category} for {audience}", "Ship {result} in {time}". Subheadline: one or two sentences on what it is and who it is for. CTA: verb + what they get ("Start free trial", "Get the checklist"); never "Learn more" or "Submit"; no competing CTAs above the fold. Benefits before features, and specific: "Cut weekly reporting from 4 hours to 15 minutes", not "save time and streamline". Match the message to the source — ad traffic sees the ad's headline mirrored in the hero. At least one risk reversal (free trial, no card, cancel anytime, guarantee). Six to twelve FAQ questions in plain question-and-answer form. Everything else in `references/copy.md`; voice and microcopy rules belong to interface-copy.

## Step 5 — The hero

Five-second test: a new visitor can name the product, its value and the primary action. Then the subtraction test: remove every hero element that does not sharpen one of those three answers. Budget: an optional eyebrow, one headline, one short lede, one primary CTA, at most one secondary CTA, one focused visual, one proof signal. Headline, lede and CTA visible at 1280×800 without scrolling; headline sized to its word count (never one word per line); line breaks at meaningful points; headline and lede capped at ~680px; at most two elements centered on one axis. Hero motion reveals the message in at most four beats and never animates every label independently. No section headline elsewhere reaches hero scale.

## Step 6 — Assets, all of them, in the same pass

A page with no real imagery reads as static however good the tokens are. Decide per section: factual or physical content (product in use, people, places) takes real photography or a real screenshot; abstract concepts (mission, values, a benefit) take illustration in one consistent style. Build an asset cast — hero anchor, product captures, proof, texture, micro assets — and record it in the lock. **Asset beats spec:** the logo is non-negotiable (stop and ask, never a colored tile), product imagery for physical products, real UI captures for digital ones. One icon set, one stroke weight. No hand-drawn CSS browser chrome, no attribution line on the page, and a stated fallback when an asset genuinely can't be sourced.

## Step 7 — Build section by section

Hero → benefits/solution → how it works → proof → FAQ → final CTA. Never rebuild the whole page per iteration; section-by-section keeps diffs reviewable and course-correction cheap. Every visual value resolves through the lock: type scale steps (no `text-[19px]`), the spacing scale with section tiers (connective 48–64px, standard 64–96px, pivotal 128–192px on desktop, stepped down on mobile), one section-separation mechanism, concentric radii, no background gradients by reflex, one accent at ≤5% of a viewport. Hand the execution to hierarchy-layout, typography, color-system, ui-polish and motion. Show a v0 with placeholders before the full build.

**Motion and effects.** The lock's motion dial picks the language, and `references/motion-and-effects.md` holds the marketing-tier vocabulary with values: hero entrance in ≤4 beats, staggered and masked word reveals, a single tagline activation, scroll reveals once per section, one pinned scroll-scrubbed sequence, sticky card stacks, restrained parallax, progress timelines, marquees, the floating island nav, hover spotlight and magnetic effects, and surface effects (gradient borders, container lines, framed grids, numeric markers, layered shadows, progressive blur, atmosphere and mesh backgrounds). Stack by dial: CSS + `IntersectionObserver` up to 4, GSAP + ScrollTrigger from 5, one smooth-scroll engine only at 8+. Every effect guides reading order or carries a beat; a page where every label animates independently is a template demo.

## Step 8 — Ship-completeness and record

Hover, active, focus, loading, empty and error states; no dead `#` links; current nav item indicated; `<title>`, meta description, `og:image`; favicon; legal links; branded 404; client-side form validation; skip link; alt text; semantic landmarks. Index evergreen pages with a real title and internal links; `noindex` ad-only and time-bound pages.

Append the build to `.design/log.json` (`date`, `page`, `shape`, `nav`, `hero`, `footer`, `knobs`, `arc`) and stamp the built CSS's first comment with the same record, so the next build rotates against it and a later review can check the arc held.

## Before you finish

| Mistake | Fix |
| --- | --- |
| Built before a style lock existed | Run design-direction first |
| Hero → three cards → testimonial → CTA → footer | Pick a named shape; state the rotation |
| Sections that don't add up to an argument | Name each beat; fewer than four is a gap |
| "Teams struggle with X" as the problem beat | Make it specific to this product's user |
| Invented "+47% conversion", "trusted by 50,000 teams" | Real number, honest placeholder, or no proof slot |
| Two CTAs above the fold | One primary action |
| Everything centered on one axis | At most two centered elements |
| Text-wall sections with a decorative icon | Show the thing: mockup, chart, comparison |
| Uniform cramped section padding | Tiers by section weight |
| No motion at all, or motion on every label | Restrained reveals; hero in ≤4 beats |
| Placeholder photos, letter-in-a-box logo, emoji icons | Real assets in this pass, or a stated fallback |

**Done when:** the page has a stated arc of ≥4 beats, a named shape rotated against `.design/log.json`, one primary CTA repeated top and bottom, a hero that passes the five-second and subtraction tests, real or honestly-placeholdered assets, every visual value resolved through the lock, the ship-completeness list checked, and a log entry plus CSS stamp recorded.
