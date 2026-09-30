# Runtime evidence

Method, not rules. Every rule still belongs to the skill that owns it; this file only says how to put the interface in front of you and what the result is worth as evidence.

A review that never rendered the interface can still report structural findings from source — a missing accessible name, a token used outside its role, an animation on a keyboard-initiated action. It cannot report what only the rendered page decides: what actually overlaps at 320px, where focus actually lands, which pair actually renders on which background, whether the console is actually clean. Those are the findings that reach users, and inferring them from source is how a review approves a broken screen.

## Put it in front of you

Work down the ladder and stop at the first rung that renders:

1. **A running instance.** The project's dev command or a URL the user gave. Ask for the URL rather than guessing a port.
2. **A built preview.** The project's preview, storybook or static-build command.
3. **The component in a harness** — a story, a test route, a sandbox page the project already has. Never author a new harness during a review; a review does not mutate the project.
4. **Static only.** Nothing renders and nothing can be started safely. Say so once in the report, and mark every runtime-decided domain `Not verified: no rendered instance`.

Prefer the browser automation available in the session; a screenshot tool that only captures one width verifies one width. On a mobile-only project, the simulator or emulator is the running instance and the tiers below collapse to the device sizes the project supports. A desktop browser at 375px is not a phone: mobile-web's domain — tap highlight, toolbar-driven viewport height, overscroll, safe areas, the keyboard — reads `Not verified: no device` unless a real device was loaded.

Never start a server the project did not document, never install dependencies, never navigate to a destructive route (delete, purchase, send), and never accept a dialog on a page you did not author. A review that changed state is not a review.

## Viewport tiers

Capture each tier the project supports, once per state that differs:

| Width | Reads | What it catches that no other tier does |
| --- | --- | --- |
| 320px | smallest supported | the clipping and overlap escalation trigger; content unreachable past a scroll edge |
| 375px | phone | tap targets below the floor, navigation that never collapsed |
| 768px | tablet | the layout between the mobile and desktop branches, which usually has no explicit design |
| 1024px | laptop | the first width where the grid is under real pressure |
| 1440px | desktop | the default design target — measure, do not admire |
| 1920px | wide | measure caps that never applied, centered content stranded in a field of background |

320px and 1440px are the floor of a credible review; a report that names fewer tiers than it checked is fine, one that names more is not. Skip a tier the project explicitly does not support and say which and why.

## The walks

**Keyboard walk.** Tab from the top of the document to the end. Every stop is visible, the order follows the visual order, nothing traps, and `Escape` closes what opened last. Record the first stop where any of that breaks — accessibility owns the rule, you own the observation.

**State walk.** Reach empty, loading, error and the longest realistic content for every surface in scope. A state reachable only by editing code is `Not verified`, not `Clear`.

**Console and network.** Read the console before judging anything visual — a failed font, a 404 image or a hydration warning explains most "the spacing is wrong" findings, and reporting the symptom instead of the cause wastes the fix. Note errors, failed requests and layout-shift warnings with the exact text.

**Measured values.** Contrast, hit area and rendered size come from the page, never from the stylesheet's intent. Read the computed value.

## What counts as observed

A runtime finding names what you did, where, and what happened: the width or interaction, the surface, and the result. "Checked at 375px: the 'Most popular' badge overlaps the card border" is evidence. "The badge probably overlaps on mobile" is a guess, and a guess belongs in `Not verified` or nowhere.

Cite runtime findings by the source location that causes them once you have found it, and by screen and component when there is no source file in scope. Evidence establishes the finding; `file:line` makes it fixable — a finding needs both, and the order is observe first, then locate.

## Report it

The coverage table carries a `Runtime` row naming the instance (URL or command), the tiers captured and the walks completed — or the rung of the ladder that failed. Verification lists each capture and walk with its result, passed checks separate from `Not verified`.

`Approve` may be issued from a static review. It may never claim a runtime-decided domain the static review could not reach.
