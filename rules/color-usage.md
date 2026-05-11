# Color Usage

> **Scope:** All new code in `src/new-app/`. Legacy code in `src/components/` follows existing conventions.

All colors must come from the design token system defined in `src/styles/globals.css`. Never use raw Tailwind color utilities in component code.

## Hard Rules

1. **Never use raw Tailwind color classes** like `text-red-500`, `bg-blue-200`, `border-green-300`, `text-gray-600`, etc. Always use semantic theme tokens instead.
2. **Never use inline hex, rgb, or oklch values** in component code. All color values are defined once in `globals.css`.
3. **Use semantic tokens** that describe purpose, not appearance: `text-destructive` not `text-red-600`, `bg-success` not `bg-green-500`, `text-warning` not `text-amber-500`.
4. **Feature-specific tokens** (e.g., `--bay-card-upcoming`, `--fuel-meter-danger`) are defined in `globals.css` and documented in the feature's UX spec.
5. **New color tokens** must be added to `globals.css` with both light and dark mode values in OKLCH format, then exposed via the `@theme inline` block.

## Token Reference

| Purpose | Token Example | Raw Color Equivalent (DON'T use) |
|---------|---------------|----------------------------------|
| Primary action | `text-primary`, `bg-primary` | `text-blue-600`, `bg-blue-600` |
| Destructive/error | `text-destructive`, `bg-destructive` | `text-red-500`, `bg-red-500` |
| Success state | `text-success`, `bg-success` | `text-green-500`, `bg-green-500` |
| Warning state | `text-warning`, `bg-warning` | `text-amber-500`, `bg-amber-500` |
| Info state | `text-info`, `bg-info` | `text-blue-400`, `bg-blue-400` |
| Muted/secondary text | `text-muted-foreground` | `text-gray-500`, `text-slate-400` |
| Borders | `border-border` | `border-gray-200`, `border-slate-300` |
| Danger state indicator | `text-state-danger`, `bg-state-danger` | `text-red-600`, `bg-red-100` |
| Warning state indicator | `text-state-warning`, `bg-state-warning` | `text-amber-600`, `bg-amber-100` |
| Success state indicator | `text-state-success`, `bg-state-success` | `text-green-600`, `bg-green-100` |

## Where Tokens Live

- **Defined:** `src/styles/globals.css` — CSS custom properties in OKLCH, with light (`:root`) and dark (`.dark`) values
- **Exposed to Tailwind:** `@theme inline` block in `globals.css` maps `--color-*` to `var(--*)` so they become Tailwind utilities
- **Documented per feature:** UX spec files describe which tokens each feature uses

## Examples

```tsx
// ❌ DON'T: Raw Tailwind colors
<Check className="text-green-500" />
<div className="bg-red-100 text-red-800">Error</div>
<span className="text-gray-500">Secondary text</span>
<div className="border-blue-200">Card</div>

// ✅ DO: Semantic theme tokens
<Check className="text-success" />
<div className="bg-destructive/10 text-destructive">Error</div>
<span className="text-muted-foreground">Secondary text</span>
<div className="border-border">Card</div>
```

## If a Token Does Not Exist

Add it to `globals.css` with OKLCH values for both light and dark modes, then expose it in the `@theme inline` block. Follow the naming pattern of existing tokens.

## Related

- [Theme definitions](mdc:src/styles/globals.css)
- [Accessibility — color contrast](mdc:.claude/rules/accessibility.md)
- [Design system component map](mdc:.claude/rules/design-system-map.md)
