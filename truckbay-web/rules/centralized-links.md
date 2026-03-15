---
description: Enforce centralized links and endpoints — no hardcoded URLs or paths anywhere in the codebase
globs: "**/*.{ts,tsx}"
alwaysApply: true
---

# Centralized Links & Endpoints

> **Scope:** These patterns apply to new code in `src/new-app/`. Legacy pages use hardcoded routes — when touching legacy code, prefer migrating routes to the centralized system.

All routes and API endpoints must be created and consumed through centralized builders. Never hardcode URLs or paths in components, hooks, services, utils, or tests.

## Hard Rules

1. **Never hardcode URLs or paths** in components, hooks, services, utils, or tests.

2. **App/UI routes** must come from [new-app/shared/links/index.ts](mdc:new-app/shared/links/index.ts) via the `links` object.

3. **Internal API routes** (Next.js `/api/*`) must be defined in the `apiRoutes` section of [new-app/shared/links/index.ts](mdc:new-app/shared/links/index.ts).

4. **External API endpoints** (paths relative to `baseURL`) must be defined as a typed constant object at the top of the feature's API adapter file.

5. **Dynamic params** must be built inside builder functions, not inline.

6. **Query strings** must be built using the `buildUrl` helper from [new-app/shared/links/index.ts](mdc:new-app/shared/links/index.ts).

7. **API base URL** comes from env via the `client` singleton in [new-app/shared/api/index.ts](mdc:new-app/shared/api/index.ts). Never repeat the base URL in multiple places. Never inline full API URLs.

8. **No string interpolation for URLs** outside the builder/endpoint files.

## Where Links Live

| Type | Location | Called With | Example |
|------|----------|-------------|---------|
| Public routes | `new-app/shared/links/index.ts` → `publicRoutes` | `router.push()`, `<Link>` | `links.public.signIn` |
| Private routes | `new-app/shared/links/index.ts` → `privateRoutes` | `router.push()`, `<Link>` | `links.private.dashboard` |
| Internal API routes | `new-app/shared/links/index.ts` → `apiRoutes` | `fetch()` (same-origin) | `links.api.auth.session` |
| External API endpoints | Feature's `api/{feature}.api.ts` → top-level const | `client` from `@/new-app/shared/api` | `authEndpoints.signIn` |
| Query strings | `buildUrl()` from `new-app/shared/links` | any of the above | `buildUrl(path, { q, page })` |

> **Note:** This project uses Next.js 12 Pages Router. Use `router.push()` from `next/router` — not `redirect()` (App Router only).

## If a Route Does Not Exist

Create it in the appropriate location **first**, then use it. Never add a raw string inline.

## Examples

### App Routes

```typescript
// Bad
router.push('/sign-in')
router.push('/dashboard')
<Link href="/locations">

// Good
import { useRouter } from 'next/router'
import { links } from '@/new-app/shared/links'

const router = useRouter()
router.push(links.public.signIn)
router.push(links.private.dashboard)
<Link href={links.private.locations}>
```

### App Routes with Query Params

```typescript
// Bad
router.push(`/sign-in?redirect=${pathname}`)

// Good
import { links, buildUrl } from '@/new-app/shared/links'

router.push(buildUrl(links.public.signIn, { redirect: pathname }))
```

### Internal API Routes (Next.js /api/*)

Internal API routes run on your own Next.js server. Use `fetch` for these (not the `client` singleton, which points at the external API base URL).

```typescript
// Bad — hardcoded path
const response = await fetch('/api/auth/session', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(session),
})

// Good — path from links.api
import { links } from '@/new-app/shared/links'

const response = await fetch(links.api.auth.session, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(session),
})
```

### External API Endpoints (per-feature)

External API calls use the `client` singleton from `@/new-app/shared/api`, which has the `baseURL` injected from `env.NEXT_PUBLIC_API_HOST`. Endpoint paths are relative to that base.

```typescript
// Bad — hardcoded strings scattered in methods
export const authApi = {
  signIn: async (creds) => {
    return client.post('/user/warehouse-owner/login', creds)
  },
  refresh: async (token) => {
    return client.post('/user/warehouse-owner/refresh', { refreshToken: token })
  },
}

// Good — endpoints defined once at the top
const authEndpoints = {
  signIn: '/user/warehouse-owner/login',
  refresh: '/user/warehouse-owner/refresh',
} as const

export const authApi = {
  signIn: async (creds) => {
    return client.post(authEndpoints.signIn, creds)
  },
  refresh: async (token) => {
    return client.post(authEndpoints.refresh, { refreshToken: token })
  },
}
```

### External API Endpoints with Dynamic Params

```typescript
// Bad — inline interpolation
const response = await client.get(`/locations/${id}`)
const response = await client.patch(`/locations/${id}`, data)

// Good — builder function in the endpoints object
const locationEndpoints = {
  list: '/locations',
  detail: (id: number) => `/locations/${id}`,
} as const

const response = await client.get(locationEndpoints.detail(id))
const response = await client.patch(locationEndpoints.detail(id), data)
```

## Existing Infrastructure

- **App routes & helpers**: [new-app/shared/links/index.ts](mdc:new-app/shared/links/index.ts) — `links`, `buildUrl`, `isPublicRoute`, `routePatterns`
- **API client**: [new-app/shared/api/index.ts](mdc:new-app/shared/api/index.ts) — singleton `client` with `baseURL` from `env.NEXT_PUBLIC_API_HOST`
- **API client class**: [new-app/shared/api/client.ts](mdc:new-app/shared/api/client.ts) — `ApiClient` with dependency-injected `baseURL`
