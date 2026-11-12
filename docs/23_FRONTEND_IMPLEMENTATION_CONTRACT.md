# Runner OS — Frontend Implementation Contract

Current repository baseline is static HTML/CSS/JavaScript served by a Cloudflare Pages Worker bundle. Do not assume React/Vite. Inspect actual source before choosing a rewrite. Preserve working UI and evolve incrementally.

## Architecture
- UI owns presentation, navigation and local form state.
- API owns authentication, authorization, domain validation and canonical writes.
- No AI provider key or Strava token in browser code.
- Same-origin authenticated API calls.
- Existing response envelope is data on success and error object on failure.
- Domain calculations live in server/shared pure functions with tests.

## Suggested modules
Adapt to actual repository: app shell/navigation; Home, Schedule, Activities, Events, Coach, Profile, Integrations and Settings pages; reusable status, metric, evidence, form, empty/loading and approval components; typed API client; date/time/distance/pace formatters.

Do not duplicate existing layers or introduce a frontend framework without measurable benefit.

## API client
Centralize fetch and response parsing. Handle expired session safely. Do not retry non-idempotent POST without idempotency key. Render safe error messages, never stack traces. Avoid logging personal payloads.

## UI data contracts
Domain records include ID, source/provenance, timestamps, lifecycle/verification state and nullable metrics.

AI suggestion includes summary, evidence refs, assumptions, unknowns, risks, proposed actions and approval status. Agent run includes ID, status, summary, timestamps, progress, safe error and retryability. Never expose chain-of-thought.

Integration UI includes provider, status, scopes, last sync and safe error. Never expose access/refresh tokens.

## Forms and charts
Client validation is for UX; server validation is authoritative. Preserve input after retryable errors. Optional fields are explicit. Prevent double submit; backend idempotency remains mandatory. Dates use selected timezone. Charts require sufficient data, sample count, range, source and caveat. Do not invent readiness score or causal conclusions.

## Security
No secrets in JS bundle, HTML, source maps or local storage. No raw HTML injection from AI/imported content. Render external text as escaped text. Restrict external links. Never trust client-supplied owner, role or provider scope.

## Delivery gates
Existing pages keep working; responsive/accessibility checks pass; API error/empty contracts tested; build output scanned for secrets; smoke tests cover login, onboarding, activity, event, AI unavailable and integration unavailable.
