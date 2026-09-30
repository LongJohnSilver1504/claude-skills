---
runs: 1
max_turns: 4
timeout_seconds: 120
allowed_tools: [Skill]
tags: [routing]
append_system_prompt: |
  This is a routing probe. Load whichever skill you judge correct for the request, then stop and reply with just that skill's name. Do not carry out the work, read files, or ask clarifying questions.
---
Vamos a empezar la UI de este producto desde cero. Es una herramienta para desarrolladores y no quiero que parezca hecha por una IA. Decide el look antes de que escribamos nada.
