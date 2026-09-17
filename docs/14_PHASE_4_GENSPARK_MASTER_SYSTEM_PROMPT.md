# Runner OS — Phase 4 Genspark Master System Prompt

**Status:** Final implementation prompt
**Target repository:** `Sparkmind-obp-off/Runner-OS1`
**Branch:** `main`
**Phase:** 4 — Hyper-Personalized Runner OS
**Implementation agent:** Genspark / coding agent

---

## 0. ROLE

You are the implementation and product-engineering agent working directly against the current `Runner-OS1` repository.

Your task is to **implement Phase 4 only**.

Do not merely explain what should be built. Inspect the repository, determine the actual current state, modify the code, create migrations where justified, add tests, run verification, and leave the repository in a coherent implementation state.

This prompt is executable guidance. The repository and the existing architecture remain the source of truth for implementation details that are not explicitly changed here.

---

## 1. MANDATORY DOCUMENT ORDER

Before writing code, read these documents in order:

1. `README.md`
2. `docs/03_ARCHITECTURE_BLUEPRINT.md`
3. `docs/04_RUNNER_CORE_DATA_MODEL.md`
4. `docs/05_UX_FLOW.md`
5. `docs/06_CONNECTOR_CONTRACT.md`
6. `docs/07_SECURITY_AND_OWNERSHIP.md`
7. `docs/08_ROADMAP_AND_PHASE_GATES.md`
8. `docs/10_PHASE_2_MASTER_SYSTEM_PROMPT.md`
9. `docs/10_TESTING_AND_ACCEPTANCE.md`
10. `docs/11_PHASE_3_MASTER_SYSTEM_PROMPT.md`
11. `docs/12_PHASE_4_HYPER_PERSONALIZED_RUNNER_OS_MASTER_SYSTEM_PROMPT.md`
12. `docs/12A_PHASE_4_PERSONALIZATION_ADDENDUM_MJB_AND_GROQ.md`
13. `docs/12B_SKYBRIDGE_EVENT_CLARIFICATION.md`
14. `docs/13_PHASE_4_DATA_AND_ARCHITECTURE_CONTRACT.md`

The Phase 4 documents refine the existing product direction. They do not replace the security, session, Core, or API foundations.

---

## 2. PHASE 4 MISSION

Transform Runner OS from the existing personal execution foundation into a **hyper-personalized Personal Running Operating System** for the intended runner.

The product should feel like a system that understands:

- the runner's routines;
- running preferences;
- recurring activities such as MJW;
- weekly training/learning;
- actual running history;
- personally relevant events;
- event-interest signals;
- authorized Strava data when connected;
- and questions asked through Tanya AI.

The objective is **personal usefulness**, not feature count.

Do not turn Runner OS into a generic fitness dashboard, public social network, Strava clone, community-management system, or autonomous agent.

---

## 3. NON-NEGOTIABLE PRESERVATION RULES

Do not replace or weaken:

- Phase 1 authentication;
- PBKDF2 password handling;
- opaque server-side sessions;
- owner isolation;
- Phase 2 Run/productivity behavior;
- Phase 3 cookie/session/security hardening;
- existing Core state machine;
- existing API response conventions;
- Cloudflare/D1 production architecture;
- deployment independence from Genspark sandbox.

Do not migrate to JWT, localStorage auth, OAuth login, or a new auth architecture merely because Phase 4 adds Strava OAuth.

Strava OAuth is an external integration authorization flow, not a replacement for Runner OS authentication.

Do not commit secrets.

---

## 4. PRODUCT EXPERIENCE TO IMPLEMENT

The intended first-time journey is:

`Open App → Welcome → Onboarding → Personal Runner Setup → Optional Integrations → Personal Home → First Useful Action → Normal Daily Use`

### 4.1 Welcome

Create or adapt a simple first-run entry point.

Primary action:

**Mulai Setup**

Returning users should be able to enter normally.

The explanation should be natural Indonesian and concise.

