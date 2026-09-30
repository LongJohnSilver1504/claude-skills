---
name: mobile-web
description: Mobile-web platform behavior that makes a web app feel installed rather than embedded on a phone — tap highlight, viewport units and the 100vh bug, safe-area insets and viewport-fit=cover, overscroll and pull-to-refresh, touch-action and the tap delay, long-press callouts on controls, carousel scroll axis, theme-color and the status bar, and verifying on a real device because DevTools emulation lies. Use when building or reviewing a PWA, an app shell, a bottom tab bar, a sheet or a carousel for phones, or when something "works in Chrome but feels wrong on my phone" — content under the notch or home indicator, the page bouncing or refreshing while scrolling, a gray flash on tap, a screen taller than the viewport. NOT for hover gating and hit areas (accessibility), iOS input zoom (typography), gesture physics and drag springs (motion), or where an action bar sits in the layout (hierarchy-layout).
---

# Mobile web

A phone browser is its own platform: a toolbar that changes the viewport height, a notch and a home indicator, a finger with no hover and a double-tap to consider, a page that wants to bounce. Most of the fixes are one declaration or one meta tag; each carries a reason and applies where the reason holds, not everywhere by habit.

Gate by capability — media queries, `env()`, viewport units — never by user agent or screen width. Never cap zoom (`user-scalable=no`, `maximum-scale=1`): that is an accessibility failure, and the zoom it was hiding is typography's 16px input rule. Write every fix in the project's styling system; `references/device-and-frameworks.md` maps the declarations to Tailwind and the Next.js `viewport` export.

## Match the symptom

| Symptom | Fix | Owner |
| --- | --- | --- |
| Gray or blue flash on tap | `-webkit-tap-highlight-color: transparent` on the root, `:active` on every control | here |
| Screen taller than the viewport, bottom button under the toolbar | `height: 100dvh` shell, `min-height: 100svh` hero | here |
| Keyboard covers a bottom-pinned input on Android | `interactive-widget=resizes-content` | here |
| Header under the notch, tab bar under the home indicator | `viewport-fit=cover` + `env(safe-area-inset-*)` | here |
| App shell bounces or pull-to-refreshes | `overscroll-behavior` | here |
| Taps feel late | `touch-action: manipulation`, feedback on press | here; press value ui-polish, timing motion |
| Long-press pops a callout or selects a label | `-webkit-touch-callout: none`; label selectability | here; typography |
| Carousel swipe drags the page too | native `scroll-snap`, or `touch-action: pan-y` on a JS track | here; snap recipe hierarchy-layout |
| Status bar a different color from the header | `theme-color` per color scheme | here |
| Right in Chrome, wrong on the phone | a real device | here |
| Hover state stuck after a tap | — | accessibility |
| Page zooms into a focused input | — | typography |
| Target too small to hit | — | accessibility |
| Drag-to-dismiss feels wrong | — | motion |

## Kill the tap highlight once

iOS Safari and Android Chrome paint a translucent box over any tapped element with a click handler, on top of the press state you designed — the loudest "this is a web page" tell. Set it once on the root, never per component:

```css
html { -webkit-tap-highlight-color: transparent; }
```

That removes the only feedback the browser was giving, so every tappable element needs its own `:active` state; ui-polish owns its value.

## Pick the viewport unit by role

On a phone `100vh` is the *large* viewport — the height with the toolbar collapsed. At load the toolbar is showing, so a `100vh` shell overflows by the toolbar's height and anything pinned to its bottom sits behind it.

| Surface | Declaration | Why |
| --- | --- | --- |
| App shell, drawer, full-screen sheet | `height: 100dvh` | tracks the visible area as the toolbar shows and hides |
| Hero or first screen of a scrolling page | `min-height: 100svh` | the smallest viewport: never cut off, never resizes mid-scroll |
| Anything | `100lvh` | the old `100vh` under a new name; almost never the answer |

`dvh` on scrolling marketing content re-lays-out the page every time the toolbar collapses — that shift is why heroes take `svh`. Put a `100vh` line above as a fallback only when the support matrix includes browsers without the units (Safari before 15.4, Chrome before 108).

On Android Chrome the software keyboard overlays the page by default, so a `100dvh` shell and its bottom-pinned composer stay under it. `interactive-widget=resizes-content` in the viewport meta makes the keyboard shrink the layout viewport, and the shell reacts to it. Where the primary action sits relative to the keyboard is hierarchy-layout's.

