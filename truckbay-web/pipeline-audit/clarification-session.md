# Pipeline Audit — Clarification Session (35 Questions)

**Date:** 2026-03-15
**Purpose:** Define what changes to implement in the skill pipeline based on research + audit
**Format:** Each question includes Why, Benefit, Example, and Possible Answer
**Status:** In Progress

---

## PRIORITY 1: CRITICAL GAPS (Q1–Q8)

### Q1: Pipeline Resume Command After Context Cleanup
**The issue:** When you clean context mid-pipeline, Claude loses all awareness of which feature is being built, which skill just ran, and that the observer is active. The OBSERVATION-LOG.md exists on disk but Claude doesn't re-read it.

**Why:** This already happened (W3 in your watch list). The observer goes stale, observations gap between context cleanups. Every pipeline skill loses its place.

**Benefit:** One command restores full pipeline context — Claude knows exactly where you are, what's been done, what's next, and the observer resumes automatically.

**Example:** After cleaning context, you'd run:
```
/resume-pipeline
```
Claude reads `.claude/pipeline/{feature}/PIPELINE-STATE.md` which contains:
```markdown
feature: reservation-details
current-stage: create-feature
completed: [generate-prd, prd-clarifier, prd-to-ux, ux-to-prompt, plan-implementation]
observer: active
files-to-read:
  - src/new-app/features/reservation-details/PRD.md
  - src/new-app/features/reservation-details/UX-spec.md
  - .claude/pipeline/reservation-details/OBSERVATION-LOG.md
```

**Possible answer options:**
- A) Create `/resume-pipeline` skill + auto-generate `PIPELINE-STATE.md` at each stage transition
- B) Add resume logic to the observer skill only (simpler, but doesn't help other skills)
- C) Add resume instructions to EVERY pipeline skill (redundant but no new skill needed)
- D) Different approach — describe your preference

**Your answer:** ___

---

### Q2: Observer Persistence Across Context Cleanups
**The issue:** The feature-retrospective skill has Phase 1 (init) and Phase 2 (observe) but no Phase 1.5 (resume). After context cleanup, the observer forgets it's active.

**Why:** Root cause of W3. The skill assumes "pipeline start = fresh session." Mid-pipeline context cleanup breaks this assumption.

**Benefit:** Observer never goes stale. Every observation is captured regardless of context cleanups.

**Example:** After context cleanup, Claude detects `.claude/pipeline/{feature}/OBSERVATION-LOG.md` with status "In Progress" and automatically resumes observing.

**Possible answer options:**
- A) Tie this to Q1's `/resume-pipeline` — observer resumes as part of pipeline resume
- B) Add independent Phase 1.5 to observer skill that auto-detects in-progress logs
- C) Both — observer has its own resume + pipeline-wide resume exists too
- D) Different approach

**Your answer:** ___

---

### Q3: Shifting Test Scenarios Earlier in the Pipeline
**The issue:** Test scenarios are only created during `/frontend-testing` (stage 8 of 11). By then, the UX spec decisions that drive tests are far back in context.

**Why:** IBM research shows 50%+ of defects are identifiable at the requirements phase. Fixing post-launch costs 100x more. Your UX spec already defines interactions — test cases naturally emerge there.

**Benefit:** When you reach `/frontend-testing`, test scenarios already exist. The testing skill just implements them instead of re-analyzing the full spec.

**Example:** In `prd-to-ux` Pass 5 (State Design & Feedback), after defining:
```
"When user clicks 'Extend' on an active reservation → show confirmation dialog"
```
The UX spec would also output:
```
Test scenario: Given active reservation, when user clicks Extend, then confirmation dialog appears with reservation details
```

**Possible answer options:**
- A) Add test scenarios directly to `prd-to-ux` output (UX spec gets a "Test Scenarios" section per interaction)
- B) Create a new `/generate-test-plan` skill between `prd-to-ux` and `ux-to-prompt` that reads the UX spec and produces a test matrix
- C) Add test scenarios to `ux-to-prompt` output (each build prompt includes its test cases)
- D) Combine A + C — UX spec defines scenarios, build prompts carry them forward

**Your answer:** ___

---

### Q4: States Matrix for Interactive Elements
**The issue:** UX specs don't systematically enumerate all states (default, hover, focus, disabled, loading, error, empty) for each interactive element.

**Why:** This is the #1 gap in UX-to-code pipelines across the industry. Your own watch list caught it: "Badge/indicator visual treatment ambiguity." Missing states cause implementation guessing.

