# 41 — Personas, Customer Journey & UX Specification

## Journey principle
Do not onboard users into the architecture. Onboard them into a useful outcome.

## First-session path
1. Landing: explain who Runner OS helps and what it does in plain Indonesian.
2. Sign-up: minimal identity collection; Google sign-in only after Clerk implementation is verified; preserve safe legacy account migration.
3. Goal setup: one primary goal, experience level, available days, optional target event.
4. First value: draft a weekly routine or invite the user to log a recent run. Unknown questions can be skipped.
5. Review: show assumptions and missing information; user edits before saving.
6. Home: one clear next action, upcoming schedule, last verified activity and progress snapshot.
7. Return loop: weekly review with concise proposed changes.

## Personas
### Beginner
Simple language, reassurance and low-pressure progress. Avoid dense metrics and shame-based streaks.
### Consistency builder
Flexible schedule, missed-session handling and practical next steps.
### Event-focused runner
Event timeline, training blocks, taper explanation and calendar conflict awareness.
### Data-focused runner
Provenance, raw records, trends, export and correction tools.

## Command-center UX
The main interaction is a task-oriented command surface, not an empty chatbot. Suggested intents: “Buat rencana minggu ini”, “Analisis lari terakhir”, “Atur jadwal”, “Persiapan event”, “Tinjau progres”. Each opens a bounded workflow with visible context used, expected output, estimated usage and approval requirement.

## Required UI states
Empty state with one helpful action; loading with cancellation for long runs; partial result with missing data; approval with before/after preview; completion with verifiable changes; failure with retry guidance and no duplicate side effect; quota reached with reset date and non-paid fallback; integration unavailable without blocking manual workflow; account export/deletion and memory controls.

## Navigation proposal
Hari Ini; Aktivitas; Rencana; Kalender; Event; Progres; Command Center; Profil & Memori; Pengaturan. Keep mobile primary navigation small; use contextual secondary navigation.

## Interaction rules
Never silently overwrite a plan or schedule. Distinguish suggestion, draft, approved action and completed action. Explain why a recommendation was made and which data it used. Never represent a model estimate as a recorded activity. Provide edit, dismiss, report and correction feedback. Users can pause/cancel runs. Do not force Strava, wearable, location, health or calendar permissions during onboarding.

## Accessibility and localization
Indonesian default. Store stable machine codes separately from translated labels. Support keyboard navigation, focus restoration, semantic headings, form labels, error summaries, reduced motion, sufficient contrast and screen-reader announcements for async run status.

## UX validation
Conduct moderated tests with 5–8 runners per priority segment before broad release. Measure task completion, time to first value, comprehension of approval states, trust in provenance and ability to correct AI assumptions. This is a plan, not completed user testing.
