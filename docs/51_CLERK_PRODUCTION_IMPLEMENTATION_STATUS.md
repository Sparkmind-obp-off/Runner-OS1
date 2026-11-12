# 51 — Clerk Production (Google sign-in): Implementation Status & Handoff

**Date:** 2026-11-12 · **Baseline commit:** `1742863` (main) · **Scope:** Workstream 1 (Identity) from Doc 50, section E.

Status vocabulary follows Doc 50 A11: IMPLEMENTED / TESTED / DEPLOYED / PRODUCTION VERIFIED / BLOCKED / NOT RUN.

## 1. Baseline (before changes)

| Check | Result |
|---|---|
| `npm test` | 67/67 passed |
| `npm run typecheck` | clean |
| `npm run build` | OK (`_worker.js` 251 KB) |
| `npm audit` | moderate: vitest, hono; high: sharp (transitive), zod |
| Production D1 (`runner-os-core-production`) | migrations 0001–0003 applied, nothing pending |
| Production Pages project | `runner-os` → `runner-os.pages.dev`, `runner-os.biz.id`; secret `GROQ_API_KEY` only |
| Auth | legacy email/password, PBKDF2, hashed opaque session token in HttpOnly cookie |

## 2. Clerk instance (verified via Backend API, read-only)

- Instance `ins_3M1KCjOss6ZUdnh49g3j4cXohpc`, `environment_type = production`.
- Domain `runner-os.biz.id`; Frontend API `https://clerk.runner-os.biz.id`; Accounts portal `https://accounts.runner-os.biz.id`.
- JWKS available from Backend API (`/v1/jwks`, RS256, `kid = ins_3M1K…`).
- **`clerk.runner-os.biz.id` does NOT resolve in DNS yet** → Clerk browser SDK cannot load → Google button stays hidden (by design, fail-closed).
- Required DNS (all CNAME, DNS-only / not proxied, as returned by Clerk):

| Host | Target |
|---|---|
| `clerk.runner-os.biz.id` | `frontend-api.clerk.services` |
| `accounts.runner-os.biz.id` | `accounts.clerk.services` |
| `clkmail.runner-os.biz.id` | `mail.v5t1p2mv37lx.clerk.services` |
| `clk._domainkey.runner-os.biz.id` | `dkim1.v5t1p2mv37lx.clerk.services` |
| `clk2._domainkey.runner-os.biz.id` | `dkim2.v5t1p2mv37lx.clerk.services` |

The Cloudflare API token available to the agent has **no DNS permission** (`Authentication error` on `dns_records`), so the agent could not create these records.

## 3. What was implemented

| Item | Status | Files |
|---|---|---|
| Migration `0004_clerk_identity.sql` (`external_identities`, `auth_events`; additive, unique `(provider,subject)` + `(owner_id,provider)`) | IMPLEMENTED, TESTED (local D1) | `migrations/0004_clerk_identity.sql` |
| Server-side Clerk token verification: RS256 via Web Crypto, JWKS (Backend API first, Frontend API fallback, 1h cache, refresh on unknown `kid`), `iss` = Frontend API derived from publishable key, `exp`/`nbf`/`iat` with 60s skew, `azp` allow-list, rejects `sts=pending`, `alg≠RS256`, oversized tokens | IMPLEMENTED, TESTED | `src/infrastructure/clerk.ts` |
| Identity mapping service: Clerk subject → canonical internal `users.id`; new user + identity created atomically; **email collision never auto-links** (`409 ACCOUNT_LINK_REQUIRED`); unverified email refused; race-safe; audit events | IMPLEMENTED, TESTED | `src/application/clerk-auth-service.ts` |
| Explicit linking legacy → Google (requires legacy session **and** verified Clerk token; one subject ↔ one tenant) | IMPLEMENTED, TESTED | same |
| Google-only accounts cannot log in with a password (`!clerk-only` marker) | IMPLEMENTED, TESTED | `auth-service.ts`, `crypto.ts` |
| API: `GET /api/auth/config`, `POST /api/auth/clerk/session`, `POST /api/auth/clerk/link`, `GET /api/auth/identities` | IMPLEMENTED, TESTED | `src/index.ts`, `src/http/schemas.ts` |
| Fail-closed: Clerk enabled only if `CLERK_PUBLISHABLE_KEY` **and** `CLERK_SECRET_KEY` exist; otherwise 503 `IDENTITY_PROVIDER_UNAVAILABLE` and legacy login keeps working | IMPLEMENTED, TESTED | `src/index.ts` |
| CSP extended only when Clerk configured (Clerk FAPI origin, Cloudflare Turnstile, `img.clerk.com`) | IMPLEMENTED, TESTED | `buildCsp()` in `src/index.ts` |
| Frontend: "Masuk/Daftar dengan Google" (shown only if Clerk SDK actually loads), `/sso-callback` handler, "Hubungkan akun Google" in Profil, Clerk sign-out on logout | IMPLEMENTED (browser flow NOT RUN end-to-end) | `public/static/clerk-auth.js`, `public/static/app.js`, `style.css` |
| Legacy email/password retained | unchanged | — |