**Benefit:** No ambiguity about what each component looks like in every state. Developers don't need to ask "what happens when this is loading?"

**Example:** Current UX spec says:
```
"Extend button — allows user to extend reservation"
```
With states matrix:
```
| Element | Default | Hover | Disabled | Loading | Error |
|---------|---------|-------|----------|---------|-------|
| Extend button | Primary, enabled when status=active | darken bg | When status≠active, show tooltip "Only active reservations can be extended" | Spinner replaces label, button disabled | Toast with error message, button re-enables |
```

**Possible answer options:**
- A) Add states matrix as mandatory section in `prd-to-ux` Pass 5 (State Design)
- B) Add as a new Pass 9 (after Design Language)
- C) Add to `ux-to-prompt` — each build prompt includes states for its components
- D) Add to both `prd-to-ux` AND `ux-to-prompt` for redundancy

**Your answer:** ___

---

### Q5: Size Gate / Fast-Track Path
**The issue:** Every feature runs through all 8+ stages, even a simple bug fix or single-component addition.

**Why:** Martin Fowler calls full pipelines on small changes "sledgehammers for nuts." Small changes don't need PRD → clarification → UX spec → prompts. This overhead discourages using the pipeline for small work.

**Benefit:** Small changes get structure without overhead. The pipeline scales down gracefully.

**Example:** At pipeline entry, Claude asks:
```
What size is this change?
- 🟢 Small (bug fix, single component, styling) → skip to plan-implementation
- 🟡 Medium (new feature section, API integration) → start at generate-prd, skip clarifier
- 🔴 Large (new feature module, multi-screen flow) → full pipeline
```

**Possible answer options:**
- A) Add size classification to `generate-prd` — it decides which stages to skip
- B) Create a `/pipeline-start` entry skill that routes to the right starting point
- C) Don't formalize — just let users invoke whichever skill they want directly
- D) Add fast-track instructions to each skill (each skill can be entry point)

**Your answer:** ___

---

### Q6: Testable Requirements Gate in PRD Clarifier
**The issue:** `prd-clarifier` pressure-tests requirements but doesn't explicitly check if every acceptance criterion is verifiable.

**Why:** Vague requirements like "improve UX" or "make it fast" can't be tested. They survive clarification and cause problems during testing and review.

**Benefit:** Every requirement that exits the clarifier is testable. No ambiguity reaches implementation.

**Example:**
```
❌ Vague: "The checkout flow should be smooth"
✅ Testable: "Checkout completes in ≤3 steps from cart to confirmation"

❌ Vague: "Loading should be fast"
✅ Testable: "Reservation list renders within 2 seconds on 3G connection"
```
The clarifier would add a question category: "Is this requirement testable? If not, how would you verify it works?"

**Possible answer options:**
- A) Add "testable requirement" as a new question category in `prd-clarifier` (alongside the existing 10 categories)
- B) Add a final pass/checklist at the end of clarification: "Review all requirements for testability"
- C) Move this check to `prd-to-ux` instead (when requirements become interactions)
- D) Both A + B

**Your answer:** ___

---

### Q7: DECISIONS.md — Accumulating Context Across Stages
**The issue:** Late pipeline stages (testing, docs) lose the "why" behind decisions made in early stages (PRD, clarifier, UX). They either re-read everything or miss context.

**Why:** Context engineering best practice (Martin Fowler). Each stage produces artifacts but doesn't summarize the key decisions that downstream stages need.

**Benefit:** Any stage can read `DECISIONS.md` to understand why things are the way they are, without re-reading the full PRD + UX spec + clarification session.

**Example:**
```markdown
# DECISIONS.md — Reservation Details

## From PRD Clarification
- DECIDED: No real-time updates for MVP — polling every 30s is acceptable
- DECIDED: Only warehouse owners can extend reservations, not truckers

## From UX Spec
- DECIDED: Use stepper for checkout flow (not single-page form) — reduces cognitive load
- DECIDED: Error states show inline, not toast — user stays in context

## From Implementation Planning
- DECIDED: Extend reservation is a domain feature, not infrastructure
- DECIDED: Share the reservation status badge component across list and detail views
```

**Possible answer options:**
- A) Create `DECISIONS.md` in feature folder, each skill appends to it automatically
- B) Include decisions in the existing OBSERVATION-LOG.md (observer tracks decisions too)
- C) Add a "Key Decisions" section to each artifact (PRD, UX spec, etc.) instead of a separate file
- D) Don't create another file — the existing artifacts are enough

