# 06 — Connector Contract

## Purpose

Connectors translate external provider resources into Runner OS concepts without leaking provider-specific assumptions into Runner Core.

## Connector interface

Each connector should expose conceptually:

- `connect()` — establish provider authorization.
- `disconnect()` — revoke/remove local connection state.
- `health()` — report connection status.
- `list_resources()` — discover available provider resources.
- `import_activity()` — normalize an external activity.
- `sync()` — perform an incremental synchronization according to policy.

## Normalized activity

Provider-specific payloads are converted into:
- provider
- external id
- activity type
- start/end time
- duration
- distance where available
- source metadata
- raw-provider reference where permitted

## Strava first integration

Strava is a P2 connector. Initial scope should prioritize importing completed activities and associating them with Runner OS Runs. OAuth tokens must be server-side and encrypted/secured according to deployment practices.

The connector must handle:
- authorization failure
- token expiration/refresh where supported
- duplicate activities
- deleted/changed external activities
- rate limiting
- partial sync failure

## Sync policy

Synchronization must be idempotent. External IDs are used to prevent duplicate records. A failed sync must not corrupt existing Runner Core state.

## Ownership rule

Provider data is external data. Runner Core owns user execution state. Connector code may propose updates, but destructive or ambiguous changes require explicit policy and safe handling.
