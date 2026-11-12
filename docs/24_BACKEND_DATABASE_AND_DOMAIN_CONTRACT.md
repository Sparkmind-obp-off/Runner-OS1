# Runner OS — Backend, Domain & Database Contract

Baseline: TypeScript + Hono + Cloudflare Pages/Workers + D1. Existing migrations 0001–0003 and source are canonical. Upgrade in place; additive migrations only.

## Layering
HTTP: Hono routes, auth middleware, schema parsing, response envelope.
Application: use cases, orchestration, integrations and policy.
Domain: entities, state transitions, invariants and pure calculations.
Infrastructure: D1 repositories, provider adapters, Strava client, crypto, Queues and Workflows.
UI has no direct database/provider access. Domain/application should not depend on Cloudflare SDK except through ports.

## Existing canonical entities
users, sessions, runs, run_events, runner_profiles, recurring_activities, recurring_activity_occurrences, running_activities, running_events, event_evidence and integration_accounts.

## Future additive entities
agent_runs, agent_run_steps, agent_approvals, agent_audit_events, runner_memory_facts, encrypted integration token metadata, integration_sync_cursors and minimal webhook idempotency records. Add only when implementation phase needs them.

## Data rules
- Persist UTC ISO timestamps; retain timezone ID for user schedule.
- Distance meters, duration seconds, pace seconds/km, elevation meters.
- Unknown metrics are NULL, never zero.
- Source/provenance required for imported and derived data.
- External IDs stored as strings.
- Minimize raw provider payload retention.
- Every personal table has owner_id and owner-scoped indexes.

## Proposed agent schema
agent_runs: id, owner_id, task_type, status, idempotency_key, input_summary, result_summary, provider/model metadata, budget counters, timestamps and expiry. Unique owner + idempotency key.

agent_run_steps: id, run_id, owner_id, step key, specialist, status, attempt count, input hash, output summary, evidence refs, safe error code and timestamps. No hidden reasoning.

agent_approvals: id, run_id, owner_id, action type, exact payload/hash, pending/approved/rejected/expired/cancelled status, expiry, approval timestamp and idempotency key. Changed payload requires new approval.

runner_memory_facts: id, owner_id, category, structured value, proposed/confirmed/rejected/stale status, source, evidence, confidence label, observed/reviewed/expiry timestamps. Exclude sensitive health facts by default.

## State machines
Agent run: queued → planning → running → awaiting_approval → running → completed. Failure/terminal paths: retry_wait, failed, cancelled, expired.
Approval: pending → approved/rejected/expired/cancelled.
Integration: not_connected → pending_oauth → connected → sync_pending → connected/error/revoked/disconnected.
Transitions are application-validated, not client-controlled.

## Repository/query rules
Every personal query filters owner_id. Never accept owner from LLM tool args. Update/delete use resource ID plus owner ID. Cross-owner access returns consistent not-found. Parameterized SQL only. Bounded pagination and stable ordering. Transactions/batches for related writes.

## Target API contracts
POST /api/agent-runs; GET /api/agent-runs; GET /api/agent-runs/:id; POST /api/agent-runs/:id/cancel; GET /api/approvals; POST /api/approvals/:id/approve; POST /api/approvals/:id/reject; GET /api/memory; POST /api/memory/:id/confirm or reject; DELETE /api/memory/:id.

These are target contracts, not claims that routes exist today.

## Security and retention
Secrets only in Cloudflare secret bindings. Strava tokens encrypted with AES-GCM and key from Worker Secret; unique nonce and versioned envelope. No plaintext token in D1. Redact PII and provider payloads from logs. Define deletion of imported activity, cursor and memory. Export authenticated and rate-limited. Preview/test/production use separate databases and secrets.

## Migration acceptance
Preserve migration history; apply to empty and current schema; existing records unchanged; owner indexes and foreign keys tested; no production migration without owner approval and backup/recovery plan.
