---
description: Enforce TanStack Query conventions — query keys, hooks, error handling, and provider config
globs: "**/*.{ts,tsx}"
alwaysApply: false
---

# TanStack Query Patterns

> **Scope:** These patterns apply to new code in `src/`. Legacy hooks in `src/api/hooks/` follow existing conventions.

All server-state fetching/mutation uses `@tanstack/react-query`. Feature hooks wrap `useQuery`/`useMutation` — components never call the query client directly.

## Dual React Query Versions

This project has **two React Query versions** running side by side:

| Version | Package | Used By | Provider |
|---------|---------|---------|----------|
| v3 | `react-query` | Legacy code in `src/api/hooks/` | `QueryClientProvider` from `react-query` |
| v5 | `@tanstack/react-query` | New code in `src/` | `QueryClientProvider` from `@tanstack/react-query` |

Both providers are mounted in `_app.tsx`. **All new code must use v5** (`@tanstack/react-query`). Never import from `react-query` in new code.

## Hard Rules

1. **Every feature defines a query keys object** — never inline `queryKey` arrays.
2. **Queries and mutations live in feature hooks** (`features/{feature}/hooks/`) — never in components.
3. **Use `isPending`** (not deprecated `isLoading`) for mutation/query loading state.
4. **Error handling uses `useError().showError()`** — never `toast.error()` directly.
5. **Mutations always have `onError`** with `AppError.isAppError()` type guard.
6. **Never import `QueryClient` directly** in feature code — use `useQueryClient()` hook.
7. **Don't override default `staleTime` / `gcTime`** unless the feature has a specific reason.

## Query Keys Convention

```typescript
// features/{feature}/queries/{feature}.keys.ts
export const locationKeys = {
  all: ['locations'] as const,
  lists: () => ['locations', 'list'] as const,
  list: (params?: LocationListParams) => ['locations', 'list', params] as const,
  details: () => ['locations', 'detail'] as const,
  detail: (id: number) => ['locations', 'detail', id] as const,
} as const
```

**Key structure:** `[feature, scope, ...params]`

## useQuery Pattern

```typescript
// features/{feature}/hooks/use-{feature}-list.ts
import { useQuery } from '@tanstack/react-query'
import { locationKeys } from '../queries/location.keys'
import { locationApi } from '../api/location.api'

export function useLocationList(params?: LocationListParams) {
  return useQuery({
    queryKey: locationKeys.list(params),
    queryFn: () => locationApi.list(params),
  })
}
```

## useMutation Pattern

```typescript
// features/{feature}/hooks/use-create-{feature}.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useError } from '@/shared/providers'
import { AppError } from '@/shared/errors'

export function useCreateLocation() {
  const queryClient = useQueryClient()
  const { showError } = useError()

  return useMutation({
    mutationFn: locationApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: locationKeys.lists() })
    },
    onError: (error) => {
      if (AppError.isAppError(error)) {
        showError(error.message)
        return
      }
      showError('Something went wrong')
    },
  })
}
```

## Invalidation Rules

| Action | Invalidate |
|--------|-----------|
| Create | `{feature}Keys.lists()` |
| Update | `{feature}Keys.detail(id)` + `{feature}Keys.lists()` |
| Delete | `{feature}Keys.lists()` |

```typescript
// Invalidate all queries for a feature
queryClient.invalidateQueries({ queryKey: locationKeys.all })

// Invalidate a specific detail
queryClient.invalidateQueries({ queryKey: locationKeys.detail(id) })
```

## Provider Configuration

The `QueryProvider` at [shared/providers/query-provider.tsx](mdc:shared/providers/query-provider.tsx) sets:
- `staleTime`: 5 minutes
- `gcTime`: 10 minutes
- `retry`: Skip 4xx errors, max 3 retries for server/network errors
- Mutations: `retry: false`

## Component Consumption

```tsx
// ✅ Use hook return values directly
function LocationList() {
  const { data, isPending, error } = useLocationList()

  if (isPending) return <Skeleton />
  if (error) return <ErrorMessage error={error} />

  return <ul>{data.map(loc => <li key={loc.id}>{loc.name}</li>)}</ul>
}
```

## Wizard Flow Invalidation

**Never call `invalidateQueries` inside a mutation's `onSuccess` when the mutation runs inside a multi-step wizard.** Query refetches can change conditional flags (e.g., `needsSelection`, `needsTypeSelection`) that control the wizard's step array, shifting step indices mid-flow and landing the user on the wrong step.

Instead, invalidate in the **success step's exit handler** (the "Back to reservation" / "Done" button). This ensures queries are refreshed only when leaving the wizard.

```typescript
// ❌ Invalidation in onSuccess — can shift wizard steps
const mutation = useMutation({
  mutationFn: myApi.submit,
  onSuccess: async () => {
    await queryClient.invalidateQueries({ queryKey: myKeys.lists() }) // Re-renders wizard!
  },
})

// ✅ Invalidation in success step exit — safe
const onBack = useCallback(async () => {
  await queryClient.invalidateQueries({ queryKey: myKeys.lists() })
  await router.push(links.private.dashboard)
  store.reset()
}, [queryClient, store, router])
```

Wizard step flags must be **stable** — derived only from data that doesn't change mid-flow (URL params, API data), never from store selections that change when the user interacts:

```typescript
// ❌ Store dependency removes the step when user selects — shifts all indices
const needsSelection =
  !store.selectedReservationId && !reservationIdParam && reservations.length > 1

// ✅ Stable — only depends on URL param and data count
const needsSelection = !reservationIdParam && reservations.length > 1
```

## Anti-Patterns

```typescript
// ❌ Inline query keys
useQuery({ queryKey: ['locations', 'list'], ... })

// ❌ Query logic in component
function MyComponent() {
  const { data } = useQuery({ queryKey: ..., queryFn: locationApi.list })
}

// ❌ Deprecated isLoading
if (mutation.isLoading) ...

// ❌ Direct toast in onError
onError: (error) => { toast.error(error.message) }

// ❌ Direct QueryClient import in features
import { QueryClient } from '@tanstack/react-query'
```

## Related

- [Query provider](mdc:shared/providers/query-provider.tsx)
- [Auth mutation example](mdc:features/auth/hooks/use-sign-in.ts)
- Query keys template in `create-feature` skill
- Error handling in `error-handling` rule
