# 49 — Execution Roadmap, Test Strategy & Release Gates

## Roadmap
### Phase A — Baseline and trust
Audit main branch; reconcile docs with source; run tests/typecheck/build/audit/D1 migration checks; confirm export/deletion, rate limits, privacy and terms gaps; retain Strava AI exclusion regression test.

### Phase B — Identity and tenant lifecycle
Implement Clerk Google sign-in only after current integration is verified. Safely link legacy accounts, preserve internal IDs/data, verify sessions server-side, test revocation/recovery/export/deletion. Do not disable legacy auth before migration and rollback pass.

### Phase C — Agentic foundation
Add typed tool registry, run state machine, idempotency and budget; durable execution only after workload/limits evaluation; approval inbox, audit, cancellation and verifier; begin with read-only and draft-only tools.

### Phase D — Core running workflows
Draft weekly plan from user-approved native context; provenance-aware activity analysis; schedule proposals and approval-gated application; weekly progress review and event preparation.

### Phase E — SaaS readiness
Entitlements, usage ledger, quota enforcement and payment webhook reconciliation; support/incident operations, analytics and cost dashboards; closed beta cohort, interviews and retention review.

### Phase F — Controlled launch
Public launch only after gates pass and support capacity exists.

## Test matrix
- Unit: domain invariants, calculations, context selection and tool schema validation.
- Integration: D1 isolation, auth, migrations, workflow transitions and provider adapters.
- Security: IDOR, cross-tenant access, session replay, CSRF, rate limits, quota bypass and secret leakage.
- Agent evaluation: golden prompts, missing data, unsafe medical requests, prompt injection in external content, tool selection, approvals, idempotency, cancellation and budget exhaustion.
- UX: keyboard, screen reader, responsive mobile, slow network and empty/loading/error/partial states.
- Operational: backup/restore, provider outage, stale-run recovery, incident response and billing reconciliation.

## Mandatory acceptance
No cross-tenant data access; every write tool has authorization/idempotency/audit; approval binds exact arguments; no Strava API data in AI context; core activity workflow works without integrations; hard budget cannot be exceeded; retries do not duplicate side effects; export/deletion tested; privacy/terms reviewed; Cloudflare deployment and production smoke tests evidenced.

## Release decision
Use GO, CONDITIONAL GO or NO-GO with evidence links, tested commit SHA, environment, timestamp, owner and unresolved risks. Never declare production-ready based on docs or merge status alone.
