---
runs: 2
max_turns: 30
timeout_seconds: 600
allowed_tools: [Skill, Agent, Read, Glob, Grep, Write, Edit, Bash]
tags: [outcome, holdout]
append_system_prompt: |
  This is an unattended evaluation run: no user is present. Never ask a question. Where a skill would ask or offer a next step, take its documented default, write the artifact the request names, and stop.
---
Ponle guardrails a este repo con el perfil estándar, acordes a lo que tiene el proyecto. No toques `.claude/settings.json` ni la configuración del sandbox.