## Paint edge to edge, pad the chrome

By default the browser letterboxes the page inside the safe area and fills the notch and home-indicator zones with the body background. Native apps paint under them and pad their *content* away. `viewport-fit=cover` opts in; `env(safe-area-inset-*)` gives the distances. Without the meta tag every `env()` value is `0px` — the usual reason safe-area padding "does nothing".

```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
```

```css
.app-header { padding-top: env(safe-area-inset-top, 0px); }
.tab-bar    { padding-bottom: env(safe-area-inset-bottom, 0px); }
.sheet      { padding-bottom: calc(1rem + env(safe-area-inset-bottom, 0px)); }
.app-header, .tab-bar {
  padding-inline: max(1rem, env(safe-area-inset-left, 0px)) max(1rem, env(safe-area-inset-right, 0px));
}
```

Pad the fixed chrome — header, tab bar, toasts, sheets, floating buttons — not the page body: backgrounds run under the insets, content and controls never do. The side insets only appear in landscape, on the notch side; the `max()` keeps the design gutter when they are zero. Always give `env()` a `0px` fallback inside `calc()` and `max()`. How far an action bar sits from the edges is hierarchy-layout's.

## Stop the page from being dragged

Scrolling past the top triggers pull-to-refresh on Android Chrome and a whole-page rubber band on iOS. Right for a document; wrong for an app shell with its own scroll containers, a sheet the user drags down, a map or a canvas.

```css
html, body { overscroll-behavior: none; }                          /* the page never bounces or refreshes */
.chat-list, .sheet-body { overflow-y: auto; overscroll-behavior: contain; } /* own bounce, no chaining */
```

`none` on the root, `contain` on inner scrollers — `contain` keeps the container's native bounce and stops the page behind it from moving. Leave the root at its default on a scrolling document where pull-to-refresh is welcome. Never a `touchmove` listener calling `preventDefault()`: it has to be non-passive, costs frames and blocks scrolling outright. Locking the background behind a modal is accessibility's.

## Make taps land on press

Two delays stack. **The double-tap wait:** the browser holds a tap to see whether a second one is coming to zoom. `width=device-width` removes most of it, not all; `touch-action: manipulation` removes the rest — pan and pinch still work, double-tap zoom does not, and `click` fires at once.

```css
button, a, label, summary, [role="button"] { touch-action: manipulation; }
```

**Feedback on release:** `click` fires when the finger lifts, so feedback wired to it reads as lag even at 0ms. Style `:active`; in JavaScript listen to `pointerdown`, not `click`, for anything that should respond to the touch itself. The press value is ui-polish's; its duration and curve are motion's.

## `touch-action` names what the browser keeps

| Surface | Value | The browser still handles |
| --- | --- | --- |
| Controls | `manipulation` | panning, pinch zoom |
| Horizontal JS carousel or slider | `pan-y` | vertical page scroll |
| Vertical drag handle (a sheet) | `pan-x` | horizontal panning |
| Canvas, signature pad, custom drag in every direction | `none` | nothing |

`none` on anything the user must scroll past traps them. A carousel that is native scroll needs none of this: `scroll-snap-type: x mandatory` on the track and `scroll-snap-align: start` on the slides — the browser's momentum beats a hand-rolled spring. The peeking-scroller recipe lives in hierarchy-layout; thresholds, velocity and springs for a custom drag are motion's.

## No callouts on controls

Holding a finger on a link or image that acts as a control pops the iOS callout (open, copy, share). Controls never do that natively:

```css
button, [role="button"], [role="tab"], .chip, .drag-handle, .control img { -webkit-touch-callout: none; }
```

Which text may be selected — control labels and drag surfaces not, content always — is typography's rule. Never either declaration on `body`: people copy addresses, order numbers and error messages.

## Match the status bar to the top of the page

`theme-color` tints the status bar and the browser chrome. One value means one scheme gets the wrong bar. Give each scheme its own, set to the color at the very top of the page — the header's surface token, not the brand color:

```html
<meta name="theme-color" media="(prefers-color-scheme: light)" content="#ffffff" />
<meta name="theme-color" media="(prefers-color-scheme: dark)" content="#0a0a0a" />
```

