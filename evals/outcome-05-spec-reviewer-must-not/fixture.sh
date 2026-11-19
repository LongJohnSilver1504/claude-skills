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
cat > "SPEC.md" <<'FIXTURE_EOF'
### D2: Order list (Domain Feature (Extension))

- **Covers**: R3
- **Must not**: Must not: show the empty state while the query is still loading.
- **Acceptance criteria**:
  - Given the query has returned zero orders, the list shows "No orders yet".
  - Given the query has returned orders, the list shows one row per order.
- **Components**: `OrderList` receives `{ orders, isPending }` from `useOrderList`.
- **Files**: `src/features/orders/components/order-list.tsx`
- **Verify**: file compiles
FIXTURE_EOF
mkdir -p "src/features/orders/components"
cat > "src/features/orders/components/order-list.tsx" <<'FIXTURE_EOF'
type Props = { orders?: { id: string; total: number }[]; isPending: boolean }

export const OrderList = ({ orders }: Props) => {
  if (!orders || orders.length === 0) return <p>No orders yet</p>
  return (
    <ul>
      {orders.map((o) => (
        <li key={o.id}>{o.total}</li>
      ))}
    </ul>
  )
}
FIXTURE_EOF
