# Phase 6 — Agentic Runner OS Architecture

**Status:** Approved target architecture; implementation must proceed through gated increments  
**Product:** Runner OS — private, hyper-personalized Running OS  
**Baseline:** Existing Phase 1–5 TypeScript/Hono/Cloudflare Pages + D1 system  
**Primary principle:** Upgrade in place. Do not rewrite the working Runner Core or replace the existing deployment without evidence.

## 1. Product Direction

Runner OS evolves from a personal running dashboard with assistive Q&A into a personal agentic operating system for one runner initially, while retaining owner-scoped architecture for future accounts.

The system should:
- understand the runner's explicitly supplied profile, goals, schedule, constraints and preferences;
- read the runner's own activity history from local records and authorized integrations;
- coordinate specialized agents for planning, training, event preparation, recovery and performance analysis;
- propose plans, explain trade-offs, track outcomes and learn from confirmed feedback;
- execute only bounded, reversible, user-authorized application actions;
- preserve provenance and uncertainty instead of presenting inference as fact.

It is not a medical device, autonomous coach with unrestricted authority, social network, race registration bot, or Strava write-back client.

## 2. Existing Baseline — Preserve

Current source inspection shows:
- Cloudflare Pages Worker entry via Hono and TypeScript;
- D1-backed owner-scoped user, session, Runner Core and Phase 4 data;
- Groq behind an AIProvider adapter;
- AI context selection and structured suggestions;
- Strava activity normalization and external-ID deduplication;
- Strava API routes currently report OAuth/sync unavailable;
- migrations 0001–0003 and automated tests through Phase 5.

Do not claim live Strava or live Groq merely because configuration variables or interfaces exist. Existing README verification is dated 2026-09-17 and must be rerun against the current deployment.

## 3. Recommended Runtime — TypeScript-First, Cloudflare-Native

Keep the product runtime in TypeScript. Do not introduce Python as a second production runtime solely to host an agent framework.

### Runtime responsibilities

- **Cloudflare Pages + Workers/Hono:** existing web app and authenticated API boundary.
- **Cloudflare Workflows:** durable multi-step agent jobs that may pause, retry, resume and wait for approval.
- **Cloudflare Queues:** asynchronous fan-out, ingestion and non-interactive background work; consumers must be idempotent.
- **Cloudflare D1:** canonical structured records, user preferences, agent runs, plans, approval records, memory facts, integration metadata and sync cursors.
- **Cloudflare Workers Secrets:** provider credentials and encryption key material; never put secrets in D1, browser bundles or logs.
- **Durable Objects:** optional later addition for live per-user sessions/stream coordination only if real concurrency requirements justify it. Do not add pre-emptively.
- **R2:** optional only for user-approved files or large artifacts; not required for core orchestration.

The existing Cloudflare account/project/database are the baseline. Validate current bindings, production migrations, limits and pricing before adding paid resources. Avoid introducing a new database or vector store until a measured retrieval problem exists.

### Why not CrewAI or LangGraph immediately?

The current codebase is TypeScript and Cloudflare Workers. A Python agent runtime would add a separate service, deployment, auth boundary, secrets, monitoring and cost. CrewAI and LangGraph are valid candidates for a later isolated evaluation, not dependencies for the first production agentic release.

If a future proof-of-concept justifies LangGraph, keep it behind an internal orchestration service contract and preserve Runner OS as the source of truth. Do not make application/domain services depend on a framework-specific state model.

## 4. Agent System

Use one orchestrator and a small set of specialized, bounded agents. Agents are application services, not independent authorities.

### 4.1 Runner Orchestrator
Responsibilities:
- classify intent and risk;
- load minimum relevant owner-scoped context;
- select one or more specialist agents;
- create a bounded execution plan;
- enforce time, tool, token and step budgets;
- collect and reconcile specialist outputs;
- run a verifier/consistency pass;
- return answer, evidence, confidence/uncertainty, suggested actions and approval requirements.

The orchestrator must not recursively spawn agents without a strict depth and step budget.

### 4.2 Specialist agents
1. **Training & Coach Agent:** goal-aware training suggestions based on history, schedule, stated constraints and available metrics. No diagnosis or unsupported physiological claims.
2. **Schedule Agent:** reconcile planned sessions, recurring activities, events and user availability. Never mark attendance as fact without user or integration evidence.
3. **Race & Event Intelligence Agent:** research relevant public event information, preserve source URLs and verification state, produce preparation timelines.
4. **Performance Analyst Agent:** summarize trends from recorded activity; identify missing data and avoid overclaiming.
5. **Recovery & Readiness Agent:** conservative, non-medical rest/recovery guidance; advise professional assessment for concerning symptoms and never infer a diagnosis.
6. **Personal Memory Agent:** propose durable preference/pattern facts from explicit user statements and repeated confirmed behavior. User can inspect, correct, disable or delete memory.