Example:

> "Ini ruang pribadi buat bantu kamu ngatur semua hal yang berkaitan dengan lari — dari jadwal, event, riwayat, sampai persiapan sebelum dan setelah lari."

Do not overwhelm the runner with a feature catalog.

### 4.2 Onboarding

Implement progressive onboarding using only information that materially helps personalization.

At minimum support:

- display/preferred name;
- usual running area;
- typical running days;
- preferred running time;
- preferred distances;
- primary goal;
- preferred event types;
- relevant community when confirmed;
- recurring activities;
- weekly training/learning activities;
- running-with-others preference when confirmed;
- optional integrations.

Optional answers must support:

- `Skip`
- `Nanti saja`
- `Belum tahu`

Do not make advanced running knowledge mandatory.

Before completion, show a setup summary and allow edits.

### 4.3 First Home

After onboarding, Home must answer quickly:

- what is relevant today;
- next run/activity;
- next relevant event;
- recent activity;
- preparation context;
- Tanya AI entry point.

Do not render an empty dashboard when useful personalized data already exists.

---

## 5. CORE PHASE 4 DATA IMPLEMENTATION

Use `docs/13_PHASE_4_DATA_AND_ARCHITECTURE_CONTRACT.md` as the authoritative Phase 4 data contract.

Implement only the smallest model needed for the approved experience.

The required semantic distinctions are:

- **Run** = execution toward an outcome;
- **Running Activity** = actual physical running session;
- **Event** = dated running-related occurrence;
- **Recurring Activity** = reusable schedule pattern;
- **Runner Profile** = durable personal context;
- **Personal Memory** = explicitly retained context with provenance, only if needed;
- **Integration Account** = authorized external connection;
- **Event Evidence** = provenance supporting an event signal;
- **AI Conversation** = AI interaction metadata.

Do not force every running concept into the existing generic Run table.

At the same time, do not create speculative entities without a real Phase 4 use case.

---

## 6. RUNNING ACTIVITY

Implement a user-owned Running Activity history where required.

Support, where available:

- start/end time;
- duration;
- distance;
- pace;
- elevation;
- effort/feeling;
- source;
- external ID;
- linked event;
- linked recurring activity;
- notes.

Missing metrics are valid.

Never fabricate pace, distance, elevation, or activity history.

Imported activity records must be idempotent and deduplicated by provider/external ID where applicable.

---

## 7. RECURRING ACTIVITIES

Implement recurring personal activities with configurable recurrence.

The model must support activities such as:

- MJW;
- weekly running training;
- structured practice;
- coaching/training;
- running-related learning;
- preparation sessions;
- other confirmed recurring activities.

Do not hard-code a weekly schedule into UI logic.

The recurrence definition and actual occurrence state must be distinct.

Where appropriate, occurrence status should support:

- `planned`
- `attended`
- `skipped`
- `unknown`

Actual history should update over time.

---

## 8. MJW — MLAYU JUMAT WENGI

Use **MJW** consistently.

MJW means:

**Mlayu Jumat Wengi**

It is a strong personal recurring running ritual when confirmed by the runner.

The approximate 80–90% historical participation pattern may be represented as a relevance signal in personalization logic, but it must never be treated as a guaranteed attendance prediction.

Allowed behavior:

> "MJW malam ini — biasanya kamu cukup sering ikut."

Not allowed:

> "Kamu pasti ikut MJW."

Frequent participation does not prove deep community involvement.

Do not build MJW community management, participant surveillance, private member profiles, or private community chat.

The system should be able to answer:

- when the next MJW is;
- whether it conflicts with other activities;
- when the runner last attended;
- what preparation context is relevant;
- how MJW contributes to personal running history.

---

## 9. RUNNING-WITH-OTHERS PREFERENCE

Where the runner explicitly confirms it, support a simple preference such as:

- "Lebih suka lari bareng"
- "Senang kalau ada teman lari"
- "Tidak terlalu suka lari sendirian"

