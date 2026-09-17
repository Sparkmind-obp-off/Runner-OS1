# Runner OS

Runner OS is a calm personal execution system for everything a person is actively running. The canonical **Run** remains the only execution entity. Phase 2 adds a lightweight Productivity Layer for daily focus, organization, search, and deterministic due-time awareness without introducing a competing task or project model.

## Completed features

### Runner Core

- Email/password registration and login with PBKDF2 password hashes and opaque HTTP-only session cookies.
- Server-side owner isolation for every Run and Run Event operation.
- Run creation, detail, metadata editing, next action, progress, blocker, due time, and archive behavior.
- Domain-enforced lifecycle: `planned → active → paused / blocked → active → completed / archived`.
- Append-oriented history for creation, metadata, next action, progress, focus, and lifecycle changes.
- Transactional Run and event writes through Cloudflare D1.

### Phase 2 Productivity Layer

- Normalized, deduplicated Run tags (up to 10) for lightweight grouping.
- A deliberately limited daily focus set of up to three actionable Runs.
- Server-side search, filtering by status/priority/type/tag, and deterministic sorting by priority/due/update/title.
- Today decision surface with focused, active, blocked, resumable, overdue, upcoming, priority, and recent-change views.
- UTC due-time storage and deterministic overdue/upcoming rules; completed and archived Runs are excluded from active overdue work.
- Improved Run cards and detail view with due state, tags, next action, progress, focus controls, and recovery guidance.
- Responsive mobile navigation, filters, loading/error/empty states, and accessible modal/dialog labels.

### Phase 3 Authentication and production hardening

- Cloudflare-compatible PBKDF2 password hashing at the Workers Web Crypto maximum of 100,000 iterations.
- Opaque 30-day server-side sessions stored as SHA-256 token hashes in D1.
- Host-only `HttpOnly`, `SameSite=Strict`, `Path=/` cookies; `Secure` is enabled on HTTPS production origins.
- Server-confirmed session bootstrap after login/registration, explicit expired-session UX, and logout state cleanup.
- Dynamic security headers on Worker responses and revalidated unversioned static assets to prevent stale auth bundles.
- Expanded authentication, cookie, expiry, logout, invalid-session, and ownership regression coverage.

## URLs

- **Local preview:** `http://localhost:3000`
- **Health:** `GET /health`
- **Production custom domain:** https://runner-os.biz.id
- **Canonical Pages origin:** https://runner-os.pages.dev
- **GitHub:** https://github.com/Sparkmind-obp-off/Runner-OS1

## API

All successful responses use `{ "data": ... }`. Errors use `{ "error": { "code", "message", "details?" } }`. Cross-owner access fails closed as `NOT_FOUND`.

Authentication:

- `POST /api/auth/register` — `{ email, displayName, password }`
- `POST /api/auth/login` — `{ email, password }`
- `POST /api/auth/logout`
- `GET /api/auth/me`

Protected Runner Core and productivity routes:

- `GET /api/runs` — optional query parameters: `status`, `priority`, `type`, `tag`, `search`, `sort`, `direction`
- `POST /api/runs` — supports optional `priority`, `nextAction`, `dueAt`, and `tags`
- `GET|PATCH|DELETE /api/runs/:id` (`DELETE` is safe archive semantics)
- `PATCH /api/runs/:id/next-action`
- `PATCH /api/runs/:id/progress`
- `PATCH /api/runs/:id/focus` — `{ focusDate: "YYYY-MM-DD" | null, focusOrder?: 1 | 2 | 3 | null }`
- `POST /api/runs/:id/start|pause|block|resume|complete|archive`
- `GET /api/runs/:id/history`
- `GET /api/today?date=YYYY-MM-DD`

## Data architecture

Cloudflare D1 stores:

- `users` — identity plus salted PBKDF2 password material;
- `sessions` — SHA-256 hashes of random opaque tokens;
- `runs` — canonical owner-scoped state, including JSON tags and optional daily focus fields;
- `run_events` — append-oriented, owner-scoped history.

Migrations:

- `0001_runner_core.sql` — Phase 1 identity, sessions, Runs, and event history.
- `0002_productivity_layer.sql` — tags, focus date/order, and due/focus indexes.

IDs are UUIDs. Instants are UTC ISO-8601 strings. Daily focus uses a client-local `YYYY-MM-DD` key supplied to the server, while due comparisons use the server-generated UTC instant returned by Today.

## User guide

1. Create an account or sign in.
2. Capture a Run with a title, type, outcome, optional next action, due time, priority, and tags.
3. Use **Runs** to search, filter, and sort commitments.
4. Add up to three actionable Runs to **Today focus**.
5. Open a Run to start it, update its next action/progress, or handle pause/block/recovery.
6. Use Today to see overdue and upcoming work without completed or archived noise.
7. Complete the Run and inspect its immutable history timeline.

## Development

Prerequisites: Node.js 20+ and npm.

```bash
npm install
npm run db:migrate:local
npm run build
npm run dev
```

Sandbox service workflow:

```bash
npm run build
pm2 start ecosystem.config.cjs
curl http://localhost:3000/health
```

Quality gates:

```bash
npm test
npm run typecheck
npm run build
npm audit
```

## Production deployment

1. Supply a Cloudflare API token through the project Deploy panel; never commit it.
2. Use the configured D1 database `runner-os-core-production` and its binding in `wrangler.jsonc`.
3. Run `npm run db:migrate:prod`.
4. Build and deploy Pages project `runner-os` through the BYOK Wrangler workflow.
5. Keep `runner-os.biz.id` attached to that Pages project; API calls remain relative and same-origin.

Production and preview/custom origins intentionally receive separate host-only session cookies. A login on `runner-os.biz.id` does not authenticate `runner-os.pages.dev`, and vice versa. `.env.example` documents boundaries without values. `.dev.vars`, `.env*`, API tokens, and credentials are git-ignored.

See `docs/15_PHASE_3_STATUS.md` for the authentication architecture, cookie contract, browser matrix, and manual acceptance checklist.

## Not yet implemented

Focus-session logging, goals, activity records, external connectors, autonomous AI actions, team/social features, analytics-heavy dashboards, and complex project-management methods remain deferred. Phase 2 intentionally uses tags and daily focus instead of adding independent Project or Task entities.

## Recommended next sprint

Run the documented Phase 3 acceptance matrix in Firefox, Safari/WebKit, and representative mobile browsers using `https://runner-os.biz.id`. After that operational sign-off, return to product validation before starting any new feature phase.

## Deployment status

- **Platform:** Cloudflare Pages + Hono + D1
- **Status:** Phase 3 implementation verified locally; production BYOK deployment and post-deploy checks are recorded in `docs/15_PHASE_3_STATUS.md`
- **Last updated:** 2026-09-17
