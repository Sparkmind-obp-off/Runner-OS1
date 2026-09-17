# Runner OS — Phase 4 Addendum
## MJB Running Ritual, Social Motivation, and Grok Console Provider

**Status:** Phase 4 clarification / override addendum
**Applies to:** `docs/12_PHASE_4_HYPER_PERSONALIZED_RUNNER_OS_MASTER_SYSTEM_PROMPT.md`

---

## 0. Purpose

This addendum records the latest product clarification for the intended runner persona.

It does not replace the Phase 4 Master System Prompt. It refines the interpretation of the runner's recurring community-running behavior and the initial AI provider choice.

Where this addendum conflicts with an earlier generic assumption in Phase 4, this addendum takes precedence for the implementation of the intended runner persona.

---

## 1. MJB Is a Strong Personal Running Ritual

The runner frequently joins **MJB** and this should be treated as an important recurring part of the runner's personal running life.

The intended behavior is approximately:

- MJB is joined very often, roughly **80–90% of the time when circumstances allow**;
- MJB is therefore a high-priority recurring activity in the personal Runner OS context;
- attendance is **not guaranteed** because the runner may skip when work, events, or other commitments make the schedule too crowded;
- the system should model this as a strong personal pattern, not as an absolute rule.

Do not interpret 80–90% as a hard attendance prediction. It is a product-design signal that MJB is normally relevant when checking the runner's upcoming schedule.

### Recommended behavior

If an upcoming MJB occurrence exists, Home and Tanya AI may surface it naturally when relevant:

> "MJB malam ini — biasanya kamu cukup sering ikut."

or:

> "Besok ada MJB. Jadwal kamu kelihatan cukup longgar, mau aku bantu cek persiapannya?"

The system must not claim that the runner will attend unless the runner explicitly confirms attendance.

---

## 2. Why the Runner Joins MJB

The product should understand the **functional reason** for the ritual without turning it into a psychological diagnosis.

The intended product hypothesis is:

> The runner appears to prefer running with other people rather than running alone, and MJB provides an opportunity to run together, meet people, and have company.

This should be represented as a simple, user-confirmable preference such as:

- "Lebih suka lari bareng"
- "Senang kalau ada teman lari"
- "Tidak terlalu suka lari sendirian"

Do not store speculative psychological labels.

Do not infer personality traits beyond what the runner explicitly confirms.

This preference can influence recommendations and Home prioritization:

- surface group/community runs when relevant;
- consider social running options when suggesting a run;
- do not treat solo running as the default if the runner has explicitly said they prefer company.

---

## 3. MJB Community vs. MJB Attendance

The runner's relationship with MJB should **not** automatically be interpreted as deep involvement in the MJB ecosystem.

Important distinction:

**Joining the running activity ≠ being deeply involved in the community ecosystem.**

The runner may primarily use MJB as:

- a chance to run together;
- a way to avoid running alone;
- a way to meet or know more people;
- a recurring social running opportunity.

Therefore the product should separately model:

1. **MJB participation/attendance** — how often the runner joins the run;
2. **MJB community involvement** — only what the runner explicitly confirms.

Do not automatically create a strong community-membership claim merely because attendance is frequent.

Example:

> "Kamu sering ikut MJB"

is valid if based on the runner's own confirmed history.

But:

> "Kamu anggota inti / aktif di ekosistem MJB"

must not be inferred.

---

## 4. MJB Should Feel Personal, Not Like a Community Management Feature

Runner OS is not being built to manage MJB.

MJB is a **personal context source** for the runner's life.

The system should focus on questions such as:

- Kapan MJB berikutnya?
- Apakah biasanya aku ikut?
- Ada bentrok dengan jadwal lain?
- Kalau aku ikut, apa yang perlu disiapkan?
- Kapan terakhir aku ikut?
- Bagaimana MJB masuk ke riwayat lari aku?

Do not build:

- MJB member management;
- private member profiles;
- private community chat;
- moderation tools;
- community administration;
- surveillance of other participants.

---

## 5. Recurrence and Attendance Model

MJB should be represented as a configurable recurring activity with fields such as:

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

The system should learn from **actual recorded attendance**, not from the 80–90% heuristic alone.

The heuristic is useful for prioritization before sufficient history exists.

---

## 6. Language Update

Use **MJB** consistently in the product if that is the runner's own terminology.

Do not expand or reinterpret the acronym unless the runner confirms the exact meaning.

The UI should use natural Indonesian:

- "MJB berikutnya"
- "Biasanya ikut MJB"
- "Riwayat MJB"
- "MJB minggu ini"
- "Mau ikut?"
- "Tidak ikut"

Avoid technical labels such as `RecurringActivity`, `AttendanceProbability`, or `CommunityParticipationScore` in user-facing UI.

---

## 7. Initial AI Provider: Grok Console

For the initial implementation, the intended AI provider is **Grok through the user's chosen/free Console access**, rather than building a complex multi-provider system immediately.

The architecture should still keep a small provider boundary so the provider can be replaced later without rewriting the Runner OS chatbot domain.

Initial implementation priority:

1. simple `Tanya AI` interface;
2. server-side provider call;
3. controlled Runner OS context retrieval;
4. concise Indonesian answers;
5. clear handling of unavailable provider/API access;
6. no API keys committed to GitHub;
7. no unnecessary multi-provider infrastructure in the first slice.

If the chosen Grok Console access does not expose a usable production API credential or endpoint for the deployed environment, do not fake the integration. Keep the provider boundary and document the exact blocker.

---

## 8. AI Context Priority for This Runner

For a question about the runner's life, prioritize context in this order where relevant:

1. current confirmed Runner OS data;
2. confirmed personal preferences;
3. actual recorded running/activity history;
4. confirmed recurring activities such as MJB;
5. upcoming events;
6. authorized Strava data;
7. relevant public community/event information;
8. general AI knowledge/suggestions.

The AI must not convert assumptions into facts.

Example:

User: "Besok aku biasanya lari apa?"

Good behavior:
- inspect confirmed recurring activities and schedule;
- identify MJB if the date matches the configured recurrence;
- mention uncertainty if attendance is not confirmed;
- answer in simple Indonesian.

Bad behavior:
- assume the runner definitely attends;
- invent an event schedule;
- claim private community information;
- fabricate a Strava activity.

---

## 9. Product Principle Added

The hyper-personalization should capture not only **what the runner does**, but also **what makes the activity useful to the runner**.

For this runner, an important product signal is:

> **Running is more useful/enjoyable when there is someone to run with.**

Therefore Runner OS should help the runner find, remember, and prepare for relevant opportunities to run with others, while leaving the final decision to the runner.

This is a product preference, not a psychological diagnosis.

---

## 10. Implementation Priority

For Phase 4 implementation, prioritize:

- Indonesian-first UX;
- onboarding that captures running-with-others preference;
- MJB as a high-relevance recurring personal activity;
- attendance tracking without assuming certainty;
- distinction between attendance and community membership;
- Home surfacing of relevant MJB occurrences;
- Tanya AI using confirmed personal context;
- initial Grok provider boundary;
- simple graceful provider failure handling.

Do not expand Phase 4 into MJB community-management software.

Do not build advanced AI autonomy yet.

Do not add logo/branding work yet.
