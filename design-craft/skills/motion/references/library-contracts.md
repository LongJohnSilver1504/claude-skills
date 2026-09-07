# Library contracts — Motion (`motion/react`)

The CSS ladder in the skill covers everything up to exit animation. Once you reach for `AnimatePresence`, the library has a contract that fails **silently** — no error, no warning, the exit simply never runs. These are the rules the ladder does not state. Durations, curves and springs still come from the skill's tables or the project's existing motion tokens; this file adds no values of its own.

## The AnimatePresence contract

Four things must all be true or the exit does not fire:

1. **The wrapper stays mounted.** `AnimatePresence` must sit *outside* the condition. It animates children on their way out, so unmounting the wrapper takes the child with it instantly.
2. **The conditional render happens inside the wrapper**, not around it.
3. **The direct child has a stable `key`.** Presence is tracked by key; a key that changes on every render (an index after a filter, `Math.random()`, a new object identity) reads as "different element" and skips the exit.
4. **The child has an `exit` prop.** `initial` + `animate` with no `exit` is an incomplete animation — it enters and then vanishes.

```tsx
// Wrong — the wrapper unmounts with the condition, so nothing animates out
{isOpen && <AnimatePresence><Panel /></AnimatePresence>}

// Right — wrapper mounted, condition inside, stable key, exit defined
<AnimatePresence>
  {isOpen && (
    <motion.div
      key="panel"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
    />
  )}
</AnimatePresence>
```

A child wrapped in another component still needs the `key` on the element `AnimatePresence` sees — the direct child — and that component must forward its props to a `motion.*` element.

## Picking `mode`

| `mode` | Use when |
| --- | --- |
| `sync` (default) | Enter and exit may overlap: stacked toasts, list items, anything where the leaving element does not occupy the incoming one's space |
| `wait` | One thing at a time: route and page transitions, content swaps in a fixed panel, a tab body replacing another. Enter starts only after exit completes, so total time is the sum — keep each side short |
| `popLayout` | An item is removed from a list that reflows: the exiting item pops out of the layout flow so the survivors close the gap while it animates away. Needs `layout` on the siblings |

`mode="wait"` on a list of simultaneous notifications serializes them into a queue that looks broken. `mode="sync"` on a page transition overlaps two full pages.

## `initial` must match server-rendered output

The first client render has to produce the same DOM as the server, so `initial={{ opacity: 0 }}` on a server-rendered element is a hydration mismatch — React logs it, and the element can flash at full opacity before dropping to zero.

- On a server-rendered element, keep `initial` equal to the settled state, or gate the animation behind a mount flag set in an effect.
- `initial={false}` on `AnimatePresence` skips enter animations on the first render — correct where the component has a default open state, wrong where the first-time entrance *is* the animation.
- Every file importing `motion/react` needs `"use client"`, and nothing reads `window` or `navigator` at module level.

## Reduced motion is a code path, not a media query here

CSS `@media (prefers-reduced-motion: reduce)` does not reach values passed as props. Read the preference and branch:

```tsx
const reduce = useReducedMotion()
<motion.div
  initial={{ opacity: 0, y: reduce ? 0 : 8 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0 }}
  transition={reduce ? { duration: 0.15, ease: "easeOut" } : undefined}
/>
```

Drop the movement, keep the opacity — gentler and fewer, never zero. Layout animations (`layout`, `layoutId`) have no reduced-motion fallback of their own: turn the prop off when `reduce` is true.
