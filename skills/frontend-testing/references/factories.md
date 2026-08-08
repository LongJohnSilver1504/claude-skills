# Shared Test Factories, Mapper Tests, and Contract Smoke

> **Project config:** `{app}` is the project's new-code root from `.claude/rules/project-structure.md`; project values (package manager, commands, base branch, error surface) come from `docs/agents/project-conventions.md`. Resolve both before writing any file — never assume. If a needed file is missing, stop: "Run `/setup-daher-skills` first — missing `<file>`."

## Shared Test Factories

When a type is used across many test files, create a **shared test factory** instead of duplicating `makeReservation` in every test file. This avoids a cascade of updates when adding a new required field to the type.

There are **two levels of factory**, mirroring the API boundary (see `rules/api-boundary.md`):

| Factory level | Builds | Used by | Typing |
|---|---|---|---|
| **DTO factories** | Wire-format objects (what the backend sends) | MSW handlers, adapter/mapper tests | `satisfies z.input<typeof xDtoSchema>` |
| **Domain factories** | Hand-authored domain types | Component, hook, and domain tests | `: X` (the domain type) |

Both live in `features/{feature}/testing/factories.ts` (location defined in `.claude/rules/testing.md`); split DTO factories into `testing/dto-factories.ts` when the file grows large.

**DTO factories are a detection layer.** Declaring `satisfies z.input<typeof xDtoSchema>` means any change to the wire schema makes the mocks fail to compile — contract drift surfaces at build time instead of when a user hits it:

```typescript
// features/stays/testing/factories.ts
import { z } from 'zod'
import { stayDetailDtoSchema } from '../api/stays.dto'

export const createStayDetailDto = (
  overrides: Partial<z.input<typeof stayDetailDtoSchema>> = {}
) =>
  ({
    id: 1,
    status: 'active',
    cab_plate: 'ABC-1234',
    // ... every field the backend sends, wire names and all ...
    ...overrides,
  }) satisfies z.input<typeof stayDetailDtoSchema>
```

> The DTO-import ban in `rules/api-boundary.md` targets app code (hooks/components); `testing/` factories are the exception — they must import the dto schema to stay typed against it.

## Factory pattern (domain)

```typescript
// features/reservation-details/testing/factories.ts
import type { Reservation, ReservationInvoice } from '../domain/reservation.types'

export const createReservation = (overrides: Partial<Reservation> = {}): Reservation => ({
  id: 1,
  status: 'checked in',
  type: 'daily',
  // ... all required fields with sensible defaults ...
  ...overrides,
})

export const createInvoice = (overrides: Partial<ReservationInvoice> = {}): ReservationInvoice => ({
  id: 1,
  status: 'paid',
  total: 5000,
  createdAt: '2026-01-01T00:00:00Z',
  collectionMethod: 'charge_automatically',
  ...overrides,
})
```

## Usage in tests

```typescript
// domain/reservation-state.test.ts
import { createReservation, createInvoice } from '../testing/factories'

it('returns CHARGED_FAILED when own payment failed', () => {
  const r = createReservation({ payment: { status: 'payment failed' } })
  expect(resolveState(r)).toBe('CHARGED_FAILED')
})

it('detects unpaid invoice', () => {
  const r = createReservation({
    invoice: createInvoice({ status: 'open' }),
  })
  expect(resolveState(r)).toBe('CHARGED_FAILED')
})
```

## When to create a factory

- The type has **5+ required fields** AND
- It appears in **3+ test files**

If a type is only tested in 1-2 files, a local `makeX` helper is fine. (Thresholds apply to both DTO and domain factories.)

## DTO factories feed MSW

MSW handlers simulate the backend, so they return **DTO-factory output (wire shapes), never domain objects**. If a handler returns a domain object, the test bypasses the validate→map boundary and proves nothing about it:

```typescript
// features/{feature}/testing/handlers.ts
http.get('*/stays/:id', ({ params }) =>
  HttpResponse.json(createStayDetailDto({ id: Number(params.id) }))  // wire shape
)
```

## Mapper Tests

Mappers (`api/{feature}.mapper.ts`) are pure functions — give them direct unit tests. Call `toX(dtoFactory())` and assert field mapping, nullable normalization (`?? null` / defaults), and envelope flattening:

```typescript
import { toStay } from './stays.mapper'
import { createStayDetailDto } from '../testing/factories'

it('maps wire names and normalizes nullables', () => {
  const stay = toStay(createStayDetailDto({ cab_plate: null }))
  expect(stay.plate).toBeNull()
  expect(stay.id).toBe(1)
})
```

These are the cheapest tests in the codebase — no rendering, no network, no providers. **Always write them.**

## Contract Smoke Test (Optional)

The layers above catch drift at compile/test time against *mocked* data. The proactive layer is a CI/cron script that runs the feature's dto schemas against **real staging responses** — schema failures mean the backend changed before any user saw it. See the detection-layers table in `rules/api-boundary.md`; add it once a stable authed staging env exists.
