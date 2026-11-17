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
cat > ".claude/rules/project-structure.md" <<'FIXTURE_EOF'
# Project Structure

Features live in `src/features/{feature}/` with `api/`, `hooks/`, `components/`, `domain/` and an `index.ts` barrel. Shared code lives in `src/shared/`.
FIXTURE_EOF
mkdir -p "src/shared/api"
cat > "src/shared/api/endpoints.ts" <<'FIXTURE_EOF'
export const endpoints = {
  reservations: '/reservations',
  customers: '/customers',
  invoices: '/invoices',
}
FIXTURE_EOF
mkdir -p "src/features/shared"
cat > "src/features/shared/format-money.ts" <<'FIXTURE_EOF'
export const formatMoney = (cents: number) => (cents / 100).toFixed(2)
FIXTURE_EOF
mkdir -p "src/features/reservations"
cat > "src/features/reservations/index.ts" <<'FIXTURE_EOF'
export * from './hooks/use-reservations'
FIXTURE_EOF
mkdir -p "src/features/reservations/api"
cat > "src/features/reservations/api/reservations.api.ts" <<'FIXTURE_EOF'
import { endpoints } from '../../../shared/api/endpoints'

export const reservationsApi = { list: () => fetch(endpoints.reservations) }
FIXTURE_EOF
mkdir -p "src/features/reservations/hooks"
cat > "src/features/reservations/hooks/use-reservations.ts" <<'FIXTURE_EOF'
import { reservationsApi } from '../api/reservations.api'

export const useReservations = () => ({ load: reservationsApi.list })
FIXTURE_EOF
mkdir -p "src/app/reservations"
cat > "src/app/reservations/page.tsx" <<'FIXTURE_EOF'
import { useReservations } from '../../features/reservations'

export default function Page() {
  useReservations()
  return null
}
FIXTURE_EOF
mkdir -p "src/features/customers"
cat > "src/features/customers/index.ts" <<'FIXTURE_EOF'
export * from './hooks/use-customers'
FIXTURE_EOF
mkdir -p "src/features/customers/api"
cat > "src/features/customers/api/customers.api.ts" <<'FIXTURE_EOF'
import { endpoints } from '../../../shared/api/endpoints'

export const customersApi = { list: () => fetch(endpoints.customers) }
FIXTURE_EOF
mkdir -p "src/features/customers/hooks"
cat > "src/features/customers/hooks/use-customers.ts" <<'FIXTURE_EOF'
import { customersApi } from '../api/customers.api'

export const useCustomers = () => ({ load: customersApi.list })
FIXTURE_EOF
mkdir -p "src/app/customers"
cat > "src/app/customers/page.tsx" <<'FIXTURE_EOF'
import { useCustomers } from '../../features/customers'

export default function Page() {
  useCustomers()
  return null
}
FIXTURE_EOF
mkdir -p "src/features/invoices"
cat > "src/features/invoices/index.ts" <<'FIXTURE_EOF'
export * from './hooks/use-invoices'
FIXTURE_EOF
mkdir -p "src/features/invoices/api"
cat > "src/features/invoices/api/invoices.api.ts" <<'FIXTURE_EOF'
import { endpoints } from '../../../shared/api/endpoints'

export const invoicesApi = { list: () => fetch(endpoints.invoices) }
FIXTURE_EOF
mkdir -p "src/features/invoices/hooks"
cat > "src/features/invoices/hooks/use-invoices.ts" <<'FIXTURE_EOF'
import { invoicesApi } from '../api/invoices.api'

export const useInvoices = () => ({ load: invoicesApi.list })
FIXTURE_EOF
mkdir -p "src/app/invoices"
cat > "src/app/invoices/page.tsx" <<'FIXTURE_EOF'
import { useInvoices } from '../../features/invoices'

export default function Page() {
  useInvoices()
  return null
}
FIXTURE_EOF