**Your answer:** ___

---

### Q8: Component Vocabulary in UX Spec
**The issue:** UX specs use descriptive language ("a subtle button", "a card with info") instead of exact design system component names.

**Why:** When `create-feature` reads "a card with info," it might create a new component instead of using the existing `Card` from `@/new-app/ui/card`. This causes component duplication.

**Benefit:** Zero ambiguity between design intent and component implementation. Every UX element maps to an existing component or explicitly flags "needs new component."

**Example:** Current UX spec:
```
"Show reservation info in a bordered container with a header"
```
With component vocabulary:
```
Component: Card (from @/new-app/ui/card)
  - CardHeader: Reservation title + status badge
  - CardContent: Details grid
  - CardFooter: Action buttons (Button variant="default" for primary, variant="outline" for secondary)
```

**Possible answer options:**
- A) Already handled by `prd-to-ux` Pass 7 (shadcn/ui Component Mapping) — just needs enforcement
- B) Create a `design-system-map.md` rule file that `prd-to-ux` references automatically
- C) Both — Pass 7 references the map, map is maintained separately
- D) This is fine as-is — Pass 7 already does this

**Your answer:** ___

---

## PRIORITY 2: IMPROVEMENTS (Q9–Q18)

### Q9: Metadata Naming Consistency
**The issue:** `ux-to-prompt/SKILL.md` metadata says `name: ux-spec-to-prompts` and `feature-retrospective/SKILL.md` says `name: pipeline-observer`. These don't match the actual skill directory names.

**Why:** Cosmetic, but causes confusion when referencing skills in documentation and other skills.

**Benefit:** Names match everywhere — less cognitive overhead.

**Possible answer options:**
- A) Fix metadata to match directory names (quick, 2 files)
- B) Rename directories to match metadata names
- C) Doesn't matter — skip this

**Your answer:** ___

---

### Q10: Path Reference Standardization
**The issue:** Some skills reference `@/components/ui/` (legacy path) instead of `@/new-app/ui/` for shadcn components.

**Why:** Can lead to wrong imports during code generation. The shadcn-ui skill itself has this inconsistency.

**Benefit:** All generated code uses correct import paths from the start.

**Possible answer options:**
- A) Audit all skills and fix path references (one-time cleanup)
- B) Add a centralized "import map" to `.claude/rules/` that all skills reference
- C) Both
- D) Skip — Claude can figure it out from project structure

**Your answer:** ___

---

### Q11: Scope Creep Detection During Pipeline
**The issue:** No mechanism to handle when you add requirements mid-pipeline ("actually, we should also support X").

**Why:** Late additions bypass the PRD/clarification process, leading to unvalidated requirements in the implementation.

**Benefit:** Mid-pipeline additions are explicitly captured, impact-assessed, and either incorporated properly or deferred.

**Example:** During `create-feature`, you say "oh, we also need to support bulk extension of reservations." Claude would:
```
⚠️ New requirement detected mid-pipeline:
"Bulk extension of reservations"

Impact assessment:
- Affects: API adapter, domain types, component design
- Pipeline stages to revisit: UX spec (new interaction), implementation plan
- Estimated scope increase: ~40%

Options:
1. Add to current feature (revisit UX spec for this interaction)
2. Defer to separate feature (create ticket)
3. Add as stretch goal (implement if time allows)
```

**Possible answer options:**
- A) Create a `/scope-check` skill that can be invoked mid-pipeline
- B) Add scope creep detection to the observer (it already watches for this pattern)
- C) Add inline warnings to `create-feature` and `create-infrastructure` skills
- D) Don't formalize — the observer already logs it for retrospective

**Your answer:** ___

---

### Q12: Pipeline Skill Output Summaries
**The issue:** Each skill produces a full artifact (PRD, UX spec, etc.) but no concise summary for downstream consumption.

**Why:** Context engineering: downstream skills shouldn't need to re-read 2000-line UX specs. A "digest" artifact prevents context bloat.

**Benefit:** Later skills load the summary (200 lines) instead of the full artifact (2000 lines), saving context window space.

