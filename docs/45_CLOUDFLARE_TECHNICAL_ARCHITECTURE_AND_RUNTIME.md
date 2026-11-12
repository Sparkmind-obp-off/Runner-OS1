# 45 — Cloudflare Technical Architecture & Runtime

## Decision
Preserve current Cloudflare Pages/Workers + Hono + TypeScript + D1 + static HTML/CSS/JS. Avoid framework migration without measured evidence.

## Logical components
- Web UI: existing static frontend; task-oriented command center.
- API: Hono routes, authentication middleware and domain services.
- Domain: profiles, activities, plans, events, schedule and progress.
- Agent application: orchestrator, context builder, policy engine, tool registry and verifier.
- Persistence: D1 canonical records; separate tables for runs, steps, approvals, usage and audit.
- Async execution: evaluate Cloudflare Workflows for durable multi-step runs; Queues only if workload requires buffering.
- Coordination: Durable Objects only for strongly coordinated per-user/per-run state or concurrency.
- Storage: R2 only for files that need object storage.
- Providers: AI, auth and payment adapters; optional integrations behind explicit policy gates.

## Suggested logical tables
agent_runs, agent_run_steps, agent_approvals, agent_tool_invocations, agent_memory_items, usage_ledger, tenant_entitlements, audit_events, billing_events, idempotency_keys. Each row requires appropriate owner/tenant scope, timestamps, status and indexes. These are conceptual names, not migration instructions; review current schema/history first.

## Runtime sequence
1. Verify session/JWT server-side.
2. Resolve internal user and tenant membership.
3. Check entitlement and usage budget.
4. Persist run intent and idempotency key.
5. Plan within tool allowlist.
6. Persist step and approval request.
7. Execute approved tool through bounded service.
8. Verify resulting domain state.
9. Record usage and audit.
10. Return status and concise summary.

## Authentication migration
Clerk is designated for Google sign-in only. Strava OAuth is independent and must not pass through Clerk. Preserve internal user IDs and existing records; verify Clerk sessions server-side; link accounts only through verified, non-ambiguous identity; prevent email collision/account takeover; maintain rollback and recovery. Do not disable legacy auth until migration and recovery matrix passes.

## D1 and concurrency
D1 remains canonical. Use transactions/batches carefully, uniqueness constraints and idempotency. Design for at-least-once delivery; do not assume exactly-once execution. Use explicit status transitions and stale-run recovery.

## Provider cost controls
Record provider/model/version, token usage where available, estimated/actual cost, tool cost, retries and tenant. Enforce hard ceilings before execution. Never expose provider credentials to browser or model output.

## Operational decision gates
Before adding Workflows, Durable Objects, Queues, Vectorize, AI Gateway or paid services, document workload, limits, failure mode, cost estimate, migration and rollback. Prefer deterministic D1 retrieval over vector search until value and scale justify embeddings.
