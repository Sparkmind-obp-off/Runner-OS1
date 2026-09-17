# Phase 2 — Productivity Layer Status

Date: 2026-09-17

## Implementation summary

Phase 2 extends the canonical Run model with a deliberately small productivity layer. It adds normalized tags, a three-Run daily focus set, server-side list organization, deterministic due awareness, and a clearer Today decision surface. It does not add independent Project, Task, Goal, Workspace, or Activity execution entities.

## Confirmed scope

- Run tags for lightweight grouping.
- Daily focus date and order, limited to three actionable Runs per owner/date.
- Search plus status, priority, type, and tag filters.
- Priority, due, updated, and title sorting.
- Today sections for focus, overdue, upcoming seven-day work, priority, blocked, resumable, and recent changes.
- Responsive list/detail UX and focus controls.
- Append-oriented `run.focus_updated` history events.

## Architecture and data integrity

- Runner Core lifecycle is unchanged and remains domain-enforced.
- Phase 2 fields are stored on `runs`; no competing execution model was introduced.
- All reads and mutations remain authenticated and owner-scoped.
- Focus mutations use the existing transactional Run + event write.
- Completing or archiving a Run clears stale focus state and records that fact in lifecycle event metadata.
- Due instants remain UTC ISO-8601 values. `null` remains distinct from a due instant.
- Overdue and upcoming calculations exclude completed and archived Runs.

## Migration

`migrations/0002_productivity_layer.sql` adds:

- `runs.tags` as JSON text with an empty-array default;
- `runs.focus_date` as an optional local calendar date key;
- `runs.focus_order` constrained to 1–3 when present;
- owner/due and owner/focus indexes.

The migration is additive and preserves all Phase 1 rows.

## API additions

- `GET /api/runs` accepts validated filter and sort query parameters.
- Run create/update accepts validated tags.
- `PATCH /api/runs/:id/focus` adds or removes the Run from a date's focus set.
- `GET /api/today?date=YYYY-MM-DD` returns the expanded decision surface and server `generatedAt` instant.

Response envelopes and stable error behavior are unchanged.

## Verification

- Existing lifecycle suite remains intact.
- Productivity domain tests cover tags, due/overdue boundaries, terminal exclusion, filtering, and sorting.
- Application tests cover Today focus and UTC horizon behavior.
- API tests cover validation, owner isolation, focus limit, focus history, organization, and terminal overdue exclusion.
- Local D1 migrations `0001` and `0002` apply successfully.

Final verification passed on 2026-09-17: 36/36 automated tests, TypeScript, production build, dependency audit (0 vulnerabilities), local D1 migration, production D1 migration, and Cloudflare Pages smoke tests. Phase 2 is live at https://runner-os.pages.dev.

## Deferred

Focus-session logging, goals, activity records, connectors, AI automation, collaboration, analytics dashboards, and heavyweight project management remain outside Phase 2.

## Recommended next sprint

Run a short real-usage validation of the three-item focus limit, seven-day upcoming horizon, and default sort. Then either harden those defaults based on evidence or implement narrowly scoped focus-session logging attached to a Run as the next productivity increment.
