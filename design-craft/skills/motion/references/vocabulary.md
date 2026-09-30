# Motion vocabulary — from a vague description to the exact term

People describe what they see ("springy", "grows out of the button", "draws itself in"), not the name. Map the sensation to a term below, then to the value or recipe this skill already ships — the term is only useful if it lands on something buildable.

## How to answer

- Lead with the term and one line on what it is. A naming question wants a name, not an essay.
- When two terms compete, give the best match, then one or two alternates with the difference in a clause.
- When nothing fits exactly, say it is an approximation, or compose it from these words ("a *stagger* of *scale-in* entrances").
- Stay inside this list; explain an unlisted concept with these words instead of coining one.
- If the user then wants it built, switch to build mode — the frequency gate still runs first.

## Entrances and exits

| Term | What it looks like | Here |
| --- | --- | --- |
| Fade | appears or vanishes through opacity alone | reduced-motion fallback; blur-masked crossfade recipe |
| Slide in | enters from off-screen along one edge | drawer, toast recipes (`translateY(100%)`) |
| Scale in | grows to full size as it appears, usually with a fade | popover `0.95`, modal `0.96`, tooltip `0.97` — never `scale(0)` |
| Pop in | scale in that overshoots and settles | spring with bounce `0.2`, only after momentum; never on a menu that merely faded in |
| Reveal | content uncovered progressively by a clip or mask | scroll reveal recipe, `clip-path: inset()` |
| Enter / exit | what plays on mount and unmount | build step 6; exits shorter and softer; `AnimatePresence` contract |

## Sequencing and timing

| Term | What it looks like | Here |
| --- | --- | --- |
| Keyframes | fixed waypoints the browser fills between | CSS animation; not for anything triggered twice in a second |
| Interpolation / tween | the generated in-between frames | what a transition does from the current value |
| Stagger | items entering one after another | 50ms per item in the recipe; ~100ms between hero chunks |
| Orchestration | several animations timed to read as one | tab indicator, hold to confirm; landing-page for hero beats |
| Delay | wait before start | tooltip first open ~800ms, then 0ms |
| Duration | how long it runs | build step 5 table; UI under 300ms |
| Fill mode | holding the first or last frame outside the run | `fill: "forwards"` in the WAAPI recipe |
| Stepped | discrete jumps, like a countdown | `steps(n)` timing; digits need `tabular-nums` (typography) |

## Movement and transforms

| Term | What it looks like | Here |
| --- | --- | --- |
| Translate | moves along X or Y | percentages are the element's own size |
| Scale | bigger or smaller, children included | press `scale(0.96)` |
| Rotate | spins around a point | spring damping `0.8`, response `0.4` |
| Skew | shears out of its rectangle | rarely UI; no recipe |
| 3D tilt / flip | rotates in depth (`rotateX` / `rotateY`) | 3D flip and orbit recipe |
| Perspective | strength of the 3D effect; lower reads closer | set on the parent of the 3D element |
| Transform origin | the anchor a scale or rotation grows from | build step 4 |
| Origin-aware | a panel grows out of the trigger that opened it | `var(--transform-origin)`; modals exempt |

## Transitions between states

| Term | What it looks like | Here |
| --- | --- | --- |
| Crossfade | one fades out as another fades in, same spot | add `blur(2px)` when two states visibly overlap |
| Continuity transition | the same element resizes so before and after stay connected | layout animation (`layout` in Motion) |
| Morph | one shape turns into another (Dynamic Island) | spring, bounce `0` by default |
| Shared element | an element travels and transforms into its destination, a thumbnail into a card | `layoutId` in Motion; View Transitions in CSS |
| Layout animation | size or position change glides instead of snapping | `layout`; switched off under reduced motion |
| Accordion / collapse | height expands and collapses | accordion recipe, 200ms |
| Direction-aware | forward slides one way, back the other | same path in and out, mirrored easing |

## Scroll

| Term | What it looks like | Here |
| --- | --- | --- |
| Scroll reveal | elements settle in as they enter the viewport | scroll reveal recipe, once; marketing only |
| Scroll-driven | progress bound to scroll position | landing-page skill (pinned, scrubbed sequences) |
| Parallax | layers moving at different speeds | landing-page skill; dropped under reduced motion |
| Page / view transition | route change animates; the browser morphs shared elements | `AnimatePresence mode="wait"`; View Transitions API |

## Feedback and interaction

| Term | What it looks like | Here |
| --- | --- | --- |
| Hover effect | change on pointer over | gated by `(hover: hover) and (pointer: fine)`; `ease` |
| Press / tap feedback | slight scale-down on press | `scale(0.96)`, 160ms `var(--ease-out)` |
| Hold to confirm | a fill that completes while held | 2s linear press, 200ms release |
| Drag | grabbed and moved, momentum on release | 1:1 tracking, velocity handoff |
| Drag to reorder | siblings shift to make room | `layout` on siblings; pick-library for the sortable |
| Swipe to dismiss | dragged off-screen to close | velocity `> 0.11` px/ms dismisses |
| Rubber-banding | resistance and snap-back past a boundary | `rubberband()` with constant `0.55` |
| Shake / wiggle | quick side-to-side jitter on rejection | never the only error signal — the message carries it (interface-copy, accessibility) |
| Ripple | circle spreading from the tap point | Material idiom; press scale is the default here |

