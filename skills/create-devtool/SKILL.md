---
name: create-devtool
description: Scaffold a dev-only DevTool debug panel (component + hook) for a page or feature. Use when the user says "create a devtool", "debug panel", "inspect store state", or wants to see query status, API payloads, or computed state for a page during development. NOT for production UI (create-feature), fixing bugs (systematic-debugging), or shared app plumbing (create-infrastructure).
---

> **Project config:** `{app}` is the project's new-code root from `.claude/rules/project-structure.md`; project values (package manager, commands, base branch, error surface) come from `docs/agents/project-conventions.md`. Resolve both before writing any file — never assume. If a needed file is missing, stop: "Run `/setup-daher-skills` first — missing `<file>`."
# Create DevTool

Scaffold a DevTool debug panel for a page or wizard flow. The panel surfaces internal state that's invisible from the UI: store values, query statuses, computed payloads, errors, and a full JSON snapshot for copy-paste bug reports.

**Related:** create-feature (feature scaffolding), systematic-debugging (when you're hunting a bug).

## When to Use

- A new page or wizard is being built and needs debug visibility
- A page has complex state (stores, multiple queries, computed payloads) that's hard to inspect from the UI
- The user says "create a devtool for this page"

## Before You Begin

1. **Read the page component** to identify what it renders and which hooks/stores it uses.
2. **Read the page's hook(s)** to find: Zustand stores, TanStack queries, mutations, computed state, and the data flow.
3. **Identify what's useful to surface** (see the Data Selection Guide below).

Do NOT ask the user what to include — analyze the page and decide. The user expects you to know what's debug-useful from reading the code.

## Architecture

DevTools follow the same component-hook separation as the rest of the app, but live in a `devtool/` directory:

### Wizard/Complex Flow (with hook)

```
{feature}/
  devtool/
    components/
      {feature}-devtool.tsx     # Pure renderer
    hooks/
      use-{feature}-devtool.ts  # All data gathering
    index.ts                    # Barrel export
```

### Simple Page (inline, no hook)

When the page has minimal state (1 store, 1-2 queries, no computed payload), skip the hook — read state directly in the component:

```
{feature-or-sub-feature}/
  components/
    {name}-devtool.tsx          # Reads hooks directly, no separate hook file
```

Use the simple pattern when: ≤ 5 store fields, ≤ 2 queries, no payload construction, no coupon/lease/payment resolution logic.

## Data Selection Guide

### Always Include

| Data | Why | Source |
|------|-----|--------|
| **Store state** | Shows what the user has selected/entered at each step | Zustand store selectors |
| **Query statuses** | Shows if data is loading, errored, or stale | `queryClient.getQueryState()` |
| **Errors** | Surface API errors with code + message for instant diagnosis | Filter queries where `status === 'error'` |
| **JSON snapshot** | One-click copy of all state for bug reports | `StateSnapshot` component |

### Include When Present

| Data | When | How |
|------|------|-----|
| **Wizard step info** | Page has a wizard/stepper | Step index, step name, total steps, isExpired |
| **Computed API payload** | Page submits data (create/update) | Mirror the payload construction from the hook, show what would be sent |
| **Pricing/breakdown** | Page shows prices | Raw pricing object from the API query cache |
| **Coupon state** | Page has coupon input | Manual code, resolved ID, processing/invalid flags, store coupons list with quick-apply buttons |
| **Payment resolution** | Page collects payment | Stripe ID, DB ID, resolution path, type (card/bank) |
| **Subscription params** | Page starts a subscription | planId, start, end, totalPrice, seats, enabled flag, test-subscription button |
| **TTL/expiry** | Store has `createdAt` or expiry | Computed time remaining |
| **Completion checklist** | Wizard with required fields | List of steps with StatusDot showing done/pending |

### Never Include

- Translated strings (they're visible in the UI)
- CSS/layout state
- Ref values that change every render
- Full response bodies (use the Snapshot tab for that)

## Tab Structure

### Complex flows (wizard, multi-query) — 3-4 tabs

```
Tabs: [ Wizard | Payload | Queries | Snapshot ]
       [ Visual | Payload | Queries | Snapshot ]  (if no wizard)
```

- **Wizard/Visual** — StoreField rows for store state, StatusDot for flags, section headers for grouping
- **Payload** — The computed request body that would be sent on submit (or "not ready" message)
- **Queries** — StatusDot + status label for each query, errors section at top
- **Snapshot** — `StateSnapshot` component with copy button

### Simple pages — 2 tabs

```
Tabs: [ Visual | Dev Mode ]
```

- **Visual** — StoreField rows organized in sections
- **Dev Mode** — `StateSnapshot` with full JSON

## File Templates

The component (complex flow and simple page), hook and barrel templates are in [references/TEMPLATES.md](references/TEMPLATES.md). Read it once you have chosen the architecture above, before writing any file — the templates carry the tab wiring, the shared primitives' imports and the snapshot shape.

**Done when:** every file from the chosen architecture exists and the project's build command passes with the panel imported at its placement site.

## Placement

Drop `<{Feature}Devtool />` at the bottom of the page component, inside `AppContainer` but after all visible content:

```tsx
export const {Feature}Page = () => {
  // ...
  return (
    <AppContainer>
      {/* ... page content ... */}
      <{Feature}Devtool />
    </AppContainer>
  )
}
```

The `DevToolPanel` wrapper handles:
- `isDevToolEnabled()` check — returns null in production
- Draggable wrench button (fixed position, bottom-right)
- Right-side Sheet with ScrollArea
- Error boundary around children

## Shared Primitives

All from `@/{app}/shared/devtool`:

| Component | Purpose | Usage |
|-----------|---------|-------|
| `StoreField` | Key-value row (label + mono value) | `<StoreField label="fieldName" value={store.field} />` |
| `StatusDot` | Green/red dot | `<StatusDot ok={condition} />` |
| `StateSnapshot` | Formatted JSON + copy button | `<StateSnapshot data={snapshotData} />` |
| `isDevToolEnabled` | Guard (checks env/flag) | Used internally by `DevToolPanel` |

And from `@/{app}/ui/custom/dev-tool-panel`:

| Component | Purpose |
|-----------|---------|
| `DevToolPanel` | Wrench button + Sheet + error boundary |

## Section Styling

Every visual section follows the same pattern:

```tsx
<div>
  <h3 className="text-xs font-semibold uppercase text-muted-foreground pb-2">
    Section Title
  </h3>
  <div className="rounded-lg border p-3">
    <StoreField label="..." value={...} />
    {/* or StatusDot rows, or custom content */}
  </div>
</div>
```

Group sections in a `<div className="flex flex-col gap-4">`.

## Checklist

Before reporting done:

- [ ] DevTool surfaces all store fields relevant to the page
- [ ] Query statuses are tracked for every TanStack query the page uses
- [ ] All query keys in the devtool hook come from the feature's `queries/*.keys.ts` factory (no inline arrays)
- [ ] Errors are filtered and shown prominently (with copy support for complex flows)
- [ ] Snapshot tab includes all state needed for a bug report
- [ ] Component is placed in the page, after all visible content
- [ ] Barrel export exists (`devtool/index.ts` or inline export)
- [ ] The project's build passes (no type errors)
- [ ] Tested: wrench button appears, panel opens, data renders

## Examples in Codebase

Paths are relative to the features root defined in `.claude/rules/project-structure.md`.

| DevTool | Complexity | Pattern | Path |
|---------|-----------|---------|------|
| BookingDevtool | Complex (wizard + coupon + payload + queries) | Hook + Component, 4 tabs | `features/booking/devtool/` |
| ExtendDevtool | Medium (wizard + pricing + subscription) | Inline, 2 tabs | `features/reservations/extend-reservation/components/extend-devtool.tsx` |
| BookingsDevtool | Simple (list page + filters) | Hook + Component, 2 tabs | `features/bookings/devtool/` |
| CancelSubscriptionDevtool | Medium (wizard + store) | Inline, 2 tabs | `features/subscriptions/cancel/components/` |
