---
runs: 1
max_turns: 4
timeout_seconds: 120
allowed_tools: [Skill]
tags: [routing]
append_system_prompt: |
  This is a routing probe. Load whichever skill you judge correct for the request, then stop and reply with just that skill's name. Do not carry out the work, read files, or ask clarifying questions.
---
Mi PWA en el iPhone: la barra de navegación inferior queda tapada por la barra de inicio, la pantalla es más alta que el viewport cuando sale la barra de Safari y toda la página rebota al hacer scroll.
