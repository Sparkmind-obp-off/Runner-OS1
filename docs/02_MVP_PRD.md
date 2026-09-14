# 02 — MVP PRD

## Goal

Validate the Runner Core execution loop before expanding into a large productivity platform.

## MVP scope

### P0 — Runner Core
- Create/edit/archive Run.
- Run types: Project, Task Stream, Habit, Fitness, Learning, Hobby, Custom.
- Status: planned, active, paused, blocked, completed, archived.
- Priority: low, normal, high, critical.
- Desired outcome.
- Next action.
- Progress percentage or milestone-based progress.
- Optional due date and review date.
- Blocker field.
- Activity/event history.

### P0 — Dashboard
- Active Runs.
- Needs attention.
- Blocked Runs.
- Recently completed.
- Resume/pick-up actions.

### P0 — Execution loop
1. Capture Run.
2. Clarify outcome.
3. Set next action.
4. Start.
5. Update progress.
6. Pause/block/complete.
7. Resume or review.

### P1 — Productivity
- Projects and tasks.
- Daily focus view.
- Simple goals.
- Focus session logging.

### P1 — Activity layer
- Custom activity records.
- Manual fitness/activity entry.
- Activity history.

### P2 — Integrations
- Strava connector as the first concrete external integration.
- Calendar connector.
- GitHub connector.

## MVP exclusions

No complex automation engine, team collaboration, marketplace, billing, social feed, or broad AI agent framework in the initial build.

## Acceptance gate

MVP is acceptable only when a fresh user can complete the full Run lifecycle without needing an external spreadsheet or manual database operation.
