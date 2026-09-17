# Runner OS — Phase 4 Data & Architecture Contract

**Status:** Implementation contract
**Applies to:** Phase 4 Hyper-Personalized Runner OS
**Depends on:** `03_ARCHITECTURE_BLUEPRINT.md`, `04_RUNNER_CORE_DATA_MODEL.md`, `06_CONNECTOR_CONTRACT.md`, `07_SECURITY_AND_OWNERSHIP.md`, `12_PHASE_4_HYPER_PERSONALIZED_RUNNER_OS_MASTER_SYSTEM_PROMPT.md`, `12A_PHASE_4_PERSONALIZATION_ADDENDUM_MJB_AND_GROQ.md`, `12B_SKYBRIDGE_EVENT_CLARIFICATION.md`

## 0. Purpose

This document is the final data and architecture contract for Phase 4 implementation.

Its job is to remove ambiguity before coding. It does not authorize a redesign of Runner Core or Phase 3 foundations.

The implementation must prefer the smallest coherent model that can support the intended hyper-personalized runner experience.

Runner OS remains a private, owner-scoped Personal Running Operating System. The system must become more personally useful through confirmed data, actual activity history, recurring routines, event intelligence, authorized integrations, and controlled AI context.

---

## 1. Architectural Invariants

The following rules are mandatory:

1. Runner Core remains domain-neutral and canonical for execution state.
2. Phase 2 productivity behavior remains intact.
3. Phase 3 authentication/session behavior remains intact.
4. Phase 4 feature modules depend on Core; Core must not depend on Strava, Groq, Instagram, MJW, or any other provider/community.
5. External data enters through explicit connector/source boundaries.
6. All user-owned Phase 4 records are owner-scoped server-side.
7. Provider credentials and tokens are server-side only.
8. Domain IDs are stable UUIDs or the repository's existing equivalent; do not introduce a second ID convention.
9. Timestamps are stored consistently in UTC; UI converts to the runner's intended local context.
10. Important state changes remain auditable where the existing architecture supports events/audit records.
11. External providers never silently become authoritative over Runner OS canonical state.
12. Production must not depend on a Genspark sandbox.
13. No speculative table or abstraction should be added only because a future feature might need it.
14. Existing data and migrations must remain backward-compatible unless a documented migration is required.

The existing architecture explicitly separates UI, application services, Runner Core, persistence, and connector boundaries. Phase 4 must preserve that separation. fileciteturn29file0

---

## 2. Phase 4 Domain Boundaries

Phase 4 introduces or formalizes these concepts:

| Concept | Meaning | Ownership |
|---|---|---|
| `Run` | Work/execution toward an outcome | Runner Core |
| `Running Activity` | Actual completed/recorded physical running session | Activity module |
| `Event` | Dated running-related occurrence | Event module |
| `Recurring Activity` | Reusable personal schedule pattern | Activity/Schedule module |
| `Runner Profile` | Durable runner preferences/context | Personalization module |
| `Personal Memory` | Explicitly saved durable context with provenance | Personalization module |
| `Integration Account` | Authorized external provider connection | Integration module |
| `Event Evidence` | Provenance supporting event relevance/interest/participation | Event module |
| `AI Conversation` | Conversation/session metadata for Tanya AI | AI module |

Do not collapse these concepts into one generic table merely for implementation convenience.

The existing Runner Core already defines `Activity Record` for concrete work performed against a Run. Phase 4 running history must not corrupt that semantic meaning. If a dedicated Running Activity entity is required, it must be distinct and may optionally link to a Core Run. fileciteturn30file0

---

## 3. Minimum Data Model

### 3.1 Runner Profile

Minimum useful fields:

- `id`
- `owner_id`
- `display_name`
- `running_area` or equivalent user-provided location granularity
- `preferred_days`
- `preferred_time`
- `preferred_distances`
- `primary_goal`
- `preferred_event_types`
- `running_with_others_preference` when explicitly confirmed
- `created_at`
- `updated_at`

Optional fields should only be implemented when they directly support an approved Phase 4 flow.

Do not collect medical diagnoses, injury status, or other sensitive health information as a prerequisite for personalization.

### 3.2 Running Activity

