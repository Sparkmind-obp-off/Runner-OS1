# Runner OS — Skybridge Event Clarification

**Status:** Phase 4 event-intelligence clarification / override
**Applies to:** `docs/12_PHASE_4_HYPER_PERSONALIZED_RUNNER_OS_MASTER_SYSTEM_PROMPT.md` and `docs/12A_PHASE_4_PERSONALIZATION_ADDENDUM_MJB_AND_GROK.md`

---

## 1. Correct Event Identity

The KAI-related running event discussed for this runner is:

> **Sky Bridge Run / Skybridge Race Run**

For Runner OS, use **Skybridge Race Run** as the normalized event name when a canonical event record is needed, with aliases:

- Sky Bridge Run
- Skybridge Run
- Skybridge Race Run
- KAI Daop 5 Skybridge Run

Do not confuse this event with **KAI Commuter Run** in Jakarta. They are different event concepts.

The relevant historical event verified in public sources was the **Skybridge Race Run 2025** in Purwokerto, organized in connection with KAI Daop 5 Purwokerto, held on **21 September 2025**, with 5K and 10K categories.

---

## 2. November Event — Do Not Hard-Code an Unverified Date

The runner's personal context indicates that a later Skybridge event is expected around **November 2026**.

However, the public web search performed for this clarification did **not** produce a sufficiently reliable official/public source confirming the exact November 2026 date.

Searches for:

- Sky Bridge Run + November + Purwokerto + KAI;
- Skybridge Race Run + November 2026;
- Railway Runners + Skybridge Run;
- relevant public Instagram-indexed results;

did not produce a source strong enough to establish the exact date.

Therefore Runner OS must currently store this as:

- `event_name`: `Skybridge Race Run`
- `edition_year`: `2026`
- `month_hint`: `November`
- `event_date`: `null` until verified
- `date_status`: `unverified`
- `location`: `Purwokerto` only if retained from the known event context, not as proof of the 2026 edition
- `organizer`: `KAI Daop 5 Purwokerto` only when supported by the eventual event source
- `source_url`: `null` until a reliable source is available

Do **not** invent a day/date.

Do **not** convert the November hint into a confirmed event date.

---

## 3. Personal Interest Signal

This event is important to Runner OS because the runner's known personal history provides multiple relevance signals:

1. the runner previously participated in the event/an earlier edition;
2. public social evidence may document that prior participation;
3. the runner has shared/reposted the upcoming edition;
4. the event appears to be a recurring event relevant to the runner.

These signals may justify a **high personal relevance** classification.

They do **not** prove registration or future attendance.

Recommended evidence representation:

- `prior_participation` → strong historical relevance;
- `instagram_post` / `instagram_highlight` → supporting public evidence when actually verified;
- `repost` → positive current-interest signal;
- `public_event_listing` → event existence/date evidence when verified;
- `registration` / `explicit_confirmation` → stronger participation intent.

A repost must never be interpreted as registration.

Prior participation must never be interpreted as guaranteed repeat attendance.

---

## 4. Evidence State for Current Implementation

Until an authoritative/public source confirms the 2026 edition:

**Known:**
- Skybridge Race Run is a real KAI Daop 5 Purwokerto-related running event name used for the 2025 edition.
- The verified 2025 edition occurred on 21 September 2025 in Purwokerto.
- The intended 2026 personal context points to November, but the exact date is not currently verified.

**Not yet verified:**
- exact November 2026 event date;
- official 2026 event page;
- final 2026 venue;
- final 2026 categories;
- final 2026 organizer wording.

Runner OS must preserve this distinction.

---

## 5. Implementation Rule

If the exact 2026 event/date is discovered later through an authoritative source or a reliable public event listing, update the event record with provenance rather than replacing the existing interest signal.

Example final record after verification:

```text
Event: Skybridge Race Run
Edition: 2026
Date: <verified date>
Location: <verified location>
Organizer: <verified organizer>
Date status: verified
Interest signals:
- prior participation
- public prior-event evidence
- current repost/share
Evidence sources:
- <source URLs>
```

If the runner explicitly confirms participation, store that separately as an intent/participation state.

---

## 6. Correction to Earlier Phase 4 Addendum

Any earlier statement that identifies **KAI Commuter Run 2026 in Jakarta** as the runner's relevant KAI event should be treated as superseded for this specific personalization context.

The intended event is **Skybridge Race Run / Sky Bridge Run in the KAI Daop 5 Purwokerto context**.

The product should not use the unrelated Jakarta KAI Commuter Run as a substitute merely because it has a publicly confirmed date.

---

## 7. Product Principle

This is an example of the core Runner OS event-intelligence rule:

> **Personal relevance can be strong even when event-date verification is incomplete.**

Runner OS should therefore be able to say, internally or in UI when useful:

> "Skybridge Race Run — November 2026 — tanggal belum terverifikasi."

rather than inventing a date or silently substituting another KAI event.

When the date becomes verified, the event can move from **candidate/unverified** to **verified upcoming event** while retaining its historical personal-interest signals.
