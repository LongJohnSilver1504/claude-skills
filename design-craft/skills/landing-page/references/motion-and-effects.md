# Landing motion and effects

Marketing pages are the one place the motion budget opens up: visitors see them once, and a well-choreographed reveal is part of the argument. The rules that govern product UI (the motion skill: frequency gate, sub-300ms, `transform`/`opacity`) still hold for every *control* on the page; this file adds the landing-specific vocabulary — scroll choreography, text reveals, pinned sequences, atmospheric surfaces — with the values that make them read as premium instead of busy.

Pick from here by the lock's **motion dial**; never stack effects because they are available. One page carries one motion language.

## Intensity by dial

| Motion dial | Language | Stack |
| --- | --- | --- |
| 1–2 | still; hover/focus/press feedback only | CSS |
| 3–4 | hero entrance in ≤4 beats; scroll reveals once per section; a marquee | CSS + `IntersectionObserver` |
| 5–7 | word reveals on headings, parallax on one or two media layers, one pinned sequence, a progress timeline | GSAP + ScrollTrigger (no smooth-scroll engine) |
| 8–10 | cinematic: smooth scroll, scrubbed scenes, sticky card stacks, masked kinetic type, a preloader | GSAP + ScrollTrigger + **one** smooth-scroll engine (Lenis or Locomotive, never both); WebGL only with a stated purpose |

Above 4, every effect still passes: does it guide reading order or carry the narrative beat? A page where every label animates independently reads as a template demo.

## Tokens (marketing tier)

```js
// GSAP
gsap.defaults({ ease: "power3.out", duration: 0.85 });
// eases: power3.out / power4.out / expo.out for enters; "none" for scrubbed scenes
// reveals 0.75–1.1s · hover 0.35–0.6s · word stagger 0.035–0.07s · line stagger 0.08–0.14s · card stagger 0.06–0.1s
// reveal offset y: 24–48px · blur 4–10px → 0 · trigger start: "top 82%" · scrub: 0.8–1.4 · anticipatePin: 1
```

```css
/* CSS-only tier */
--ease-reveal: cubic-bezier(0.16, 1, 0.3, 1);   /* strong ease-out for entrances */
--ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);  /* heavy, fluid — nav morphs, fade-ups */
```

Never bounce, elastic or springy easing on a landing page; never large scale jumps; never more than one scrubbed scene visible at a time.

## Global setup (dial ≥5)

```js
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
gsap.registerPlugin(ScrollTrigger);

const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

// dial ≥8 only: one smooth-scroll engine, driven by the GSAP ticker
if (!reduceMotion) {
  const lenis = new Lenis({ lerp: 0.08, smoothWheel: true, wheelMultiplier: 0.9, anchors: true });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}
addEventListener("load", () => ScrollTrigger.refresh()); // after fonts and media settle
```

In React/Next, wrap in `gsap.context()` and revert on unmount; kill triggers on route change. Under reduced motion, **bypass** smooth scroll and scrubbed timelines and render final states — do not merely shorten them.

## Hero entrance

At most four beats, in reading order: nav → headline → lede → CTA + visual. Nothing the visitor needs (nav, headline, CTA) waits for the sequence to finish; the static first frame is complete without JavaScript.

```js
gsap.timeline({ defaults: { ease: "power3.out", duration: 0.8 } })
  .from(".nav", { y: -16, autoAlpha: 0 })
  .from(".hero-title .word", { yPercent: 110, stagger: 0.05 }, "-=0.3")
  .from(".hero-lede", { y: 24, autoAlpha: 0, filter: "blur(6px)" }, "-=0.4")
  .from(".hero-cta, .hero-visual", { y: 24, autoAlpha: 0, stagger: 0.1 }, "-=0.4");
```

## Text reveals

**Staggered word reveal (CSS + IO, dial 3–5).** Each word fades and rises once, 0.8s, `--ease-reveal`, 0.07s per word, trigger at ~20% visible. Split with a text-node splitter (never `innerHTML`), set `aria-label` to the unsplit sentence, keep the unsplit text visible without JS, and set `aria-hidden` on the word spans. Never split links or meaningful inline markup.

```css
.word { display: inline-block; opacity: 0; transform: translate3d(0, 20px, 0);
  transition: opacity 0.8s var(--ease-reveal), transform 0.8s var(--ease-reveal);
  transition-delay: calc(var(--i) * 0.07s); }
.is-visible .word { opacity: 1; transform: none; }
```

**Masked word reveal (GSAP, dial ≥5).** Words rise through an `overflow: hidden` mask: `yPercent: 110 → 0`, 0.7–0.9s, `power3.out`, stagger 0.025–0.045s, `start: "top 82%"`, once.

**Tagline scroll activation (one per page).** A two-line benefit statement mid-page, `text-4xl`–`text-6xl`, each word from ~30% opacity to full as it crosses a trigger line, in reading order, with `--ease-drawer` — never a linear fade, never the block flipping at once. `IntersectionObserver` per word or one `requestAnimationFrame`-throttled scroll read.

## Scroll reveals

Once, on entry, 0.6–0.8s, `translateY(16–24px)` + `blur(6–8px)` + `opacity: 0` → settled. `IntersectionObserver` with `threshold: 0.2, rootMargin: "0px 0px -10% 0px"` (or ScrollTrigger `start: "top 82%"`). Never an unthrottled `scroll` listener. Reveal semantic chunks (heading, copy, media), not every list item on a dense section; ~100ms between chunks.

## Scroll-scrubbed pinned sequence (dial ≥5, one per page)

A sticky stage inside a tall section; native scroll position is the single source of truth, forward and backward.

