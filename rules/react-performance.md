---
description: Checkable React render and load performance rules for mobile — selectors, stable references, images, long lists, imports
globs: "**/*.{ts,tsx}"
paths: ["src/**/*.tsx", "src/**/*.ts"]
---

# React Performance

> **Scope:** All new code in `src/`. These are the checkable rules — a reviewer can point at a line and name the rule number. Deeper reasoning about structure lives in the `react-clean-architecture` skill.

Mobile devices have a fraction of the CPU and bandwidth of a dev laptop. Every rule below targets one of three things: fewer re-renders, less JavaScript on first load, less layout work while scrolling.

## Hard Rules

1. **Selectors subscribe to the narrowest value the component renders** — a derived boolean or primitive, not the whole slice.
2. **Default non-primitive props and constants are hoisted to module scope.**
3. **Components are declared at module scope** — never inside another component's body.
4. **Conditional render uses a ternary** when the left side can be `0`, `NaN`, or `''`.
5. **Expensive initial state uses the lazy initializer form** `useState(() => …)`.
6. **`memo` / `useMemo` / `useCallback` need a stated reason** — a measurement, a known-heavy computation, or a documented identity requirement.
7. **Every `<img>` carries explicit `width` and `height`**, plus `loading="lazy"` when it renders below the fold.
8. **Lists longer than ~50 rows get `content-visibility: auto` or virtualization.**
9. **Imports point at the module that owns the symbol** — not at an app-wide `@/components` barrel.
10. **Derived state is computed during render**, not synced with `useEffect`.

## 1. Narrow Selectors

```tsx
// ❌ Re-renders on every cart change — quantity edits, price updates, reorders
const cart = useCartStore((s) => s.cart)
const hasItems = cart.length > 0

// ✅ Re-renders only when emptiness flips
const hasItems = useCartStore((s) => s.cart.length > 0)
```

**Why:** the component only renders the boolean, so subscribing to the array makes it re-render for changes it cannot show. For store-shape and dependency-array rules, see `zustand-patterns.md`.

State read only inside a callback needs no subscription at all — read it on call with `useCartStore.getState()`.

## 2. Hoisted Defaults and Constants

```tsx
// ❌ New array identity every render — breaks memo on List, re-runs its effects
<List items={items ?? []} sort={{ by: 'name' }} />

// ✅ Stable identities
const EMPTY_ITEMS: Item[] = []
const SORT_BY_NAME = { by: 'name' } as const

<List items={items ?? EMPTY_ITEMS} sort={SORT_BY_NAME} />
```

**Why:** object and array literals get a fresh identity on each render, so every downstream `memo`, `useEffect`, and query key sees a "change" that never happened.

This is a **render default** for a value that is legitimately absent (no filter applied, list not yet requested). It is not the `?? []` that `error-handling.md` forbids — that one sits on an error path and turns a failed request into "no items". Same syntax, different question: "is absence a valid state here, or a failure being hidden?"

## 3. Components at Module Scope

```tsx
// ❌ Row is a new component type on every OrderList render
const OrderList = ({ orders }: OrderListProps) => {
  const Row = ({ order }: RowProps) => <li>{order.id}</li>
  return <ul>{orders.map((o) => <Row key={o.id} order={o} />)}</ul>
}

// ✅ Declared once
const Row = ({ order }: RowProps) => <li>{order.id}</li>

const OrderList = ({ orders }: OrderListProps) => (
  <ul>{orders.map((o) => <Row key={o.id} order={o} />)}</ul>
)
```

**Why:** a new component type each render means React unmounts and remounts the subtree — local state, focus, and scroll position are lost, and every child effect re-runs.

## 4. Ternary for Numeric Conditions

```tsx
// ❌ Renders a literal "0" when count is 0
{count && <Badge>{count}</Badge>}

// ✅
{count > 0 ? <Badge>{count}</Badge> : null}
```

**Why:** `&&` returns the falsy left operand, and React renders `0`, `NaN`, and `''` as text nodes — a stray zero in the UI, not an omitted badge.

