---
runs: 1
max_turns: 4
timeout_seconds: 120
allowed_tools: [Skill]
tags: [routing]
append_system_prompt: |
  This is a routing probe. Load whichever skill you judge correct for the request, then stop and reply with just that skill's name. Do not carry out the work, read files, or ask clarifying questions.
---
La tarjeta ReservationCard se ve plana: el precio, la fecha y el estado pesan todos igual y no se sabe dónde mirar. Mejora la jerarquía visual y el espaciado sin tocar la lógica ni el hook.
