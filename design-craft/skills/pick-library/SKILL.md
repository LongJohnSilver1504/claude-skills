---
name: pick-library
description: Pick the right frontend library for a UI task from a curated, opinionated list instead of hand-rolling it — primitives, command menus, toasts, OTP inputs, motion, number animation, charts, drag and drop, virtualization, state, class composition, theming — and detect the stack before recommending anything. Use when a task needs a toast, dropdown, dialog, drawer, command palette, chart, sortable list, long list, animated number or theme switch, when the user asks "what should I use for X", or when a hand-rolled version of one of those is about to be written. NOT for choosing a framework or backend, or for styling decisions (the reference skills).
---

# Pick a library

Direct; don't fabricate what a production-grade library already ships. A hand-rolled toast, a `<div>` dropdown with manual focus handling, a chart drawn from scratch — these are reliable "AI built this" tells and reliable accessibility bugs. Pull the part, then spend the effort restyling it to the project's tokens; that coherence pass is the actual design work.

## How to use

1. **Identify the task, not the library the user named.** "Show a dropdown" is a UI-primitives task even if they asked about something else.
2. **Detect the stack and read `package.json` first.** Most picks below are React. On a stack that cannot consume them, port the *pattern* by hand and say so. If the project already uses a listed library, use it; if it uses a competitor (react-window instead of Virtuoso), flag the recommendation without churning the dependency unasked.
3. **Recommend one library**, one sentence on what it is for, install and wire it if that is part of the request. No menus when the list has an answer.
4. Off the list → say so plainly and recommend from general knowledge.
5. After installing: restyle to the lock's tokens, and strip any default that fights the direction (default shadows, radii, easings).

## The list

### UI components and primitives

| Task | Library |
| --- | --- |
| Unstyled, accessible primitives (dialogs, popovers, menus, selects, tooltips) | [Base UI](https://base-ui.com) — or the project's existing Radix/shadcn layer |
| Command menus (⌘K) | [cmdk](https://cmdk.paco.me) |
| Toasts | [Sonner](https://sonner.emilkowal.ski) |
| Drawers and sheets with real drag | [Vaul](https://vaul.emilkowal.ski) |
| One-time-password inputs | [input-otp](https://input-otp.rodz.dev) |
| Control panels for prototypes | [Leva](https://github.com/pmndrs/leva) |

### Motion and visuals

| Task | Library |
| --- | --- |
| Springs, layout animation, enter/exit, gestures | [Motion](https://motion.dev) |
| Animating numbers (counters, prices) | [NumberFlow](https://number-flow.barvian.me) |
| 3D globes | [Cobe](https://cobe.vercel.app) |
| Dynamic OG images | [Satori](https://github.com/vercel/satori) |
| Syntax highlighting | [Shiki](https://shiki.style) |

A hover or a fade needs none of these — CSS transitions are the tool (motion skill).

### Charts

| Task | Library |
| --- | --- |
| Static or interactive dashboards | [Recharts](https://recharts.org) |
| Real-time streaming | [Liveline](https://github.com/benjitaylor/liveline) |

### Interaction and performance

| Task | Library |
| --- | --- |
| Drag and drop | [dnd kit](https://dndkit.com) |
| Virtualization (long lists, big tables) | [Virtuoso](https://virtuoso.dev) |

### State and styling

| Task | Library |
| --- | --- |
| Shared client state | [zustand](https://zustand.docs.pmnd.rs) |
| Conditional `className` | [clsx](https://github.com/lukeed/clsx) |
| Variant-driven Tailwind styling | [cva](https://cva.style) |
| Theme switching without a flash | [next-themes](https://github.com/pacocoursey/next-themes) |

clsx for ad-hoc conditions; cva once a component has real variants (size, intent, state).

### Visual blocks (marketing)

Heroes, pricing tables, bento grids and marketing sections come from shadcn-compatible registries when the stack is React + Tailwind + shadcn; pull the block, then restyle it to the lock. Emitting `npx shadcn add` at a static-HTML or SwiftUI project is a failure — port the pattern instead.

## Mismatches to catch

- Toasts built by hand or with a modal library → Sonner.
- A `<div>` dialog or dropdown with manual focus code → Base UI (or the project's primitives).
- A number animated by re-rendering text → NumberFlow.
- A 1,000-row list rendered directly → Virtuoso.
- A web of `useState` and props for shared state → zustand.
- Template-literal className ternaries three deep → clsx, or cva if variant-shaped.
- A drawer with no drag physics → Vaul.

**Done when:** one library is named for the task (or the list is declared not to cover it), the stack was checked, and any install is restyled to the project's tokens.
