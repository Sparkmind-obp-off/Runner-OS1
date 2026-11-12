# Runner OS — Agentic Running OS as a Service (SaaS) Blueprint

**Status:** Product/architecture target; not a claim of completed implementation  
**Date:** 2026-11-13  
**Applies to:** Runner OS multi-user product, agentic service model, identity and provider integrations  
**Baseline:** Existing TypeScript + Hono + Cloudflare Pages/Workers + D1 application

## 1. Product decision

Runner OS is to evolve into **Agentic Running OS as a Service**: a multi-user SaaS in which each runner receives a personal running workspace and a bounded AI-agent service.

It is more than a running log, dashboard, chatbot, or Strava companion. It combines:
- a personal running data workspace;
- schedule, activity, goal and event management;
- agent-assisted planning, analysis and follow-through;
- user-controlled approvals for changes;
- optional external integrations that remain replaceable and non-essential.

The product is a service operated by Runner OS. Users do not need to install or operate agent infrastructure, bring their own Strava developer app, or configure an AI framework. Runner OS owns the application runtime and provider integrations; each user's data and permissions remain tenant-isolated.

**Positioning:** “Your personal running operating system, powered by bounded AI agents.”

Do not market the product as an autonomous medical coach, guaranteed performance improver, or unrestricted agent that can take external actions without approval.

## 2. Service model and tenant boundaries

### 2.1 Multi-tenant SaaS

- One Runner OS application serves many independent Runner OS accounts.
- Every personal record, agent run, approval, memory item, integration connection and export is scoped to the authenticated Runner OS owner.
- Owner identity is derived from the verified server-side session/token. Never accept an owner ID supplied by the browser or model as authority.
- A user's Strava account, if a permitted integration is eventually enabled, is connected individually to that user's Runner OS account. Never share athlete tokens or activity data across tenants.
- Support/operator access is not a general data-browsing privilege. Any exceptional support access must be purpose-limited, authorized, logged and disclosed.

### 2.2 Service tiers — hypotheses, not published prices

Use capability/usage packaging, not a promise of unlimited AI:
- **Free / Starter:** core profile, manual activity records, basic schedule and bounded basic AI allowance if cost permits.
- **Plus:** larger agent-run allowance, richer planning and history analysis using eligible Runner OS-native data.
- **Pro / Coach Workspace:** advanced multi-step workflows, event preparation and configurable recurring reviews, subject to clear limits and eligibility.
- **Team / Organization:** defer until there is a proven need and a separately designed consent, privacy and tenant model. No cross-user health/activity visibility by default.

Exact names, prices, limits, free allowances and payment provider are undecided. Do not publish pricing or enable paid entitlements until unit economics, provider costs, abuse controls, payment reconciliation, refund and cancellation flows are verified.

### 2.3 Service usage controls

Every plan must have explicit limits for agent runs, model tokens, execution duration, tool calls, file storage and background jobs. Enforce limits server-side. No silent paid model fallback, no unlimited loops and no surprise billing. Show users the allowance and expected consequence before a costly action.

## 3. Agentic service architecture

### 3.1 User experience

The primary journey:
1. User signs in to Runner OS.
2. User completes a progressive profile and chooses goals, constraints and schedule.
3. Runner OS displays a personal cockpit and native activity history.
4. User asks for help or starts a named workflow (weekly plan, race preparation, schedule review, performance summary).
5. Orchestrator selects minimum relevant, eligible data and routes to bounded specialist capabilities.
6. A verifier checks provenance, uncertainty, safety and policy.
7. Runner OS returns an explanation, evidence and proposed next steps.
8. If an application mutation is supported, it is shown as an exact proposal and waits for user approval.
9. The service records outcome and user feedback; it does not silently rewrite canonical facts.

### 3.2 Agent roles

Keep one orchestrator and small specialist capabilities:
- Training & Coach — conservative training suggestions, no diagnosis.
- Schedule — planned sessions, recurring activities and availability.
- Race & Event Intelligence — public event research with source and verification status.
- Performance Analyst — trends from eligible, recorded data; missing metrics stay missing.
- Recovery & Readiness — non-medical guidance and escalation for concerning symptoms.
- Memory — proposes user-reviewable preferences/patterns; never treats inference as confirmed fact.
- Verifier / Policy Gate — checks ownership, data eligibility, tool permissions, uncertainty, budgets and approval requirements.

Specialists are bounded application capabilities, not independent agents with unrestricted credentials. Deterministic operations should use normal code, not an LLM call.

