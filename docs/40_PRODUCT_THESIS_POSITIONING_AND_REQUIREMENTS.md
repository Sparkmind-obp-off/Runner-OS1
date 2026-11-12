# 40 — Product Thesis, Positioning & Requirements

## Category
Personalized Agentic Running OS. Commercial delivery: multi-tenant SaaS.

## Problem hypothesis
Runners often split their journey across tracking apps, spreadsheets, calendars, race pages, coaching plans, chat conversations, and memory. This fragments context and makes the runner repeatedly interpret progress and decide what to do next. This is a hypothesis to validate, not a proven universal pain point.

## Job to be done
“When I want to become a more consistent, capable, or race-ready runner, help me understand my current situation and choose the next safe, realistic action using my own verified context.”

## Initial segments (hypotheses)
- Beginner/returning runner: confidence, simple routine, low-friction logging.
- Consistency-focused recreational runner: schedule coordination and habit visibility.
- Goal/event runner: plan, milestones and race preparation.
- Data-oriented runner: structured history and explainable trends.
- Coach-supported runner: later sharing/review workflows; not an initial launch dependency.

Do not target elite/high-performance medicalized coaching as the first segment.

## Positioning
“Your personal running workspace—with AI agents that help plan, understand, and organize your running journey.”

Avoid claims of guaranteed performance, injury prevention, medical advice, coach replacement, perfect GPS, automatic Strava sync, or autonomous training decisions.

## Differentiators to validate
1. One personal context across goals, schedule, activity, events and plans.
2. Native/manual data useful without an external platform.
3. Indonesian-first onboarding and guidance.
4. Explainable recommendations: evidence, assumptions, confidence and missing data.
5. Agent execution with preview, approval, audit and undo where possible.
6. User-owned memory and clear data controls.

## Core jobs and acceptance
- Set a goal: create/edit/retire a goal with dates and measurable targets; unknown values remain optional.
- Record an activity: manual entry works without integrations; metrics can be null; source and timestamps retained.
- Build a plan: weekly structure, rationale, assumptions and constraints; no fabricated baseline.
- Review progress: compare compatible data and label missing/estimated values.
- Adjust schedule: preview changes, show conflicts, require confirmation before persistent mutation.
- Prepare for an event: date/source confidence visible; unverified dates cannot silently become deadlines.
- Ask for help: authorized context only and source-aware answers.

## Non-functional requirements
Owner/tenant isolation on every read/write; server-side authorization; stable error envelopes and request IDs; idempotency for retryable writes; rate limits and per-tenant budgets; keyboard/accessibility; responsive mobile; export/deletion/retention/consent; provider outages cannot corrupt native records; integrations are never mandatory for core value.

## North-star metric
Weekly Active Runners Completing a Meaningful Running Action (WACMA): unique weekly users completing at least one verified activity record, plan action, schedule action, or progress review. Track components separately.

## Supporting metrics
Activation within 24h; time to first value; first activity completion; plan acceptance; W1/W4 retention; plan adherence; user-corrected AI output rate; approval acceptance/rejection; tool failure rate; cost per active runner; gross margin; support incidents; export/deletion completion.

## Evidence status
Initial competitor scan and small review sample are in Doc 48. Directional only. Market size, willingness to pay, segment priority and retention hypotheses require direct interviews and behavioral experiments.
