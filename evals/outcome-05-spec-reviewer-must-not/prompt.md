---
runs: 2
max_turns: 30
timeout_seconds: 600
allowed_tools: [Skill, Agent, Read, Glob, Grep, Write, Edit, Bash]
tags: [outcome]
append_system_prompt: |
  This is an unattended evaluation run: no user is present. Never ask a question. Where a skill would ask or offer a next step, take its documented default, write the artifact the request names, and stop.
---
Revisa con el agente `spec-reviewer` de este plugin si `src/features/orders/components/order-list.tsx` cumple la especificación `SPEC.md`. Escribe su informe completo, tal cual lo devuelva, en `REVIEW.md`.
