---
name: linear-ticket
description: Create or improve Linear tickets with proper documentation. Use when the user wants to create a ticket, write a ticket, document a feature for Linear, or improve ticket descriptions.
user_invocable: true
---

# Linear Ticket

Create well-documented Linear tickets with clear context, functional requirements, and acceptance criteria.

## Workflow

1. **Gather info** from the user: what feature/change/bug needs a ticket
2. **Generate** the ticket content using the template below
3. **Ask** the user to review before creating
4. If Linear MCP is available, **create the ticket** directly in Linear

## Template

Generate ONLY English markdown content. No Spanish headers. User will copy directly into Linear or it will be created via MCP.

### Title
- Imperative or descriptive phrase
- Specific about what changes
- Example: "Display only available pricing types in Rental Costs table"

### Body

```markdown
## Context
[Why this feature/change is needed. What business problem it solves. Keep it brief.]

## Expected Behavior
[How the system should work after implementation]
- Scenario 1: [Description]
- Scenario 2: [Description]

## Component Location
[Where in the app this lives — optional, include only if known]

## Functional Requirements

**FR-1:** The system must [requirement]
**FR-2:** The system must [requirement]
**FR-3:** The system must [requirement]

## Acceptance Criteria

- [ ] **AC-1:** When [condition], then [expected result]
- [ ] **AC-2:** When [condition], then [expected result]
- [ ] **AC-3:** When [condition], then [expected result]

## Resources
- **Related Ticket:** [Link if applicable]
- **Related Project:** [Project name]
```

## Rules

- **Include:** Clear context, specific FRs, testable ACs, related links
- **Exclude:** Historical info about ticket creation, "Current Behavior" section, PR links, implementation details, timeline assumptions
- **Language:** Present tense for current state, "must" for requirements, "when/then" for ACs
- Each FR must be testable and actionable
- Each AC must be verifiable with clear conditions
- Omit optional sections (Component Location, Resources) if not applicable