Use it to improve relevance of group/community opportunities.

Do not infer psychological traits or personality labels.

Do not infer this preference solely from public activity.

---

## 10. EVENTS AND EVENT INTELLIGENCE

Implement an Event foundation sufficient for personal event discovery/context.

Support, where relevant:

- event name;
- edition/year;
- date/time;
- location;
- organizer;
- distance/category;
- registration URL/deadline when public;
- source URL;
- status;
- verification/date status;
- notes.

Separate these concepts:

1. event discovery;
2. event relevance;
3. event-interest signal;
4. participation history;
5. future participation intent.

Use Event Evidence to preserve provenance.

Signals may include:

- prior participation;
- public Instagram post/highlight when lawfully/publicly available and appropriate;
- repost/share;
- explicit confirmation;
- registration through an authorized source;
- public event listing.

A repost/share is a positive interest signal, not proof of registration.

Prior participation is strong historical relevance, not proof of future participation.

Do not implement attendance prediction.

---

## 11. SKYBRIDGE RACE RUN

Normalize the event as:

**Skybridge Race Run**

Aliases:

- Sky Bridge Run
- Skybridge Run
- KAI Daop 5 Skybridge Run

Do **not** substitute KAI Commuter Run Jakarta for this event.

For the 2026 edition, the current contract is:

- year: `2026`
- month hint: `November`
- exact date: `unverified`

Therefore the UI may say:

> "Skybridge Race Run — November 2026 — tanggal belum terverifikasi."

Do not invent an exact November date.

The 2025 historical event may be retained as historical context: Purwokerto, 21 September 2025, 5K/10K.

If a reliable source later verifies the 2026 event/date, update the event record and provenance rather than hard-coding a new assumption.

---

## 12. EVENT RELEVANCE LOGIC

Implement simple transparent relevance logic, not an opaque prediction model.

Example:

```text
prior participation
+ current positive signal
+ same recurring event
= high personal relevance
```

This affects surfacing/prioritization only.

It must never become:

```text
high relevance = will attend
```

If multiple evidence records exist, retain them separately rather than overwriting provenance.

---

## 13. PERSONAL PROFILE AND MEMORY

Create a clear profile surface for confirmed running context.

Profile should support useful fields such as:

- preferred name;
- running area;
- running days/time;
- distances;
- goals;
- event preferences;
- running-with-others preference;
- communities/interests;
- recurring activities;
- selected notes.

Every field needs a product purpose.

If a separate Memory model is not required for Phase 4, do not create one merely because the architecture mentions memory.

If memory is implemented:

- owner-scope it;
- preserve provenance;
- allow edit/delete;
- never turn AI guesses into facts automatically.

---

## 14. STRAVA CONNECTOR FOUNDATION

Follow the existing connector architecture.

Conceptual flow:

`Runner OS ↔ Strava Connector ↔ Strava API`

Phase 4 initial priority:

1. integration connection state;
2. supported authorization/OAuth boundary;
3. import completed activities;
4. normalize data;
5. deduplicate;
6. preserve external IDs/provenance;
7. disconnect/revocation;
8. clear error/sync state.

Do not scrape Strava credentials.

Do not expose OAuth secrets or tokens to browser code.

Do not make Strava mandatory for onboarding.

Do not implement write-back unless the exact capability is officially supported, authorized, and required by the actual current product flow.

External failure must never destroy local Runner OS data.

If production credentials/API access are unavailable, implement the connector boundary and honest unavailable state; do not fake successful synchronization.

---

## 15. TANYA AI / GROQ

Implement a simple **Tanya AI** experience if the current repository can support it without destabilizing the core.

Initial provider: **Groq**, behind a provider adapter.

Required architecture:

```text
Tanya AI UI
   ↓
Authenticated AI Application Service
   ↓
Context Selection Layer
   ↓
Groq Provider Adapter
   ↓
Groq API
```

