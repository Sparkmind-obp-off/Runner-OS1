# Runner OS

Runner OS is a personal execution system for everything a person is actively running: work, projects, habits, fitness, learning, hobbies, and connected activities.

## Core thesis

Runner OS is not primarily a to-do list. Its core abstraction is a **Run**: an active commitment or activity with a desired outcome, current state, next action, progress, blockers, and history.

## Product layers

1. **Runner Core** — the canonical execution model.
2. **Productivity** — projects, tasks, goals, planning, focus.
3. **Life** — habits, routines, personal goals.
4. **Activities & Hobbies** — running, cycling, reading, learning, and custom activities.
5. **Integrations** — external systems such as Strava and calendars.

Integrations enrich Runner OS; they do not define the core product.

## Design principle

**Capture → Clarify → Run → Execute → Track → Recover → Reflect.**

The first implementation should prove that one coherent Runner Core can support multiple domains without becoming a generic database or overloaded productivity suite.

## Status

Foundation / specification phase.

See `docs/` for the product, architecture, security, implementation, and acceptance specifications.
