# DevTool file templates

Copy the template that matches the Architecture choice in SKILL.md (complex flow with a hook, or simple inline page), then swap in the page's real stores, queries and payloads.

## Component (complex flow)

```tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/{app}/ui/tabs'
import { DevToolPanel } from '@/{app}/ui/custom/dev-tool-panel'
import { StoreField, StatusDot, StateSnapshot } from '@/{app}/shared/devtool'
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

## Component (simple page)

```tsx
import { useMemo } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/{app}/ui/tabs'
import { DevToolPanel } from '@/{app}/ui/custom/dev-tool-panel'
import { StoreField, StatusDot, StateSnapshot } from '@/{app}/shared/devtool'
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

## Hook (complex flow)

```ts
import { useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { AppError } from '@/{app}/shared/errors'
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

  // Build query status list from query keys.
  // Keys MUST come from the feature's queries/*.keys.ts factory — never inline
  // queryKey arrays in the devtool hook.
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

## Barrel export

```ts
// devtool/index.ts
export { {Feature}Devtool } from './components/{feature}-devtool'
```