**Example:** After `prd-to-ux` completes, it appends a digest at the end of the UX spec:
```markdown
## Quick Reference (for downstream skills)
- 3 screens: List, Detail, Extend Dialog
- 12 interactive elements mapped to shadcn components
- Key states: loading (skeleton), error (inline), empty (illustration + CTA)
- Critical interactions: extend, checkout, cancel
- Design tokens: primary=blue, destructive=red, spacing=4px grid
```

**Possible answer options:**
- A) Add digest section to each artifact (appended at end)
- B) Create separate `{artifact}-digest.md` files
- C) Use DECISIONS.md (Q7) as the cumulative digest
- D) Not needed — Claude can summarize on the fly

**Your answer:** ___

---

### Q13: Success Metrics in PRD Template
**The issue:** PRDs don't include code-level success criteria (test coverage, bundle size, accessibility level).

**Why:** OpenAI's internal PRD template includes measurable success metrics. Without them, "done" is subjective.

**Benefit:** Clear definition of done that includes quality gates, not just functional completeness.

**Example:**
```markdown
## Success Metrics
- [ ] All acceptance criteria pass automated tests
- [ ] Component test coverage ≥ 80%
- [ ] No accessibility violations (axe-core, WCAG AA)
- [ ] Bundle size increase < 15KB gzipped
- [ ] No new TypeScript errors
```

**Possible answer options:**
- A) Add "Success Metrics" as Section 8 in `generate-prd`
- B) Add to `plan-implementation` instead (closer to code)
- C) Add to both (PRD defines goals, plan makes them concrete)
- D) Skip — this is over-engineering for a demo-grade PRD

**Your answer:** ___

---

### Q14: E2E Testing Guidance
**The issue:** `frontend-testing` covers unit/component/integration tests but has no E2E guidance.

**Why:** User workflows spanning multiple components/pages aren't tested. Critical flows like "login → navigate → extend reservation → confirm" are only tested in pieces.

**Benefit:** Complete user journey validation, not just individual component testing.

**Possible answer options:**
- A) Add E2E section to existing `frontend-testing` skill (Playwright patterns)
- B) Create separate `/e2e-testing` skill
- C) Not needed yet — unit + integration coverage is sufficient for current project stage
- D) Add later when the project has more complete user flows

**Your answer:** ___

---

### Q15: Design System Map Rule File
**The issue:** No centralized mapping of UI concepts → exact component paths.

**Why:** Different skills reference components differently. A "loading indicator" could mean `Skeleton`, `Spinner`, or a custom component depending on which skill generates the code.

**Benefit:** Consistent component usage across all generated code. One source of truth for "what component do we use for X?"

**Example:**
```markdown
# design-system-map.md

| UI Concept | Component | Import Path |
|------------|-----------|-------------|
| Loading placeholder | Skeleton | @/new-app/ui/skeleton |
| Inline loading | Spinner | @/new-app/ui/custom/spinner |
| Error message | Alert variant="destructive" | @/new-app/ui/alert |
| Empty state | EmptyState | @/new-app/ui/custom/empty-state |
| Form field | Field + FieldLabel + FieldError | @/new-app/ui/field |
| Navigation back | BackButton | @/new-app/ui/custom/back-button |
```

**Possible answer options:**
- A) Create `design-system-map.md` in `.claude/rules/`
- B) Add to existing `shadcn-ui` skill references
- C) Auto-generate from `src/new-app/ui/` directory (scan what exists)
- D) Not needed — shadcn-ui skill + Pass 7 in prd-to-ux is enough

**Your answer:** ___

---

### Q16: Known Limitations in Feature Docs
**The issue:** `generate-feature-doc` produces README with 11 sections but no "Known Limitations" derived from pipeline decisions.

**Why:** Trade-offs made during PRD/UX (e.g., "no real-time updates for MVP") should be documented so future developers know what was intentional vs overlooked.

**Benefit:** Future developers (or future you) know what's a bug vs a deliberate limitation.

**Example:**
```markdown
## Known Limitations
- **No real-time updates:** Reservation status polls every 30s (decided in PRD clarification — real-time adds WebSocket complexity)
- **Single reservation extend only:** Bulk extend deferred to Phase 2 (scope decision during implementation)
- **English/Spanish only:** i18n supports two locales per MVP constraint
```

**Possible answer options:**
- A) Add "Known Limitations" section to `generate-feature-doc` — derived from DECISIONS.md
- B) Already exists as Section 11 in the skill — just needs to pull from pipeline artifacts
- C) Add to PRD instead (limitations known upfront)
- D) Skip — limitations are in PRD, no need to duplicate

