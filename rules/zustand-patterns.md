# Zustand Patterns

> **Scope:** All new code in `src/new-app/` that uses Zustand stores.

## Hard Rules

1. **Never put the store object in a `useEffect` dependency array.** Zustand's hook returns a new object reference on every render. Using it as a dependency causes infinite re-render loops.

2. **Select specific values** when you need reactive state from a store. Use selectors or destructure before the effect.

3. **Store actions are stable references** — they don't need to be in dependency arrays. Access them directly inside effects or callbacks.

4. **One-time checks (expiry, redirect) use `[]` dependencies.** If the logic only needs to run on mount, use an empty dependency array with an eslint-disable comment.

## Examples

### useEffect with Store State

```typescript
// ❌ INFINITE LOOP: store object changes every render
const store = useMyStore()

useEffect(() => {
  if (store.isExpired()) {
    store.reset()
  }
}, [store]) // store is a new object each render → effect re-runs → reset triggers re-render → loop

// ✅ Select specific values for reactive effects
const count = useMyStore((s) => s.count)
const increment = useMyStore((s) => s.increment)

useEffect(() => {
  if (count > 10) increment()
}, [count, increment])

// ✅ Mount-only check (expiry, auth redirect)
const store = useMyStore()

useEffect(() => {
  if (store.isExpired()) {
    store.reset()
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [])
```

### Callbacks and Event Handlers

```typescript
// ✅ Store actions in callbacks are fine — no dependency array involved
const store = useMyStore()

const handleSubmit = () => {
  store.setPhone(phone, countryCode)
  store.goToOtp()
}
```

### Selectors for Derived State

```typescript
// ✅ Use selectors to subscribe to specific slices
const step = useAuthLoginStore((s) => s.step)
const phone = useAuthLoginStore((s) => s.phone)

// ✅ Computed values from selectors
const currentStep = stepToIndex[useAuthLoginStore((s) => s.step)]
```

## Why This Matters

Zustand's `create()` hook works like `useStore()` — each call returns a fresh object containing both state and actions. Unlike `useState` or `useRef`, the returned reference is **not stable**. Putting it in a dependency array guarantees the effect runs every render, and if the effect mutates the store, it creates an infinite loop.

## Related

- [Component–Hook Separation](component-hook-separation.md) — hook conventions
- [TanStack Query Patterns](tanstack-query.md) — query hook patterns
