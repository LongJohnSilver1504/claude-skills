# Example Project Convention Rules

These are `.claude/rules/` files from a production React/Next.js/TypeScript project. They complement the skills in this repo by providing project-specific conventions that skills like `/create-feature`, `/execute-tasks`, and `/frontend-testing` reference.

## Usage

Copy the rules relevant to your project into your `.claude/rules/` directory:

```bash
cp rules/component-hook-separation.md .claude/rules/
cp rules/error-handling.md .claude/rules/
```

Then customize them to match your project's conventions.

## What's Included

| File | Scope |
|------|-------|
| `accessibility.md` | WCAG 2.1 AA standards, touch targets, contrast, ARIA |
| `centralized-links.md` | Route builders, API endpoint constants, no hardcoded URLs |
| `component-hook-separation.md` | Components as pure renderers, hooks own all logic and state |
| `design-system-map.md` | Component selection guide (shadcn/ui + custom components) |
| `error-handling.md` | AppError class, API adapter pattern, tryCatch utility |
| `form-patterns.md` | react-hook-form + Zod + Controller pattern |
| `package-manager.md` | pnpm enforcement |
| `project-structure.md` | Feature-based architecture with `src/new-app/` structure |
| `react-components.md` | Arrow functions, named exports, forwardRef conventions |
| `tanstack-query.md` | Query keys, mutation patterns, invalidation rules |

These are examples, not requirements. Adapt them to your stack and conventions.
