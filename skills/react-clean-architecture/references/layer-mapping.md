# Layer Mapping to create-feature Structure

The 3-layer model maps to the `create-feature` folder structure:

```
┌─────────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                           │
│  components/                                                    │
│    └── {feature}-list.tsx, {feature}-card.tsx, {feature}s-view  │
├─────────────────────────────────────────────────────────────────┤
│                    BUSINESS LOGIC LAYER                         │
│  hooks/       → React hooks as ports to UI                      │
│  queries/     → TanStack Query configuration                    │
│  store/       → Zustand UI state (optional)                     │
│  domain/      → Pure TS types, business logic functions         │
├─────────────────────────────────────────────────────────────────┤
│                    TRANSPORT LAYER                              │
│  api/                                                           │
│    ├── {feature}.api.ts      → HTTP adapter                     │
│    ├── {feature}.schemas.ts  → Zod schemas (trust boundary)     │
│    ├── {feature}.mapper.ts   → Raw → Domain + Zod validation    │
│    └── {feature}.types.ts    → Raw API response types           │
└─────────────────────────────────────────────────────────────────┘
```

## Principle to Implementation Mapping

| Principle | create-feature Implementation |
|-----------|-------------------------------|
| Trust Boundary Validation | `api/{feature}.schemas.ts` + `api/{feature}.mapper.ts` validate with Zod |
| Deep Modules | `hooks/use-{feature}.ts` hides query complexity |
| Hardcoded Value Extraction | `queries/{feature}.keys.ts` for query keys |
| Guard Clauses | `components/{feature}s-view.tsx` handles loading/error first |
| Layer Separation | Import rules enforced per folder |
| Component Responsibility | Components import hooks, never api directly |
