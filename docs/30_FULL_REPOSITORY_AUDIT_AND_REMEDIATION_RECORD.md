# Runner OS — Full Repository Audit & Remediation Record

**Audit date:** 2026-11-13  
**Repository:** `Sparkmind-obp-off/Runner-OS1`  
**Audited branch baseline:** `main` at `d8a44849edf4f657132f844dea998437a4bd732e`  
**Remediation branch:** `audit/runner-os-2026-hardening`

## Executive decision

Runner OS remains a Cloudflare Pages + Hono + TypeScript + D1 application with a static HTML/CSS/JavaScript frontend. Do not migrate it to React/Vite, Neon, or another framework/database without measured evidence. The product must remain useful without Strava and without an AI provider.

The 2026 Strava policy decision requires strict separation: Strava API-sourced activity records must never enter Runner OS AI prompts, context selection, summaries, embeddings, agent tools, or analytics. The audit found a concrete violation in the current source: `selectAIContext()` included every running activity, including records whose source was `strava`. This is a release-blocking policy gap and has been fixed on the remediation branch.

## Repository map reviewed

- Runtime and routing: `src/index.ts`
- AI provider and context boundary: `src/application/ai-service.ts`
- Authentication: `src/application/auth-service.ts`
- Running domain workflows: `src/application/phase4-service.ts`, `src/application/run-service.ts`
- Strava normalizer boundary: `src/application/strava-connector.ts`
- Persistence: `src/infrastructure/d1-store.ts`
- Validation: `src/http/schemas.ts`
- Browser UI: `public/static/app.js`, `public/static/style.css`
- D1 migrations: `migrations/0001` through `0003`
- Automated tests: `tests/*`
- Build/deploy configuration: `package.json`, `wrangler.jsonc`, `.env.example`
- Product and implementation docs: `docs/01` through `docs/29`

## Verified architecture facts

1. Frontend is static HTML/CSS/JavaScript; Worker API is Hono + TypeScript.
2. D1 is the canonical database. No demonstrated need for Neon/Postgres exists.
3. Authentication uses PBKDF2 password hashing, hashed opaque session tokens, owner IDs from authenticated server sessions, and HttpOnly/SameSite cookies.
4. Personal profile, recurring activity, occurrences, running activity, events and event evidence are owner-scoped in the service/store contracts.
5. Groq is called server-side through a provider adapter. The browser does not receive the API key.
6. AI suggestions are normalized as suggestions requiring confirmation; the AI endpoint reports no executed actions.
7. Strava OAuth, callback, token encryption/rotation, revocation, webhooks and live sync are not implemented.
8. Existing Strava connect and sync routes return unavailable; that is the truthful runtime state.
9. The original profile UI nevertheless rendered an enabled “Hubungkan Strava” button, which implied an available action despite the API returning 503. This has been changed to a disabled “Strava belum tersedia” state.
10. The AI context builder originally included `source === 'strava'` activity records. This has been corrected to exclude them before any AI context object is constructed.

## Remediation implemented on this branch

| Area | Finding | Change |
|---|---|---|
| AI policy boundary | Strava-sourced records were included in AI history context | Filter `source !== 'strava'` before building AI context |
| Regression coverage | No explicit assertion prevented Strava data entering AI context | Added a Strava fixture and negative assertions in `tests/phase5.test.ts` |
| Integration API truthfulness | `available` was derived from configured credentials even though OAuth was not implemented | GET status now explicitly reports unavailable/deferred capabilities |
| Frontend truthfulness | Profile showed an enabled connect button while connect always returned 503 | Disabled connect control and explanatory copy |
| Onboarding copy | Suggested Strava import could be enabled after OAuth setup without acknowledging AI policy boundary | Copy now directs users to native Runner OS activity records and says Strava is deferred |

## Remaining gaps — prioritized

### P0 — Must close before public release

- **Runtime verification:** this audit used the GitHub repository API. No local checkout/runtime was available in this pass, so tests, typecheck, build, npm audit, migrations and browser flows have not been rerun against the remediation branch.
- **AI provider live verification:** Groq secret presence is not proof that an authenticated production inference succeeds. Verify with a safe test account and a non-sensitive prompt; never print or transmit the secret.
- **Production deployment verification:** confirm Cloudflare Pages deployment is built from the remediation commit; verify `/health`, login, profile, manual activity, AI unavailable/success behavior, and response headers.
- **Privacy/Terms:** publish accurate privacy notice, terms, data retention/deletion process, AI disclosure, support/contact and incident response before public launch.
- **Abuse controls:** add and test server-side rate limits for registration, login and AI requests. Use Cloudflare-native controls where available; do not rely on browser throttling.
- **Account lifecycle:** define and implement authenticated account export/deletion, session revocation and deletion propagation for all owner-scoped records before public release.
- **Operational recovery:** document D1 backup/restore, migration rollback strategy, secret rotation and incident response.

### P1 — Important product completeness

- Add explicit pagination/limits for potentially growing activities, events, occurrences and run history; avoid unbounded list reads.
- Add request correlation IDs and structured redacted error logging. Never log cookies, passwords, tokens, API keys, or full sensitive prompts.
- Add AI usage/cost telemetry with owner-level quotas and bounded concurrency; avoid retaining full prompt/response transcripts by default.
- Add frontend loading, empty, validation, retry and offline/error states for every primary workflow.
- Add accessible keyboard/focus behavior and test narrow mobile widths and screen readers.
- Review date/time handling and timezone assumptions for recurrence and event dates.
- Add tests for concurrent registration, session expiry/revocation, owner isolation across every entity, malformed provider JSON, oversized provider output, and data deletion.

### P2 — Defer until product evidence supports it

- Durable agent workflows, specialist agents, approval inbox and proactive notifications.
- Cloudflare Workflows/Queues, R2, KV, Durable Objects, Vectorize, AI Gateway or Neon.
- Strava OAuth/display-only integration. Reconsider only after policy/legal review and a real user need; never connect Strava API data to AI.
- Third-party Strava MCP, custom Strava MCP, scraping, or proxy access: do not implement.

## Strava product rule

For the MVP, Strava is deferred. Native Runner OS records are the primary activity source. The current integration API must report `available: false`; the UI must not offer a working Connect/Sync action. Strava-sourced data, including any historical records already in D1, must be excluded from all AI context and AI-derived processing. User consent does not override Strava API policy.

## Release gates

1. Re-run `npm ci`, `npm test`, `npm run typecheck`, `npm run build`, `npm audit`, and local clean-database migrations.
2. Review test output, not merely command exit summaries.
3. Verify owner isolation and the new Strava-to-AI negative test.
4. Verify Cloudflare production bindings/secrets without exposing their values.
5. Deploy only after the owner approves production deployment and migrations.
6. Test production flows using a controlled account.
7. Keep the release private/beta until P0 gaps are closed.

## Audit limitations

This is a source/configuration audit based on the GitHub tree and retrieved files. It is not a penetration test, legal opinion, Cloudflare account inspection, D1 production data inspection, or live production/browser test. Any item not directly observed is marked as a verification requirement rather than assumed complete.
