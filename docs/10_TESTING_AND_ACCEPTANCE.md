# 10 — Testing & Acceptance

## Unit tests

Test the Runner Core state machine for every allowed and disallowed transition.

Minimum coverage:
- planned → active
- active → paused
- paused → active
- active → blocked
- blocked → active
- active → completed
- paused → completed
- blocked → completed
- archived behavior
- invalid transitions

## API tests

Verify:
- authentication required
- ownership enforced
- Run creation/update/deletion/archive behavior
- event creation
- validation errors
- idempotent operations where applicable

## UX acceptance

A user should be able to:
1. Create a Run in under a minute.
2. Identify the next action from the Run detail.
3. Start and update a Run without leaving the main workflow.
4. See blocked and paused Runs.
5. Resume a Run and understand what changed.
6. Complete a Run and inspect its history.

## Integration acceptance

Before Strava launch:
- OAuth secrets remain server-side.
- Duplicate external activities do not create duplicate records.
- Token failures are visible and recoverable.
- Partial sync failures do not damage canonical Runner data.

## Security acceptance

- Cross-user access tests fail closed.
- Secrets absent from repository and client bundles.
- Sensitive tokens absent from logs.
- Critical mutations are auditable.

## Release gate

No phase is considered complete because the UI appears functional. The phase is complete only when its acceptance criteria and relevant automated tests pass.
