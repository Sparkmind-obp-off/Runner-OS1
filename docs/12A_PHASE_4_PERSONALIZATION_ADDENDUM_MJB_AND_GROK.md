# Runner OS — Phase 4 Personalization Addendum
## MJW (Mlayu Jumat Wengi), Hyper-Personalization, and Grok Console

**Status:** Phase 4 clarification / override addendum
**Applies to:** `docs/12_PHASE_4_HYPER_PERSONALIZED_RUNNER_OS_MASTER_SYSTEM_PROMPT.md`

---

## 0. Purpose

This addendum records the latest product clarification for the intended runner persona.

Runner OS is intentionally being shaped as a **hyper-personalized personal running product for one specific runner**, not as a generic running app and not as community-management software.

The product should be designed around a simple principle:

> If this runner wants to run, Runner OS should help provide the context, preparation, opportunities, and support needed to make that running experience easier and more personally useful.

This addendum refines the interpretation of the runner's recurring running ritual, personal preferences, and initial AI provider.

Where this addendum conflicts with an earlier generic assumption in Phase 4, this addendum takes precedence for the implementation of the intended runner persona.

---

## 1. Correct Terminology: MJW

The recurring running activity must be referred to as **MJW**, not MJB.

The runner's terminology is:

> **MJW = Mlayu Jumat Wengi**

Use **MJW** consistently throughout the product, documentation, domain examples, onboarding, Home, schedule surfaces, and Tanya AI context.

Do not rename it to MJB.

Do not expand, reinterpret, or invent any alternative meaning for MJW beyond the runner-confirmed meaning above.

Examples of natural UI language:

- "MJW berikutnya"
- "Biasanya ikut MJW"
- "Riwayat MJW"
- "MJW minggu ini"
- "Mau ikut MJW?"
- "Tidak ikut MJW"

---

## 2. MJW Is a Strong Personal Running Ritual

The runner frequently joins **MJW** and this should be treated as an important recurring part of the runner's personal running life.

The intended behavior is approximately:

- MJW is joined very often, roughly **80–90% of the time when circumstances allow**;
- MJW is therefore a high-priority recurring activity in the personal Runner OS context;
- attendance is **not guaranteed** because the runner may skip when work, events, or other commitments make the schedule too crowded;
- the system should model this as a strong personal pattern, not as an absolute rule.

The 80–90% figure is a product-design signal for relevance, not a hard attendance prediction.

The system should learn from actual recorded attendance over time.

### Recommended behavior

If an upcoming MJW occurrence exists, Home and Tanya AI may surface it naturally when relevant:

> "MJW malam ini — biasanya kamu cukup sering ikut."

or:

> "Besok ada MJW. Mau aku bantu cek jadwal dan persiapannya?"

The system must not claim that the runner will attend unless the runner explicitly confirms attendance.

---

## 3. Why MJW Matters to the Runner

The product should understand the functional value of MJW without turning it into a psychological diagnosis.

The intended product hypothesis is that the runner gets value from running with other people: having company, meeting people, and enjoying a shared running experience.

This may be represented as a simple, user-confirmable preference such as:

- "Lebih suka lari bareng"
- "Senang kalau ada teman lari"
- "Tidak terlalu suka lari sendirian"

Do not store speculative psychological labels.

Do not infer personality traits beyond what the runner explicitly confirms.

When confirmed, this preference can influence Runner OS prioritization:

- surface relevant group/community runs when useful;
- consider social running opportunities when suggesting a run;
- do not automatically treat solo running as the preferred default.

---

## 4. MJW Participation vs. Community Involvement

Frequent participation in MJW must **not** automatically be interpreted as deep involvement in the MJW ecosystem.

Important distinction:

**Joining a running activity ≠ being deeply involved in its community ecosystem.**

The product should separately model:

1. **MJW participation/attendance** — whether and how often the runner joins;
2. **MJW community involvement** — only what the runner explicitly confirms.

Valid:

> "Kamu sering ikut MJW."

when based on confirmed history.

Not valid without explicit confirmation:

> "Kamu anggota inti / aktif di ekosistem MJW."

The product is about the runner's personal experience, not about profiling the MJW community.

---

## 5. MJW Should Feel Personal, Not Like Community Management

Runner OS is **not** being built to manage MJW.

MJW is a **personal context source** for the runner's running life.

Useful questions include:

- Kapan MJW berikutnya?
- Biasanya aku ikut MJW nggak?
- Ada bentrok dengan jadwal lain?
- Kalau ikut MJW, apa yang perlu disiapkan?
- Kapan terakhir aku ikut MJW?
- Bagaimana MJW masuk ke riwayat lariku?

Do not build:

- MJW member management;
- private member profiles;
- private community chat;
- moderation tools;
- community administration;
- surveillance of other participants.

