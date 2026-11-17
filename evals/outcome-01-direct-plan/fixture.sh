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
mkdir -p "docs/backend"
cat > "docs/backend/reservations.md" <<'FIXTURE_EOF'
# Reservations API

- `GET /reservations?status=&from=&to=` — list, JSON.
- `GET /reservations/export?status=&from=&to=` — same filters, returns `text/csv` with columns id, customer, date, status.
FIXTURE_EOF
mkdir -p "src/features/reservations"
cat > "src/features/reservations/index.ts" <<'FIXTURE_EOF'
export * from './hooks/use-reservation-list'
FIXTURE_EOF
mkdir -p "src/features/reservations/api"
cat > "src/features/reservations/api/reservations.api.ts" <<'FIXTURE_EOF'
import { http } from '../../../shared/api/http'

export const reservationsApi = {
  list: (filters: Record<string, string>) => http.get('/reservations', { params: filters }),
}
FIXTURE_EOF
mkdir -p "src/features/reservations/hooks"
cat > "src/features/reservations/hooks/use-reservation-list.ts" <<'FIXTURE_EOF'
import { useState } from 'react'
import { reservationsApi } from '../api/reservations.api'

export const useReservationList = () => {
  const [filters, setFilters] = useState<Record<string, string>>({})
  return { filters, setFilters, load: () => reservationsApi.list(filters) }
}
FIXTURE_EOF
mkdir -p "src/features/reservations/components"
cat > "src/features/reservations/components/reservation-list-header.tsx" <<'FIXTURE_EOF'
export const ReservationListHeader = ({ onNew }: { onNew: () => void }) => (
  <header>
    <h1>Reservas</h1>
    <button onClick={onNew}>Nueva reserva</button>
  </header>
)
FIXTURE_EOF
mkdir -p "src/shared/api"
cat > "src/shared/api/http.ts" <<'FIXTURE_EOF'
export const http = { get: (path: string, _opts?: unknown) => fetch(path) }
FIXTURE_EOF
