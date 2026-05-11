# Layout Ownership

> **Scope:** All new code in `src/new-app/`. Inspired by Alex Kondov's component architecture philosophy: a component should never dictate how it's spaced relative to its siblings.

Components own their **internal** layout. Parent layouts own **external** spacing between children.

## Page Root: AppContainer

**Every page component must wrap its content in `AppContainer`** from `@/new-app/ui/custom/app-container`. AppContainer provides the viewport constraint (full-width on mobile, max-w-sm centered on desktop), full-height scrollability, semantic `<main>` element, and consistent background. Pages own the layout inside AppContainer — sections, spacing, and content structure.

```tsx
// ✅ Every page renders inside AppContainer
import { AppContainer } from '@/new-app/ui/custom/app-container'

<AppContainer>
  <TruckerNavbar />
  <div className="px-4 pt-3">
    <SectionA />
  </div>
  <div className="px-4 pt-6">
    <SectionB />
  </div>
</AppContainer>

// ❌ Page without AppContainer — missing viewport constraints
<div>
  <TruckerNavbar />
  <SectionA />
</div>
```

## Hard Rules

1. **Components render flush.** A component's root element must not include external spacing classes (`mt-*`, `mb-*`, `mx-*`, `my-*`, `pt-*`, `pb-*`, `px-*`) that position it relative to siblings. Internal padding (card content padding, list gaps) is fine.
2. **Parent owns inter-component spacing.** The parent layout controls gaps between children using wrapper divs, `gap-*`, or grid/flex properties.
3. **Skeletons render flush too.** A component's loading skeleton follows the same rule — no external spacing. The parent's layout handles skeleton positioning.
4. **Use wrapper divs when sections need different spacing.** If children require different vertical distances (e.g., `pt-3` for one section, `pt-6` for another), wrap each in a div with its specific padding.
5. **Use uniform `gap-*` when all children have equal spacing.** If all children are evenly spaced, use `flex flex-col gap-X` or `grid gap-X` on the parent — no wrapper divs needed.
6. **No `className` passthrough for spacing.** Components should not accept `className` just to receive external spacing. The parent handles this via its own layout.

## Examples

```tsx
// ✅ DO: Parent owns spacing via wrapper divs (different spacing per section)
<AppContainer>
  <TruckerNavbar />
  <div className="px-4 pt-3">
    <NavigationBadgeSection />
  </div>
  <div className="px-4 pt-6">
    <BayStatusCardStack />
  </div>
</AppContainer>

// ✅ DO: Parent owns spacing via uniform gap
<div className="flex flex-col gap-4 px-4">
  <UserCard />
  <ActivityFeed />
  <StatsPanel />
</div>

// ❌ DON'T: Component owns its external spacing
export const NavigationBadgeSection = () => (
  <div className="px-4 pt-3">  {/* external spacing baked in */}
    <div className="flex flex-wrap gap-2">...</div>
  </div>
)

// ❌ DON'T: Pass className just for spacing
<NavigationBadgeSection className="px-4 pt-3" />
```

## What's OK Inside Components

- Internal padding: `px-4 py-3` on a card's content area
- Internal gaps: `gap-2` between badges, `gap-3` between list items
- Internal layout: `flex`, `grid`, `flex-col` within the component

## Exception

Page-owned layout elements (toolbar divs, nav bars) that are not reusable components can have inline styling — they're part of the page layout, not standalone components.

## Related Rules

- [component-hook-separation.md](mdc:.claude/rules/component-hook-separation.md) — Component architecture
- [react-components.md](mdc:.claude/rules/react-components.md) — Component conventions