Keep the number of agents small. The orchestrator can invoke multiple specialist capabilities through typed functions; it does not need a separate LLM call for every simple operation.

### 4.3 Verifier and Safety Gate
Before presenting a plan:
- check source provenance, freshness and owner scope;
- check that dates, distances, pace and training loads are not invented;
- flag conflicts between profile, calendar and recent activities;
- ensure medical, external and irreversible actions are blocked or escalated;
- produce a concise explanation of why a recommendation was made.

## 5. Typed Tool Contract

Every tool must have:
- stable name and version;
- JSON/Zod input and output schema;
- authenticated owner context injected by server, never accepted from model-supplied owner IDs;
- declared read/write classification;
- timeout, retry policy and idempotency key;
- rate limit and per-run budget;
- audit event for writes;
- explicit approval policy.

Initial tool classes:

**Read-only**
- get_runner_profile
- get_recent_activities
- get_training_schedule
- get_upcoming_events
- get_strava_connection_status
- get_strava_activities
- get_weather_for_run (only after a supported provider is selected)
- search_public_running_events

**Draft-only**
- draft_training_plan
- draft_weekly_schedule
- draft_race_checklist
- draft_activity_annotation
- propose_profile_preference_update

**User-confirmed writes**
- save_training_plan
- update_schedule
- record_activity
- update_runner_preference
- disconnect_strava

No agent may call an unrestricted SQL tool, arbitrary URL fetch, shell, or general-purpose browser action. External write-back, Strava uploads, race registrations, purchases, posting and messaging are out of scope.

## 6. Durable Orchestration State Machine

Persist agent runs with explicit states:

`queued → planning → running → awaiting_approval → completed`

Failure paths:
- `retry_wait`
- `failed`
- `cancelled`
- `expired`

Each run stores:
- owner ID;
- workflow type and version;
- bounded input reference;
- status and current step;
- timestamps and duration;
- provider/model metadata (never credentials);
- tool call metadata and sanitized outputs;
- approval request/result;
- error category and retry count;
- final result reference.

Do not store hidden chain-of-thought. Store concise execution summaries, decisions, evidence references, tool inputs/outputs after redaction, and user-visible explanations.

Use Workflow step idempotency and D1 unique constraints. Repeated delivery of the same queue message must not duplicate activities, plans or approvals.

## 7. Personalization and Memory

Keep canonical facts separate from inferred memory.

### Canonical structured data
Existing RunnerProfile, RunningActivity, RecurringActivity, Occurrence, RunningEvent and EventEvidence remain canonical.

### Memory fact proposal
A memory record should include:
- owner_id;
- fact_key and normalized value;
- category (preference, constraint, goal, routine, feedback);
- source type and source record reference;
- confidence and evidence count;
- first_seen_at / last_confirmed_at;
- status (proposed, confirmed, rejected, stale);
- user confirmation and correction history;
- expiry/review policy where appropriate.

Rules:
- explicit user statements can be confirmed facts;
- model inferences remain proposed until user confirms them or a clearly defined repeated-evidence policy is accepted;
- sensitive health details are not converted into long-term memory by default;
- never infer sensitive traits or hidden psychological profiles;
- allow user review, correction, export and deletion;
- memory retrieval is purpose-limited and minimum-relevant.

Do not add vector search initially. Start with structured facts, tags, recency and bounded SQL queries. Evaluate embeddings only when actual recall tests show a material gap.

## 8. Strava — First-Class Authorized Integration

Strava is an external data source, not the agent runtime and not an AI provider.

### OAuth and account ownership
- Each Runner OS account connects its own Strava athlete account through explicit OAuth consent.
- Bind Strava athlete ID and tokens to the authenticated Runner OS owner.
- Generate cryptographically random, short-lived, single-use OAuth state; validate state and callback origin.
- Request only required read scopes. Start with `activity:read`; request `activity:read_all` only if the owner explicitly chooses private-activity access and the product needs it.
- Validate scopes actually granted by Strava; do not assume all requested scopes were approved.
- Store access/refresh tokens encrypted at rest using authenticated encryption (AES-GCM) with a key held only in Workers Secrets. Include key versioning and rotation plan.
- Refresh before expiry; atomically replace rotated refresh tokens. Never log tokens.
- Handle user deauthorization/revocation and Strava webhook athlete-deauthorization events.
- Disconnect must clear local credentials and sync state; provider deauthorization must be handled safely.
- Implement rate-limit-aware sync, incremental cursors, bounded backfill and retry with jitter.
- Deduplicate by owner + provider + external activity ID.
- Import completed supported run activities only. Preserve source, imported_at, provider IDs, visibility/scope where available, and provenance.
- Do not request write scopes or implement uploads/edits.