```js
ScrollTrigger.create({
  trigger: section, start: "top top", end: () => `+=${innerHeight * 2.8}`,
  pin: stage, scrub: true, anticipatePin: 1, invalidateOnRefresh: true,
  onUpdate: ({ progress }) => render(progress),
});
```

Renderer by need: video (continuous, photographic — coalesce `currentTime` writes in rAF, preload metadata), image sequence (art-directed frames — preload current then neighbors, never block first paint), canvas (procedural — cap DPR at 2, redraw only on change), SVG/DOM (interface states, diagrams — transforms and clip paths only), WebGL (only when depth or a camera materially strengthens the idea; static poster fallback). Keep copy and CTA in semantic HTML outside the frames; release the pin before the next section; keep the footer reachable. Under reduced motion: no pin, no scrub, one selected static frame.

**Sticky card stack.** Cards `position: sticky` at the same top; as the next arrives the previous scales `1 → 0.92` and fades slightly. Finite, then release.

**Parallax.** One or two media layers at `yPercent: -8` to `-15` with `scrub: true, ease: "none"`. Never on text, never on more than two layers per viewport.

## Scroll progress timeline

Ordered steps as an `<ol>` with real headings; a quiet base line plus a progress line with `transform-origin: top`, measured between the first and last step centers, `scaleY(progress)` written once per frame. Active step gets `aria-current="step"`; no live region for scroll updates. Left rail on mobile; alternating layout only with room on both sides.

## Marquee

Duplicate the sequence, animate the track `translateX(0 → -50%)` linear and infinite, stable item widths, edge fade with a mask, pause on hover only when useful. Logos, testimonials, tags — never content that must be read carefully. Under reduced motion: static wrap.

## Floating island nav

A detached pill (`mt-6 mx-auto w-max rounded-full`, dark translucent, light edge gradient) instead of a docked bar. The hamburger's lines rotate and translate into an X (`rotate-45`, `-rotate-45`, absolute) — never swap or disappear. The menu opens as a screen-filling overlay (`backdrop-blur-3xl` over `bg-black/80` or `bg-white/80`) with links staggered from `translate-y-12 opacity-0`. Curve `--ease-drawer`, 500–700ms.

## Number ticker

Counts up once on entry with tabular figures; use NumberFlow (pick-library) rather than re-rendering text. Only on **real** numbers.

## Hover effects (pointer: fine only)

- **Spotlight reveal.** Two identical images stacked; the top one shows through a feathered radial `mask-image` following an eased pointer (`easing 0.1`, radius 260px desktop, collapse to 0 on leave). For before/after, x-ray, material and color reveals.
- **Magnetic hover.** Buttons drift ≤8px toward the pointer with 0.35–0.6s ease; a custom cursor lags 0.25–0.45s. Additive only — touch, keyboard and coarse pointers get the plain state.
- **Beam / traveling border.** One animated edge glow on at most one prominent surface per view (loading, selected, the featured tier). Never on every card.

## Surface effects

| Effect | Recipe | Use / avoid |
| --- | --- | --- |
| **Gradient border** | `border: 1px solid transparent; background: linear-gradient(surface, surface) padding-box, linear-gradient(135deg, white/34%, accent/36%, white/8%) border-box` | premium edge on dark glass, pricing, hero shell; keep stops under 0.4 alpha |
| **Container lines** | 1px vertical guides at the content container's edges (`left: max(pad, calc((100vw − max)/2))`), `pointer-events: none`, 6px corner squares at section intersections | editorial/technical structure; one width for the whole page |
| **Framed grid** | every section snaps to one 12-column grid, 1px frames, L-shaped corner brackets, a repeating 135° hairline texture at ~3% | precise, system-like pages; no floating cards or uneven margins |
| **Numeric markers** | `01 02 03` in mono or narrow uppercase, low contrast, predictable position (card corner, gutter, rail) | process steps, feature groups — never competing with headings |
| **Layered neutral shadows** | sm `0 2px 3px -1px black/10, 0 1px 0 black/2, 0 0 0 1px black/8` · md six layers of 6% from 1px to 24px · lg six layers to 100px/12% | hero media and feature callouts (lg), cards and popovers (md), controls (sm); never tinted, never stacked |
| **Progressive blur** | 4–6 stacked `backdrop-filter` layers (0.5 → 16px) each masked to a band, fixed at the top or bottom edge, `pointer-events: none` | soften content under a floating nav or above a footer; needs a real background behind it |
| **Atmosphere background** | canvas: several tall vertical light folds with slow sine drift, screen blending, brightness accumulating toward one lower corner, tinted with the accent | dark, moody heroes at dial ≥6; slow and meditative; never full-frame glow that fights the headline |
| **Mesh gradient shell** | procedural blue-led canvas *inside* a large rounded hero shell with a gradient border; the surrounding system stays disciplined (rails, corner markers, one bright CTA) | futuristic/infrastructural lanes; never as a generic page backdrop |
| **Grain overlay** | fixed, `pointer-events: none`, ~3–5% opacity noise | break digital flatness where a gradient would be the reflex |

Gradient rule from the color-system skill still binds: a decorative gradient is a look the lock called for, never a habit — and the indigo→purple diagonal stays banned.

## Performance and access guardrails

- `transform`, `opacity`, `filter` and `clip-path` only; blur under 20px; no continuously animated offscreen content; pause canvases when the document is hidden.
- One smooth-scroll engine at most; refresh ScrollTrigger after fonts and media load; clean up triggers, observers, rAF and WebGL resources on unmount.
- Split text keeps an unsplit accessible name; the page is complete with JavaScript off; every pinned or scrubbed scene has a static equivalent under reduced motion; no scroll hijacking, no blocked keyboard navigation.
- Verify: forward and reverse scroll, fast flicks, resize while pinned, 390/768/1024/1440, 200% zoom, blocked video, reduced motion, clean console.
