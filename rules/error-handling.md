---
description: Enforce error handling conventions — AppError, tryCatch, useError, and error propagation
globs: "**/*.{ts,tsx}"
alwaysApply: false
---

# Error Handling

> **Scope:** These patterns apply to new code in `src/new-app/`. Legacy code in `src/api/` and `src/hooks/` follows existing conventions.

Errors flow upward through well-defined layers. Transform at the adapter boundary, display at the hook/component boundary.

## Hard Rules

1. **Transform Axios errors in API adapters** (`new-app/features/{feature}/api/{feature}.api.ts`) — catch `isAxiosError`, throw `AppError`.
2. **Never swallow errors** — always re-throw or show user feedback.
3. **Use `useError().showError()`** for user-visible errors — never `toast.error()` directly.
4. **Use `AppError.isAppError()`** to type-check errors before accessing `.code` or `.status`.
5. **Error codes are `UPPER_SNAKE_CASE`** strings — never enums.
6. **Domain error classes** go in `new-app/features/{feature}/domain/{feature}.errors.ts` and extend `AppError`.
7. **Use `tryCatch()`** from `@/new-app/shared/utils` for imperative async flows needing sequential steps.
8. **The `ApiClient` logs errors but always re-throws** — it is side-effect only.

## Error Flow

```
API adapter (catch axios → throw AppError)
  → Hook (tryCatch or onError → showError)
  → Component (receives loading/error state from hook)
```

## API Adapter Pattern

```typescript
import { isAxiosError } from 'axios'
import { AppError } from '@/new-app/shared/errors'

catch (error) {
  if (isAxiosError(error)) {
    const status = error.response?.status
    const message = error.response?.data?.message

    if (status === 401) throw new AppError(message || 'Unauthorized', 'UNAUTHORIZED', 401)
    if (status === 404) throw new AppError(message || 'Not found', 'NOT_FOUND', 404)
    if (status === 422) throw new AppError(message || 'Validation failed', 'VALIDATION_ERROR', 422)

    throw new AppError(message || 'Server error', 'SERVER_ERROR', status ?? 500)
  }
  throw new AppError('Unable to connect', 'NETWORK_ERROR', 0)
}
```

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
import { tryCatch } from '@/new-app/shared/utils'
import { links } from '@/new-app/shared/links'

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
// new-app/features/payments/domain/payment.errors.ts
import { AppError } from '@/new-app/shared/errors'

export class PaymentNotFoundError extends AppError {
  constructor(id: number) {
    super(`Payment #${id} not found`, 'PAYMENT_NOT_FOUND', 404)
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
| `VALIDATION_ERROR` | 422 | Request validation |
| `SERVER_ERROR` | 500 | Backend error |
| `NETWORK_ERROR` | 0 | Connection failure |

## Anti-Patterns

```typescript
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

- [AppError source](mdc:new-app/shared/errors/app-error.ts)
- [tryCatch source](mdc:new-app/shared/utils/try-catch.ts)
- [ErrorProvider source](mdc:new-app/shared/providers/error-provider.tsx)
- [Auth adapter example](mdc:new-app/features/auth/api/auth.api.ts)
