# Runner OS — UX/UI & Information Architecture

Design direction: calm, personal, data-truthful, mobile-first, Indonesian-first.

## UX goals
- Answer “Apa yang relevan hari ini?” immediately.
- Make the next action obvious without visual noise.
- Let the runner inspect why an AI recommendation exists.
- Distinguish fact, plan, completed, imported, inferred and unverified data.
- Work well on phone and desktop.

## Navigation
1. Home — today's cockpit and next action.
2. Jadwal — calendar, recurring sessions and attendance.
3. Aktivitas — history and manual entry.
4. Event — race/event library and preparation.
5. Coach / AI — ask, plan, review and agent runs.
6. Profil — goals, routine, preferences and personal context.
7. Integrasi — Strava and future providers.
8. Pengaturan — privacy, memory, export, security and account.

Mobile bottom navigation prioritizes Home, Jadwal, Aktivitas and Coach. Secondary pages remain accessible through a clear More menu.

## Page specifications

### Home cockpit
Date/time in user timezone, next planned session, relevant routine, upcoming event, recent activity and concise insight. Primary actions: log activity, view schedule, ask coach. No fabricated readiness score.

### Onboarding
Progressive steps: display name/area; running days/time; usual distance/current experience if volunteered; goal/event; preferences/constraints; review/confirm. Allow skip, back and edit. Do not force health disclosures.

### Schedule
Week default, month and agenda alternatives. Recurring template separated from actual occurrence. Status: planned, attended, skipped, unknown. Explain conflicts and changes. Timezone-aware.

### Activity
Cards show date, source, distance, duration, pace and elevation only when present. Detail includes provenance and editable annotations. Imported activity must not silently overwrite user-edited records.

### Events
Group by upcoming/interested/planned/past. Show verification status, location, category, organizer, registration URL and evidence. Unknown means “Belum terverifikasi”. Preparation checklist is draft until approved.

### Coach / agent workspace
Conversation-like task input plus run history. Output sections: summary, evidence, assumptions, unknowns, recommendation, risks and proposed actions. Proposed actions have preview/edit/approve/reject. Long tasks show queued/running/awaiting approval/completed/failed/cancelled. Never show hidden reasoning.

### Memory and privacy
Group facts into proposed/confirmed/rejected/stale. Each has origin and review date. Controls: confirm, correct, reject, delete, export. Explain that deleting a memory fact does not automatically delete its source activity/profile record.

### Integrations
States: not connected, connecting, connected, sync pending, stale, error, revoked. Explain scopes before OAuth. Show last successful sync, last attempt, imported count and safe error. Disconnect and data controls are prominent.

## Visual system
Clean, premium, restrained. Clear hierarchy, readable numbers, consistent spacing. Avoid excessive gradients, glass effects, meaningless charts and decorative badges. Semantic colors only for statuses. Every metric includes units and time range. Pace min/km, distance km, duration and elevation m. Support reduced motion and keyboard focus.

## Interaction states
Every page defines loading, empty/first-use, success, validation error, provider unavailable, stale, permission denied, retryable error, destructive confirmation and network failure. No infinite spinner. Retry must not duplicate writes.

## Accessibility
Semantic landmarks/headings, labels, visible focus, WCAG AA contrast target, touch-friendly controls, narrow-phone/tablet/desktop testing. Charts have text summaries or tables. Never communicate status by color alone.

## UX acceptance
First-time runner understands onboarding; returning runner sees useful home; planned differs from attended; suggestion evidence is inspectable; rejection preserves source data; disconnect is clear; all pages have accessible empty/error/loading states.
