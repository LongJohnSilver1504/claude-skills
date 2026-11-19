---
runs: 1
max_turns: 4
timeout_seconds: 120
allowed_tools: [Skill]
tags: [routing]
append_system_prompt: |
  This is a routing probe. Load whichever skill you judge correct for the request, then stop and reply with just that skill's name. Do not carry out the work, read files, or ask clarifying questions.
---
Añade un prop `compact` al ReservationCard que ya existe para que oculte la fecha cuando venga a true. Son un par de líneas en el componente y un test.