### 3.3 Tool permission levels

- **Read-only:** retrieve the authenticated user's eligible profile, native activities, schedule and events.
- **Draft-only:** draft a plan, checklist, summary or proposed preference change.
- **Approval-gated write:** save or update an explicitly displayed payload after the user approves that exact payload.
- **Prohibited by default:** unrestricted SQL, arbitrary shell/browser, unrestricted URL fetch, external messaging/posting, purchases, race registration, medical decisions and provider write-back.

Persist run state, concise execution summaries, tool metadata, sanitized outputs and approvals. Never persist hidden chain-of-thought.

### 3.4 Runtime

Keep the existing TypeScript/Hono/Cloudflare architecture:
- Pages/Workers + Hono for web/API.
- D1 as canonical structured database.
- Cloudflare Workflows for durable runs, retries, pauses and approval handoffs.
- Queues only for asynchronous decoupling and idempotent consumers.
- Workers Secrets for provider credentials and encryption key material.
- AI provider adapters behind the existing provider interface.
- Agents SDK remains an evaluated option, not a mandatory dependency.
- Add Durable Objects, R2, KV, Vectorize or another database only after a demonstrated requirement and cost/security review.

Do not rewrite the static HTML/CSS/JS frontend or migrate frameworks without measured evidence.

## 4. Authentication and identity — Clerk boundary

**Clerk is required specifically for Google sign-in / Google OAuth identity authentication. Clerk is not the Strava OAuth broker.**

Responsibilities:
- Clerk handles Google identity sign-in and the associated identity/session lifecycle.
- Runner OS backend verifies Clerk-issued sessions/tokens server-side and maps the verified Clerk subject to one internal Runner OS user record.
- D1 remains the canonical store for Runner OS profile, activity, schedule, agent, approval, entitlement and integration metadata.
- Never trust client-supplied user IDs, email addresses or claims that have not been verified server-side.
- Do not put Clerk secret keys in browser code, D1 or logs.
- Do not use Clerk to store or refresh Strava access/refresh tokens.
- Do not route Strava authorization through Google OAuth or Clerk's Google connection.

### Migration from existing authentication

The repository already has a legacy email/password and opaque-session implementation. Do not abruptly remove it or strand existing accounts. Before changing production:
1. Inspect the current Clerk configuration, callback URLs, allowed origins and account-linking behavior.
2. Define a deterministic mapping from verified Clerk subject to internal D1 user.
3. Decide how existing email/password users link or migrate to Google sign-in; require proof of control and prevent account takeover/duplicate identities.
4. Preserve owner IDs and existing records during migration.
5. Test sign-in, sign-out, expired/revoked sessions, account linking, duplicate email, cross-owner access and rollback in preview.
6. Only then deprecate legacy password auth under an explicit migration/release plan.

Do not claim Clerk is integrated merely because an account or environment variable exists. Verify actual code paths and production configuration.

## 5. Strava OAuth — separate provider integration, currently gated

Strava OAuth is a separate provider authorization flow, independent from Clerk:
- Runner OS owns one Strava developer application.
- Each Runner OS user authorizes their own Strava account through Strava's official consent screen.
- The server validates one-time OAuth state, exchanges the authorization code server-to-server, validates scopes and athlete identity, and binds the connection to the authenticated Runner OS owner.
- Store tokens encrypted server-side using authenticated encryption and a key held only in Cloudflare Secrets. Refresh-token rotation must be persisted atomically.
- Disconnect/revocation must stop future sync and remove credentials/cursors according to the approved retention policy.
- Never ask users to create their own Strava developer applications. Never use the developer's athlete token for customer accounts.

**Critical policy gate:** Do not activate multi-user Strava OAuth, import, sync, AI use or customer access merely because credentials exist or an athlete clicks consent. The Strava API Policy effective 2026-06-01 includes restrictions on competing applications and prohibits use of Strava API data in AI application development/operation, including inference/context/RAG/recommendations. Runner OS is an AI-assisted running product, so the exact product/use case requires written confirmation/approval from Strava before live activation. App access tier alone does not resolve this policy question.

Until the gate is cleared:
- Strava stays visibly deferred/unavailable.
- No real API requests, customer token collection or sync.
- No Strava-sourced data in any Runner OS AI/agent context, analytics or model workflow.
- Native/manual Runner OS records remain usable by AI under the applicable user consent and privacy rules.
- Any OAuth code or test harness must remain dormant and unable to activate from credentials alone.

