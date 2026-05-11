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
| `working-principles.md` | Behavioral guardrails — think before coding, surgical changes, goal-driven execution |
| `verification-before-completion.md` | The Iron Law — no completion claims without fresh verification |
| `project-structure.md` | Feature-based architecture, sub-feature pattern, tech stack reference |
| `accessibility.md` | WCAG 2.1 AA standards, touch targets, contrast, ARIA |
| `centralized-links.md` | Route builders, API endpoint constants, no hardcoded URLs |
| `color-usage.md` | Semantic theme tokens — no raw Tailwind colors |
| `component-hook-separation.md` | Components as pure renderers, hooks own all logic and state |
| `design-system-map.md` | Component selection guide (shadcn/ui + custom components) |
| `error-handling.md` | AppError class, API adapter pattern, tryCatch utility |
| `form-patterns.md` | react-hook-form + Zod + Controller pattern |
| `layout-ownership.md` | Components render flush, parents own inter-component spacing |
| `package-manager.md` | pnpm enforcement |
| `react-components.md` | Arrow functions, named exports, forwardRef conventions |
| `tanstack-query.md` | Query keys, mutation patterns, invalidation rules |
| `testing.md` | Vitest config, polyfills, feature test helpers |
| `zustand-patterns.md` | Avoid store-object in dependency arrays, use selectors |

These are examples, not requirements. Adapt them to your stack and conventions.
