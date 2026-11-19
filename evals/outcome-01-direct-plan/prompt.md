---
runs: 2
max_turns: 30
timeout_seconds: 600
allowed_tools: [Skill, Agent, Read, Glob, Grep, Write, Edit, Bash]
tags: [outcome]
append_system_prompt: |
  This is an unattended evaluation run: no user is present. Never ask a question. Where a skill would ask or offer a next step, take its documented default, write the artifact the request names, and stop.
---
Quiero exportar a CSV el listado de reservas: endpoint nuevo, hook y botón en la cabecera. No hay pantallas nuevas. El archivo debe llamarse `reservas-YYYY-MM-DD.csv` y no debe incluir reservas canceladas. Hazme el plan directamente, sin PRD, y guárdalo en `src/features/reservations/reservations-export-implementation-plan.md`.