A Running Activity represents an actual physical running session.

Recommended fields:

- `id`
- `owner_id`
- `started_at`
- `ended_at`
- `duration_seconds`
- `distance_meters`
- `pace_seconds_per_km` when derivable/available
- `elevation_meters` when available
- `effort` when voluntarily provided
- `feeling` when voluntarily provided
- `source`
- `external_id`
- `event_id` nullable
- `recurring_activity_id` nullable
- `notes`
- `created_at`
- `updated_at`

Do not require every metric. Missing provider data must remain missing rather than being fabricated.

### 3.3 Event

Minimum event fields:

- `id`
- `owner_id` when the event is stored as personal/relevant context; public-source canonical data may use an explicit source ownership model if the existing architecture supports it
- `name`
- `edition_year` nullable
- `event_date` nullable until verified
- `location` nullable
- `organizer` nullable
- `distance_or_category` nullable
- `registration_url` nullable
- `registration_deadline` nullable
- `source_url` nullable
- `status`
- `date_status`
- `notes`
- `created_at`
- `updated_at`

`event_date` must be nullable when not verified. Never invent dates to make an event card look complete.

### 3.4 Recurring Activity

Minimum fields:

- `id`
- `owner_id`
- `name`
- `activity_type`
- `recurrence_rule`
- `usual_day` nullable
- `usual_time` nullable
- `usual_location` nullable
- `community` nullable
- `expected_distance` nullable
- `attendance_status`/occurrence state through occurrence records or equivalent
- `notes`
- `source`
- `active`
- `created_at`
- `updated_at`

The recurrence model must be configurable. Do not hard-code MJW into business logic.

### 3.5 Recurring Activity Occurrence / Attendance

If recurrence generation and attendance history cannot be represented safely on the recurring record itself, create a lightweight occurrence record.

Recommended fields:

- `id`
- `owner_id`
- `recurring_activity_id`
- `scheduled_at`
- `status` = `planned | attended | skipped | unknown`
- `linked_running_activity_id` nullable
- `notes`
- `created_at`
- `updated_at`

Attendance history is evidence of what happened. The recurrence definition is evidence of what was expected.

### 3.6 Event Evidence

For personally relevant events, preserve provenance.

Recommended fields:

- `id`
- `owner_id`
- `event_id`
- `evidence_type`
- `evidence_strength`
- `source_url` nullable
- `observed_at`
- `notes`
- `created_at`

Allowed `evidence_type` values should include:

- `prior_participation`
- `instagram_post`
- `instagram_highlight`
- `repost`
- `explicit_confirmation`
- `registration`
- `public_event_listing`

Allowed `evidence_strength` values:

- `weak`
- `moderate`
- `strong`
- `confirmed`

Evidence strength must not be interpreted as attendance probability.

### 3.7 Personal Memory

Only implement this as a separate persistence model if the existing application needs durable memory beyond structured profile/activity fields.

Recommended fields:

- `id`
- `owner_id`
- `memory_type`
- `content`
- `source_type`
- `source_id` nullable
- `confidence` only when it represents evidence quality, not speculative personality inference
- `confirmed_by_user`
- `created_at`
- `updated_at`

The default rule is: AI guesses are not memory.

### 3.8 Integration Account

Recommended fields:

- `id`
- `owner_id`
- `provider`
- `provider_user_id` nullable
- `status`
- `scopes`
- `connected_at`
- `last_synced_at` nullable
- `last_error_code` nullable
- `created_at`
- `updated_at`

Tokens/secrets must not be represented as client-readable fields.

If the existing deployment has an established secret-storage pattern, reuse it.

### 3.9 AI Conversation

Keep this minimal for Phase 4.

Possible fields:

- `id`
- `owner_id`
- `provider`
- `started_at`
- `updated_at`
- `title` nullable
- `metadata` nullable

Do not persist full sensitive conversation content unless required by an explicit product requirement and covered by the existing privacy/security model.

---

## 4. MJW Contract

MJW means **Mlayu Jumat Wengi**.

It is a high-relevance personal recurring activity when confirmed by the runner.

The system may use the known approximate 80–90% participation pattern as a relevance signal during initial personalization, but this value must never be treated as a hard attendance prediction.

