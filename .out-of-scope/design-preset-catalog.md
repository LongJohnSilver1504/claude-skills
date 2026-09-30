# A design preset catalog (palettes, font pairings, style presets as data)

**Decision:** not adopted.

**Why:** Evaluated against [nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) (MIT, 2026-09-16), whose content layer is ~1.9 MB of CSV: 95 product-typed palettes, 56 font pairings, 57 style presets, 24 chart types, 29 landing patterns and 22 per-stack guideline files, queried by a Python search CLI.

Three reasons it stays out:

1. **It contradicts the stance `design-craft` is built on.** `design-direction` exists to ground a direction in the codebase, the user's assets, a reference or a named anchor — and only at the bottom of that ladder to generate from a mood. A lookup table of finished palettes short-circuits the ladder at rung 5 every time, which is the "AI made this" tell `references/anti-slop.md` is written to catch. Data for correctness, taste for distinctiveness — a palette is taste.
2. **Provenance is unverifiable.** The rows carry no sourcing a reviewer can check, and a wrong contrast pair shipped as a preset is worse than no preset, because it arrives pre-approved.
3. **Cost with no matching benefit.** The catalog is larger than both plugins combined and would need its own refresh, schema validation and data-contract tests to stay true — the upstream project carries roughly 20 test files for exactly that.

**What was adopted instead:** the *mechanism* underneath it — keying the cold start to product type rather than to a mood adjective. `design-craft/skills/design-direction/references/moods.md` gained a product-type routing table whose third column names the reflex each lane has to be pulled off. It routes; it does not supply finished values.

**Reconsider if:** a concrete measurement shows cold-start directions landing in the same lane repeatedly *despite* the routing table — and then the fix is more routing rows, not stored palettes.

**Previously requested:** uupm.cc comparison pass (2026-09-16).
