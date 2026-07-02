# Feature Documentation — Section Templates

> **Path convention:** `{app}` is the project's new-code root from `.claude/rules/project-structure.md` (some projects use `src/new-app/`, others `src/` directly). Resolve it from the rule before writing any file — never assume.
> **If `project-structure.md` does not exist:** stop and ask the user (AskUserQuestion) to define the structure before scaffolding anything. For a **new project**, propose a sensible default (e.g., `src/features/` with `src/shared/` and `src/ui/`) as the recommended option; for an **existing project**, detect candidate roots from the actual tree (Glob for `features/`, `shared/`, `ui/`) and present them as options. Then offer to save the answer as `.claude/rules/project-structure.md` so no one has to ask again.


Complete markdown templates for each section of the generated documentation.
Replace `{feature}` with the feature name (lowercase) and `{Feature}` with PascalCase.

## 1. Overview

```markdown
## Overview

**Feature**: {FeatureName}
**Status**: {Implemented/In Progress/Planned}
**Created**: {Date}
**Last Updated**: {Date}

### Purpose
{One paragraph explaining what this feature does and why it exists}

### Key Capabilities
- {Capability 1}
- {Capability 2}
- {Capability 3}
```

## 2. Architecture

```markdown
## Architecture

This feature follows **hexagonal architecture** with vertical slicing.

### Directory Structure (Simple Feature)

features/{feature}/
├── api/           # HTTP adapters + schemas
├── domain/        # Pure TS types + business logic
├── queries/       # TanStack Query config
├── store/         # Zustand UI state (optional)
├── hooks/         # React hooks
├── components/    # UI layer
└── index.ts       # Public exports

### Directory Structure (Feature with Sub-Features)

features/{feature}/
├── api/                    # Shared API adapters + schemas
├── domain/                 # Shared types + business logic
├── queries/                # Shared query key factories
├── hooks/                  # Shared hooks (data fetching, common logic)
├── testing/                # Shared test factories
├── pages/                  # Page compositors (one per route)
│
├── {sub-feature-a}/        # Self-contained sub-feature
│   ├── components/
│   ├── hooks/
│   └── domain/             # Sub-feature-only logic (optional)
│
├── {sub-feature-b}/        # Another sub-feature
│   ├── components/
│   └── hooks/
│
└── index.ts                # Public barrel exports

### Layer Responsibilities

| Layer | Purpose | Dependencies |
|-------|---------|--------------|
| domain/ | Pure types, business logic | None (pure TS) |
| api/ | HTTP calls, Zod schemas | domain/ |
| queries/ | Query configuration | api/, domain/ |
| store/ | UI state management | domain/ |
| hooks/ | React data access | queries/, store/ |
| components/ | UI rendering | hooks/, store/ |
| pages/ | Page compositors (thin shells) | All sub-features |

### Sub-Feature Import Rules

| From | Can Import | Cannot Import |
|------|-----------|---------------|
| pages/ | Any sibling sub-feature, shared layers | — |
| {sub-feature}/ | Shared layers (api/, domain/, hooks/, queries/) | Other sub-features |
```

## 3. Data Flow

```markdown
## Data Flow

1. **Fetch**: Component calls `use{Feature}s()` hook
2. **Query**: TanStack Query executes `{feature}Api.getAll()`
3. **Transform**: Mapper validates raw response with Zod and transforms to domain types
4. **Cache**: TanStack Query caches the result
5. **Render**: Component receives typed data and renders
```

## 4. Key Files

```markdown
## Key Files

| File | Purpose |
|------|---------|
| `api/{feature}.schemas.ts` | Zod schemas (trust boundary) |
| `api/{feature}.api.ts` | HTTP adapter with all API calls |
| `api/{feature}.types.ts` | Raw API response types |
| `domain/{feature}.types.ts` | Pure TypeScript types |
| `domain/{feature}.service.ts` | Pure business logic functions |
| `queries/{feature}.queries.ts` | TanStack Query options |
| `store/{feature}.store.ts` | Zustand store for UI state |
| `hooks/use-{feature}s.ts` | List query hook |
| `hooks/use-{feature}-form.ts` | Form hook (useForm + useMutation) |
| `hooks/use-{feature}-mutations.ts` | Create/update/delete mutations |
| `components/{feature}s-view.tsx` | Main container component |
```

## 5. API Reference

```markdown
## API Reference

### Endpoints Consumed

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/{feature}s` | List all (paginated) |
| GET | `/{feature}s/:id` | Get single item |
| POST | `/{feature}s` | Create new item |
| PATCH | `/{feature}s/:id` | Update item |
| DELETE | `/{feature}s/:id` | Delete item |
```

## 6. Data Models

```markdown
## Data Models

### Zod Schemas (api/{feature}.schemas.ts)
- `{feature}Schema` — response validation
- `create{Feature}Schema` — request validation
- `update{Feature}Schema` — partial request validation

### Domain Types (domain/{feature}.types.ts)
- `{Feature}` — main entity type
- `{Feature}Status` — status enum
- `Paginated{Feature}s` — list response type
```

## 7. State Management

```markdown
## State Management

### Server State (TanStack Query)
- `use{Feature}s(params)` — list query
- `use{Feature}(id)` — detail query
- `useCreate{Feature}()` — create mutation
- `useUpdate{Feature}()` — update mutation
- `useDelete{Feature}()` — delete mutation

### Query Keys
- `{feature}Keys.all` — `['{feature}s']`
- `{feature}Keys.list(params)` — `['{feature}s', 'list', params]`
- `{feature}Keys.detail(id)` — `['{feature}s', 'detail', id]`

### Client State (Zustand) — if applicable
- `use{Feature}Store()` — UI state (filters, selection, modals)

### When to Use Each
| State Type | Manager | Examples |
|------------|---------|----------|
| Server data | TanStack Query | Fetched entities, API responses |
| UI state | Zustand | Selection, filters, modal open/close |
| Form state | react-hook-form | Field values during editing |
```

## 8. Components

```markdown
## Components

### {Feature}sView (Container)
Main container. Handles loading, error, and data display.

### {Feature}List
Renders array of items. Props: `{feature}s`, `onEdit?`

### {Feature}Card
Single item display. Props: `{feature}`, `onEdit?`

### {Feature}Form
Create/edit form using Controller + Field pattern.
```

## 9. Usage Examples

```markdown
## Usage Examples

### Basic Usage
import { {Feature}sView } from '@/{app}/features/{feature}'
<{Feature}sView />

### Using Hooks Directly
import { use{Feature}s } from '@/{app}/features/{feature}'
const { data, isPending } = use{Feature}s({})

### Creating a New Item
import { useCreate{Feature} } from '@/{app}/features/{feature}'
const { mutate, isPending } = useCreate{Feature}()
mutate({ name: 'New Item' })
```

## 10. Testing

```markdown
## Testing

### Test Files Location
Tests are co-located next to their source files — no __tests__/ directories:
features/{feature}/domain/{feature}.service.test.ts
features/{feature}/api/{feature}.api.test.ts
features/{feature}/hooks/use-{feature}s.test.ts
features/{feature}/components/{feature}s-view.test.tsx

### Running Tests
pnpm vitest run {feature-dir}

### Test Coverage
| Layer | Coverage |
|-------|----------|
| Domain | {X}% |
| API | {X}% |
| Hooks | {X}% |
| Components | {X}% |
```

## 11. Known Limitations

```markdown
## Known Limitations

### Current Constraints
- {Limitation 1}

### Future Improvements
- [ ] {Planned improvement 1}

### Edge Cases
- {Edge case 1}: {How it's handled}
```
