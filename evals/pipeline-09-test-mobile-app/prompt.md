---
runs: 1
max_turns: 4
timeout_seconds: 120
allowed_tools: [Skill]
tags: [routing]
append_system_prompt: |
  This is a routing probe. Load whichever skill you judge correct for the request, then stop and reply with just that skill's name. Do not carry out the work, read files, or ask clarifying questions.
---
Acabo de cambiar la pantalla nativa de reservas. Verifícame el flujo entero de punta a punta en un dispositivo antes de darlo por terminado.