---

## 6. Recurrence and Attendance Model

MJW should be represented as a configurable recurring personal activity with fields such as:

- `name`;
- `recurrence_rule`;
- `usual_time`;
- `usual_location` when confirmed;
- `community` when confirmed;
- `expected_distance` when known;
- `attendance_status` per occurrence;
- `notes`;
- `active`.

Attendance status should allow at least:

- `attended`;
- `skipped`;
- `planned`;
- `unknown`.

The system should learn from **actual recorded attendance**, not from the 80–90% pattern alone.

The frequency pattern is useful for prioritization before sufficient history exists.

---

## 7. Hyper-Personalization Is the Core Product Requirement

Runner OS should not merely provide generic running features.

It should progressively become a personal system that understands the runner through:

1. explicit onboarding answers;
2. confirmed personal preferences;
3. actual running/activity history;
4. recurring activities such as MJW;
5. upcoming events;
6. authorized integrations such as Strava;
7. relevant public running/event information;
8. the runner's conversations with Tanya AI.

The system should answer the practical question:

> **"Kalau dia ingin lari, apa yang bisa Runner OS lakukan untuk benar-benar membantu dia?"**

Examples of the intended product behavior:

- remind the runner about relevant upcoming running opportunities;
- understand when MJW normally matters to the runner;
- help prepare for a planned run or event;
- connect running history with upcoming plans;
- surface relevant community/group opportunities when the runner wants company;
- use authorized Strava data when available;
- let the runner ask naturally through Tanya AI instead of configuring everything manually;
- progressively make Home more useful based on confirmed personal context.

The goal is **personal usefulness**, not feature count.

---

## 8. Initial AI Provider: Grok Console

For the initial implementation, the intended AI provider is **Grok through the user's chosen/free Grok Console access**.

Keep a small provider boundary so the provider can be replaced later without rewriting the Runner OS chatbot domain, but do not build complex multi-provider infrastructure now.

Initial implementation priority:

1. simple `Tanya AI` interface;
2. server-side provider call;
3. controlled Runner OS context retrieval;
4. concise Indonesian answers;
5. graceful handling of unavailable provider/API access;
6. no API keys committed to GitHub;
7. minimal provider architecture.

If the chosen Grok Console access does not expose a usable production API credential or endpoint for the deployed environment, do not fake the integration. Keep the provider boundary and document the exact blocker.

---

## 9. AI Context Priority for This Runner

For questions about the runner's life, prioritize relevant context in this order:

1. current confirmed Runner OS data;
2. confirmed personal preferences;
3. actual recorded running/activity history;
4. confirmed recurring activities such as MJW;
5. upcoming events;
6. authorized Strava data;
7. relevant public community/event information;
8. general AI knowledge/suggestions.

The AI must never convert assumptions into facts.

Example:

User: "Besok aku biasanya lari apa?"

Good behavior:

- inspect confirmed recurring activities and schedule;
- identify MJW if the date matches its configured recurrence;
- mention uncertainty if attendance is not confirmed;
- answer in simple Indonesian.

Bad behavior:

- assume the runner definitely attends;
- invent an MJW schedule;
- claim private community information;
- fabricate a Strava activity.

---

## 10. Product Principle

The hyper-personalization should capture not only **what the runner does**, but also **what makes running useful or enjoyable for this particular runner**.

A relevant confirmed preference may be:

> **Running is more useful/enjoyable when there is someone to run with.**

Runner OS should therefore help the runner find, remember, prepare for, and make use of relevant opportunities to run with others, while leaving the final decision to the runner.

This is a product preference, not a psychological diagnosis.

---

## 11. Scope Discipline

The current priority is the runner experience itself.

Do not expand the product unnecessarily into:

- community management;
- social-network features;
- private participant surveillance;
- advanced AI autonomy;
- autonomous event registration;
- autonomous messaging/posting;
- payment execution;
- large branding/logo work;
- monetization-first features;
- generic project-management features unrelated to the runner's actual needs.

The product should stay focused on one question:

> **How can Runner OS become genuinely useful for this runner's running life?**

---

## 12. Implementation Priority

For the current Phase 4 direction, prioritize:

- correct **MJW = Mlayu Jumat Wengi** terminology;
- Indonesian-first UX;
- hyper-personalized onboarding;
- running-with-others preference when confirmed;
- MJW as a high-relevance recurring personal activity;
- attendance tracking without assuming certainty;
- distinction between attendance and community involvement;
- Home surfacing of relevant MJW occurrences;
- running history and upcoming context;
- Tanya AI using confirmed personal context;
- initial Grok provider boundary;
- simple graceful provider failure handling;
- progressive personalization based on actual usage.

Do not add logo/branding work yet.
