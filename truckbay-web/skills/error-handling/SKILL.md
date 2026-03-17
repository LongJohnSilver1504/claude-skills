---
name: error-handling
description: Patterns for error creation, propagation, transformation, and display in TruckBays
tags: [errors, AppError, tryCatch, toast, domain-errors]
---

# Error Handling

## Architecture Overview

```
API call
  → ApiClient.request() catches + logs
  → Feature adapter transforms to AppError (with code + status)
  → Hook catches with tryCatch() or mutation onError
  → useError().showError() displays toast
```

**Key principle:** Errors always re-throw upward. Side effects (logging, toasting) happen at the boundaries, not in the middle.

## Core Infrastructure

### AppError (base class)

```typescript
import { AppError } from '@/shared/errors'

// Create with message, code, and HTTP status
throw new AppError('Invalid email or password', 'INVALID_CREDENTIALS', 401)
throw new AppError('Location not found', 'LOCATION_NOT_FOUND', 404)

// Type-check unknown errors
if (AppError.isAppError(error)) {
  console.log(error.code)   // 'INVALID_CREDENTIALS'
  console.log(error.status) // 401
}
```

**Location:** `shared/errors/app-error.ts`
**Exports:** `AppError` class with `isAppError()` static guard and `toErrorInfo()` / `toJSON()` methods.

### Domain Error Classes

Create feature-specific errors that extend `AppError` for self-documenting code:

```typescript
// features/payments/domain/payment.errors.ts
import { AppError } from '@/shared/errors'

export class PaymentNotFoundError extends AppError {
  constructor(id: number) {
    super(`Payment #${id} not found`, 'PAYMENT_NOT_FOUND', 404)
  }
}

export class PaymentExpiredError extends AppError {
  constructor(id: number) {
    super(`Payment #${id} has expired`, 'PAYMENT_EXPIRED', 410)
  }
}

export class InsufficientFundsError extends AppError {
  constructor() {
    super('Insufficient funds for this transaction', 'INSUFFICIENT_FUNDS', 402)
  }
}
```

**When to use domain classes vs plain AppError:**
- Use **domain classes** when an error has specific construction logic, is thrown in 2+ places, or needs distinctive handling
- Use **plain AppError** for one-off errors or simple status-to-message mappings in adapters

### tryCatch Utility

```typescript
import { tryCatch } from '@/shared/utils'

const { data, error } = await tryCatch(authApi.signIn(credentials))

if (error) {
  // error is typed as Error (or custom via generic)
  showError(error.message)
  return
}

// data is guaranteed non-null here
console.log(data.accessToken)
```

**Location:** `shared/utils/try-catch.ts`
**Returns:** `{ data: T, error: null } | { data: null, error: E }`

### useError Hook (toast display)

```typescript
import { useError } from '@/shared/providers'

const { showError, showWarning } = useError()

showError('Something went wrong')     // Red toast via Sonner
showWarning('Session expiring soon')  // Yellow toast via Sonner
```

**Rule:** Always use `useError().showError()` — never call `toast.error()` directly.
**Location:** `shared/providers/error-provider.tsx`

## Error Flow Patterns

### Pattern 1: API Adapter (transform Axios → AppError)

```typescript
// features/auth/api/auth.api.ts
import { isAxiosError } from 'axios'
import { AppError } from '@/shared/errors'
import { client } from '@/shared/api'

const authEndpoints = {
  signIn: '/user/warehouse-owner/login',
} as const

export const authApi = {
  signIn: async (credentials: SignInCredentials): Promise<Session> => {
    try {
      const response = await client.post(authEndpoints.signIn, credentials)
      return mapSession(response.data)
    } catch (error) {
      if (isAxiosError(error)) {
        const status = error.response?.status
        const message = error.response?.data?.message

        if (status === 401) {
          throw new AppError(message || 'Invalid email or password', 'INVALID_CREDENTIALS', 401)
        }
        if (status === 422) {
          throw new AppError(message || 'Validation failed', 'VALIDATION_ERROR', 422)
        }
        throw new AppError(message || 'Server error', 'SERVER_ERROR', status ?? 500)
      }
      throw new AppError('Unable to connect. Please check your connection.', 'NETWORK_ERROR', 0)
    }
  },
}
```

**Schema validation failures:** If using Zod `safeParse` on the response, throw `RESPONSE_PARSE_ERROR` (422) — not 500 — when validation fails. The server responded successfully; the contract mismatch is a client-side concern.

### Pattern 2: Hook with tryCatch

```typescript
// features/auth/hooks/use-sign-in.ts
import { tryCatch } from '@/shared/utils'
import { AppError } from '@/shared/errors'
import { useError } from '@/shared/providers'

export function useSignIn() {
  const { showError } = useError()

  return useMutation({
    mutationFn: authApi.signIn,
    onSuccess: async (session) => {
      // handle success
    },
    onError: (error) => {
      if (AppError.isAppError(error)) {
        switch (error.code) {
          case 'INVALID_CREDENTIALS':
            showError('Invalid email or password')
            break
          case 'VALIDATION_ERROR':
            showError(error.message)
            break
          default:
            showError('Something went wrong. Please try again.')
        }
        return
      }
      showError('An unexpected error occurred')
    },
  })
}
```

### Pattern 3: Hook with tryCatch (imperative flow)

Use when you need sequential steps after the API call (e.g., save session then redirect):

```typescript
const mutation = useMutation({ mutationFn: authApi.signIn })

const handleSignIn = async (credentials: SignInCredentials) => {
  const { data: session, error } = await tryCatch(
    mutation.mutateAsync(credentials)
  )

  if (error) {
    if (AppError.isAppError(error)) {
      switch (error.code) {
        case 'INVALID_CREDENTIALS':
          showError('Invalid email or password')
          break
        default:
          showError('Something went wrong')
      }
    }
    return
  }

  // Sequential steps after success
  await saveSession(session)
  router.push(links.private.dashboard)
}
```

## Error Code Conventions

| Code | Status | Meaning |
|------|--------|---------|
| `INVALID_CREDENTIALS` | 401 | Wrong email/password |
| `UNAUTHORIZED` | 401 | Missing or expired token |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `{ENTITY}_NOT_FOUND` | 404 | Resource doesn't exist |
| `VALIDATION_ERROR` | 422 | Request validation failed |
| `CONFLICT` | 409 | Duplicate or state conflict |
| `SERVER_ERROR` | 500 | Unhandled backend error |
| `RESPONSE_PARSE_ERROR` | 422 | Server response doesn't match expected schema |
| `NETWORK_ERROR` | 0 | Connection failure |

## Rules

1. **Never swallow errors silently** — always re-throw or show user feedback
2. **Transform at the adapter boundary** — Axios errors become `AppError` in `api/{feature}.api.ts`
3. **Use `useError().showError()`** — never call `toast.error()` directly in features
4. **Use `tryCatch`** for imperative async flows needing sequential steps after success
5. **Use `onError`** in `useMutation` for simple fire-and-forget error display
6. **Domain error classes** go in `features/{feature}/domain/{feature}.errors.ts`
7. **Error codes are UPPER_SNAKE_CASE** strings (not enums)
8. **`ApiClient` is side-effect only** — it logs errors but always re-throws

## Related

- `create-feature` skill for scaffolding errors alongside a new feature
- `react-clean-architecture` skill for where errors fit in the layer model
- `shared/errors/` for base classes and types
- `shared/utils/try-catch.ts` for the Result pattern utility
- `shared/providers/error-provider.tsx` for the toast display hook
- See [references/advanced-patterns.md](references/advanced-patterns.md) for error boundaries, form-level errors, and server action patterns
