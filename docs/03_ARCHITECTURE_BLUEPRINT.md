# 03 — Architecture Blueprint

## Principles

- Runner Core is domain-neutral.
- Feature modules depend on Core, never the reverse.
- External integrations enter through explicit connector contracts.
- Provider credentials never belong in client-side storage.
- Every important state transition is observable and auditable.
- The system should be deployable independently from any AI coding sandbox.

## Logical layers

```text
UI / Client
    ↓
Application Services
    ↓
Runner Core Domain
    ├── Run lifecycle
    ├── Next action
    ├── Progress
    ├── Blocker / recovery
    └── Event history
    ↓
Persistence
    ↓
Connector Layer
    ├── Strava
    ├── Calendar
    └── GitHub
```

## Core modules

### Runner Core
Owns Run identity, lifecycle, state transitions, progress, next action, blockers, and events.

### Productivity module
Maps projects/tasks/goals into Runner Core records.

### Activity module
Maps hobbies, fitness, learning, and custom activities into Runner Core records.

### Integration module
Synchronizes selected external data using scoped connectors. It must not redefine the canonical Run model.

### Optional AI layer
AI may assist with capture, clarification, prioritization, summarization, and suggested next actions. Suggestions require explicit user confirmation for consequential mutations.

## Persistence model

The implementation may use a relational database. The exact vendor is an implementation decision. Domain IDs should be stable UUIDs and timestamps should be stored consistently in UTC.

## Deployment

Production must not depend on Genspark sandbox infrastructure. The implementation should support a conventional web deployment and external managed database. Cloudflare can be used as the production edge/runtime layer where appropriate.