The implementation must learn from actual occurrence status.

Valid:

- "MJW malam ini"
- "Biasanya kamu cukup sering ikut MJW"
- "Terakhir kamu ikut MJW ..." when history supports it

Invalid:

- "Kamu pasti ikut MJW"
- "Kamu anggota inti MJW" without explicit confirmation
- hard-coded MJW dates that are not sourced/configured

MJW is personal context, not community-management software.

---

## 5. Weekly Training/Learning Contract

Weekly training, structured practice, coaching, learning, and preparation may be represented as recurring Activities.

They must remain distinct from dated Events.

The UI may combine them in one schedule surface, but the domain must preserve the distinction:

- recurring training/learning = Activity;
- race/city run/organized occasion on a date = Event.

Actual completion should be recorded separately from scheduled recurrence.

---

## 6. Skybridge Race Run Contract

The normalized event identity is:

**Skybridge Race Run**

Aliases may include:

- Sky Bridge Run
- Skybridge Run
- KAI Daop 5 Skybridge Run

Do not use KAI Commuter Run Jakarta as a substitute for this event.

For the 2026 edition, the current known state is:

- `edition_year = 2026`
- `month_hint = November`
- `event_date = null`
- `date_status = unverified`

No November date may be hard-coded until a reliable public/authoritative source verifies it.

Personal evidence such as prior participation or a current repost may be stored as Event Evidence, but it does not prove future registration or attendance.

The 2025 historical event may be stored when useful as historical context: Skybridge Race Run in Purwokerto, 21 September 2025, with 5K and 10K categories. Do not use historical date as the 2026 date.

---

## 7. Provenance and Truth Model

Every personalized fact must be distinguishable by source.

Use a source classification concept such as:

- `user_confirmed`
- `user_provided`
- `local_recorded`
- `authorized_integration`
- `public_source`
- `derived_from_confirmed_data`
- `unverified`

The exact enum may be adapted to existing code, but the semantic distinction is mandatory.

### Truth rules

**Confirmed data** may be stated as fact.

**User-provided data** may be stated as user-provided context.

**Authorized imported data** may be stated with its source.

**Public source data** must retain source/provenance and freshness where relevant.

**Derived data** must be reproducible from known inputs.

**Unverified data** must be labeled or withheld from factual presentation.

Never upgrade a weak signal into a confirmed fact merely because it makes personalization easier.

---

## 8. Personal Relevance vs. Prediction

Runner OS may calculate or represent relevance, but Phase 4 must not implement attendance prediction as if it were fact.

Example:

`prior participation + current repost + same recurring event = high personal relevance signal`

This does **not** mean:

`high personal relevance = will attend`.

The product should use relevance to decide what to surface, not to claim what the runner will do.

---

## 9. Strava Data Boundary

Strava integration follows the existing connector contract: explicit authorization, server-side credentials, normalized external activity, idempotent synchronization, and failure isolation. fileciteturn31file0

Phase 4 initial implementation priority:

1. connection state;
2. OAuth/authorization boundary;
3. import completed activities;
4. normalize external IDs and provenance;
5. deduplicate safely;
6. disconnect/revocation handling;
7. clear sync/error state.

Write-back is not required for the first Phase 4 implementation. If considered later, it must use only officially supported provider capabilities and explicit confirmation for consequential actions.

---

## 10. AI / Groq Architecture Boundary

The chatbot must not call Groq directly from browser code.

Required conceptual flow:

```text
Tanya AI UI
   ↓
Authenticated AI Application Service
   ↓
Context Selection Layer
   ↓
Provider Adapter
   ↓
Groq API (initial provider, if available)
```

The context selector retrieves only data relevant to the current question.

Default priority:

1. current confirmed Runner OS data;
2. confirmed personal preferences;
3. actual activity history;
4. recurring activities such as MJW and weekly training;
5. relevant upcoming events and event evidence;
6. authorized Strava data;
7. relevant public running/event information;
8. general model knowledge.

Do not send the complete personal database to the provider by default.

Provider failure must degrade gracefully and must never expose credentials or internal errors to the browser.

Groq is an adapter/provider choice, not a domain dependency.