**Your answer:** ___

---

### Q17: Quantitative Pipeline Metrics in Retrospective
**The issue:** Retrospective captures qualitative observations but no quantitative data (how many clarification rounds, how many rework cycles, test pass rate).

**Why:** Without numbers, you can't measure if the pipeline is improving over time. "This run felt smoother" isn't actionable.

**Benefit:** Track pipeline efficiency across runs. Identify which stages consistently cause the most rework.

**Example:**
```markdown
## Pipeline Metrics — Reservation Details
- Total pipeline duration: ~4 hours across 3 sessions
- Clarification rounds: 2 (20 questions + 15 follow-ups)
- UX spec revisions: 1 (Pass 7 required component remapping)
- Implementation rework: 0
- Tests passing on first run: 85% (2 failures from missing mock)
- Context cleanups: 2
- Observer gaps: 1 (30 min between cleanup and resume)
```

**Possible answer options:**
- A) Add metrics collection to `feature-retrospective` Phase 3 (end-of-pipeline analysis)
- B) Track metrics in OBSERVATION-LOG.md during pipeline (each stage logs its count)
- C) Both — log during, summarize at end
- D) Skip — too much overhead for the value

**Your answer:** ___

---

### Q18: Auto-Promote Recurring Observations to Rules
**The issue:** When an observation recurs 3+ times, the retrospective "strongly recommends" a fix but doesn't automate the rule creation.

**Why:** Manual promotion means observations can stall in the watch list. The gap between "we know this is a pattern" and "we've fixed it" is human-dependent.

**Benefit:** Patterns that recur enough automatically become rules, closing the feedback loop.

**Possible answer options:**
- A) Add auto-promotion logic to `feature-retrospective` — after 3rd occurrence, draft a rule file and present for approval
- B) Add to `learn-from-session` instead — it already writes to memory/rules
- C) Keep manual — auto-promotion might create rules you don't want
- D) Semi-automatic — draft the rule, but always ask before creating

**Your answer:** ___

---

## PRIORITY 3: NICE-TO-HAVES (Q19–Q28)

### Q19: Mobile/Responsive States in UX Spec
**The issue:** UX specs don't explicitly address mobile vs desktop layout differences.

**Why:** Most features need responsive behavior, but it's not in the spec — developers decide ad-hoc.

**Benefit:** Responsive breakpoints and layout changes documented before implementation.

**Possible answer options:**
- A) Add responsive variants section to `prd-to-ux`
- B) Add as part of states matrix (Q4) — each element has a mobile column
- C) Not needed — Tailwind's mobile-first approach handles this naturally
- D) Add only for complex layouts (not every component)

**Your answer:** ___

---

### Q20: Accessibility Compliance Level in PRD
**The issue:** No explicit accessibility target (WCAG AA, AAA) in PRD or UX spec.

**Why:** Without a target, accessibility is ad-hoc. Some components get full a11y, others don't.

**Benefit:** Consistent accessibility standard across all features.

**Possible answer options:**
- A) Add WCAG level to `generate-prd` template (Section 8)
- B) Hardcode "WCAG AA" in `prd-to-ux` as a constant — don't ask every time
- C) Add to `.claude/rules/` as a project-wide constant
- D) Already covered by shadcn/ui defaults — skip

**Your answer:** ___

---

### Q21: Skill Index by Use Case
**The issue:** No quick reference for "I need to do X — which skill do I use?"

**Why:** With 20 skills, remembering which one handles what requires reading skill descriptions.

**Benefit:** Fast lookup, especially for infrequent skills like `web-design-guidelines` or `vercel-composition-patterns`.

**Possible answer options:**
- A) Create a `SKILLS-INDEX.md` in `.claude/` with use-case → skill mapping
- B) Add to MEMORY.md (always loaded, quick reference)
- C) Not needed — skill descriptions in the system prompt are sufficient
- D) Create but keep minimal (10-15 common scenarios only)

**Your answer:** ___

---

### Q22: API Contract Evolution Handling
**The issue:** No documented approach for when the external API changes (breaking changes, new fields, deprecations).

**Why:** API changes can break feature adapters. Currently handled ad-hoc.

**Benefit:** Structured approach to detecting and migrating API changes.

**Possible answer options:**
- A) Create `/api-migration` skill for handling breaking API changes
- B) Add a section to `error-handling` skill about API versioning
- C) Not needed now — handle when it happens
- D) Add API version tracking to feature adapter files

