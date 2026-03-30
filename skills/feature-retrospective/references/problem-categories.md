# Problem Categories

Every issue falls into one of these root cause categories. Use the code when logging problems in the observation log.

| Code | Category | Description | Example | Fix Target |
|------|----------|-------------|---------|------------|
| `PRD` | PRD Gap | Requirement missing, vague, or wrong in the PRD | "PRD didn't mention border radius" | generate-prd template |
| `CLAR` | Clarifier Miss | prd-clarifier should have caught this but didn't ask | "Nobody asked about mobile vs desktop" | prd-clarifier questions |
| `UX` | UX Spec Gap | prd-to-ux missed a pass or produced incomplete output | "Pass 5 didn't cover error state" | prd-to-ux pass checklist |
| `PROMPT` | Prompt Gap | ux-to-prompt produced a prompt missing key details | "Build prompt didn't include a11y" | ux-to-prompt template |
| `PLAN` | Plan Gap | plan-implementation misclassified or missed a deliverable | "Should have been feature, not infra" | plan-implementation |
| `SCAFFOLD` | Scaffold Gap | create-feature produced wrong structure | "Generated a hook for stateless component" | create-feature |
| `SKILL` | Skill Missing | No skill exists for this type of problem | "No skill for responsive testing" | create new skill |
| `SBUG` | Skill Bug | Skill instructions are wrong or incomplete | "Template doesn't match project conventions" | the broken skill |
| `USER` | User Input | User provided incomplete or ambiguous input | "Requirements changed mid-implementation" | better clarifier questions |
| `EXT` | External | Problem outside the pipeline (dependency, API, etc.) | "Tailwind class doesn't work as expected" | document workaround |
| `PROC` | Process | Pipeline ordering or handoff issue | "Should have done X before Y" | feature-flow |

## How to Use

When logging a problem, include:
1. The category **code** (e.g., `CLAR`)
2. The **severity** (Low / Medium / High / Critical)
3. A brief **root cause** explanation
4. The specific **fix target** (which skill or file to update)

## Severity Guide

| Severity | Meaning |
|----------|---------|
| **Low** | Minor inconvenience, no rework needed |
| **Medium** | Required a correction but didn't block progress |
| **High** | Caused significant rework or confusion |
| **Critical** | Blocked the pipeline or produced fundamentally wrong output |