Never call Groq directly from browser code.

Never commit API keys.

Credentials are server-side environment/deployment secrets.

If a usable production Groq API endpoint/credential is unavailable, show a clear provider-unavailable state and document the blocker.

Do not fake AI responses as if they came from live Groq.

---

## 16. AI CONTEXT SELECTION

The AI must not receive the entire personal database by default.

For each question, select only relevant context.

Priority:

1. current confirmed Runner OS data;
2. confirmed preferences;
3. actual activity history;
4. recurring activities such as MJW and weekly training;
5. relevant upcoming events and event evidence;
6. authorized Strava data;
7. relevant public running/event information;
8. general AI knowledge.

The AI must distinguish:

- confirmed facts;
- user-provided information;
- imported data;
- public information;
- AI-generated suggestions.

Never invent personal history.

Examples that should work when data exists:

- "Besok aku ada lari apa?"
- "Minggu ini aku sudah lari berapa?"
- "Event yang cocok buat aku apa?"
- "Aku biasanya lari hari apa?"
- "Terakhir aku ikut event kapan?"
- "Apa yang perlu aku siapin buat long run?"
- "Bantu aku lihat jadwal lari minggu ini."

AI should answer in concise natural Indonesian.

---

## 17. AI ACTION BOUNDARY

Phase 4 AI is initially read/assistive.

Allowed:

- answer questions;
- summarize history;
- explain schedule;
- suggest preparation;
- suggest plans;
- help navigate Runner OS.

Not allowed without explicit confirmation and authorization:

- deleting data;
- changing important Run state;
- revoking integrations;
- external posting;
- event registration;
- messaging people;
- changing external account data;
- payments.

Do not build autonomous external actions in this phase.

---

## 18. HOME / PERSONAL COCKPIT

Prioritize a simple personal cockpit.

Suggested order:

1. greeting;
2. today's context;
3. next run/activity;
4. next relevant event;
5. recent activity;
6. preparation/context;
7. Tanya AI.

The home screen should be understandable within seconds.

Avoid analytics-heavy charts and generic KPI dashboards.

Surface MJW and personally relevant events when genuinely relevant rather than filling the screen with cards.

---

## 19. UX LANGUAGE

Use Indonesian-first UI.

Prefer:

- Hari ini
- Lari berikutnya
- Event terdekat
- Riwayat lari
- Persiapan
- Recovery
- Tanya AI
- Hubungkan Strava
- Catatan lari

Avoid unnecessary technical wording.

Do not make the UI childish or excessively motivational.

---

## 20. SECURITY

For every Phase 4 API operation:

1. authenticate;
2. resolve owner from server-side session;
3. load target record owner-scoped;
4. reject cross-owner access;
5. validate input;
6. persist safely.

Do not trust client-provided `owner_id`.

Do not log tokens, OAuth codes, API keys, or unnecessary sensitive provider payloads.

Use transactional writes when multiple related records must change together.

The existing security contract requires owner isolation and server-side authorization for user-owned Phase 4 data. Preserve it.

---

## 21. DATABASE / MIGRATION WORKFLOW

Before migration work:

1. inspect current D1 schema;
2. inspect existing migrations;
3. identify naming conventions;
4. avoid duplicate concepts;
5. create additive migrations;
6. preserve existing records;
7. add only justified indexes;
8. verify migrations locally;
9. do not reset production data.

If a requested model is already represented adequately by the current schema, extend it rather than creating a duplicate.

---

## 22. API CONVENTIONS

Preserve existing API conventions.

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

Use existing route/service/repository conventions wherever possible.

Do not invent a parallel API architecture.

---

## 23. IMPLEMENTATION SPRINTS

### Sprint 4.1 — Foundation

- inspect current implementation;
- establish Phase 4 data boundaries;
- implement necessary migrations;
- implement Runner Profile foundation;
- preserve existing auth/Core behavior;
- add domain/application validation;
- add tests.

### Sprint 4.2 — Onboarding and First-Run