The written approval must cover the exact Runner OS product, multi-user model, requested scopes, data display/retention, AI separation and intended use. Record the approval reference and re-check current policy before launch.

## 6. Data and AI policy

- Native/manual Runner OS data is canonical and remains available if all external integrations are disconnected.
- Distinguish user-provided facts, measured metrics, external source data, model inference and proposed actions.
- Do not invent distance, pace, dates, attendance, event status or physiological metrics.
- Strava API data is excluded from AI/agent context under the current policy decision. This exclusion must occur at data selection, not only in prompts or UI.
- Minimize data sent to providers; keep provider keys server-side; redact logs.
- Do not store full AI transcripts or sensitive health details by default.
- Memory is inspectable, correctable, exportable and deletable; inferred memory remains proposed until user confirmation.
- No diagnosis, treatment or medical risk scoring.

## 7. Reliability, security and operations

Required before public SaaS launch:
- verified authentication and account recovery/linking;
- strict tenant isolation and authorization tests;
- rate limits, bot/abuse controls and agent budgets;
- user data export and deletion;
- privacy notice and terms reviewed for actual data flows;
- audit trail for approvals and mutations;
- idempotent workflow retries and cancellation;
- provider outage handling and graceful manual-mode operation;
- backups and tested restore;
- incident response, support access controls and retention schedule;
- monitoring for latency, error rate, token spend, queue/workflow failures and abuse;
- staging/preview isolation from production data and secrets.

No production migration, public release, paid plan or external provider activation without explicit owner approval and a verified release gate.

## 8. Phased delivery roadmap

### Gate A — SaaS foundation
- Confirm Clerk Google sign-in architecture and safely migrate existing identity.
- Verify multi-user onboarding, tenant isolation, account lifecycle, export/deletion and privacy controls.
- Keep manual/native running workflows fully functional.

### Gate B — Agentic core
- Implement typed tool registry, orchestrator, bounded specialist capabilities and verifier.
- Add durable run state, approval inbox, budgets, audit events, retry/cancel/resume.
- Start read-only and draft-only; introduce writes only behind exact-payload approval.

### Gate C — Service operations and entitlements
- Add server-side quotas, plan entitlements, usage ledger and cost visibility.
- Verify payment lifecycle only after choosing a provider and reviewing unit economics.
- No published prices until approved.

### Gate D — Integrations
- Add provider adapters independently.
- Google sign-in remains Clerk's responsibility.
- Strava remains blocked until written policy clearance; if cleared, implement its OAuth flow separately from Clerk and preserve the no-Strava-data-in-AI boundary.

### Gate E — Proactive service
- Add opt-in scheduled reviews and notifications only after consent, durable execution, cost controls and unsubscribe controls are verified.

## 9. Definition of done

A phase is complete only when:
- code and migrations exist and match the documentation;
- automated tests prove tenant isolation, permission boundaries, idempotency and failure behavior;
- typecheck/build/security/dependency checks are executed and results recorded;
- preview and production configuration are distinguished;
- no feature is described as live based only on a specification or secret name;
- owner has explicitly approved production migration/deployment;
- external policy gates are evidenced, not assumed.

## 10. Explicit non-goals

Runner OS is not:
- dependent on Strava to function;
- a Strava API data proxy, aggregator or MCP re-exposure layer;
- an autonomous medical coach;
- a social network or public leaderboard by default;
- an unrestricted agent platform with arbitrary tools;
- a framework showcase that requires Python, LangGraph or CrewAI without a demonstrated need;
- a product that silently incurs paid AI or infrastructure costs.

## 11. Reference documents

This blueprint is the current product-level clarification for the SaaS and identity boundaries. Read alongside:
- `17_AGENTIC_RUNNER_OS_ARCHITECTURE.md`
- `18_PHASE_6_AGENTIC_IMPLEMENTATION_PROMPT.md`
- `25_INTEGRATIONS_STRAVA_AI_MCP_CONTRACT.md`
- `26_CLOUDFLARE_PLATFORM_ARCHITECTURE_AND_ADR.md`
- `29_STRAVA_OAUTH_MCP_COST_AND_2026_POLICY_DECISION.md`
- `30_FULL_REPOSITORY_AUDIT_AND_REMEDIATION_RECORD.md`

Where earlier documents imply that Strava OAuth can be activated once credentials are configured, this document's policy gate takes precedence. Where earlier docs describe Runner OS as initially single-user/private, this document defines the target multi-tenant SaaS direction while retaining the existing implementation as the migration baseline.
