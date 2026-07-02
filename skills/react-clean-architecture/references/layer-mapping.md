# Layer Mapping to create-feature Structure

How the 3-layer model lands in a feature folder (see the `create-feature` skill for the full folder template — this file only maps principles to locations):

- **Presentation** → `components/` (pure renderers, one hook per component)
- **Business logic** → `hooks/` (React ports to UI), `queries/` (query key factories), `store/` (Zustand UI state, optional), `domain/` (pure TS business logic; types re-exported from the API schemas)
- **Transport** → `api/` — **schemas-only convention**:
  - `{feature}.api.ts` — HTTP adapter (`client` + `handleApiError` + `parseResponse`)
  - `{feature}.schemas.ts` — Zod schemas = the trust boundary; domain types are inferred from these schemas and re-exported via `domain/{feature}.types.ts`

There are no separate `{feature}.mapper.ts` or `{feature}.types.ts` files in `api/` — `parseResponse(schema, data)` validates at the boundary, and `z.infer` replaces hand-written raw-response types.

## Principle to Implementation Mapping

| Principle | create-feature Implementation |
|-----------|-------------------------------|
| Trust Boundary Validation | `api/{feature}.schemas.ts` validated via `parseResponse` in the adapter |
| Deep Modules | `hooks/use-{feature}.ts` hides query complexity |
| Hardcoded Value Extraction | `queries/{feature}.keys.ts` for query keys; endpoint constants at the top of `api/{feature}.api.ts` |
| Guard Clauses | `components/{feature}s-view.tsx` handles loading/error first |
| Layer Separation | Import rules enforced per folder |
| Component Responsibility | Components import hooks, never api directly |
| Interface Design for Testability | Adapter objects expose one method per operation (SDK-style) |
