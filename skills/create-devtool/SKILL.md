---
name: create-devtool
description: Create a DevTool debug panel for a page or feature. Scaffolds the component + hook that surfaces store state, query status, API payloads, and a JSON snapshot — all behind the dev-only wrench button.
---

# Create DevTool

Scaffold a DevTool debug panel for a page or wizard flow. The panel surfaces internal state that's invisible from the UI: store values, query statuses, computed payloads, errors, and a full JSON snapshot for copy-paste bug reports.

**Related:** create-feature (feature scaffolding), systematic-debugging (when you're hunting a bug).

## When to Use

- A new page or wizard is being built and needs debug visibility
- A page has complex state (stores, multiple queries, computed payloads) that's hard to inspect from the UI
- The user says "create a devtool for this page"

## Before You Begin

1. **Read the page component** to identify what it renders and which hooks/stores it uses.
2. **Read the page's hook(s)** to find: Zustand stores, TanStack queries, mutations, computed state, and the data flow.
3. **Identify what's useful to surface** (see the Data Selection Guide below).

Do NOT ask the user what to include — analyze the page and decide. The user expects you to know what's debug-useful from reading the code.

## Architecture

DevTools follow the same component-hook separation as the rest of the app, but live in a `devtool/` directory:

### Wizard/Complex Flow (with hook)

```
{feature}/
  devtool/
    components/
      {feature}-devtool.tsx     # Pure renderer
    hooks/
      use-{feature}-devtool.ts  # All data gathering
    index.ts                    # Barrel export
```

### Simple Page (inline, no hook)

When the page has minimal state (1 store, 1-2 queries, no computed payload), skip the hook — read state directly in the component:

```
{feature-or-sub-feature}/
  components/
    {name}-devtool.tsx          # Reads hooks directly, no separate hook file
```

Use the simple pattern when: ≤ 5 store fields, ≤ 2 queries, no payload construction, no coupon/lease/payment resolution logic.

## Data Selection Guide

### Always Include

| Data | Why | Source |
|------|-----|--------|
| **Store state** | Shows what the user has selected/entered at each step | Zustand store selectors |
| **Query statuses** | Shows if data is loading, errored, or stale | `queryClient.getQueryState()` |
| **Errors** | Surface API errors with code + message for instant diagnosis | Filter queries where `status === 'error'` |
| **JSON snapshot** | One-click copy of all state for bug reports | `StateSnapshot` component |

### Include When Present

| Data | When | How |
|------|------|-----|
| **Wizard step info** | Page has a wizard/stepper | Step index, step name, total steps, isExpired |
| **Computed API payload** | Page submits data (create/update) | Mirror the payload construction from the hook, show what would be sent |
| **Pricing/breakdown** | Page shows prices | Raw pricing object from the API query cache |
| **Coupon state** | Page has coupon input | Manual code, resolved ID, processing/invalid flags, warehouse coupons list with quick-apply buttons |
| **Payment resolution** | Page collects payment | Stripe ID, DB ID, resolution path, type (card/bank) |
| **Lease params** | Page has lease signing | warehouseId, start, end, totalPrice, bayNames, enabled flag, test-lease button |
| **TTL/expiry** | Store has `createdAt` or expiry | Computed time remaining |
| **Completion checklist** | Wizard with required fields | List of steps with StatusDot showing done/pending |

### Never Include

- Translated strings (they're visible in the UI)
- CSS/layout state
- Ref values that change every render
- Full response bodies (use the Snapshot tab for that)

## Tab Structure

### Complex flows (wizard, multi-query) — 3-4 tabs

```
Tabs: [ Wizard | Payload | Queries | Snapshot ]
       [ Visual | Payload | Queries | Snapshot ]  (if no wizard)
```

- **Wizard/Visual** — StoreField rows for store state, StatusDot for flags, section headers for grouping
- **Payload** — The computed request body that would be sent on submit (or "not ready" message)
- **Queries** — StatusDot + status label for each query, errors section at top
- **Snapshot** — `StateSnapshot` component with copy button

### Simple pages — 2 tabs

```
Tabs: [ Visual | Dev Mode ]
```

- **Visual** — StoreField rows organized in sections
- **Dev Mode** — `StateSnapshot` with full JSON

## File Templates

### Component (complex flow)

```tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/ui/tabs'
import { DevToolPanel } from '@/ui/custom/dev-tool-panel'
import { StoreField, StatusDot, StateSnapshot } from '@/shared/devtool'
import { use{Feature}Devtool } from '../hooks/use-{feature}-devtool'

export const {Feature}Devtool = () => {
  const { store, queries, errors, snapshotData } = use{Feature}Devtool()

  return (
    <DevToolPanel title="{Feature Name}">
      <Tabs defaultValue="visual">
        <TabsList className="w-full">
          <TabsTrigger value="visual" className="flex-1">Visual</TabsTrigger>
          <TabsTrigger value="queries" className="flex-1">
            Queries {errors.length > 0 && `(${errors.length})`}
          </TabsTrigger>
          <TabsTrigger value="snapshot" className="flex-1">Snapshot</TabsTrigger>
        </TabsList>

        <TabsContent value="visual" className="mt-3">
          <div className="flex flex-col gap-4">
            {/* Section: group related StoreField rows */}
            <div>
              <h3 className="text-xs font-semibold uppercase text-muted-foreground pb-2">
                Store
              </h3>
              <div className="rounded-lg border p-3">
                <StoreField label="fieldName" value={store.fieldName} />
                {/* ... */}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="queries" className="mt-3">
          {/* Query status rows with StatusDot */}
        </TabsContent>

        <TabsContent value="snapshot" className="mt-3">
          <StateSnapshot data={snapshotData} />
        </TabsContent>
      </Tabs>
    </DevToolPanel>
  )
}
```

### Component (simple page)

```tsx
import { useMemo } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/ui/tabs'
import { DevToolPanel } from '@/ui/custom/dev-tool-panel'
import { StoreField, StatusDot, StateSnapshot } from '@/shared/devtool'
// import the page's store and hooks directly

export const {Name}Devtool = () => {
  // Read store/hooks directly — no separate hook file needed
  const store = use{Name}Store()

  const snapshotData = useMemo(() => ({
    store: { /* ... */ },
  }), [/* deps */])

  return (
    <DevToolPanel title="{Name}">
      <Tabs defaultValue="visual">
        <TabsList className="w-full">
          <TabsTrigger value="visual" className="flex-1">Visual</TabsTrigger>
          <TabsTrigger value="devmode" className="flex-1">Dev Mode</TabsTrigger>
        </TabsList>

        <TabsContent value="visual" className="mt-3">
          {/* Sections with StoreField + StatusDot */}
        </TabsContent>

        <TabsContent value="devmode" className="mt-3">
          <StateSnapshot data={snapshotData} />
        </TabsContent>
      </Tabs>
    </DevToolPanel>
  )
}
```

### Hook (complex flow)

```ts
import { useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { AppError } from '@/shared/errors'
// import the feature's store, keys, API

type QueryStatus = {
  key: string
  status: 'idle' | 'pending' | 'error' | 'success'
  errorMessage: string | null
  errorCode: string | null
}

export type Use{Feature}DevtoolReturn = {
  store: { /* store fields */ }
  queries: QueryStatus[]
  errors: QueryStatus[]
  snapshotData: Record<string, unknown>
}

export const use{Feature}Devtool = (): Use{Feature}DevtoolReturn => {
  const queryClient = useQueryClient()

  // Read store via selectors (never the full store object)
  const field1 = use{Feature}Store((s) => s.field1)
  // ...

  // Build query status list from query keys
  const queryKeyMap = useMemo(() => [
    { key: 'queryName', queryKey: featureKeys.something() },
    // ...
  ], [/* deps */])

  const queries: QueryStatus[] = useMemo(() => {
    return queryKeyMap.map(({ key, queryKey }) => {
      const state = queryClient.getQueryState(queryKey)
      const error = state?.error
      let errorMessage: string | null = null
      let errorCode: string | null = null
      if (error) {
        if (AppError.isAppError(error)) {
          errorMessage = error.message
          errorCode = error.code
        } else if (error instanceof Error) {
          errorMessage = error.message
        } else {
          errorMessage = String(error)
        }
      }
      return { key, status: state?.status ?? 'idle', errorMessage, errorCode }
    })
  }, [queryClient, queryKeyMap])

  const errors = useMemo(() => queries.filter((q) => q.status === 'error'), [queries])

  const store = { field1, /* ... */ }

  const snapshotData: Record<string, unknown> = useMemo(() => ({
    store,
    queries: queries.map((q) => ({
      key: q.key,
      status: q.status,
      ...(q.errorMessage ? { error: q.errorMessage, code: q.errorCode } : {}),
    })),
  }), [/* deps */])

  return { store, queries, errors, snapshotData }
}
```

### Barrel export

```ts
// devtool/index.ts
export { {Feature}Devtool } from './components/{feature}-devtool'
```

## Placement

Drop `<{Feature}Devtool />` at the bottom of the page component, inside `AppContainer` but after all visible content:

```tsx
export const {Feature}Page = () => {
  // ...
  return (
    <AppContainer>
      {/* ... page content ... */}
      <{Feature}Devtool />
    </AppContainer>
  )
}
```

The `DevToolPanel` wrapper handles:
- `isDevToolEnabled()` check — returns null in production
- Draggable wrench button (fixed position, bottom-right)
- Right-side Sheet with ScrollArea
- Error boundary around children

## Shared Primitives

All from `@/shared/devtool`:

| Component | Purpose | Usage |
|-----------|---------|-------|
| `StoreField` | Key-value row (label + mono value) | `<StoreField label="fieldName" value={store.field} />` |
| `StatusDot` | Green/red dot | `<StatusDot ok={condition} />` |
| `StateSnapshot` | Formatted JSON + copy button | `<StateSnapshot data={snapshotData} />` |
| `isDevToolEnabled` | Guard (checks env/flag) | Used internally by `DevToolPanel` |

And from `@/ui/custom/dev-tool-panel`:

| Component | Purpose |
|-----------|---------|
| `DevToolPanel` | Wrench button + Sheet + error boundary |

## Section Styling

Every visual section follows the same pattern:

```tsx
<div>
  <h3 className="text-xs font-semibold uppercase text-muted-foreground pb-2">
    Section Title
  </h3>
  <div className="rounded-lg border p-3">
    <StoreField label="..." value={...} />
    {/* or StatusDot rows, or custom content */}
  </div>
</div>
```

Group sections in a `<div className="flex flex-col gap-4">`.

## Checklist

Before reporting done:

- [ ] DevTool surfaces all store fields relevant to the page
- [ ] Query statuses are tracked for every TanStack query the page uses
- [ ] Errors are filtered and shown prominently (with copy support for complex flows)
- [ ] Snapshot tab includes all state needed for a bug report
- [ ] Component is placed in the page, after all visible content
- [ ] Barrel export exists (`devtool/index.ts` or inline export)
- [ ] `pnpm build` passes (no type errors)
- [ ] Tested: wrench button appears, panel opens, data renders

## Examples in Codebase

| DevTool | Complexity | Pattern | Path |
|---------|-----------|---------|------|
| BookingDevtool | Complex (wizard + coupon + payload + queries) | Hook + Component, 4 tabs | `features/booking/devtool/` |
| ExtendDevtool | Medium (wizard + pricing + lease) | Inline, 2 tabs | `features/reservations/extend-reservation/components/extend-devtool.tsx` |
| BookingsDevtool | Simple (list page + filters) | Hook + Component, 2 tabs | `features/bookings/devtool/` |
| CancelBaysDevtool | Medium (wizard + store) | Inline, 2 tabs | `features/reservations/monthly/cancel-bays/components/` |
