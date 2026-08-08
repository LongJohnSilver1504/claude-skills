# PRD — Actualización del repo `claude-skills` v3.0

**Origen:** `informe-mejora-claude-skills.md` + adenda de consejos agénticos de Anthropic (2026-08-08) · **Scope:** repo-wide

---

## 1. Problem Statement

> Un desarrollador que instala `claude-skills` como plugin obtiene skills y agentes que referencian archivos que el plugin nunca instala (`.claude/rules/`), hooks que no existen, rutas que no resuelven y convenciones de un proyecto ajeno (TruckBays) hardcodeadas, porque el repo evolucionó como configuración personal sin procesos de release ni validación — resultando en un plugin que solo funciona de forma fiable en la máquina de su autor.

**Related problems:** las descriptions débiles de 4 skills hacen que Claude no las dispare o dispare la equivocada; los SKILL.md largos (hasta 512 líneas) pagan tokens innecesarios en cada invocación; el mismo loop de review existe implementado dos veces (`audit-branch` y `execute-tasks`).

## 2. Success Criteria

**Demo goal:** en un proyecto React limpio (no TruckBays), ejecutar `/setup-daher-skills`, luego el pipeline completo desde `/brainstorm` hasta `/finish-feature` sobre una feature pequeña, sin que ninguna skill o agente falle por rutas rotas, rules ausentes o convenciones ajenas.

**Acceptance criteria:**

1. `claude plugin validate . --strict` pasa, y un script `validate-skills` propio pasa en CI (frontmatter válido, <500 líneas por SKILL.md, cero referencias cross-skill por ruta, contadores de plugin.json/README/package.json coinciden).
2. Dado un proyecto sin `.claude/rules/`, cuando se ejecuta la nueva skill de setup, entonces las rules seleccionadas y un `docs/agents/project-conventions.md` quedan escritos y todas las skills/agentes los resuelven.
3. Los 4 agentes reviewer declaran `tools:` sin Write/Edit, y los 6 agentes usan un único contrato de output (`Status: PASS | CONCERNS | FAIL` + tags `TRIVIAL`/`ARCHITECTURAL`).
4. Ninguna skill model-invoked tiene una description sin cláusula "Use when" con triggers; las skills solo-manuales llevan `disable-model-invocation: true`.

**Non-goals:** reescribir el pipeline (la cadena DESIGN→PRD→UX→plan→PROGRESS se mantiene); soporte para OpenAI/Codex; crear las skills fantasma `to-issues`/`shadcn-ui` (se eliminan las referencias); evals automatizadas completas; reviewer voting, headless fan-out y agent teams (ver `.out-of-scope/`).

## 3. Target User

**Rol:** desarrollador frontend (React/Next.js) que usa Claude Code a diario y quiere el pipeline de features completo — empezando por el propio Daher, extendiéndose a compañeros de Truckbays y usuarios externos del plugin.
**Skill level:** medio-alto en React; principiante-medio en skills/plugins de Claude Code.
**Key constraint:** no va a leer el código fuente del plugin — si una skill falla en silencio, no sabrá diagnosticarlo. Todo debe funcionar tras el setup o fallar con mensaje claro.

## 4. Core Use Case (Happy Path)

**Start condition:** proyecto React existente, plugin `claude-skills` v3 instalado, sin configuración previa.

1. El usuario ejecuta `/setup-daher-skills`.
2. La skill detecta package manager, estructura, branch base y cómo se muestran errores; presenta hallazgos con recomendaciones (frontier de preguntas independientes por ronda, AskUserQuestion).
3. Escribe `.claude/rules/` (subset elegido) + `docs/agents/project-conventions.md` + allowlist de permisos + bloque `@`-import en CLAUDE.md (+ `.claude/iron-law.json` si opt-in).
4. El usuario ejecuta el pipeline (`/brainstorm` → … → `/execute-tasks`); los agentes leen las rules sembradas; los reviewers corren en paralelo con tools restringidos.
5. `/finish-feature` cierra con PR.

**End condition:** feature mergeable producida sin que el usuario haya tocado configuración a mano ni visto un error de ruta/archivo ausente.

