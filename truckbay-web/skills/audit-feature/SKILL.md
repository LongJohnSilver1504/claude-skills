---
name: audit-feature
description: Audit a feature folder for compliance with project rules — color tokens, hook/component separation, import boundaries, clean code, and shadcn patterns. Use when reviewing code quality, after implementation, or when context is lost and you need to verify a feature follows conventions.
---

# Audit Feature

Scan a feature folder (or any `src/new-app/` directory) and report violations of project conventions. Produces a checklist report with file-level findings and auto-fixes what it can.

**When to use:** After implementing a feature, when resuming work after context loss, during code review, or when the user says "audit", "check", "review conventions", "lint rules".

## Input

The user provides a **folder path** relative to `src/new-app/features/` (e.g., `reservations/extend-reservation`) or an absolute path. If no path is given, ask for one.

## Audit Passes

Run each pass in order. For each pass, use Grep/Glob/Read to scan files, then collect violations. Report findings per-pass with file:line references.

---

### Pass 1: Raw Tailwind Colors

**Rule:** No raw Tailwind color classes anywhere in `new-app/`. All colors must use semantic theme tokens from `globals.css`.

**Scan for these patterns in `.tsx` and `.ts` files:**

```
text-(red|blue|green|yellow|orange|purple|pink|gray|slate|zinc|neutral|stone|amber|emerald|teal|cyan|sky|indigo|violet|fuchsia|rose|lime|white|black)-\d+
bg-(red|blue|green|yellow|orange|purple|pink|gray|slate|zinc|neutral|stone|amber|emerald|teal|cyan|sky|indigo|violet|fuchsia|rose|lime|white|black)-\d+
border-(red|blue|green|yellow|orange|purple|pink|gray|slate|zinc|neutral|stone|amber|emerald|teal|cyan|sky|indigo|violet|fuchsia|rose|lime|white|black)-\d+
ring-(red|blue|green|yellow|orange|purple|pink|gray|slate|zinc|neutral|stone|amber|emerald|teal|cyan|sky|indigo|violet|fuchsia|rose|lime|white|black)-\d+
fill-(red|blue|green|yellow|orange|purple|pink|gray|slate|zinc|neutral|stone|amber|emerald|teal|cyan|sky|indigo|violet|fuchsia|rose|lime|white|black)-\d+
stroke-(red|blue|green|yellow|orange|purple|pink|gray|slate|zinc|neutral|stone|amber|emerald|teal|cyan|sky|indigo|violet|fuchsia|rose|lime|white|black)-\d+
decoration-(red|blue|green|yellow|orange|purple|pink|gray|slate|zinc|neutral|stone|amber|emerald|teal|cyan|sky|indigo|violet|fuchsia|rose|lime|white|black)-\d+
```

Also scan for:
- Inline hex colors: `#[0-9a-fA-F]{3,8}` in className strings
- Inline `rgb(`, `rgba(`, `hsl(`, `oklch(` in className strings or style props