**Your answer:** ___

---

### Q23: Feature Rollback Documentation
**The issue:** No skill for documenting what went wrong post-ship and how to clean up.

**Why:** When a feature needs rollback, there's no structured approach for documenting the issue, root cause, and cleanup steps.

**Benefit:** Faster incident response, better post-mortems.

**Possible answer options:**
- A) Create `/feature-rollback` skill
- B) Add to `feature-retrospective` as a Phase 4 (post-ship)
- C) Not needed — git revert + incident doc is enough
- D) Create later when the project is in production

**Your answer:** ___

---

### Q24: Spec Drift Detection
**The issue:** No mechanism to compare final implementation against the UX spec and flag divergences.

**Why:** Implementation might deviate from spec due to technical constraints, and these deviations aren't documented.

**Benefit:** Explicit documentation of what changed and why, preventing "is this a bug or intentional?" questions.

**Possible answer options:**
- A) Add spec-vs-implementation comparison to `generate-feature-doc`
- B) Add to `feature-retrospective` Phase 3 analysis
- C) Use Figma MCP to compare design screenshots vs implementation screenshots
- D) Not practical — too much overhead for the value

**Your answer:** ___

---

### Q25: Pipeline Stage Transition Confirmation
**The issue:** Some skill transitions happen without explicit user confirmation that the previous stage's output is satisfactory.

**Why:** If you're not happy with the UX spec but the pipeline auto-transitions to `ux-to-prompt`, you get prompts based on a bad spec.

**Benefit:** Quality gate at each transition — no stage starts until you approve the previous output.

**Possible answer options:**
- A) Already handled — skills use AskUserQuestion for transitions. No change needed
- B) Add explicit "approve/revise" gate before each transition
- C) Add approval only for critical transitions (prd→ux, ux→prompts, plan→code)
- D) Make it configurable — some users want gates, others want flow

**Your answer:** ___

---

### Q26: i18n Integration in Pipeline
**The issue:** Translation keys aren't part of the pipeline — they're added during implementation ad-hoc.

**Why:** Missing translations cause runtime fallbacks to English, which may not be caught until QA.

**Benefit:** Translation keys planned during UX spec, generated during scaffolding.

**Possible answer options:**
- A) Add i18n key planning to `prd-to-ux` (list all user-facing strings)
- B) Add to `create-feature` scaffolding (generate translation JSON files)
- C) Both — plan in UX, generate in scaffolding
- D) Current approach is fine — translations are simple enough to add during implementation

**Your answer:** ___

---

### Q27: Figma MCP Integration in Pipeline
**The issue:** Figma MCP is now connected but not integrated into any pipeline skill.

**Why:** If designs exist in Figma, the pipeline should pull from Figma rather than generating UX specs from scratch.

**Benefit:** UX specs grounded in actual designs, not text descriptions. Component mapping comes from Figma's design system.

**Possible answer options:**
- A) Add Figma integration to `prd-to-ux` — if a Figma URL is provided, use it as input
- B) Create a `/figma-to-ux` skill that converts Figma designs to UX specs
- C) Use Figma as validation — compare generated UX spec against Figma design
- D) Keep separate — Figma for visual design, pipeline for specs

**Your answer:** ___

---

### Q28: Linear Integration in Pipeline
**The issue:** Linear MCP is connected but not integrated into the pipeline for ticket tracking.

**Why:** Features often start from Linear tickets and should update ticket status as pipeline progresses.

**Benefit:** Automatic ticket status updates, linking PRDs to tickets, creating sub-tickets for implementation tasks.

**Possible answer options:**
- A) Add Linear reading to `generate-prd` — if ticket URL provided, pull requirements from it
- B) Add ticket status updates at each pipeline stage
- C) Create tickets from `plan-implementation` output (one per implementation task)
- D) Keep separate — use `/linear-ticket` skill independently when needed

**Your answer:** ___

---

## PRIORITY 4: ARCHITECTURE QUESTIONS (Q29–Q35)

### Q29: Skill File Size — Should Large Skills Be Split?
**The issue:** Some skills are very large: `feature-retrospective` (19.5KB), `prd-to-ux` (13.5KB), `plan-implementation` (12KB).

**Why:** Large skill files consume more context window. Claude reads the entire skill when invoked.

**Benefit:** Smaller skills = less context consumed per invocation.

