---
runs: 2
max_turns: 30
timeout_seconds: 600
allowed_tools: [Skill, Agent, Read, Glob, Grep, Write, Edit, Bash]
tags: [outcome]
append_system_prompt: |
  This is an unattended evaluation run: no user is present. Never ask a question. Where a skill would ask or offer a next step, take its documented default, write the artifact the request names, and stop.
---
Ticket ABC-482 (pegado aquí: en esta sesión no hay conector del tracker).

Título: El listado de reservas se queda en blanco para algunos clientes
Descripción: Desde ayer, los clientes con una reserva abierta (sin fecha de salida) ven la pantalla de reservas en blanco. En consola aparece `TypeError: Cannot read properties of null (reading 'slice')` dentro de format-range. La respuesta de `GET /reservations` para ese cliente trae `"endDate": null`.
Esperado: la reserva abierta se muestra con su fecha de inicio y el texto "en curso".

Investígalo y dame el plan con tu confianza. No arregles nada todavía: escribe el diagnóstico completo en `DIAGNOSIS.md` y para ahí.
