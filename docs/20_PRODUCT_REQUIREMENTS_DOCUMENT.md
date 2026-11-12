# Runner OS — Product Requirements Document

Status: baseline PRD for implementation and release planning.

## Problem
Running information is fragmented across memory, calendar, spreadsheets, fitness platforms, race announcements and chat. Generic AI advice lacks the runner's real schedule and evidence. Runner OS connects personal intent, schedule, activity truth and evidence-aware assistance.

## Jobs to be done
- Understand today's relevant running context and next action.
- Plan sessions around goals, routine, availability and constraints.
- Record a run once and reflect it in progress.
- Evaluate races with verified facts and visible unknowns.
- Ask AI questions grounded in personal records.
- Connect Strava with explicit scope, sync, disconnect and deletion controls.

## Functional requirements

### Identity and ownership
- Registration, login, logout and secure session bootstrap.
- All personal resources are scoped to authenticated owner.
- Owner identity is injected server-side, never accepted from LLM or client payload.
- Authenticated export and account/data deletion process.

### Onboarding and profile
- Progressive setup for display name, running area, days/time, usual distances, goals, event types and preferences.
- Optional questions can be skipped and edited later.
- Profile completeness must not block core usage.

### Home and schedule
- Home shows today's context, next planned activity, recent activity, upcoming event and relevant actions.
- Recurring activity templates are separate from actual occurrences.
- Attendance states: planned, attended, skipped, unknown. Unknown is never silently changed.
- Schedule supports timezone, date ranges and conflict explanation.

### Activities
- Manual activity create/edit and optional metrics: distance, duration, pace, elevation, effort and feeling.
- Explicit source: manual, Strava or future connector.
- Import idempotency by owner, provider and external ID.
- Imported, user-entered and derived values remain distinguishable.

### Events
- Event records and evidence with source URL and freshness.
- Date status verified/unverified.
- Participation intent none/interested/planned/confirmed.
- Never invent date, location, fee, organizer or registration status.

### AI and agents
- Minimum-relevant owner-scoped context.
- Provider credentials server-only.
- AI responses and structured suggestions never silently mutate canonical data.
- Typed tools, bounded budgets, run status, verifier and approval requirements.
- Safe provider failure and honest unavailable state.
- Store concise summaries, evidence and audit metadata; never hidden chain-of-thought.

### Memory
- Structured facts with provenance and proposed/confirmed/rejected/stale lifecycle.
- Inferred memory stays proposed until confirmed.
- User can inspect, correct, reject, export and delete.
- SQL/structured retrieval first; embeddings only after measured benefit.

### Integrations
- Provider connection state is per owner.
- Strava OAuth state, minimal scopes, encrypted tokens and refresh rotation.
- Read-only import, cursor, sync telemetry and webhooks.
- Deauthorization, disconnect and data deletion are supported.

## Non-functional requirements
Security: owner isolation, validation, CSRF-aware state-changing routes, rate limits and least privilege.
Privacy: data minimization, explicit consent, export/deletion and no public data by default.
Reliability: idempotent retries, durable state, honest stale/error states and graceful degradation.
Performance: fast cockpit, paginated history, bounded context and provider timeouts.
Accessibility: keyboard navigation, semantic labels, contrast and responsive layouts.
Maintainability: TypeScript, additive migrations, adapter boundaries and testable domain logic.
Observability: redacted logs, correlation IDs, latency, usage and cost metadata.

## Core journeys
1. First visit → account → onboarding → Home.
2. Add recurring session → weekly schedule → mark outcome.
3. Record manual activity → history → AI reflection.
4. Create event → attach evidence → set intent → preparation checklist.
5. Connect Strava → consent → callback → sync → reconcile activity.
6. Request plan → inspect evidence → approve/edit/reject → track outcome.
7. Review memory → confirm/correct/delete.

## Data truth taxonomy
Every value is observed/imported fact, explicit user fact, confirmed preference, plan/draft, derived calculation, model hypothesis or unknown/unverified.

## Safety
No diagnosis or treatment, no false certainty, no automatic training-load increase from an LLM, no external write without explicit approval, and all imported notes/event text are untrusted data.

## Open decisions
Training methodology, coach review, notifications, multi-user billing, raw payload retention, semantic retrieval and external framework adoption must be resolved by evidence rather than assumptions.
