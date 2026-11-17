---
runs: 2
max_turns: 30
timeout_seconds: 600
allowed_tools: [Skill, Agent, Read, Glob, Grep, Write, Edit, Bash]
tags: [outcome, holdout]
append_system_prompt: |
  This is an unattended evaluation run: no user is present. Never ask a question. Where a skill would ask or offer a next step, take its documented default, write the artifact the request names, and stop.
---
Revisa con el agente `quality-reviewer` de este plugin los archivos `src/features/orders/components/order-card.tsx` y `src/features/orders/components/order-badge.tsx` contra la regla `.claude/rules/component-hook-separation.md`. Escribe su informe completo, tal cual lo devuelva, en `REVIEW.md`.
