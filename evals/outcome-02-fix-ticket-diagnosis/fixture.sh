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
cat > "package.json" <<'FIXTURE_EOF'
{ "name": "fixture", "private": true, "type": "module", "scripts": { "test": "node --test" } }
FIXTURE_EOF
mkdir -p "src/features/reservations/domain"
cat > "src/features/reservations/domain/format-range.mjs" <<'FIXTURE_EOF'
/** "2026-03-01 → 2026-03-04" for a reservation. */
export function formatRange(reservation) {
  const start = reservation.startDate.slice(0, 10)
  const end = reservation.endDate.slice(0, 10)
  return `${start} → ${end}`
}
FIXTURE_EOF
mkdir -p "src/features/reservations/domain"
cat > "src/features/reservations/domain/format-range.test.mjs" <<'FIXTURE_EOF'
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { formatRange } from './format-range.mjs'

test('formats a closed reservation', () => {
  assert.equal(formatRange({ startDate: '2026-03-01T10:00:00Z', endDate: '2026-03-04T10:00:00Z' }), '2026-03-01 → 2026-03-04')
})
FIXTURE_EOF
mkdir -p "src/features/reservations/components"
cat > "src/features/reservations/components/reservation-row.mjs" <<'FIXTURE_EOF'
import { formatRange } from '../domain/format-range.mjs'

export const reservationRow = (reservation) => `<li>${reservation.customer}: ${formatRange(reservation)}</li>`
FIXTURE_EOF
mkdir -p "src/features/reservations/api"
cat > "src/features/reservations/api/reservations.api.mjs" <<'FIXTURE_EOF'
export const listReservations = async () => (await fetch('/reservations')).json()
FIXTURE_EOF
git init -q && git add -A && git -c user.name=fixture -c user.email=fixture@example.com commit -q -m "chore: fixture"
