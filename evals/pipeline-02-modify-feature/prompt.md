---
runs: 1
max_turns: 4
timeout_seconds: 120
allowed_tools: [Skill]
tags: [routing]
append_system_prompt: |
  This is a routing probe. Load whichever skill you judge correct for the request, then stop and reply with just that skill's name. Do not carry out the work, read files, or ask clarifying questions.
---
El componente ReservationCard se ha ido a 300 líneas. Extrae el estado a un hook y déjalo como renderer puro, sin cambiar comportamiento.