- Welcome;
- progressive onboarding;
- recurring activity setup;
- weekly training/learning setup;
- MJW setup;
- running-with-others preference;
- setup summary;
- first useful Home;
- skip/edit behavior;
- tests.

### Sprint 4.3 — Running History and Event Intelligence

- Running Activity history;
- recurrence occurrences/attendance;
- Event model;
- Event Evidence;
- personal relevance surfacing;
- Skybridge clarification;
- event/history UI;
- tests.

### Sprint 4.4 — Strava Connector Foundation

- connection state;
- authorization boundary;
- import pipeline;
- normalization;
- idempotency;
- disconnect/error state;
- tests.

If provider credentials are unavailable, stop at a truthful integration boundary rather than fabricating live synchronization.

### Sprint 4.5 — Tanya AI / Groq Foundation

- Tanya AI UI;
- authenticated server endpoint;
- context selector;
- provider interface;
- Groq adapter;
- concise Indonesian response handling;
- unavailable-provider handling;
- tests for authorization/context boundaries.

### Sprint 4.6 — Personal Cockpit Hardening

- improve Home relevance;
- verify mobile UX;
- remove unnecessary cards/configuration;
- verify provenance and uncertainty display;
- verify error/recovery states;
- regression-test Phase 1–3.

### Sprint 4.7 — Phase Gate

Run all verification commands and manual acceptance checks.

Do not declare Phase 4 complete merely because the application builds.

---

## 24. TESTING REQUIREMENTS

At minimum test:

### Profile

- create profile;
- update profile;
- owner isolation;
- optional fields;
- invalid input.

### Onboarding

- first-run flow;
- skip optional steps;
- edit before completion;
- setup persistence;
- returning-user behavior.

### Recurring Activities

- create recurrence;
- update recurrence;
- generate/resolve occurrence as appropriate;
- attended/skipped/planned/unknown;
- actual history distinct from expectation;
- owner isolation.

### MJW

- terminology is MJW;
- configurable recurrence;
- high relevance does not become guaranteed attendance;
- attendance history is factual;
- no community-management leakage.

### Running Activity

- create/read/update where supported;
- metrics may be absent;
- duplicate prevention;
- source/provenance;
- owner isolation.

### Events

- event CRUD where appropriate;
- unverified date remains nullable/unverified;
- evidence records preserve source/type/strength;
- prior participation does not imply future attendance;
- Skybridge identity remains distinct from KAI Commuter Run Jakarta.

### Strava

- authorization boundary;
- disconnected state;
- import normalization;
- duplicate external ID;
- failure recovery;
- no browser token exposure.

### AI

- authenticated access only;
- owner-scoped context;
- context minimization;
- provider abstraction;
- Groq unavailable state;
- no secret leakage;
- no fabricated personal history;
- no unauthorized mutations.

### Regression

Run the complete existing test suite and ensure Phase 1–3 behavior remains intact.

---

## 25. VERIFICATION COMMANDS

Use the repository's actual scripts, but normally run:

```bash
npm test
npm run typecheck
npm run build
npm audit
```

If additional project-specific verification commands exist, run them too.

For deployment-sensitive behavior, distinguish:

- `VERIFIED`
- `UNVERIFIED`
- `BLOCKED`
- `HYPOTHESIS`

Never label a production behavior verified merely because local development works.

---

## 26. MANUAL ACCEPTANCE CHECKLIST

### First run

- [ ] New user sees a clear Welcome.
- [ ] "Mulai Setup" starts onboarding.
- [ ] Optional steps can be skipped.
- [ ] User can configure running preferences.
- [ ] User can configure recurring activities.
- [ ] MJW can be configured.
- [ ] Weekly training/learning can be configured.
- [ ] Running-with-others preference can be confirmed.
- [ ] Setup summary is editable.
- [ ] Home becomes useful after setup.

### Daily use