**Possible answer options:**
- A) Split large skills into main skill + reference files (already done for some)
- B) Keep as-is — the size is justified by the complexity
- C) Move examples and templates to reference files, keep core logic in SKILL.md
- D) Compress — remove verbose examples, keep only rules and templates

**Your answer:** ___

---

### Q30: Skill Versioning
**The issue:** Skills evolve but there's no version tracking. If a change breaks the pipeline, there's no easy rollback.

**Why:** Skills are iterated during retrospectives. A bad change could cascade through the pipeline.

**Benefit:** Ability to revert a skill to a known-good state.

**Possible answer options:**
- A) Git tracks this already — skills are in the repo, use git history
- B) Add version frontmatter to each skill (version: 1.2)
- C) Not needed — git is sufficient
- D) Add changelog section to each skill

**Your answer:** ___

---

### Q31: Cross-Skill Communication Protocol
**The issue:** Skills communicate through artifacts (files) but there's no formal contract for what each artifact must contain.

**Why:** If `prd-to-ux` changes its output format, `ux-to-prompt` might break.

**Benefit:** Each skill knows exactly what to expect from its predecessor.

**Possible answer options:**
- A) Define artifact schemas (required sections, headings) in a shared reference
- B) Each skill validates its input artifact before processing
- C) Not needed — the pipeline is maintained by one person and changes are rare
- D) Add input validation to each skill's Phase 1

**Your answer:** ___

---

### Q32: Parallel Pipeline Execution
**The issue:** The pipeline is strictly sequential. Some stages could run in parallel (e.g., test planning + implementation planning).

**Why:** Sequential execution means longer total pipeline time.

**Benefit:** Faster pipeline completion for independent stages.

**Possible answer options:**
- A) Keep sequential — dependencies make parallelism risky
- B) Allow parallel execution for specific independent pairs
- C) Not practical in Claude Code — context is shared, can't run skills in parallel
- D) Use background agents for independent work (e.g., test plan generation while scaffolding)

**Your answer:** ___

---

### Q33: Pipeline Telemetry — What to Track Long-Term
**The issue:** No long-term tracking of pipeline effectiveness across features.

**Why:** Without trends, you can't measure if pipeline improvements are working.

**Benefit:** Data-driven pipeline optimization over time.

**Possible answer options:**
- A) Add to global `src/new-app/RETRO.md` — aggregate metrics per feature
- B) Create a pipeline dashboard file with run history
- C) Not needed — qualitative retrospectives are sufficient
- D) Track in Linear instead of local files

**Your answer:** ___

---

### Q34: Skill Dependencies Declaration
**The issue:** Skills reference other skills by name but don't formally declare dependencies.

**Why:** If a referenced skill is renamed or removed, the referencing skill silently breaks.

**Benefit:** Clear dependency graph, easier maintenance.

**Possible answer options:**
- A) Add `depends_on` field to skill frontmatter
- B) Keep implicit — the pipeline order documents dependencies
- C) Create a `PIPELINE.md` that documents the dependency graph
- D) Not needed — skills are stable enough

**Your answer:** ___

---

### Q35: User Onboarding for the Pipeline
**The issue:** No documentation for how to use the full pipeline for the first time.

**Why:** If someone new joins or you forget after a break, there's no guide for "how do I use this system?"

**Benefit:** Self-documenting pipeline, lower barrier to entry.

**Possible answer options:**
- A) Create a `PIPELINE-GUIDE.md` in `.claude/` with step-by-step usage
- B) Add to project README
- C) The skills are self-explanatory — each one guides you to the next
- D) Create a `/pipeline-help` skill that explains the flow interactively

**Your answer:** ___

---

## Summary

| Priority | Questions | Focus |
|----------|-----------|-------|
| **P1: Critical** | Q1–Q8 | Pipeline resume, observer persistence, test shift-left, states matrix, size gate, testable requirements, decisions tracking, component vocabulary |
| **P2: Improvements** | Q9–Q18 | Metadata fixes, path standardization, scope creep, output summaries, success metrics, E2E testing, design system map, known limitations, pipeline metrics, auto-promotion |
| **P3: Nice-to-have** | Q19–Q28 | Responsive states, a11y level, skill index, API evolution, rollback, spec drift, stage gates, i18n, Figma integration, Linear integration |
| **P4: Architecture** | Q29–Q35 | Skill size, versioning, cross-skill contracts, parallelism, telemetry, dependencies, onboarding |

**Next step:** Answer each question, then we'll build an implementation plan from your answers.
