# MSW v2 Setup & Handler Patterns

Mock Service Worker v2 intercepts HTTP requests at the network level, so your code uses the real fetch/axios paths.

## Server Setup

```tsx
// test/mocks/server.ts
import { setupServer } from 'msw/node'
import { handlers } from './handlers'

export const server = setupServer(...handlers)
```

## Global Setup (vitest.setup.ts)

```tsx
import { beforeAll, afterEach, afterAll } from 'vitest'
import { server } from './test/mocks/server'

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
```

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

```tsx
// test/mocks/handlers.ts
import { authHandlers } from './auth.handlers'
import { locationHandlers } from './location.handlers'

export const handlers = [
  ...authHandlers,
  ...locationHandlers,
]
```

```tsx
// test/mocks/auth.handlers.ts
import { http, HttpResponse } from 'msw'

export const authHandlers = [
  http.post('*/user/warehouse-owner/login', async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({
      accessToken: 'test-access-token',
      refreshToken: 'test-refresh-token',
      user: { name: 'Test User', email: body.email },
    })
  }),
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
