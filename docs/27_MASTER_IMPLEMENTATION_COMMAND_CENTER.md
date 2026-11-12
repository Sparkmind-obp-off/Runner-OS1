# Runner OS — Master Implementation Command Center

Purpose: one command center for product, UX/UI, frontend, backend, database, integrations, agent runtime, QA and release. This document is a blueprint, not evidence of implementation.

## Mission
Upgrade the existing Runner OS into a hyper-personalized, reliable agentic Running OS while preserving Phase 1–5. Deliver a useful end-to-end product, not isolated demos.

## Source-of-truth reading order
1. README.
2. Product vision and North Star (doc 19).
3. PRD (doc 20).
4. MVP/MVW (doc 21).
5. UX/UI (doc 22).
6. Frontend contract (doc 23).
7. Backend/database contract (doc 24).
8. Integrations (doc 25).
9. Cloudflare architecture/ADRs (doc 26).
10. Agentic architecture (doc 17).
11. Phase 6 implementation prompt (doc 18).
12. Execution roadmap and release gates (doc 28).

Then inspect actual source, migrations, tests, environment bindings, deployment configuration and latest commit. Code is authoritative when docs are stale; document and resolve discrepancies.

## Operating behavior
Before every phase: inspect branch and commit, files/tests affected, migration and security risks, cost implications and acceptance criteria.

During every phase: work on a dedicated branch; small reviewable commits; preserve existing routes and behavior; additive schema; typed schemas; owner isolation; idempotency; no secrets in chat or Git; no optional infrastructure by default; no production deploy/migration without explicit approval.

After every phase: run typecheck, tests, build, migration validation and dependency audit; inspect outputs; report files, SHA, counts and failures. Update docs only to match verified code. State blockers honestly.

## Mandatory architecture
TypeScript + Hono + Cloudflare Pages/Workers. D1 canonical DB. Preserve Groq adapter. Workflows for durable execution; Queues for async ingestion. Evaluate Agents SDK without SDK lock-in. R2/KV/DO/Vectorize/Hyperdrive only when justified. No mandatory LangChain, LangGraph, CrewAI or Neon. Strava read-only. User approval before consequential mutation.

## Workstreams
A. Product/MVP: close onboarding-to-week-plan-to-run-log-to-reflection.
B. UX/UI: cockpit, schedule, activity, event, coach, profile, integrations, settings.
C. Frontend: accessible responsive pages and typed API client.
D. Backend: auth, owner-scoped services, validation, rate limits and error contract.
E. Database: additive migrations, provenance, indexes, idempotency and retention.
F. Agents: bounded orchestrator, specialist capabilities, verifier, workflow, approvals and audit.
G. Memory: proposed/confirmed/rejected/stale lifecycle and controls.
H. Integrations: Strava OAuth, tokens, sync, webhooks, AI providers and optional MCP.
I. Operations: environments, secrets, monitoring, cost, backup and release.

## Agent target
One orchestrator routes to typed capabilities: Training & Coach, Schedule, Race & Event Intelligence, Performance Analyst, Recovery & Readiness (non-medical), Personal Memory. Deterministic calculations do not call an LLM. Every run has bounded step/tool/token/time budget, cancellation, idempotency, provenance, verifier and approval. Store concise summaries and audit metadata, never hidden reasoning.

## Definition of done
Implementation exists; relevant tests pass; security and ownership verified; migrations/recovery documented; UI truthful; docs match code; cost and secrets documented; deployment separately verified or marked pending.

## Required final report
Scope/phase; baseline SHA/branch; decisions; changed files; migrations; API/UI; integrations and secret prerequisites; tests actually run; security review; cost/tier; deployment/health evidence; known limitations; next phase and approvals.

## Immediate command
Start with audit, not rewrite. Map existing pages/routes/entities/tests and discrepancies. Implement the highest-value missing slice closing the MVP/MVW journey without destabilizing production. Do not begin by installing every framework or enabling every Cloudflare service.
