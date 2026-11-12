# Runner OS — MVP / MVW Scope & Acceptance

MVP means Minimum Viable Product. MVW means Minimum Valuable Workflow. Ship the smallest end-to-end workflow that creates value and earns trust.

## MVP outcome
A runner can onboard, maintain profile and routine, record activities, track an event, understand today's next action and ask AI a question grounded in personal records. The product remains useful without Strava and when AI is unavailable.

## P0 — Required MVP
- Account registration/login/logout and secure sessions.
- Owner-scoped profile and progressive onboarding.
- Home cockpit with next action and useful empty states.
- Recurring activities and occurrence tracking.
- Manual activity CRUD with optional metrics.
- Events with provenance and verified/unverified status.
- Activity history and basic summaries.
- AI Q&A behind server-side adapter, minimum context and honest unavailable state.
- Responsive Indonesian-first UI.
- Privacy/security baseline, migrations, tests and export path.

## P1 — Valuable follow-on
- Strava OAuth and read-only sync.
- Personal memory review and confirmation.
- Agentic planning and event preparation.
- Approval inbox.
- Weekly reflection and trend summaries.

## P2 — Later
- Opt-in proactive coaching.
- Vector semantic search.
- Multi-provider dynamic routing and evaluation.
- LangGraph or CrewAI evaluation.
- Additional wearables.
- Social features and coach collaboration.

## Explicitly out of MVP
No medical diagnosis, automatic training-plan mutation, Strava write-back, race registration, payments, external messaging, public social feed, mandatory Neon, Vectorize, LangChain, LangGraph or CrewAI, always-on unbounded agent, or paid fallback that can silently increase spend.

## Minimum Valuable Workflow
1. Runner provides goal, routine and constraints.
2. Runner creates a recurring activity or planned session.
3. Runner records a completed run manually.
4. Home reflects actual history and next planned session.
5. Runner asks what the next training step should be.
6. AI receives relevant profile, schedule and activity context.
7. AI returns a labeled suggestion with evidence and unknowns.
8. Runner accepts, edits or rejects it explicitly.
9. Later review compares intended and actual outcome.

This is more valuable than six independent agents without an end-to-end result.

## Release acceptance
Product:
- New runner completes onboarding with optional skips.
- Home explains next action and why.
- Planned is never shown as completed.
- Manual run accepts partial metrics.
- Unverified event date is visibly unverified.
- AI distinguishes fact, suggestion and unknown.
- Product remains useful with AI disabled.

Security/data:
- Owner comes from authenticated session on every personal endpoint.
- Cross-owner reads/updates/deletes fail closed.
- Secrets never appear in browser bundle, D1, logs or API responses.
- Invalid/oversized payloads rejected.
- Session and CSRF behavior tested.
- Integration disconnect and data consequences are clear.

Quality:
- Unit, application, API and migration tests pass.
- Typecheck and production build pass.
- Keyboard/mobile smoke tests pass.
- Empty/error/loading states tested.
- Backup/restore and migration recovery documented.
- Production health and smoke tests run against actual deployment.

## MVP versus agentic release
MVP may include assistive Q&A. Agentic release separately requires typed tools, bounded orchestration, durable execution, run state, approval inbox, cancellation, audit, verifier and regression tests.

## Truthful status language
“Strava connector foundation” means normalization/deduplication only. “Strava connected” requires real OAuth consent and verified sync. “Agentic workflow available” requires durable orchestration and approval gates. Documented or mocked functionality is never called live.
