---
runs: 1
max_turns: 4
timeout_seconds: 120
allowed_tools: [Skill]
tags: [routing]
append_system_prompt: |
  This is a routing probe. Load whichever skill you judge correct for the request, then stop and reply with just that skill's name. Do not carry out the work, read files, or ask clarifying questions.
---
Los agentes pierden tiempo buscando dónde está cada cosa en este repo. Créame un mapa de features: qué features hay, en qué directorio vive cada una, por qué rutas se entra y qué endpoints usa, y que se mantenga al día.
