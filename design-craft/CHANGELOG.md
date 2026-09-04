# Changelog — design-craft

Work in progress goes under `## [Unreleased]`; a release cuts it into a dated version section.

## [Unreleased]

## 1.0.0 (2026-08-25)

### Added

Initial release: a stand-alone design plugin, separate from the `claude-skills` pipeline, synthesized from the best of seven public skill collections and organized the way Matt Pocock organizes his — a router, a main flow, shaping skills, and a reusable reference layer.

- **Start here** — `design-help` (router).
- **Main flow** — `design-direction` (design read + dials, grounding ladder, anti-default rules, persisted `.design/style-lock.md`, reference study with a similarity dial, redesign protocol), `landing-page` (one offer → one audience → one action, narrative arc, twelve named page shapes rotated against `.design/log.json`, conversion copy, hero tests, asset cast, ship-completeness, and a marketing-tier motion-and-effects reference — GSAP/ScrollTrigger/Lenis tiers by motion dial, word reveals, pinned scroll-scrubbed sequences, sticky stacks, parallax, progress timelines, marquees, island nav, spotlight and magnetic hovers, gradient borders, container lines, framed grids, layered shadows, progressive blur, atmosphere and mesh backgrounds — distilled from Meng To's web-design techniques and elayadesign's motion choreography), `design-review` (evidence not taste, escalation triggers, cheaper-fix ladder, one ranked Before/After/Why table, screen and change scopes with Introduced/Regression/Pre-existing).
- **Shaping** — `variants` (three answers on one named axis behind a picker in the real page), `stress-states` (one component rendered under every reachable scenario; the page is the report).
- **Reference layer** — `hierarchy-layout`, `typography`, `color-system`, `ui-polish`, `motion`, `interface-copy`, `accessibility`, `pick-library`. The seven rule-owning skills share a byte-identical Reporting block so `design-review` can consolidate them.
- **Agent** — `design-critic`, read-only, preloads `design-review`.
- **Validator** — `scripts/validate.mjs` checks frontmatter, the <500-line budget, "Use when" triggers, cross-skill paths, dangling skill names, the canonical Reporting block, read-only agents, and count/version sync.

Sources synthesized (all MIT-licensed): Jakub Krehel's `interfaces` (review architecture, domain skills, variant, break), Emil Kowalski's skills (motion framework, recipes, library picks, Apple fluid-interface principles), codeswithroh's `tastemaker` (style lock, anti-slop gates, narrative arc, page shapes, diversification), ConardLi's `web-design-engineer` (design read and dials, checkpoints, redesign protocol), Meng To's skills (reference-inspired brand worlds with a similarity dial), elayadesign's landing-page and redesign skills (page structure, conversion copy, content realism), and the Refactoring UI principles already condensed in `claude-skills`.
