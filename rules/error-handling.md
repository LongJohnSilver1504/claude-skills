---
description: Enforce error handling conventions — AppError, tryCatch, useError, and error propagation
globs: "**/*.{ts,tsx}"
alwaysApply: false
---

# Error Handling

> **Scope:** These patterns apply to new code in `src/`. Legacy code in `src/api/` and `src/hooks/` follows existing conventions.

Errors flow upward through well-defined layers. Transform at the adapter boundary, display at the hook/component boundary.

## Hard Rules

1. **Use `.catch()` with `handleApiError()`** from `@/shared/api` in API adapters — never use try/catch boilerplate.
2. **Use `parseResponse()`** from `@/shared/api` to validate API responses against Zod schemas — catches shape mismatches at runtime.
3. **Never swallow errors** — always re-throw or show user feedback.
4. **Use `useNotification().showError()`** for user-visible errors — never `toast.error()` directly.
5. **Use `AppError.isAppError()`** to type-check errors before accessing `.code` or `.status`.
6. **Error codes are `UPPER_SNAKE_CASE`** strings — never enums.
7. **Domain error classes** go in `features/{feature}/domain/{feature}.errors.ts` and extend `AppError`.
8. **Use `tryCatch()`** from `@/shared/utils` for imperative async flows needing sequential steps. Returns a `Result<T, E>` discriminated union.
9. **The `ApiClient` logs errors but always re-throws** — it is side-effect only.

## axios v0.21 Gotcha

This project uses **axios v0.21**. The named export `isAxiosError` does not exist in this version. Always use the static method:

```typescript
// ✅ Correct for axios v0.21
import axios from 'axios'
axios.isAxiosError(error)

// ❌ Does not exist in v0.21
import { isAxiosError } from 'axios'
```

## AppError

`AppError` extends native `Error` with structured fields:

| Field | Type | Purpose |
|-------|------|---------|
| `message` | `string` | User-facing error message |
| `code` | `string` | Machine-readable error code (`UPPER_SNAKE_CASE`) |
| `status` | `number` | HTTP status code |
| `description` | `string?` | Validation details (e.g., field paths) |
| `details` | `Record?` | Structured error context |
| `cause` | `unknown?` | Original error via native `Error.cause` chaining |
| `responseBody` | `unknown?` | Raw server response body for debugging |

## Error Flow

```
API adapter (.catch → handleApiError → throw AppError)
  → Hook (tryCatch or onError → showError)
  → Component (receives loading/error state from hook)
```

## API Adapter Pattern

```typescript
import { client, handleApiError, parseResponse } from '@/shared/api'
import { myResponseSchema } from './my-feature.schemas'

export const myApi = {
  getById: async (id: number) => {
    const response = await client
      .get(endpoints.detail(id))
      .catch((error) =>
        handleApiError(error, [
          { status: 404, code: 'MY_ENTITY_NOT_FOUND', message: 'Entity not found' },
        ])
      )
    return parseResponse(myResponseSchema, response.data)
  },
}
```

- `handleApiError` returns `never` — TypeScript knows it always throws, no return statement needed
- `.catch()` replaces the old try/catch + `AppError.isAppError` guard boilerplate
- `parseResponse` validates the raw API data against a Zod schema and throws `VALIDATION_ERROR` on mismatch
- The interceptor in `ApiClient` already converts all axios errors to `AppError` with `cause` and `responseBody`

## Hook Error Handling

```typescript
// Option A: onError callback (simple fire-and-forget)
onError: (error) => {
  if (AppError.isAppError(error)) {
    switch (error.code) {
      case 'INVALID_CREDENTIALS':
        showError('Invalid email or password')
        break
      default:
        showError('Something went wrong')
    }
    return
  }
  showError('An unexpected error occurred')
}

// Option B: tryCatch (sequential steps after success)
import { tryCatch } from '@/shared/utils'
import { links } from '@/shared/links'

const { data, error } = await tryCatch(mutation.mutateAsync(values))
if (error) {
  if (AppError.isAppError(error)) showError(error.message)
  return
}
await saveSession(data)
router.push(links.private.dashboard)
```

## Domain Error Classes

```typescript
// features/payments/domain/payment.errors.ts
import { AppError } from '@/shared/errors'

export class PaymentNotFoundError extends AppError {
  constructor(id: number) {
    super({ message: 'Payment not found', code: 'PAYMENT_NOT_FOUND', status: 404, details: { id } })
  }
}
```

Use domain classes when: thrown in 2+ places, needs specific construction logic, or distinctive handling.

## Error Code Table

| Code | Status | Use |
|------|--------|-----|
| `INVALID_CREDENTIALS` | 401 | Wrong email/password |
| `UNAUTHORIZED` | 401 | Missing/expired token |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `{ENTITY}_NOT_FOUND` | 404 | Resource missing |
| `VALIDATION_ERROR` | 422 | Request validation or invalid API response (Zod) |
| `SERVER_ERROR` | 500 | Backend error |
| `NETWORK_ERROR` | 0 | Connection failure |

## Anti-Patterns

```typescript
// ❌ try/catch boilerplate in API adapters
try {
  const response = await client.get(endpoint)
  return parseResponse(schema, response.data)
} catch (error) {
  if (AppError.isAppError(error)) throw error
  handleApiError(error, [...])
}

// ✅ Use .catch() instead
const response = await client.get(endpoint)
  .catch((error) => handleApiError(error, [...]))
return parseResponse(schema, response.data)

// ❌ Direct toast
toast.error('Something went wrong')

// ❌ Swallowing errors
catch (error) { /* ignore */ }

// ❌ Throwing plain strings
throw 'Something went wrong'

// ❌ Checking error.message instead of error.code
if (error.message.includes('not found')) ...

// ❌ Catching errors in components (should be in hooks)
try { await api.create(data) } catch (e) { ... }
```

## Related

- [AppError source](mdc:shared/errors/app-error.ts)
- [tryCatch source](mdc:shared/utils/try-catch.ts)
- [handleApiError source](mdc:shared/api/handle-api-error.ts)
- [parseResponse source](mdc:shared/api/parse-response.ts)
- [NotificationProvider source](mdc:shared/providers/notification-provider.tsx)
- [Location adapter example](mdc:features/reservations/api/location.api.ts)