Internal sessions issued from a Clerk sign-in last 7 days (legacy: 30 days). The Clerk token is only used once as a bridge; the browser never sends an owner id.

## 4. Tests executed

- `npm test` → **91/91 passed** (67 baseline + 24 new in `tests/clerk.test.ts`, using real RSA-2048 keys and signed JWTs).
- Negative cases covered: expired, wrong issuer, wrong `azp`, `nbf` in future, pending session, foreign signing key, unknown `kid`, `alg:none`, tampered payload, malformed/oversized/extra-field bodies, unverified email, email-collision takeover attempt, subject already linked to another tenant, second Google account on same tenant, cross-tenant read, password login on Google-only account, logout revocation, Clerk not configured.
- `npm run typecheck` clean; `npm run build` OK; `wrangler d1 migrations apply --local` applied 0004.
- Local `wrangler pages dev` with production Clerk keys: `/api/auth/config` reports `enabled:true, environment:production`; forged token → `401 AUTH_INVALID`.
- `npm audit fix` (non-breaking) applied; remaining: `zod <4.6.6` (high, fix requires major upgrade → not done in this phase).

## 5. Environment variables (names only)

| Name | Where | Public/Secret | Purpose |
|---|---|---|---|
| `CLERK_PUBLISHABLE_KEY` | Pages production | public config (stored as secret for simplicity) | identifies Clerk instance / derives issuer |
| `CLERK_SECRET_KEY` | Pages production | **secret** | Backend API (JWKS, user email verification) |
| `CLERK_AUTHORIZED_PARTIES` | Pages production | config | comma list of allowed `azp` origins, e.g. `https://runner-os.biz.id` |
| `CLERK_JWT_KEY` | optional | public key | networkless verification (PEM) |

Preview deployments must use a separate Clerk development instance (`pk_test_…`/`sk_test_…`). A production token is rejected by a preview configured with a different issuer and vice versa (issuer is derived from the publishable key).

## 6. Owner checklist (remaining)

1. **Cloudflare DNS** (zone `runner-os.biz.id`): add the five CNAME records in §2, **DNS only (grey cloud)**. Or give the agent a token with `Zone → DNS → Edit` for this zone.
2. **Clerk Dashboard → Domains**: click *Verify configuration* until DNS + SSL are green.
3. **Clerk Dashboard → SSO connections → Google**: production requires **custom Google OAuth credentials**. In Google Cloud Console create an OAuth client (Web), set *Authorized redirect URI* to the value Clerk shows on that page (it is on `https://clerk.runner-os.biz.id/...`), paste Client ID/Secret into Clerk, enable.
4. **Clerk Dashboard → User & authentication**: keep email-verified Google as the only social provider; disable other strategies if not wanted.
5. **Rotate `CLERK_SECRET_KEY`**: the key was shared in a chat transcript. After rotation, update the Pages secret (`wrangler pages secret put CLERK_SECRET_KEY --project-name runner-os`) and redeploy.
6. Then run the production verification (§7).

## 7. Production verification still required (Doc 50 E4)

PRODUCTION VERIFIED may be claimed only after, on `https://runner-os.biz.id`: real Google sign-up + sign-in, protected API call, logout, legacy user linking with data continuity, and preview/production key isolation are checked with redacted evidence.

## 8. Rollback

- App: redeploy previous Pages deployment (Cloudflare dashboard → Deployments → Rollback) or remove `CLERK_SECRET_KEY` → Clerk disabled instantly (fail-closed), legacy login unaffected.
- DB: `0004` is additive; rollback = `DROP TABLE auth_events; DROP TABLE external_identities;` (no existing table altered).

## 9. Next phase

Workstream 0/1 remainder: rate limiting for `/api/auth/*` and `/api/ai/*`, account export/deletion, zod major upgrade, then Workstream 2 (Agentic Core: run state, tool registry, approvals).

## 10. Deployment record (2026-11-12)

| Step | Status | Evidence |
|---|---|---|
| Pages secrets `CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `CLERK_AUTHORIZED_PARTIES` | DONE | `wrangler pages secret list` → all present, encrypted |
| Production D1 migration `0004_clerk_identity.sql` | DONE | `wrangler d1 migrations apply --remote` ✅; tables `external_identities`, `auth_events` exist |
| Pages deploy (commit `e129a77`) | DEPLOYED | https://5426fa65.runner-os.pages.dev |
| `GET /api/auth/config` on `runner-os.biz.id` + `runner-os.pages.dev` | PRODUCTION VERIFIED | `clerk.enabled=true`, `environment=production` |
| Forged Clerk token → `401 AUTH_INVALID`; link without session → `401` | PRODUCTION VERIFIED | curl |
| Legacy register → `/api/auth/identities` → logout | PRODUCTION VERIFIED | throwaway account, deleted afterwards |
| Browser console on `/` | no errors | Playwright |
| Real Google sign-in on production | **BLOCKED** | DNS `clerk.runner-os.biz.id` + Google OAuth credentials (see §6) |