## 5. Functional Requirements

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| R1 | Metadatos del repo consistentes: versión única sincronizada (script con `--check` para CI), CHANGELOG al día, `marketplace.json` presente, frontmatter YAML válido | P0 | ✅ `scripts/sync-version.mjs`, CHANGELOG 3.0.0, marketplace.json |
| R2 | Cero referencias a artefactos inexistentes | P0 | ✅ hooks ahora reales (R11); `/to-issues`, `shadcn-ui`, `tailwindcss-fundamentals-v4` eliminadas |
| R3 | Dependencias entre skills como invocación en prosa, nunca rutas cross-skill | P0 | ✅ + agente `skills:` preload; validador lo vigila |
| R4 | Descriptions conformes a la fórmula por modo de invocación | P0 | ✅ `setup-daher-skills` es la única manual-only; skills invocadas por transiciones deben seguir model-invoked (invariante en CLAUDE.md) |
| R5 | Agentes endurecidos: `tools:` restrictivo, `model` explícito, contrato unificado, `skills:` preload, precondiciones al inicio | P0 | ✅ + A2 anti-sobreingeniería + A3 tope de output ≤120 líneas |
| R6 | Skill `setup-daher-skills` siembra rules + `project-conventions.md`; TruckBays sale de las skills genéricas | P0 | ✅ preámbulo canónico + mensaje estándar "Run `/setup-daher-skills` first — missing `<archivo>`" |
| R7 | Script `validate-skills` en CI | P0 | ✅ `.github/workflows/validate.yml` + `claude plugin validate --strict` |
| R8 | SKILL.md largos a `references/` + `*-FORMAT.md` por artefacto; bloques duplicados con copia canónica | P1 | ✅ PRD/UX-SPEC/PLAN/PROGRESS-FORMAT; frontend-testing 512→391; execute-tasks 431→261 |
| R9 | Loop de review unificado; reviewers en paralelo | P1 | ✅ `audit-branch` es la primitiva; `execute-tasks` delega en su Pipeline Mode |
| R10 | Gates `**Done when:**` (preferir check ejecutable, A6) + CLAUDE.md del repo con invariantes | P1 | ✅ 12 invariantes + release checklist |
| R11 | Reglas de verificación críticas aplicadas por hook determinista, no por instrucción | P0 | ✅ `check-build-before-commit`, `block-raw-palette` (opt-in por rule), `iron-law-stop` (opt-in por config) |
| R12 | El setup siembra también permisos, `@`-import y contexto de compactación | P1 | ✅ allowlist en `.claude/settings.json`, bloque CLAUDE.md con `@docs/agents/project-conventions.md`, instrucción de compactación |

## 6. UX Decisions (DX)

**Entry point:** README primera pantalla + `pipeline-help` recomiendan `/setup-daher-skills` como primera interacción cuando falta `project-conventions.md`.
**Inputs:** respuestas al setup (frontier de preguntas independientes por ronda, recomendación primero); después, los inputs del pipeline actual.
**Outputs:** archivos sembrados (`.claude/rules/*`, `docs/agents/project-conventions.md`, `.claude/settings.json`, bloque CLAUDE.md, opcional `.claude/iron-law.json`).
**States:** setup idempotente — re-ejecutar detecta config existente y ofrece actualizar. `validate-skills` reporta archivo:línea + fix esperado.
**Error handling:** mensaje único estandarizado: "Run `/setup-daher-skills` first — missing `<archivo>`". Nunca continuar con supuestos silenciosos.
**Context boundaries:** `/clear` recomendado entre `plan-implementation` y `execute-tasks`; regla de las dos correcciones fallidas (en `pipeline-help`).

## 7. Data Flow

**Sources:** informe de mejora + adenda (VERIFIED contra ambos repos y docs oficiales el 2026-08-08); repo actual como baseline; plantillas semilla en `setup-daher-skills/templates/`.
**Processing:** setup: detección → confirmación → escritura. Validación: tree del repo → chequeos → exit code + reporte verboso. Refactor: contenido → references/FORMAT → SKILL.md adelgazado.
**Destination:** repo del plugin (v3.0.0) y, en cada proyecto consumidor, los archivos sembrados.

---

## Assumptions

- A1: usuarios en Claude Code ≥2.1.198 (subagentes en background, campo `skills:`).
- A2: `pnpm` sigue como ejemplo/default **porque** el setup detecta y escribe el package manager real en `project-conventions.md` — las skills leen de ahí.
- A3: multi-harness (Codex) fuera de alcance; PRD aparte si cambia.
- A4: mobile-only deja de ser supuesto oculto: valor configurable en el setup (breakpoints permitidos), mobile-only como default documentado.
