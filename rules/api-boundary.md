# API Boundary (Anti-Corruption Layer)

> **Scope:** All new code under the project's new-code root (see `project-structure.md`). Every backend request/response crosses this boundary — no exceptions.
>
> **Pattern names:** Anti-Corruption Layer (DDD) implemented as **DTO + Mapper**, following **"Parse, don't validate"**. The frontend owns its model; the backend's wire format appears in exactly ONE file per feature.

## The Flow

```
Response from backend
  → parseResponse(xDtoSchema, data)   1. VALIDATE the wire format (Zod) — throws VALIDATION_ERROR on mismatch
  → toX(dto)                          2. MAP to the app's domain model (pure function)
  → X (domain type)                   3. hooks/components only ever see this
```

Requests go through the same boundary in reverse: `buildCreateXBody(input): CreateXDto`.

## Hard Rules

1. **The wire format lives in `api/{feature}.dto.ts` only.** Zod schemas of exactly what the backend sends/receives. No other file may describe backend shapes.
2. **Every consumed response is validated then mapped.** Adapter methods do `parseResponse(dtoSchema, response.data)` → `toDomain(dto)`. Even near-identity mappers are required — they are the stable rename point for when the backend changes.
3. **Domain types are hand-authored in `domain/{feature}.types.ts`** and owned by the frontend. Never re-export `z.infer` of a DTO schema as a domain type.
4. **Mappers are pure functions in `api/{feature}.mapper.ts`**: `toX(dto): X` for responses, `buildXBody(input): XDto` for request bodies. No fetching, no side effects — trivially testable.
5. **Import rule (enforced by hook):** files outside `api/` must never import from `api/*.dto`. Hooks and components import types from `domain/` only.
6. **Strict schemas by default.** Every field is required unless the *verified* contract says otherwise. Each `.optional()`/`.nullable()` needs a one-line comment citing why (a permissive schema is a switched-off detector — the backend can drop the field and nothing fires).
7. **Void responses (204)** skip mapping — verify status only.
8. **Normalization scope:** mappers normalize names, nullables (`?? null` / defaults), envelope flattening, and string unions. Keep dates as ISO strings and money in backend units for now — formatters in `domain/` handle presentation.

## File Convention

```
api/{feature}.dto.ts       # Zod wire schemas + z.infer DTO types — ONLY place that knows the backend
api/{feature}.mapper.ts    # toX(dto), buildXBody(input) — pure, tested
api/{feature}.api.ts       # adapter: fetch → .catch(handleApiError) → parseResponse(dto) → mapper
domain/{feature}.types.ts  # the app's model, hand-written, frontend-owned
```

## Adapter Pattern

```typescript
import { client, handleApiError, parseResponse } from '@/{app}/shared/api'
import { stayDetailDtoSchema } from './stays.dto'
import { toStay, buildCreateStayBody } from './stays.mapper'

export const staysApi = {
  getById: async (id: number) => {
    const response = await client
      .get(stayEndpoints.detail(id))
      .catch((error) => handleApiError(error, [{ status: 404, code: 'STAY_NOT_FOUND', message: 'Stay not found' }]))
    const dto = parseResponse(stayDetailDtoSchema, response.data) // validate
    return toStay(dto)                                            // map
  },
  create: async (input: CreateStayInput) => {
    const response = await client
      .post(stayEndpoints.create, buildCreateStayBody(input))     // reverse map
      .catch((error) => handleApiError(error, []))
    return toStay(parseResponse(createStayDtoSchema, response.data))
  },
}
```

## Detection Layers (find out BEFORE the user does)

Runtime validation catches drift, but at the worst moment — when a user hits it. Layer these on top:

| Layer | Mechanism | Status |
|---|---|---|
| Typed MSW factories | DTO factories declare `satisfies z.input<typeof xDtoSchema>` — schema changes make mocks fail to compile | **Required** — see `frontend-testing` skill |
| Strict schemas | Rule 6 above — required-by-default fields make drops fire `VALIDATION_ERROR` | **Required** |
| Loud telemetry | `VALIDATION_ERROR` in production must be reported (the `AppError` already carries `responseBody`), not just toasted | Required when error reporting lands |
| Contract smoke test | CI/cron script runs the dto schemas against real develop/staging responses | Add when a stable authed staging env exists |
| OpenAPI diff | CI diffs the backend's swagger spec between runs | Aspirational — needs backend spec |

## Anti-Patterns

```typescript
// ❌ Re-exporting wire types as the domain
export type { Stay } from '../api/stays.schemas'

// ❌ Component/hook importing wire shapes
import type { StayDto } from '../api/stays.dto'

// ❌ Form submitting the backend's shape directly (coupling re-enters on the request side)
mutation.mutate(formValues) // where formValues IS the wire body

// ❌ Optional-by-default schema — silent-drop detector is off
z.object({ plate: z.string().nullable().optional() }) // no justification comment

// ❌ Skipping the mapper "because it's identical today"
return parseResponse(stayDtoSchema, response.data) // returns wire type to consumers
```

## Migration Note

Features written before this rule may infer domain types from wire schemas directly. Migrate opportunistically when touching them; all NEW features follow this rule from scaffold.

## Related

- [error-handling.md](error-handling.md) — `parseResponse`, `handleApiError`, `AppError`
- [project-structure.md](project-structure.md) — where `api/` and `domain/` live
- `create-feature` skill — scaffolds `dto.ts` + `mapper.ts` from the start
- `frontend-testing` skill — DTO factories (MSW) vs domain factories (components)
