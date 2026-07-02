# MSW v2 Setup & Handler Patterns

> **Path convention:** `{app}` is the project's new-code root from `.claude/rules/project-structure.md` (some projects use `src/new-app/`, others `src/` directly). Resolve it from the rule before writing any file — never assume.
> **If `project-structure.md` does not exist:** stop and ask the user (AskUserQuestion) to define the structure before scaffolding anything. For a **new project**, propose a sensible default (e.g., `src/features/` with `src/shared/` and `src/ui/`) as the recommended option; for an **existing project**, detect candidate roots from the actual tree (Glob for `features/`, `shared/`, `ui/`) and present them as options. Then offer to save the answer as `.claude/rules/project-structure.md` so no one has to ask again.


Mock Service Worker v2 intercepts HTTP requests at the network level, so your code uses the real fetch/axios paths.

## How MSW Is Wired in This Project

There is **no global MSW server** — no `test/mocks/server.ts`, and nothing MSW-related in `vitest.setup.ts` (that file is polyfills-only). The wiring has two halves:

1. **Handler catalog per feature** — handlers live in the feature's `testing/handlers.ts` (e.g., `features/stays/testing/handlers.ts` exports `buildAllHandlers()`). The same catalog powers both the browser dev-mode worker (`{app}/shared/mocks/browser.ts`) and node-side tests.
2. **Server per test file** — each test file that exercises the network creates its own `setupServer` in `beforeAll` and tears it down in `afterAll`.

## Per-Test-File Server Setup

The real pattern from `features/stays/api/stays.api.test.ts`:

```tsx
import type { SetupServer } from 'msw/node'
import { setupServer } from 'msw/node'

// Pin the API base URL so the adapter's client resolves predictably
vi.mock('@/env', () => ({
  env: { NEXT_PUBLIC_API_URL: 'http://localhost:3000' },
}))

let server: SetupServer
let stayApi: typeof import('./stays.api').stayApi

beforeAll(async () => {
  // Dynamic imports so the env mock is in place before the modules load
  const { buildAllHandlers } = await import('../testing/handlers')
  stayApi = (await import('./stays.api')).stayApi

  server = setupServer(...buildAllHandlers())
  server.listen({ onUnhandledRequest: 'error' })
})

afterEach(() => {
  server.resetHandlers()
  // ...reset any scenario/latency stores the handlers read from
})

afterAll(() => {
  server.close()
})
```

Prefer `onUnhandledRequest: 'error'` — an unhandled request means a missing handler, and silently passing it through hides bugs.

> Note: features without a handler catalog often skip MSW for adapter tests and instead `vi.mock('@/{app}/shared/api')` to assert on the request the adapter builds. Use MSW when you want to exercise the full request/response/parse path.

## Handler Patterns

### Basic GET

```tsx
import { http, HttpResponse } from 'msw'

http.get('*/api/items', () => {
  return HttpResponse.json({
    results: [{ id: 1, name: 'Test' }],
    count: 1,
  })
})
```

### POST with Body Validation

```tsx
http.post('*/api/items', async ({ request }) => {
  const body = await request.json()
  return HttpResponse.json(
    { id: 1, ...body },
    { status: 201 }
  )
})
```

### Dynamic Params

```tsx
http.get('*/api/items/:id', ({ params }) => {
  const id = Number(params.id)
  return HttpResponse.json({ id, name: `Item ${id}` })
})
```

### Error Responses

```tsx
http.get('*/api/items/:id', () => {
  return HttpResponse.json(
    { message: 'Not found' },
    { status: 404 }
  )
})
```

### Network Errors

```tsx
http.get('*/api/items', () => {
  return HttpResponse.error()
})
```

## Per-Test Handler Overrides

Override default handlers for specific test scenarios:

```tsx
it('shows error state on server failure', async () => {
  server.use(
    http.get('*/api/items', () => {
      return HttpResponse.json(
        { message: 'Internal Server Error' },
        { status: 500 }
      )
    })
  )

  // Test will use this override, then reset after the test
})
```

## Organizing Handlers by Feature

Handler catalogs live inside the owning feature's `testing/` folder and export a builder that tests (and the browser worker) spread into the server:

```tsx
// features/{feature}/testing/handlers.ts
import { http, HttpResponse } from 'msw'

const authHandlers = [
  http.post('*/user/warehouse-owner/login', async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({
      accessToken: 'test-access-token',
      refreshToken: 'test-refresh-token',
      user: { name: 'Test User', email: body.email },
    })
  }),
]

export const buildAllHandlers = () => [
  ...authHandlers,
  // ...other handler groups for this feature
]
```

## Delay Simulation

```tsx
import { delay } from 'msw'

http.get('*/api/items', async () => {
  await delay(150) // Simulate network latency
  return HttpResponse.json({ results: [] })
})
```
