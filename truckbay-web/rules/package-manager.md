---
description: Always use pnpm for package management in this project
alwaysApply: true
---

# Package Manager: pnpm

This project uses **pnpm** as the package manager. Always use pnpm commands for dependency management.

## Commands

**Install dependencies:**
```bash
pnpm install
```

**Add a new dependency:**
```bash
pnpm add <package-name>
```

**Add a dev dependency:**
```bash
pnpm add -D <package-name>
```

**Remove a dependency:**
```bash
pnpm remove <package-name>
```

**Update dependencies:**
```bash
pnpm update
```

**Run scripts:**
```bash
pnpm dev
pnpm build
pnpm start
```

## ❌ Don't Use

- `npm install` → Use `pnpm install`
- `yarn add` → Use `pnpm add`
- `bun add` → Use `pnpm add`
- `npx` → Use `pnpm dlx` (for executing packages)

## Lockfile

This project uses `pnpm-lock.yaml`. Never commit:
- `package-lock.json` (npm)
- `yarn.lock` (yarn)
- `bun.lockb` (bun)

These files are ignored in `.gitignore`.