## Easing

| Term | What it looks like | Here |
| --- | --- | --- |
| Ease-out | fast start, slow finish | `--ease-out: cubic-bezier(0.23, 1, 0.32, 1)` |
| Ease-in | slow start, fast finish | never on UI |
| Ease-in-out | slow, fast, slow — on-screen A to B | `--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1)` |
| Linear | constant speed | spinners, marquees, progress fills |
| Cubic-bezier | a custom curve | use the tokens, never an invented one |
| Asymmetric easing | accelerates and decelerates at different rates | `--ease-drawer: cubic-bezier(0.32, 0.72, 0, 1)` |

## Springs

| Term | What it looks like | Here |
| --- | --- | --- |
| Spring | motion from physics, no fixed duration | `{ type: "spring", duration: 0.5, bounce: 0.2 }` |
| Stiffness / tension | pull toward the target; higher is snappier | traditional form `stiffness: 100` |
| Damping | how fast it settles; lower bounces more | damping ratio `1.0` default, `0.8` after momentum |
| Mass | how heavy it feels | `mass: 1` |
| Bounce | overshoot and settle | `0` default, `0.1–0.3` after a flick |
| Perceptual duration | when a spring *feels* done while micro-settling | Motion's `duration`; Apple's *response* |
| Momentum / velocity | speed and direction carried into the next motion | velocity handoff, momentum projection (`0.998`) |
| Interruptible | redirected mid-flight instead of finishing first | transitions or springs, never keyframes |

## Looping and ambient

| Term | What it looks like | Here |
| --- | --- | --- |
| Marquee | content scrolling in an endless loop | landing-page skill; linear |
| Loop / alternate (yoyo) | repeats, or plays forward then back | `animation-iteration-count`, `animation-direction: alternate` |
| Orbit | circling another element | 3D flip and orbit recipe |
| Pulse | gentle repeating scale or opacity to draw attention | avoid slow loops near 0.2 Hz |
| Float / idle | slow drift while nothing happens | rare tier or marketing only; off under reduced motion |

## Polish and effects

| Term | What it looks like | Here |
| --- | --- | --- |
| Blur | softens an element or hides a seam | under 20px; `2px` on crossfades |
| Clip-path | clips to a shape — reveals, fills, sliders | hold to confirm, tab indicator, comparison slider |
| Mask | clip with soft, fadeable edges | `mask-image`; landing-page spotlight reveal |
| Before / after slider | draggable divider wiping between two images | comparison slider recipe |
| Line drawing | an SVG path tracing itself in | `stroke-dashoffset` → 0; never on data being read |
| Text morph | characters animate when the value changes | icon swap recipe's technique; NumberFlow via pick-library |
| Skeleton / shimmer | placeholder with a moving sheen while loading | shape belongs to ui-polish; the sheen runs `linear` |
| Number ticker | digits rolling to a value | landing-page skill; `tabular-nums` (typography) |
| Typewriter | text appearing character by character | marketing only; keep the full text accessible |

## Performance

| Term | What it looks like | Here |
| --- | --- | --- |
| Frame rate | frames per second; 60 baseline, 120 on newer displays | profile in the Animations panel |
| Jank / dropped frame | visible stutter when a frame misses its deadline | layout properties, rAF under load |
| Compositing | GPU moves or fades a layer without layout or paint | `transform`, `opacity`, `filter`, `clip-path` |
| `will-change` | hint to promote a layer ahead of time | only on a visible first-frame stutter (ui-polish) |
| Layout thrashing | animating `width`/`height`/`top`/`left` | never ship; accordion `height` is the one exception |

## Principles

| Term | Meaning | Here |
| --- | --- | --- |
| Purposeful animation | motion serves a function | build step 2's six purposes |
| Frequency of use | the more often seen, the shorter and subtler | build step 1 |
| Spatial consistency | an element keeps its identity and path across states | enter and exit along the same path |
| Perceived performance | the right motion makes it feel faster | faster spinners, instant subsequent tooltips |
| Anticipation / follow-through / squash & stretch | wind-up before, settle after, deformation in flight | character animation; outside product UI except the rare tier |
| Hardware acceleration | transform and opacity on the GPU | Motion's full `transform` string |
| Reduced motion | fewer and gentler, not zero | build step 7; `useReducedMotion` |

## Close pairs to disambiguate

- **Clip-path vs mask** — hard edge vs soft, fadeable edge.
- **Pop in vs bounce** — pop in is an entrance with overshoot; bounce is the spring property that causes it.
- **Shared element vs layout animation** — shared element moves between two components (`layoutId`); layout animation is one element changing size or place (`layout`).
- **Crossfade vs morph** — two things swapping in place vs one shape becoming another.
- **Scroll reveal vs scroll-driven** — plays once on entry vs progress tied to position.