The `media` attribute follows the OS setting. A theme switched by class also rewrites the tag's `content` in the toggle handler; the toggle mechanism and `color-scheme` belong to color-system. For an installed PWA, the manifest's `theme_color` and `background_color` and `apple-mobile-web-app-status-bar-style` are the same decision — make them agree.

## Verify on a phone

DevTools device mode is a narrow desktop browser. It reproduces none of this domain: the tap highlight, hover latching, the toolbar's effect on viewport units, input zoom, the double-tap wait, overscroll, safe areas, the software keyboard. Load the dev server on a real phone over the LAN with the remote inspector attached; setup and the test pass are in `references/device-and-frameworks.md`. A simulator shows safe areas and viewport units but not touch feel. Anything checked only in emulation is `Not verified: no device`.

## Baseline

The floor for any phone-facing app, before the first component:

```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content" />
<meta name="theme-color" media="(prefers-color-scheme: light)" content="#ffffff" />
<meta name="theme-color" media="(prefers-color-scheme: dark)" content="#0a0a0a" />
```

```css
html {
  -webkit-tap-highlight-color: transparent;
  -webkit-text-size-adjust: 100%; /* iOS inflates text in landscape without it */
  overscroll-behavior: none;      /* drop on a scrolling document that wants pull-to-refresh */
}
button, a, label, summary, [role="button"] { touch-action: manipulation; }
button, [role="button"], [role="tab"] { -webkit-touch-callout: none; } /* controls only — content links keep their preview */
```

Plus the owners' floors: 16px inputs (typography), hover gated behind a capability query (accessibility), non-selectable control labels (typography), touch-sized hit areas (accessibility).

## Before you finish

| Mistake | Fix |
| --- | --- |
| `height: 100vh` on an app shell or bottom-pinned UI | `height: 100dvh` |
| `100dvh` on a marketing hero | `min-height: 100svh` |
| `env(safe-area-inset-*)` without `viewport-fit=cover` | Add it to the viewport meta; otherwise every inset is `0px` |
| `env()` inside `calc()` with no fallback | `env(safe-area-inset-bottom, 0px)` |
| Safe-area padding on `body` | Pad the fixed chrome; let backgrounds run under |
| Tap highlight removed with no `:active` state | Every control gets its own press state |
| `touchmove` + `preventDefault()` to stop the bounce | `overscroll-behavior: none` on the root, `contain` inside |
| Press feedback wired to `click` | `:active`, or `pointerdown` in JS |
| `touch-action: none` on a surface the user scrolls past | `pan-x` or `pan-y` — name what the browser keeps |
| JS gesture carousel where native scroll works | `scroll-snap-type: x mandatory` on the track |
| One `theme-color` for both schemes, or the brand color | One per `prefers-color-scheme`, the header's surface color |
| `user-scalable=no` or `maximum-scale=1` | Remove it; fix the input size instead |
| User-agent sniffing to detect touch | Capability media queries |
| "Fixed" after checking in device mode | A real phone, or `Not verified: no device` |

## Reporting

**Severity.** `HIGH` hides content or a control behind the notch, the home indicator, the toolbar or the keyboard, or traps the user's scroll (`touch-action: none` or an overscroll lock with no other scroll path). `MEDIUM` makes the app read as a web page in a browser — tap flash, a bouncing or refreshing app shell, taps that land late, callouts on controls, a carousel dragging the page. `LOW` is a mismatched status bar or landscape text inflation.

**Verification.** Without a device: the viewport meta carries `viewport-fit=cover` and no zoom cap; every `env()` has the meta tag and a fallback; no `100vh` on a shell or bottom-pinned surface; root tap highlight and overscroll set; `touch-action` matches each gesture surface; one `theme-color` per scheme matching the top surface token. With one: load on a real phone with the remote inspector, toolbar shown and collapsed, keyboard open, landscape once, installed as a PWA if that is a target. Emulation counts as without.

**Format.** Group findings under the principle each violates, ordered by severity, one row per root cause listing every location it appears in:

| Severity | Location | Before | After | Why |
| --- | --- | --- | --- | --- |

`Location` is `path/to/file:line`. `Why` names the principle and the user impact. Report every check you could not run as `Not verified`.

End with `Block` when any `HIGH` remains, `Approve` otherwise, leaving the rest in the table as work to do. Never `Approve` coverage you did not inspect. With nothing to report, say "No actionable findings" for this domain in one line and report verification.