If no usable production API credential/endpoint exists, keep the adapter boundary and document the blocker rather than faking live AI.

---

## 11. API Contract

Preserve the repository's established API response convention:

Success:

```json
{ "data": {} }
```

Error:

```json
{
  "error": {
    "code": "SOME_CODE",
    "message": "Human-readable message",
    "details": {}
  }
}
```

All Phase 4 authenticated endpoints must derive owner identity from the authenticated session/server context.

Never trust `owner_id` supplied by the browser as an authorization mechanism.

Suggested resource boundaries:

- `/api/profile`
- `/api/activities`
- `/api/recurring-activities`
- `/api/events`
- `/api/event-evidence`
- `/api/integrations/...`
- `/api/ai/...`

Actual paths must follow the repository's existing routing conventions rather than being copied mechanically.

---

## 12. Authorization Rules

For every Phase 4 read/write:

1. authenticate the session;
2. resolve the authenticated owner;
3. load the target record using owner-scoped access;
4. reject cross-owner access;
5. validate input at the application/domain boundary;
6. persist transactionally where multiple records change together.

The security baseline already requires server-side ownership enforcement for user-owned Run, Activity, Event, and Integration Link data. fileciteturn32file0

---

## 13. Database and Migration Rules

Before changing the database:

1. inspect all existing migrations/schema definitions;
2. identify the current D1 schema and naming conventions;
3. reuse existing types/conventions where possible;
4. create additive migrations for new Phase 4 structures;
5. add indexes only for real query patterns;
6. preserve existing data;
7. make migrations deterministic and reproducible;
8. do not silently reset production data;
9. document any backfill or migration assumption.

Potential useful indexes include owner/time indexes for activities, owner/scheduled-time indexes for recurring occurrences, and event/evidence lookup indexes. Implement only those justified by actual queries.

---

## 14. Privacy and Sensitive Data Boundary

Phase 4 must not become a medical profiling system.

Do not infer or store:

- medical diagnoses;
- treatment decisions;
- hidden health conditions;
- psychological diagnoses;
- private information about other people;
- private social-account data.

Running effort/feeling notes are optional user data, not medical assessments.

Public event/community information must not become surveillance of unrelated individuals.

---

## 15. Failure and Recovery

External failure must not corrupt local canonical data.

Examples:

- Strava unavailable → local Runner OS remains usable.
- Groq unavailable → Tanya AI shows a clear unavailable/provider error state.
- Event source stale → preserve event but mark verification/freshness appropriately.
- Duplicate external activity → idempotency prevents duplicate canonical activity.
- Invalid recurrence → reject safely without corrupting existing recurrence.
- Cross-owner request → reject with authorization error.

Do not hide a failed external operation by presenting it as successful.

---

## 16. Implementation Decision Rule

When implementation encounters ambiguity, use this order:

1. current code behavior;
2. existing domain/security contracts;
3. this Phase 4 data contract;
4. Phase 4 master prompt;
5. 12A personalization addendum;
6. 12B Skybridge clarification;
7. smallest safe implementation;
8. document a real blocker rather than inventing behavior.

Do not create a new abstraction when a small extension of an existing boundary is sufficient.

---

## 17. Phase 4 Data Acceptance Gate

Before considering the data architecture complete:

- [ ] Runner Profile is owner-scoped.
- [ ] Running Activity is distinct from Core Run when required.
- [ ] Event and Recurring Activity remain distinct.
- [ ] MJW is configurable, not hard-coded.
- [ ] Weekly training/learning can be represented as recurring Activity.
- [ ] Attendance is historical state, not prediction.
- [ ] Event Evidence preserves provenance.
- [ ] Skybridge 2026 date remains unverified until sourced.
- [ ] KAI Commuter Run Jakarta is not substituted for Skybridge Race Run.
- [ ] Strava is behind the connector boundary.
- [ ] Groq is behind the provider boundary.
- [ ] AI context is minimized.
- [ ] Secrets remain server-side.
- [ ] Every user-owned query/write is owner-scoped.
- [ ] Migrations are additive and reproducible.
- [ ] Existing Phase 1–3 behavior remains intact.

This contract is complete when these conditions are satisfied and no unresolved ambiguity blocks implementation.