## 5. Lazy Initial State

```tsx
// (inside the component's co-located hook — component-hook-separation.md)
// ❌ parseSchedule runs on every render; only the first result is kept
const [schedule, setSchedule] = useState(parseSchedule(raw))

// ✅ Runs once, on mount
const [schedule, setSchedule] = useState(() => parseSchedule(raw))
```

**Why:** the argument form evaluates the expression on every render and throws the result away, so an expensive parse is paid on each keystroke elsewhere in the component.

## 6. Memoization With a Reason

```tsx
// (inside the component's co-located hook — component-hook-separation.md)
// ❌ Memo noise — wrapping primitives and inline handlers by reflex
const total = useMemo(() => price + tax, [price, tax])
const onTap = useCallback(() => setOpen(true), [])

// ✅ Memo where it pays, with the reason in a comment
// Chart re-layouts ~40ms on mid-range Android; rows change only on refetch
const rows = useMemo(() => buildChartRows(readings), [readings])
```

**Why:** each `useMemo` costs a dependency comparison, an allocation, and a line of code a reader has to trust. Applied by reflex it slows renders and hides the two or three places where memoization actually matters. If the project ships React Compiler, existing hand-memoization stays but new code adds it only with a measurement.

## 7. Image Dimensions

```tsx
// ❌ Layout jumps when the image loads; full-size hero fetched for a thumbnail row
<img src={product.imageUrl} alt={product.name} className="w-full rounded-md" />

// ✅ Space reserved up front, offscreen images deferred
<img
  src={product.imageUrl}
  alt={product.name}
  width={320}
  height={180}
  loading="lazy"
  className="w-full rounded-md"
/>
```

**Why:** without intrinsic dimensions the browser reserves no space, so arriving images shove content down (CLS) — on a phone that means the user taps the wrong row. Framework image components (e.g. `next/image`) satisfy the rule when width/height or `fill` with a sized parent are set.

## 8. Long Lists

```tsx
// ❌ 300 rows all laid out, styled, and painted on mount
{readings.map((r) => <ReadingRow key={r.id} reading={r} />)}

// ✅ Offscreen rows skipped by the browser
{readings.map((r) => (
  <ReadingRow key={r.id} reading={r} className="[content-visibility:auto] [contain-intrinsic-size:auto_72px]" />
))}
```

**Why:** layout and paint cost scales with row count, and on mobile a few hundred rows is a visible freeze on mount and during scroll. `content-visibility` is the cheap fix for uniform rows; reach for a virtualizer when rows are tall, interactive, or unbounded in number.

## 9. Direct Imports

```tsx
// ❌ App-wide barrel — the bundler walks every component to give you two
import { Button, Card } from '@/ui'

// ✅ The modules that own the symbols
import { Button } from '@/ui/button'
import { Card } from '@/ui/card'
```

**Why:** an app-wide index re-exports everything, so one import pulls the whole graph into the route's first-load JS.

A **feature's own `index.ts`** is a different thing: it is the module's public API, deliberately small, and importing `@/features/reservations` is the supported way in (see `project-structure.md`). Keep those barrels; avoid the app-wide ones.

## 10. Derived State During Render

```tsx
// (inside the component's co-located hook — component-hook-separation.md)
// ❌ Two renders, and a frame where fullName is stale
const [fullName, setFullName] = useState('')
useEffect(() => setFullName(`${first} ${last}`), [first, last])

// ✅ One render, never stale
const fullName = `${first} ${last}`
```

**Why:** an effect that only writes state derived from props or other state renders twice and can show the old value in between — see the `react-clean-architecture` skill for where derivation belongs.

## Related

- [Zustand Patterns](zustand-patterns.md) — selectors, store shape, dependency arrays
- [TanStack Query Patterns](tanstack-query.md) — request deduplication and cache config
- [Component–Hook Separation](component-hook-separation.md) — pure renderers, logic in hooks
- [Project Structure](project-structure.md) — where feature barrels live
