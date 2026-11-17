---
runs: 1
max_turns: 4
timeout_seconds: 120
allowed_tools: [Skill]
tags: [routing]
append_system_prompt: |
  This is a routing probe. Load whichever skill you judge correct for the request, then stop and reply with just that skill's name. Do not carry out the work, read files, or ask clarifying questions.
---
Ponle guardrails a este repo: que el agente no pueda hacer force-push a main ni a develop, que no toque los .env, que pregunte antes de correr migraciones y que no se cuele ningún token en un commit. Que sean acordes a lo que tiene este proyecto.
