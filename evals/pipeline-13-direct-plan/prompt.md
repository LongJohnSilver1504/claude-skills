---
runs: 1
max_turns: 4
timeout_seconds: 120
allowed_tools: [Skill]
tags: [routing]
append_system_prompt: |
  This is a routing probe. Load whichever skill you judge correct for the request, then stop and reply with just that skill's name. Do not carry out the work, read files, or ask clarifying questions.
---
Quiero exportar a CSV el listado de reservas que ya existe: endpoint nuevo de exportación, el hook y un botón en la cabecera del listado. Está claro lo que hay que hacer y no hay pantallas nuevas, pero son varias piezas y no lo voy a terminar en una sesión. Hazme el plan directamente, sin PRD.