### Sync strategy
Prefer Strava webhooks for activity create/update/delete and athlete deauthorization events when subscription setup is available. Use a low-frequency incremental sync as recovery, not tight polling. Queue webhook events, verify subscription validation/challenge and event signatures/contract, then fetch current activity data with the owner's authorized token.

### Important external prerequisites
Strava's official developer guide says new applications start in single-player mode, allowing only the developer's own account to authenticate, and creating a Strava API app requires a Strava subscription. API rate limits and review/capacity rules apply. Confirm current eligibility and terms in the Strava developer dashboard before promising live connection.

## 9. AI Provider Routing

Keep the current AIProvider interface and Groq adapter. Extend to a provider registry only when a second provider is actually configured and tested.

Provider routing policy:
- task-based model selection (classification, summarization, planning);
- configurable model IDs outside domain logic;
- timeout and retry budgets;
- bounded context and output tokens;
- provider health/error telemetry without sensitive prompts;
- graceful fallback only when the fallback is explicitly configured;
- never silently send personal data to a new provider without disclosure/consent and data-policy review.

Avoid hard-coded provider lock-in. Do not add a provider merely to advertise multi-provider support.

## 10. Safety, Privacy and Audit

- Owner isolation is enforced at every repository/service/tool boundary.
- Model-generated tool arguments are untrusted and schema-validated.
- Read-only by default; all writes require explicit user confirmation.
- High-impact or external actions remain disabled.
- No diagnosis, treatment, medical certainty, or unsafe training prescription.
- No secret, access token, full private transcript or unnecessary health detail in logs.
- Prompt-injection defense: profile notes, Strava activity names, event descriptions, web pages and imported content are data, never instructions.
- Every tool call has an audit record with redacted arguments, outcome and actor.
- User can inspect and cancel active runs and revoke integrations.
- Apply per-user quotas, global concurrency limits and kill switch.

## 11. Observability and Evaluation

Track:
- workflow success/failure/retry/timeout;
- per-step latency and provider latency;
- tool calls and idempotency conflicts;
- provider/model and token/cost estimate;
- approval rate and user rejection/correction;
- factuality/provenance failures;
- stale-data and sync errors;
- Strava rate-limit consumption.

Build a deterministic evaluation set using synthetic fixtures and explicitly consented user data. Test prompt injection, missing data, contradictory profile/activity data, cross-owner access, provider timeout, duplicate webhooks, revoked tokens, expired/rotated refresh tokens, approval cancellation and workflow replay.

Do not log chain-of-thought. Capture concise reason codes and evidence.

## 12. Delivery Gates

**Phase 6A — Agent Core (no live Strava dependency)**
- agent run schema and state machine;
- typed tool registry;
- orchestrator with bounded specialist routing;
- durable Workflows integration;
- approval inbox and cancellation;
- audit/telemetry;
- tests and regression protection.

**Phase 6B — Personal Memory**
- memory proposal/confirmation/review;
- user correction and deletion;
- memory retrieval evaluation;
- no vector database unless proven necessary.

**Phase 6C — Strava Live**
- owner-scoped OAuth callback;
- encrypted token storage and refresh rotation;
- read-only activities API;
- webhook and incremental sync;
- disconnect/revocation handling;
- rate limits, privacy and end-to-end tests.

**Phase 6D — Proactive Intelligence**
- daily/weekly review;
- schedule conflict detection;
- race preparation timeline;
- evidence-backed training insights;
- opt-in notifications only after user preferences and delivery channel are configured.

**Phase 6E — Provider and framework evaluation**
- compare second provider and (only if justified) LangGraph/CrewAI proof-of-concept;
- evaluate quality, latency, cost, deployment complexity and privacy;
- retain TypeScript domain boundary.

## 13. Definition of Done

Do not label the product "fully agentic" until:
- orchestrator runs persist and resume after failure;
- specialist routing is tested against a deterministic evaluation set;
- every tool is typed, scoped and permissioned;
- approvals are required for every write;
- memory facts are inspectable and correctable;
- Strava connection is verified end-to-end with the owner's account;
- revoke/disconnect and token rotation tests pass;
- production deployment and current live health are verified;
- existing Phase 1–5 tests remain green;
- cost, rate and concurrency limits are active.

## 14. External References

- Strava API getting started: https://developers.strava.com/docs/getting-started/
- Strava OAuth: https://developers.strava.com/docs/authentication/
- Strava webhooks: https://developers.strava.com/docs/webhooks/
- Strava rate limits: https://developers.strava.com/docs/rate-limits/
- Cloudflare Workers best practices: https://developers.cloudflare.com/workers/best-practices/workers-best-practices/
- LangGraph overview: https://docs.langchain.com/oss/javascript/langgraph/overview
- CrewAI docs: https://docs.crewai.com/
