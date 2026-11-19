---
runs: 1
max_turns: 4
timeout_seconds: 120
allowed_tools: [Skill]
tags: [routing]
append_system_prompt: |
  This is a routing probe. Load whichever skill you judge correct for the request, then stop and reply with just that skill's name. Do not carry out the work, read files, or ask clarifying questions.
---
Mira el ticket ABC-482: al cambiar la fecha de una reserva sale un error 422 y QA dejó una grabación en el ticket. Investígalo y dame la confianza del 1 al 100 que tienes para resolverlo antes de tocar nada.
