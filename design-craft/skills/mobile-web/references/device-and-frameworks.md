# Devices and frameworks

## Get the app onto a real phone

1. Bind the dev server to every interface, not `localhost` — e.g. `next dev -H 0.0.0.0`, `vite --host`. Use the project's documented command; never invent one during a review.
2. Put the phone on the same network and open `http://<machine LAN IP>:<port>`.
3. Attach the inspector:
   - **iOS** — on the phone, Settings → Safari → Advanced → Web Inspector on; connect by cable; on the Mac, Safari → Develop → the device → the page.
   - **Android** — Developer options → USB debugging on; connect by cable; open `chrome://inspect` on the desktop and inspect the tab.
4. Read the console there first, exactly as on desktop: a failed font or a hydration warning explains more than any of the rules in this skill.

## The pass

Run each on the device, not in device mode:

| Check | What it catches |
| --- | --- |
| Load with the toolbar showing, then scroll until it collapses | `100vh` overflow, `dvh` layout shift on marketing content, bottom UI under the toolbar |
| Tap every control once, then tap empty space | tap highlight, hover that latched, late feedback |
| Pull down at the top of the app shell and at the end of every inner scroller | pull-to-refresh, rubber band, scroll chaining to the page |
| Focus every input and type | keyboard covering a bottom-pinned field, page zoom (typography's rule) |
| Long-press buttons, tabs and control images | selected labels, the iOS callout |
| Swipe carousels diagonally | the page scrolling with the track |
| Rotate to landscape once | side safe-area insets on the notch side, text inflation |
| Switch the OS between light and dark | the status bar against the header |
| Add to Home Screen and relaunch, if a PWA is a target | standalone mode changes the viewport, the insets and the status bar |

Test on a phone a few years old as well as the newest one on the desk: slower hardware shows the tap delay and scroll jank a flagship hides.

A simulator (Xcode's iOS Simulator, the Android Emulator) is a step above device mode — it renders safe areas, viewport units, the keyboard and input zoom — but it has no finger: tap timing, highlight feel and rubber-banding still need hardware.

## Next.js `viewport` export

The metadata API owns the viewport and theme-color tags in the App Router; writing them by hand in `layout.tsx` duplicates them.

```ts
import type { Viewport } from 'next'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  interactiveWidget: 'resizes-content',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
}
```

## Tailwind

| CSS | Tailwind |
| --- | --- |
| `height: 100dvh` | `h-dvh` |
| `min-height: 100svh` | `min-h-svh` |
| `overscroll-behavior: none` | `overscroll-none` |
| `overscroll-behavior: contain` | `overscroll-contain` |
| `touch-action: manipulation` | `touch-manipulation` |
| `touch-action: pan-y` | `touch-pan-y` |
| `touch-action: none` | `touch-none` |
| `scroll-snap-type: x mandatory` | `snap-x snap-mandatory` |
| `scroll-snap-align: start` | `snap-start` |
| `padding-bottom: env(safe-area-inset-bottom, 0px)` | `pb-[env(safe-area-inset-bottom,0px)]` |
| `-webkit-tap-highlight-color: transparent` | `[-webkit-tap-highlight-color:transparent]` (or once in the base layer) |
| `-webkit-touch-callout: none` | `[-webkit-touch-callout:none]` |

`h-dvh` and `min-h-svh` need Tailwind 3.4 or later. Root-level declarations — tap highlight, text-size adjust, overscroll — go once in the base layer, not as utilities repeated per component.
