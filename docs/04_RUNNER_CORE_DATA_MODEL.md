# 04 — Runner Core Data Model

## Run

Required fields:
- `id`
- `owner_id`
- `title`
- `type`
- `status`
- `priority`
- `outcome`
- `next_action`
- `progress`
- `created_at`
- `updated_at`

Optional fields:
- `description`
- `due_at`
- `review_at`
- `blocker_reason`
- `parent_run_id`
- `external_reference`
- `metadata`

## Run status machine

```text
planned → active → completed
planned → active → paused → active
active → blocked → active
active → paused
paused → completed
blocked → completed
active/paused/blocked → archived
```

Invalid transitions must be rejected by the domain layer.

## Run Event

Each meaningful transition creates an immutable event record:
- event id
- run id
- actor
- event type
- previous state
- new state
- metadata
- timestamp

## Activity Record

Activity records represent concrete work performed against a Run, for example a focus session, run, ride, study session, or manual check-in.

Fields:
- `id`
- `run_id`
- `activity_type`
- `started_at`
- `ended_at`
- `duration`
- `source`
- `external_id`
- `metrics`
- `notes`

## Integration Link

Links a Run or Activity to an external provider without making the provider authoritative over Runner Core.

Fields:
- `provider`
- `external_id`
- `resource_type`
- `run_id` or `activity_id`
- `last_synced_at`
- `sync_status`

## Domain rule

External data may enrich a Run, but Runner OS remains the canonical source for the user's execution state unless an explicit synchronization policy says otherwise.
