#!/usr/bin/env bash
set -euo pipefail

mkdir -p "docs/agents"
cat > "docs/agents/project-conventions.md" <<'FIXTURE_EOF'
# Project Conventions

| Key | Value |
|-----|-------|
| Package manager | npm |
| Build command | none |
| Test command | node --test |
| Lint command | none |
| Dev command | none |
| New-code root (`{app}`) | src/ |
| Features root | src/features/ |
| Base/integration branch | main |
| Error surface | useNotification().showError() |
| Viewport policy | responsive |
| Locales | none |
| UI kit | none |
| Test runner | node:test |
| Ticket tracker + id prefix | Linear, `ABC-` |
| Branch format | fix/ABC-123/short-slug |
| Commit format | fix(scope): Sentence (ABC-123) |
| Backend checkout | none |
| Evidence tools | none |
| Investigation notes | ticket comment |
FIXTURE_EOF
mkdir -p ".claude/rules"
cat > ".claude/rules/component-hook-separation.md" <<'FIXTURE_EOF'
# Component / Hook Separation

**Hard rule:** components are pure renderers. A component body contains no `useState`, `useEffect`, `useReducer`, data fetching or derived-state logic — those live in a hook under `hooks/`, and the component receives the result as props or calls exactly one feature hook.

**Exception:** shadcn/ui primitives under `src/ui/` are exempt.
FIXTURE_EOF
mkdir -p "src/features/orders/components"
cat > "src/features/orders/components/order-card.tsx" <<'FIXTURE_EOF'
import { useEffect, useState } from 'react'

export const OrderCard = ({ id }: { id: string }) => {
  const [order, setOrder] = useState<{ total: number } | null>(null)
  useEffect(() => {
    fetch(`/orders/${id}`).then((r) => r.json()).then(setOrder)
  }, [id])
  return <article>{order ? order.total : '…'}</article>
}
FIXTURE_EOF
mkdir -p "src/features/orders/components"
cat > "src/features/orders/components/order-badge.tsx" <<'FIXTURE_EOF'
export const OrderBadge = ({ status }: { status: 'open' | 'paid' }) => (
  <span data-status={status}>{status === 'paid' ? 'Paid' : 'Open'}</span>
)
FIXTURE_EOF
