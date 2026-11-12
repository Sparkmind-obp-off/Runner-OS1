# Phase 6 — Master Implementation Prompt: Hyper-Personalized Agentic Runner OS

You are the senior staff engineer implementing Phase 6 in the existing repository. Work directly in this repository and preserve the existing production architecture.

## Mission

Evolve Runner OS into a reliable, hyper-personalized, agentic Running OS with bounded multi-agent orchestration, durable execution, user-controlled memory, evidence-backed recommendations and a first-class read-only Strava integration.

Read these first:
1. `README.md`
2. `docs/15_PHASE_5_INTELLIGENCE_CONTRACT.md`
3. `docs/17_AGENTIC_RUNNER_OS_ARCHITECTURE.md`
4. Existing application/domain/HTTP/infrastructure code, all migrations and all tests.

## Non-negotiable constraints

- Preserve TypeScript + Hono + Cloudflare Pages/Workers + D1.
- Do not rewrite Phases 1–5.
- Do not migrate production to Python.
- Do not add LangChain, LangGraph or CrewAI as a dependency in Phase 6A.
- Use Cloudflare Workflows for durable multi-step runs and Queues only where asynchronous decoupling/fan-out is needed.
- Do not add Durable Objects, R2, vector DB, Redis or another database without a demonstrated requirement and an explicit cost/operational review.
- Keep Groq behind the existing AIProvider boundary. Add provider registry only when another provider is configured and tested.
- Never ask the user to paste secrets into chat or commit secrets.
- No fake Strava status, mock live connection, invented activity, event date or fitness metric.
- Strava must be OAuth per Runner OS owner and read-only in this release.
- All AI-generated tool input is untrusted and must be validated.
- No autonomous write, posting, payment, race registration, messaging or Strava write-back.
- No medical diagnosis or treatment.
- Never persist hidden chain-of-thought.

## Execution discipline

1. Audit the actual current branch, latest commit, deployment bindings, package scripts, migrations and tests before changing code.
2. Report the baseline and identify code/documentation mismatches.
3. Create a dedicated branch named `phase-6-agentic-runner-os`; do not push unfinished work directly to `main`.
4. Implement in small independently testable commits.
5. Keep every migration additive and safe for the existing D1 database.
6. Run the complete test suite, typecheck, build, migration checks and npm audit after each meaningful increment.
7. Do not claim commands passed unless they were actually executed and their output inspected.
8. Update README and phase status docs only after implementation evidence exists.
9. Do not deploy production or apply production migrations without explicit owner approval.
10. At each gate, report changed files, commit SHA, test output, blockers and next gate.

## Phase 6A — Agent Core

Implement:
- typed agent/tool registry with Zod schemas;
- read-only and draft-only tools first;
- owner ID injected from authenticated session, never from LLM arguments;
- orchestrator intent classification, plan, specialist routing, synthesis and verifier;
- strict step/depth/token/time/tool-call budgets;
- durable Cloudflare Workflow state machine with queued/planning/running/awaiting_approval/completed/retry_wait/failed/cancelled/expired;
- D1 tables for agent runs, steps, approvals and audit metadata;
- explicit approval inbox and cancel/resume path;
- idempotency keys for every retriable write;
- safe, redacted telemetry and user-visible run summaries;
- specialist capabilities: Training & Coach, Schedule, Race & Event Intelligence, Performance Analyst, Recovery & Readiness;
- regression tests for every existing phase.

Do not create a separate LLM call for trivial deterministic operations. Use specialist functions with typed inputs/outputs and route to a model only where reasoning materially helps.

## Phase 6B — Personal Memory

Implement structured memory facts with proposed/confirmed/rejected/stale states, provenance, evidence references, confidence, timestamps and review policy. Provide user review, correction, export and deletion. Keep inferred memories proposed until confirmation. Exclude sensitive health details by default. Use structured SQL retrieval first; no embeddings unless evaluation proves they are needed.

## Phase 6C — Strava Live

Before coding, verify that the owner has created an eligible Strava API application and that the app's callback domain can be configured. The official developer documentation currently says a Strava subscription is required to create an API application and new apps start in single-player mode.

Implement:
- OAuth state generation and one-time validation;
- minimal `activity:read` scope first; request `activity:read_all` only with explicit user consent and need;
- callback exchange and validation of granted scopes;
- encrypted access/refresh token storage using AES-GCM and a key stored only in Cloudflare Secrets;
- token refresh with atomic refresh-token rotation;
- per-owner athlete identity and connection metadata;
- read-only activity import, incremental sync, webhook processing and rate-limit-aware recovery;
- idempotent deduplication by owner/provider/external activity ID;
- athlete deauthorization and disconnect/revoke handling;
- no upload, edit, delete or write scopes.

If the owner has not supplied/configured Strava app credentials in Cloudflare Secrets, implement and test the OAuth boundary with mocks but leave production status clearly unavailable. Never ask for client secret in chat. Give the owner exact secure Cloudflare dashboard steps.

## Phase 6D — Proactive Intelligence

Only after 6A–6C are verified, add opt-in daily/weekly reviews, schedule conflict detection, evidence-backed training insights and user-configured notifications. Do not add unsolicited notifications or background polling without consent.

## Acceptance criteria

- All existing Phase 1–5 tests pass unchanged or with justified additive updates.
- Agent orchestration survives retries and resumes without duplicate side effects.
- Cross-owner data access is impossible.
- Tool schemas reject invalid and malicious inputs.
- Untrusted Strava/event/profile text cannot override system rules.
- Writes require an explicit approval tied to the exact proposed payload.
- Agent run can be inspected, cancelled and safely retried.
- Memory can be reviewed, corrected and deleted.
- Strava OAuth, refresh rotation, webhook duplicates, revocation and disconnect are tested.
- No secrets appear in source, bundle, D1, response or logs.
- Typecheck, build, tests, migration validation and dependency audit pass.
- Production is not changed without owner approval.

## Final report format

1. Baseline and audit findings
2. Architecture decisions
3. Phase and gate completed
4. Files changed
5. Migration and deployment impact
6. Tests actually executed with exact results
7. Security/privacy review
8. Cost/limit review
9. Commit SHA and branch
10. Remaining blockers and exact owner action required

Never mark a gate complete based only on documentation or mocked tests.
