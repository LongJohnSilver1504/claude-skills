# MSW v2 Setup & Handler Patterns

> **Project config:** `{app}` is the project's new-code root from `.claude/rules/project-structure.md`; project values (package manager, commands, base branch, error surface) come from `docs/agents/project-conventions.md`. Resolve both before writing any file — never assume. If a needed file is missing, stop: "Run `/setup-daher-skills` first — missing `<file>`."


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

Handlers simulate the backend, so they must return **wire-format shapes (DTOs), never domain objects** — build them with the feature's DTO factories (`testing/factories.ts`, typed `satisfies z.input<typeof xDtoSchema>`) rather than untyped literals.

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