**Ignore:** Files in `src/styles/`, `globals.css`, `.css` files, and tailwind config. Also ignore `text-white` and `text-black` when used with opacity modifiers on semantic backgrounds (e.g., `bg-primary text-white` is usually fine if `text-primary-foreground` doesn't exist for that context — flag but mark as "review").

**Suggest fix:** Map to the closest semantic token from the color-usage rule.

---

### Pass 2: Component–Hook Separation

**Rule:** Components are pure renderers. All logic lives in co-located hooks.

**Scan `.tsx` component files for direct hook usage:**

These hooks must NOT appear directly in component bodies (they belong in the custom hook):
- `useState`
- `useEffect`
- `useCallback`
- `useMemo`
- `useRouter`
- `useTranslation`
- `useQueryClient`
- `useQuery`
- `useMutation`
- `useForm`
- `useSearchParams`
- `usePathname`

**Check that:**
1. Every component file in `components/` has a matching hook in `hooks/use-{component-name}.ts`
2. No `useState`, `useEffect`, `useCallback`, `useMemo`, `useRouter`, `useTranslation` calls directly in component files
3. Hooks return a typed object (`Use{Name}Return`)

**Skip:** Files in `src/new-app/ui/` (shadcn primitives), pure composition components with zero hook calls (only receiving props), and components that only call their own co-located custom hook.

---

### Pass 3: Import Boundaries

**Rule:** Features must not import from other features unless through `shared/`. `new-app/` must not import from legacy code.

**Scan all `.ts` and `.tsx` files for:**

1. **Cross-feature imports** — A file in `features/X/` importing from `features/Y/`:
   ```
   from '@/new-app/features/(?!X/)
   from '../../../other-feature/  (relative cross-feature)
   ```
   **Exception:** Imports from a sibling sub-feature are OK *only* in page compositor files (`pages/*-page.tsx`). Sub-features must NOT import from each other.

2. **Legacy imports** — Any file in `new-app/` importing from legacy paths:
   ```
   from '@/components/'
   from '@/api/'
   from '@/hooks/'
   ```
   **Exception:** None. `new-app/` must not import from legacy.

3. **DevTool imports** — Imports from `@/new-app/ui/custom/dev-tool-panel` are always OK (exception to cross-feature rules).

**Report:** Each violating import with the file, line, and what it imports.

---

### Pass 4: Centralized Links & Endpoints

**Rule:** No hardcoded URLs or paths. All routes come from `links`, all API endpoints from feature endpoint constants.

**Scan for:**

1. **Hardcoded route strings** in `.ts`/`.tsx` (not in `links/index.ts` or route definition files):
   ```
   router.push('/
   router.replace('/
   href="/
   href={'/
   href={`/
   ```

2. **Hardcoded API paths** in API adapter files:
   ```
   client.get('/
   client.post('/
   client.put('/
   client.patch('/
   client.delete('/
   ```
   These should use endpoint constants defined at the top of the file.

3. **String interpolation for URLs** outside of endpoint builder functions:
   ```
   `/${...}`
   `/api/${...}`
   ```

**Ignore:** Files that ARE the link/endpoint definitions themselves (`links/index.ts`, endpoint const blocks at file top).

---

### Pass 5: React Component Conventions

**Rule:** Arrow functions, named exports, proper props types, forwardRef where needed.

**Scan for:**

1. **Function declarations for components** (should be arrow functions):
   ```
   export function [A-Z]\w+\s*\(
   export default function
   ```

2. **Default exports** (should be named exports):
   ```
   export default
   ```
   **Exception:** `pages/` directory files (Next.js requires default exports there).

3. **Missing `displayName`** on `forwardRef` components

4. **`asChild` with multi-child buttons** (Link + Button pattern):
   ```
   <Button.*asChild>
     <Link
   ```
   Check if the Link has multiple children (icon + text). If so, flag it.

---

### Pass 6: TanStack Query Patterns

**Scan for:**

1. **Inline query keys** (should use key factories):
   ```
   queryKey: \[['"]
   ```

2. **Deprecated `isLoading`** (should be `isPending`):
   ```
   \.isLoading
   ```

3. **Direct `toast.error`** (should use `showError`):
   ```
   toast\.error\(
   toast\.success\(
   ```

4. **Direct `QueryClient` import** in feature code (should use `useQueryClient()`):
   ```
   import.*QueryClient.*from '@tanstack
   ```
   **Exception:** Test files.

5. **Query invalidation inside mutation `onSuccess` in wizard flows** — flag for manual review.

---

### Pass 7: Error Handling

**Scan for:**

1. **try/catch in API adapters** (should use `.catch()` + `handleApiError`):
   ```
   try\s*\{[\s\S]*?client\.(get|post|put|patch|delete)
   ```

2. **Swallowed errors** (empty catch blocks):
   ```
   catch\s*\([^)]*\)\s*\{\s*\}
   ```

3. **Thrown strings** (should throw AppError):
   ```
   throw ['"]
   throw `
   ```

4. **Error message checks instead of code checks**:
   ```
   error\.message\.includes\(
   ```

---

### Pass 8: Form Patterns (if forms exist)

Only run if the target folder contains form components.

**Scan for:**

1. **`register()` usage** (should use `Controller`):
   ```
   \.register\(['"]
   ```

2. **Deprecated `<Form>` / `<FormField>` wrappers**:
   ```
   <Form[ >]
   <FormField
   ```

3. **Missing `defaultValues`** in `useForm`:
   ```
   useForm<[^>]+>\(\{(?![\s\S]*defaultValues)
   ```

4. **Inline error display** (should use `FieldError`):
   ```
   formState\.errors\.\w+.*&&.*<p
   ```

---

## Output Format

After all passes, produce a structured report:

```markdown
# Audit Report: {folder-name}

**Path:** `src/new-app/features/{path}`
**Files scanned:** {count}
**Date:** {date}

## Summary

| Pass | Status | Violations |
|------|--------|------------|
| 1. Color tokens | PASS/FAIL | {count} |
| 2. Hook separation | PASS/FAIL | {count} |
| 3. Import boundaries | PASS/FAIL | {count} |
| 4. Centralized links | PASS/FAIL | {count} |
| 5. Component conventions | PASS/FAIL | {count} |
| 6. TanStack Query | PASS/FAIL | {count} |
| 7. Error handling | PASS/FAIL | {count} |
| 8. Form patterns | PASS/FAIL/SKIP | {count} |

## Violations

### Pass N: {Pass Name} — {PASS|FAIL}

- `file.tsx:42` — {description of violation}
  **Fix:** {suggested fix or "auto-fixed"}

## Auto-Fixes Applied

List any changes made automatically (with user confirmation first).
```

## Behavior

1. **Read first, report second.** Read every file in the target folder before reporting. Don't report based on file names alone.
2. **Ask before fixing.** Present the full report, then ask the user which violations to auto-fix. Never auto-fix without confirmation.
3. **Be precise.** Every violation must include file path and line number. No vague "might have issues" — either it violates or it doesn't.
4. **Skip irrelevant passes.** If Pass 8 (forms) finds no form files, report SKIP, don't force findings.
5. **Respect exceptions.** Each pass lists its exceptions — don't flag valid exceptions as violations.
6. **Use parallel agents.** For large folders, spawn Explore agents for different passes concurrently.