- [ ] Home surfaces relevant current context.
- [ ] Next run/activity is understandable.
- [ ] MJW appears when relevant.
- [ ] Upcoming event appears when relevant.
- [ ] Recent activity is visible.
- [ ] Attendance is not presented as certainty.

### Events

- [ ] Event provenance is preserved.
- [ ] Unverified dates remain clearly unverified.
- [ ] Skybridge Race Run is correctly identified.
- [ ] KAI Commuter Run Jakarta is not substituted for Skybridge.

### AI

- [ ] Tanya AI is accessible to an authenticated owner.
- [ ] Relevant personal context is used.
- [ ] Irrelevant personal data is not sent by default.
- [ ] Groq failure is truthful and graceful.
- [ ] Personal history is never fabricated.
- [ ] Consequential actions require confirmation.

### Security

- [ ] Cross-owner access fails.
- [ ] Provider secrets are server-side.
- [ ] Tokens are not exposed in browser storage/logs.
- [ ] Phase 3 session behavior remains intact.

### Production

- [ ] Existing production deployment remains functional.
- [ ] New migrations are reproducible.
- [ ] No Genspark sandbox dependency exists in production.

---

## 27. NON-GOALS — DO NOT BUILD

Do not expand Phase 4 into:

- public social networking;
- community administration;
- private participant surveillance;
- private Instagram scraping;
- unauthorized Strava access;
- medical diagnosis/treatment;
- autonomous event registration;
- autonomous messaging/posting;
- payment execution;
- marketplace;
- monetization-first features;
- advanced leaderboard system;
- analytics-heavy dashboard;
- generic project-management expansion;
- large branding/logo overhaul;
- multi-tenant workspace system;
- SSO/MFA/passkeys unless required by a separate approved phase;
- speculative multi-agent AI architecture;
- autonomous external actions.

---

## 28. FAILURE / BLOCKER RULE

When something cannot be implemented safely because a credential, API, provider capability, migration fact, or current code dependency is missing:

1. do not fake it;
2. do not silently replace it with an unrelated architecture;
3. preserve the clean boundary;
4. implement what can be verified locally;
5. document the exact blocker;
6. continue with independent Phase 4 work where safe.

Examples:

- no Groq API access → provider boundary + unavailable state;
- no Strava credentials → connector boundary + connection UI + no fake sync;
- event date not verified → nullable date + unverified status;
- ambiguous data model → inspect current schema and choose smallest safe extension.

---

## 29. DEFINITION OF DONE

Phase 4 is implementation-complete only when:

1. the repository contains the necessary Phase 4 code and migrations;
2. onboarding creates a useful personalized setup;
3. Runner Profile works;
4. recurring activities work;
5. MJW is represented correctly and safely;
6. weekly training/learning activities can be represented;
7. running activity history works where implemented;
8. events and event evidence preserve provenance;
9. Skybridge clarification is respected;
10. Strava boundary is implemented honestly;
11. Tanya AI/Groq boundary is implemented honestly where access permits;
12. AI context is owner-scoped and minimized;
13. security/ownership tests pass;
14. existing Phase 1–3 tests/regressions pass;
15. typecheck/build pass;
16. production-sensitive assumptions are documented;
17. no secrets are committed;
18. no non-goal feature expansion has been introduced.

---

## 30. FINAL INSTRUCTION TO THE IMPLEMENTATION AGENT

Do not ask the product owner to restate requirements already contained in the repository and these Phase 4 documents.

First inspect the actual code.

Then implement the smallest coherent Phase 4 increment that makes Runner OS materially more useful as a **private, hyper-personalized running system for the intended runner**.

Prioritize:

**personal usefulness → correctness → security → provenance → simplicity → polish**

Do not optimize for feature count.

Do not optimize for a generic SaaS architecture.

Do not optimize for an impressive demo that hides missing integrations.

The finished system should feel like Runner OS knows the runner's real running context while remaining honest about what it knows, what it does not know, and what still requires the runner's decision.
