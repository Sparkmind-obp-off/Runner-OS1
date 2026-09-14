# Runner OS

Runner OS is a calm personal execution system for everything a person is actively running. Phase 1 implements the canonical **Run** loop: capture, clarify, start, track, block/pause, recover, complete, and inspect history.

## Phase 1 features

- Email/password registration and login with PBKDF2 password hashes and opaque, HTTP-only session cookies.
- Server-side owner isolation for every Run and Run Event operation.
- Persistent Cloudflare D1 storage with a reproducible migration.
- Run creation, listing, detail, metadata editing, next action, progress, blocker, due time, and archive behavior.
- Domain-enforced lifecycle: `planned → active`, active pause/block/complete/archive, paused resume/complete/archive, and blocked recover/complete/archive.
- Append-oriented event timeline for important mutations.
- Focused Today dashboard: high-priority active Runs, next actions, blockers, resumable Runs, and recent changes.
- Explicit blocked recovery flow: identify blocker → set next action → resume.
- Stable JSON errors and automated domain, API, ownership, transaction, security, and UX acceptance tests.

## URLs

- **Local preview:** `http://localhost:3000`
- **Health:** `GET /health`
- **Production:** pending Cloudflare BYOK deployment
- **GitHub:** https://github.com/Sparkmind-obp-off/Runner-OS1

## API

Authentication:

- `POST /api/auth/register` — `{ email, displayName, password }`
- `POST /api/auth/login` — `{ email, password }`
- `POST /api/auth/logout`
- `GET /api/auth/me`

Protected Runner Core:

- `GET|POST /api/runs`
- `GET|PATCH|DELETE /api/runs/:id` (`DELETE` is safe archive semantics)
- `PATCH /api/runs/:id/next-action`
- `PATCH /api/runs/:id/progress`
- `POST /api/runs/:id/start|pause|block|resume|complete|archive`
- `GET /api/runs/:id/history`
- `GET /api/today`

Successful APIs return `{ "data": ... }`. Errors return `{ "error": { "code", "message", "details?" } }`. Cross-owner access fails closed as `NOT_FOUND`.

## Data architecture

Cloudflare D1 stores:

- `users` — identity plus salted PBKDF2 password material;
- `sessions` — only SHA-256 hashes of random opaque tokens;
- `runs` — canonical owner-scoped execution state;
- `run_events` — append-oriented, owner-scoped history.

Lifecycle writes update the Run and append its event in one transactional `D1.batch()` call. IDs are UUIDs and timestamps are UTC ISO-8601 values.

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

Quality checks:

```bash
npm test
npm run typecheck
npm run build
npm audit
```

## Environment and production configuration

- `.env.example` documents the server/client boundary and contains no values.
- Phase 1 needs no shared authentication secret: each session uses a random token and D1 stores only its hash.
- Never commit `.dev.vars`, `.env*` values, API tokens, or credentials.
- For production, create D1 database `runner-os-production`, replace `REPLACE_AFTER_D1_CREATION` in `wrangler.jsonc`, apply migrations remotely, then deploy `dist/` to Cloudflare Pages.
- Cloudflare API credentials are supplied through the project Deploy panel and loaded only into the sandbox environment for BYOK deployment.

## User guide

1. Create an account or sign in.
2. Use **New Run** to capture a title, type, outcome, and optional next action.
3. Open the Run and start it.
4. Update progress and the next action as work changes.
5. Pause or block the Run when appropriate. A blocked Run requires a blocker and a recovery next action before resume.
6. Complete the Run and inspect its History timeline.
7. Use Today to choose the highest-value next move.

## Not implemented (Phase 1 non-goals)

Strava, calendar/GitHub connectors, autonomous AI actions, social/team features, activity records, goals, complex project-management methodologies, and analytics are intentionally deferred.

## Recommended next step

After validating Phase 1 with real usage, begin Phase 2 productivity features while preserving Runner Core as the only execution state model.

## Deployment status

- **Platform:** Cloudflare Pages + Hono + D1
- **Status:** implementation verified locally; production deployment pending
- **Last updated:** 2026-09-14
