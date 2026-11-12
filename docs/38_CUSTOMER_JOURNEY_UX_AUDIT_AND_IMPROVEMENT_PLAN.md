# Runner OS — Customer Journey, UX Audit & Improvement Plan

**Date:** 2026-11-13  
**Status:** First UX improvement pass committed to audit branch; browser/device QA and production validation pending  
**Scope:** Public entry, account creation, onboarding, first value, daily use, AI trust, mobile navigation and SaaS activation

## 1. Product journey target

Runner OS should guide a runner through one coherent journey:

1. **Discover:** Understand the outcome in plain language: organize running, build a realistic routine, record progress and receive contextual assistance.
2. **Trust:** Explain that activity data belongs to the user's account, manual logging works without Strava, AI suggestions are reviewable, and integrations are optional.
3. **Join:** Create/sign in to a Runner OS account with a low-friction identity flow. Target identity provider is Clerk for Google sign-in; the current source still uses the legacy email/password API until the Clerk migration is implemented and verified.
4. **Personalize:** Ask only for context needed to produce a useful first experience. Allow skip/unknown and make later editing obvious.
5. **Activate:** Get the user to a first useful action quickly: record a run, set a simple schedule, or ask a grounded question.
6. **Build habit:** Return to a daily cockpit with the next useful action, latest confirmed activity, upcoming routine and clear empty states.
7. **Use agentic help:** Ask a specialist capability for a plan, schedule review or preparation. Show context and limitations; suggestions remain drafts until explicitly approved.
8. **Retain and control:** Let users review profile, connections, memory, usage, privacy, export and deletion controls as those capabilities are implemented.

## 2. Source audit findings

The inspected static HTML/CSS/JavaScript UI and API source showed:

- The public welcome screen described the product generically and did not communicate a clear user outcome or first action.
- Onboarding placed too many profile questions into one step, mixed essential setup with optional community/integration information, and had dot indicators rather than a meaningful progress indicator.
- The onboarding integration step explained Strava and AI but did not help the user reach a first value moment.
- The main personal cockpit had useful data panels but the most prominent card did not provide a direct next action.
- Navigation and several legacy Runner Core screens still contain English labels while the main personal running experience is Indonesian.
- The current source still implements email/password authentication. Clerk Google sign-in is a target decision, not a live implementation.
- The AI surface is currently a question-and-answer page; the multi-agent orchestrator, approval inbox and durable agent runs described in target architecture are not implemented.
- The mobile layout uses a horizontally scrolling navigation row. It needs device testing for reachability, overflow and keyboard/screen-reader behavior.

These findings are based on repository source inspection, not user interviews, analytics or real-device observation. Do not treat them as measured user complaints.

## 3. UX changes in this pass

The audit branch contains the following first-pass improvements:

- Rewrote the welcome copy around user outcomes rather than feature inventory.
- Added three concise value cues: activity recording, realistic routines and contextual AI assistance.
- Added an explicit privacy/integration reassurance: manual activity recording remains available without Strava.
- Reorganized onboarding into smaller progressive steps: identity/area, goals, realistic schedule, then an optional first routine.
- Moved communities and running-with-others preference into the schedule step rather than overloading the goals step.
- Removed the separate integration explainer step from the onboarding critical path.
- Added an accessible progress bar with progressbar role, aria-valuenow, minimum and maximum values.
- Kept skip/back paths and added a saving state with error recovery on final submission.
- Added a compact setup summary before saving the initial profile.
- Added direct cockpit actions to record activity and manage schedule.
- Updated primary navigation labels to Indonesian.
- Added supporting welcome/onboarding visual styles and clearer contrast for hero actions.

## 4. Remaining customer-journey gaps

These are follow-up implementation gates, not completed features:

### P0 — Identity and account lifecycle
- Implement Clerk Google sign-in on the server-verified session boundary.
- Map Clerk subject to the existing internal user ID without changing owner IDs.
- Design safe migration/linking for existing email/password users.
- Add account recovery, duplicate-identity protection, logout/revocation handling, export and deletion.
- Verify preview and production callback URLs and secret configuration without exposing credentials.

### P0 — Activation and trust
- Define one measurable activation event (recommended: first saved activity OR first saved recurring schedule).
- Add a post-onboarding "choose your first step" panel based on what is missing, not a forced product tour.
- Improve empty states on activities, schedule and events with a single clear next action.
- Explain exactly what the AI can read, what it cannot read, and which actions it cannot perform.
- Keep Strava deferred until written policy clearance for this exact multi-user AI-assisted SaaS use case.

### P1 — Agentic service UX
- Replace the generic "Tanya AI" framing with task-oriented entry points: review my week, draft a training plan, prepare for an event, or understand my activity history.
- Display the data period and eligible sources used for an answer.
- Show run states (queued/running/waiting for approval/completed/failed), cancellation and retry.
- Present proposed changes as exact payloads with approve/reject controls; no hidden writes.
- Show model/provider usage and plan allowance before potentially costly work.
- Keep manual mode fully usable during AI/provider outages.

### P1 — Navigation and accessibility
- Test 360px, 390px, 768px, 1024px and desktop widths.
- Verify touch targets, keyboard focus, focus return from modals, labels, error association, reduced motion and contrast.
- Revisit mobile navigation after real-device testing; consider a bottom navigation pattern only if usability tests show it is better than the current horizontal navigation.
- Finish Indonesian localization across legacy Runner Core labels, dialogs, dates and error messages.

### P2 — Retention and service lifecycle
- Add opt-in weekly review, reminders and progress summaries only after consent, notification preferences and budget controls exist.
- Add user-visible usage ledger, limits and plan entitlements before introducing paid packages.
- Do not add fabricated streaks, social pressure or default public sharing.

## 5. Success metrics to instrument

Measure only after privacy notice, consent and analytics design are approved:

- Welcome → account creation conversion.
- Account creation → onboarding completion.
- Time to first activation event.
- First saved activity / first recurring schedule.
- First AI task started and successfully completed.
- Week-1 and week-4 retention by activation cohort.
- Onboarding step drop-off and validation errors.
- Support requests per activated user.
- AI cost per active user and per completed workflow.
- Agent approval acceptance/rejection and undo/error rates.

Avoid collecting sensitive free-text or detailed health data for product analytics. Use aggregated event counts and retention windows with documented purposes.

## 6. Research references

- ProductLed, SaaS onboarding best practices for 2026: outcome-oriented messaging, progress indicators, helpful empty states, first-value actions and onboarding metrics.  
  https://productled.com/blog/5-best-practices-for-better-saas-user-onboarding
- Digia, Progressive Disclosure Using In-App UI: reveal complexity in context and avoid front-loading every feature.  
  https://www.digia.tech/post/progressive-disclosure-mobile-ux
- UX Design Institute, How to design experiences for AI agents: clarity, consistency, user control, transparency, feedback, trust and accessibility.  
  https://www.uxdesigninstitute.com/blog/design-experiences-for-ai-agents

These are design references, not proof of outcomes for Runner OS. Validate the proposed changes with actual runners and usability testing.

## 7. Release and verification status

- UI copy/onboarding/CSS changes are committed on audit/runner-os-2026-hardening.
- No local browser, mobile device or automated test execution was available through the GitHub-only editing workflow.
- No claim is made that Clerk is live, agentic orchestration is shipped, or Strava OAuth is active.
- Do not treat the UX pass as public-launch approval. Run the full tests, typecheck, build, dependency audit, D1 migration checks, cross-owner tests and real-device/browser QA before release.
