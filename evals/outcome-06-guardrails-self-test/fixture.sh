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
| Base/integration branch | develop |
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
cat > "package.json" <<'FIXTURE_EOF'
{
  "name": "fixture-api",
  "private": true,
  "scripts": {
    "build": "tsc -p .",
    "test": "node --test",
    "db:migrate": "sequelize-cli db:migrate",
    "db:migrate:status": "sequelize-cli db:migrate:status",
    "db:seed:all": "sequelize-cli db:seed:all"
  },
  "devDependencies": { "sequelize-cli": "^6.6.2" }
}
FIXTURE_EOF
cat > ".env.example" <<'FIXTURE_EOF'
DATABASE_URL=
PAYMENTS_API_KEY=
FIXTURE_EOF
cat > ".gitignore" <<'FIXTURE_EOF'
.env
.env.*
!.env.example
node_modules
FIXTURE_EOF
mkdir -p "src/database/migrations"
cat > "src/database/migrations/20260101000000-create-orders.js" <<'FIXTURE_EOF'
module.exports = { up: async () => {}, down: async () => {} }
FIXTURE_EOF
mkdir -p "src"
cat > "src/index.js" <<'FIXTURE_EOF'
console.log('api')
FIXTURE_EOF
mkdir -p ".github/workflows"
cat > ".github/workflows/build.yaml" <<'FIXTURE_EOF'
on:
  pull_request:
    branches: [develop, main]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - run: npm test
FIXTURE_EOF
