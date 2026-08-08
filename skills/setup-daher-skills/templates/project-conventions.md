# Project Conventions

<!-- Seeded by /setup-daher-skills. This file belongs to the project — edit freely.
     Skills and agents from the claude-skills plugin read these values at run time. -->

| Key | Value |
|-----|-------|
| Package manager | {pnpm \| npm \| yarn \| bun} |
| Build command | {e.g. pnpm build} |
| Test command | {e.g. pnpm vitest run} |
| Lint command | {e.g. pnpm lint, or "none"} |
| New-code root (`{app}`) | {e.g. src/} |
| Features root | {e.g. src/features/} |
| Base/integration branch | {e.g. main — PRs target this, never assumed} |
| Error surface | {e.g. useNotification().showError() — how user-facing errors are shown} |
| Viewport policy | {e.g. mobile-only inside AppContainer (~350–400px), no sm:/md:/lg: prefixes — or "responsive"} |
| Locales | {e.g. en, es — or "none"} |
| UI kit | {e.g. shadcn/ui + Tailwind v4} |
| Test runner | {e.g. Vitest + React Testing Library + MSW v2} |

## Notes

{Anything project-specific the skills should know: API base URLs come from X, the backend checkout lives at Y, deploy targets, etc. Delete this section if empty.}
