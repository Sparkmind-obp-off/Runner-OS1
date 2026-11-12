# 39 — Agentic Running OS Master Command Center v2

Status: target blueprint; implementation is partial and must be verified against source. Last updated: 2026-11-13.

## Executive decision
Runner OS is a **Personalized Agentic Running OS delivered as multi-tenant SaaS**. Agentic OS describes the product capability; SaaS describes how it is provisioned, operated, secured, and monetized.

Product promise: help each runner understand and manage their own running journey—goals, plans, activity records, schedule, progress, events, and decisions—in one personal workspace, with bounded AI agents that prepare work and execute only authorized actions.

## Non-negotiable principles
1. Personal-first: each member has an isolated workspace and controllable personal context.
2. Data integrity before AI fluency: unknown values stay unknown; every metric has provenance.
3. Agentic, not autonomous-by-default: typed tools, least privilege, budgets, approval gates, idempotency, audit trail and cancellation.
4. Native-first: manual and Runner OS-native activity records work without Strava or wearables.
5. Safety-aware: no diagnosis, injury clearance, emergency triage, or medical certainty.
6. Transparent economics: quotas and paid actions are visible; no hidden credit burn.
7. Progressive value: first useful outcome within the first session, without forcing integrations.
8. Provider-agnostic: model/provider swaps must not change domain logic or data ownership.

## Product layers
- Runner Workspace: Today, Activities, Training Plan, Calendar, Events, Progress, Profile, Memory, Agent Command Center, Settings.
- Agentic Core: orchestrator, specialist agents, tool registry, context builder, verifier, policy engine, approval inbox, durable run manager.
- SaaS Control Plane: identity, tenant boundaries, subscriptions, entitlements, metering, support, abuse controls, audit and operations.
- Data Plane: D1 canonical domain records; optional R2 for user-approved files; external providers isolated behind adapters.

## Command-center loop
User intent → classify task → retrieve minimum permitted context → plan bounded steps → estimate cost/risk → request approval if needed → execute typed tools → verify postconditions → summarize evidence and changes → write audit event → update user-controlled memory only when appropriate.

## Target agents
Profile, Training, Activity, Progress, Schedule, Race/Event, Recovery & Safety, Research, and Orchestrator. These are logical roles, not necessarily separate model calls. Start with deterministic services and a small number of specialist prompts; split into independent agents only when measurable quality or operational value justifies it.

## Existing baseline and constraints
The repository documents Phase 1–5 foundations, native activities, personal profile, recurring schedule, events, AI Q&A, and Strava policy gating. Docs 37–38 define SaaS and UX direction. Do not infer that Clerk, autonomous orchestration, specialist agents, approval inbox, subscription billing, or durable agent runs are implemented merely because this blueprint specifies them. Verify code, migrations, tests, deployment and runtime independently.

Current stack: Cloudflare Pages/Workers, Hono, TypeScript, D1 and static HTML/CSS/JS. Preserve it. Cloudflare Workflows/Durable Objects are options to evaluate, not dependencies to add without a workload-based decision.

## Release gates
- G0: data model and owner isolation verified; export/deletion plan; privacy/terms reviewed.
- G1: auth migration and account linking safe; session verification server-side.
- G2: typed tool registry, authorization, idempotency, budgets, audit, cancellation and approval inbox tested.
- G3: first three core user jobs work end-to-end on native data.
- G4: metering, quota enforcement, billing reconciliation and support runbooks tested.
- G5: closed beta metrics and safety incidents reviewed before public launch.

## Definition of done
Requirements, migration, authorization, API contract, UI states, accessibility, tests, observability, rollback, documentation and production verification. A merged commit is not proof of deployment.

## Execution order
1. Source audit and baseline tests.
2. Authentication and tenant boundary.
3. Native activity/data reliability and user lifecycle.
4. Agent runtime primitives and approval controls.
5. Training and progress workflows.
6. First-session UX and retention loops.
7. Metering and billing.
8. Closed beta and measured iteration.

## Related documents
40 Product thesis; 41 personas and journeys; 42 agent architecture; 43 memory and data model; 44 tools and approvals; 45 technical architecture; 46 security and privacy; 47 packaging and unit economics; 48 research and Actor register; 49 roadmap and quality gates.
