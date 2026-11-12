# Runner OS — Execution Roadmap, QA & Release Gates

Roadmap completion requires implementation evidence.

## Phase 0 — Baseline
Audit main/latest commit, source, tests, migrations, Cloudflare bindings and live deployment. Reconcile README/docs with code. Capture test/build/typecheck/security baseline. Map pages, routes and entities.
Gate: verified baseline and prioritized mismatch report.

## Phase 1 — MVP experience
Close onboarding, home cockpit, schedule, manual activity, event and profile workflows. Add empty/error/loading states and responsive UX. Preserve provenance and unknown states.
Gate: full MVW works without AI or Strava.

## Phase 2 — AI hardening
Verify provider adapter, context selection, timeout, failure and safe suggestions. Add usage/cost telemetry.
Gate: useful with configured provider and graceful when unavailable.

## Phase 3 — Agentic Core
Typed tools, one orchestrator, bounded specialist capabilities, Workflow state machine, D1 run/step/approval/audit records, approval inbox, cancel, idempotency and verifier.
Gate: retry/replay cannot duplicate side effects; user can approve/reject.

## Phase 4 — Personal Memory
Proposed/confirmed/rejected/stale lifecycle, provenance, evidence, review, correction, deletion and export. Structured SQL retrieval first.
Gate: inferred memory never silently becomes fact.

## Phase 5 — Strava Live
Verify API app eligibility and callback. Configure secrets in Cloudflare dashboard. Implement OAuth state, encryption, refresh rotation, import, dedupe, webhooks and recovery sync.
Gate: actual owner-consented production test passes. Otherwise status remains unavailable.

## Phase 6 — Proactive intelligence
Opt-in daily/weekly review, schedule conflicts, evidence-backed insights and configurable notifications.
Gate: user can pause/disable; no unsolicited notification.

## Phase 7 — Optimization
Benchmark AI providers/Gateway; Vectorize vs SQL/full-text; LangGraph.js vs Workflows; Neon only for PostgreSQL requirement; MCP per-tool security review.
Gate: measured quality, cost, latency or maintenance benefit.

## Test pyramid
Unit: pace/distance/time calculations, state transitions, validation, normalization, provider parsing, token crypto and memory lifecycle.
Application: owner context, routing/budgets, approval hash, retries, sync cursor, memory review/export/delete.
API: auth, owner isolation, D1 migrations, OAuth, webhook replay, provider timeout/429/5xx, approval and cancellation.
E2E: onboarding, schedule, log run, home/history, event/evidence, AI context, approval, Strava connect/disconnect, mobile/accessibility.

## Mandatory negative tests
- Owner A cannot read/update/delete Owner B data.
- LLM cannot choose owner ID.
- Imported prompt injection cannot override policy.
- Duplicate webhook/import creates no duplicate activity.
- OAuth state replay rejected.
- Refresh race cannot lose rotated token.
- Denied/expired OAuth never shows connected.
- Provider timeout does not corrupt records.
- Approval for changed payload invalid.
- Cancelled workflow cannot continue side effects.
- Missing metric stays null, unknown attendance stays unknown.
- Unverified event date never appears confirmed.
- No secret in logs, browser bundle, plaintext DB or API response.

## Operational readiness
Separate preview/production DB, secrets and callback URLs. Rate limits on auth, AI, OAuth and webhook. Idempotency and dead-letter/replay policy. Redacted logs/correlation IDs. Alerts for failed workflows, stale sync, provider errors and quotas. Backup/restore and deletion runbooks. Credential rotation and incident response. Deployment rollback and migration recovery.

## Release gates
Internal alpha: MVP manual workflows and limited owner access.
Private beta: security/regression pass, AI assistive, integration status honest.
Strava beta: OAuth/read-only import verified with real consent.
Agentic beta: durable runs, approval, audit, cancellation and bounded tools verified.
Public release: privacy/terms, accessibility, reliability, support and cost controls complete.

## Release checklist
- Latest SHA and release tag recorded.
- CI/test outputs saved.
- Typecheck/build/dependency audit pass.
- Production migrations reviewed and backed up.
- Secrets/bindings validated.
- Preview isolated and tested.
- Production health/smoke pass.
- Privacy/terms and retention documented.
- Rollback plan ready.
- User-facing status and limitations accurate.
