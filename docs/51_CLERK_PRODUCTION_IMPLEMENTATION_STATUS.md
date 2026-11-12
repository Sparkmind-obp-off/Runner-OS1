# 51 — Clerk Production (Google sign-in): Implementation Status & Handoff

**Date:** 2026-11-12 (updated 2026-11-13) · **Baseline commit:** `1742863` (main) · **Scope:** Workstream 1 (Identity) from Doc 50, section E.

> **Current status summary (2026-11-13) — see §12 for evidence.** Google-only code on branch `feat/clerk-production-only-auth` (PR #4): IMPLEMENTED + TESTED (109/109). Production (`main` @ `4a5ee61`): DEPLOYED but **Google sign-in is broken in production** (clerk-js v5 rejected by Clerk as outdated; CSP blocks Clerk Protect) and password endpoints are still live. The fixes are only on the branch; merge + deploy need owner authorization. Real Google login: NOT RUN. Old `CLERK_SECRET_KEY` still valid → rotation REQUIRED.

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
| Auth baseline | Clerk identity + internal opaque HttpOnly session; legacy password path now retired in the Clerk-only change set |

## 2. Clerk instance (verified via Backend API, read-only)

- Instance `ins_3M1KCjOss6ZUdnh49g3j4cXohpc`, `environment_type = production`.
- Domain `runner-os.biz.id`; Frontend API `https://clerk.runner-os.biz.id`; Accounts portal `https://accounts.runner-os.biz.id`.
- JWKS available from Backend API (`/v1/jwks`, RS256, `kid = ins_3M1K…`).
- **Superseded by live Clerk check 2026-11-13:** all five CNAME records are verified; `clerk.runner-os.biz.id` and `accounts.runner-os.biz.id` SSL are complete; mail records are complete; overall domain status is `complete`.
- Required DNS (all CNAME, DNS-only / not proxied, as returned by Clerk):

| Host | Target |
|---|---|
| `clerk.runner-os.biz.id` | `frontend-api.clerk.services` |
| `accounts.runner-os.biz.id` | `accounts.clerk.services` |
| `clkmail.runner-os.biz.id` | `mail.v5t1p2mv37lx.clerk.services` |
| `clk._domainkey.runner-os.biz.id` | `dkim1.v5t1p2mv37lx.clerk.services` |
| `clk2._domainkey.runner-os.biz.id` | `dkim2.v5t1p2mv37lx.clerk.services` |

The prior DNS permission limitation is no longer a blocker: Clerk's live domain check now reports all five records verified. No DNS changes were made during the 2026-11-13 audit.

## 3. What was implemented

| Item | Status | Files |
|---|---|---|
| Migration `0004_clerk_identity.sql` (`external_identities`, `auth_events`; additive, unique `(provider,subject)` + `(owner_id,provider)`) | IMPLEMENTED, TESTED (local D1) | `migrations/0004_clerk_identity.sql` |
| Server-side Clerk token verification: RS256 via Web Crypto, JWKS (Backend API first, Frontend API fallback, 1h cache, refresh on unknown `kid`), `iss` = Frontend API derived from publishable key, `exp`/`nbf`/`iat` with 60s skew, `azp` allow-list, rejects `sts=pending`, `alg≠RS256`, oversized tokens | IMPLEMENTED, TESTED | `src/infrastructure/clerk.ts` |
| Identity mapping service: Clerk subject → canonical internal `users.id`; new user + identity created atomically; **email collision never auto-links** (`409 ACCOUNT_LINK_REQUIRED`); unverified email refused; race-safe; audit events | IMPLEMENTED, TESTED | `src/application/clerk-auth-service.ts` |
| Explicit linking legacy → Google (requires legacy session **and** verified Clerk token; one subject ↔ one tenant) | IMPLEMENTED, TESTED | same |
| Google-only accounts cannot log in with a password (`!clerk-only` marker) | IMPLEMENTED, TESTED | `auth-service.ts`, `crypto.ts` |
| API: `GET /api/auth/config`, `POST /api/auth/clerk/session`, `POST /api/auth/clerk/link`, `GET /api/auth/identities` | IMPLEMENTED, TESTED | `src/index.ts`, `src/http/schemas.ts` |
| Fail-closed: Clerk enabled only if `CLERK_PUBLISHABLE_KEY` **and** `CLERK_SECRET_KEY` exist; password register/login are disabled by default and never used as fallback | IMPLEMENTED in current branch; tests added | `src/index.ts` |
| CSP extended only when Clerk configured (Clerk FAPI origin, Cloudflare Turnstile, `img.clerk.com`) | IMPLEMENTED, TESTED | `buildCsp()` in `src/index.ts` |
| Frontend: one Google sign-in entry point, `/sso-callback`, explicit account linking from an existing session, Clerk sign-out on logout; no email/password form or fallback | IMPLEMENTED + browser-TESTED up to Google consent on branch (§12); real Google login NOT RUN | `public/static/clerk-auth.js`, `public/static/app.js`, `style.css` |
| Legacy password register/login | RETIRED by default; test-only fixture flag is opt-in; old sessions remain valid only for explicit Google linking until expiry | `src/index.ts`, tests |

Internal sessions issued from a Clerk sign-in last 7 days. The Clerk token is only used once as a bridge; the browser never sends an owner id. Existing legacy sessions remain usable for the explicit linking flow, but new password sessions cannot be created.

## 4. Tests executed

- `npm test` → **91/91 passed** at `e129a77` (67 baseline + 24 in `tests/clerk.test.ts`). Superseded: **109/109** on the branch at the 2026-11-13 audit (see Doc 53).
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

1. **DNS + custom domain — VERIFIED 2026-11-13:** all five CNAME records report `verified:true`; SSL is complete for `clerk.runner-os.biz.id` and `accounts.runner-os.biz.id`; mail records are complete; domain status is `complete`.
2. **Google OAuth Production — CONFIGURED 2026-11-13:** Clerk reports Google enabled with Client ID and Client Secret configured. Values are intentionally not reproduced here.
3. **Browser end-to-end — NOT RUN:** still test real Google sign-up/sign-in on `https://runner-os.biz.id`, protected API access, logout, and account linking with data continuity.
4. **Rotate `CLERK_SECRET_KEY` — REQUIRED (verified 2026-11-13: the exposed key still authenticates against the Clerk Backend API).** Rotate in Clerk, update the Cloudflare Pages encrypted secret, then redeploy. Never paste the secret into chat or GitHub.
5. **Authorize merge of PR #4 + production deploy** (fixes the broken production sign-in, see §12).
6. Then run the production verification (§7) with a dedicated owner-controlled Google test account.

## 7. Production verification still required (Doc 50 E4)

PRODUCTION VERIFIED may be claimed only after, on `https://runner-os.biz.id`: real Google sign-up + sign-in, protected API call, logout, legacy user linking with data continuity, and preview/production key isolation are checked with redacted evidence. DNS/SSL and Google provider configuration alone do not satisfy browser end-to-end verification.

## 8. Rollback

- App: redeploy previous Pages deployment (Cloudflare dashboard → Deployments → Rollback). Removing `CLERK_SECRET_KEY` disables Clerk and leaves the application unable to authenticate new users; there is intentionally no password fallback. Restore the secure Clerk configuration to recover sign-in.
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
| Real Google sign-in on production | **NOT RUN / NOT VERIFIED** | DNS + SSL + Google OAuth are now configured; browser end-to-end remains to be tested |


## 11. Clerk-only authentication decision and implementation (2026-11-13)

**Decision: Clerk Production Google is the only supported Runner OS authentication method.** Native email/password registration and login are retired; no automatic fallback is permitted if Clerk is unavailable.

- The unauthenticated welcome/login UI contains one Google action only. It does not render email, password, register, or switch-account forms.
- `POST /api/auth/register` and `POST /api/auth/login` return HTTP 410 `PASSWORD_AUTH_DISABLED` by default. The optional legacy password path in `createApp` is an explicit test fixture flag only and must never be enabled in production.
- `GET /api/auth/config` reports `legacyPassword:false`. If Clerk Production configuration is absent, Google sign-in remains unavailable and the application fails closed.
- `POST /api/auth/clerk/session` remains the only new-user/sign-in bridge. Server-side JWT/JWKS verification, verified-email requirement, identity mapping, and owner isolation remain mandatory.
- **Migration policy: Option B — explicit linking.** An existing account can link its Google identity only while the user has a still-valid Runner OS session, via Profile → Link Google. Email equality alone never links identities.
- Existing `users.id`, profile, activities, runs, and other owner-scoped records are preserved. No user or data rows are deleted or bulk-reassigned by this change. The additive identity mapping connects the Clerk subject to the same internal owner ID.
- Existing legacy sessions are not invalidated by the UI/API retirement and can be used to complete explicit linking until they expire. A user with no valid session cannot self-link through email matching; a separate verified account-recovery process is required before linking.
- Tests retain a clearly named, opt-in test fixture to construct legacy sessions and verify migration/linking. Production uses the default `allowLegacyPasswordAuth:false`.

**Change-set status:** implementation is prepared on branch `feat/clerk-production-only-auth`; it is not yet merged to `main` or deployed. The branch must pass CI and code review before production rollout. Do not claim the production UI or endpoints have changed until merge/deploy is confirmed.


## 12. Audit 2026-11-13 — branch hardening, browser evidence, production gap

**Branch:** `feat/clerk-production-only-auth` (PR #4), base `main` @ `4a5ee61`. Full matrix in [Doc 53](53_CLERK_PRODUCTION_QA_REPORT.md); journey in [Doc 52](52_CLERK_GOOGLE_ONLY_USER_JOURNEY.md).

### Live configuration (re-checked, read-only)

| Item | Result |
|---|---|
| `clerk.runner-os.biz.id`, `accounts.runner-os.biz.id` DNS + TLS | resolve; JWKS 200 |
| Clerk instance | `production`; only `oauth_google` enabled; email/password/phone/username attributes **disabled**; sign-up `public` |
| Google redirect URI (observed in a real browser) | `https://clerk.runner-os.biz.id/v1/oauth_callback`, Google `client_id` present (custom credentials) |
| Pages production env | `CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `CLERK_AUTHORIZED_PARTIES`, `GROQ_API_KEY` (encrypted); D1 `DB` bound |
| Pages **preview** env | no Clerk secrets, no D1 binding → preview fails closed (isolated, but not functional) |
| Exposed `CLERK_SECRET_KEY` | **still valid** → rotation required |
| Production D1 | 3 users, 0 Clerk identities, 3 unlinked legacy users, 1 user with a still-valid session (counts only; no personal data read) |

### Defects found and fixed on the branch

| # | Defect | Impact | Fix |
|---|---|---|---|
| 1 | Clerk Production rejects `clerk-js@5` sign-ins: `403 … "This app uses an outdated version of Clerk"` | **No Google sign-in possible in production** | load `clerk-js@6` |
| 2 | CSP blocked Clerk Protect (`cdn.protect.clerk.com` script, `*.client.protect.clerk.com:<port>` probes) | sign-in attempts rejected | CSP adds `https://cdn.protect.clerk.com` (script) and `https://*.protect.clerk.com:*` (connect), only when Clerk is configured |
| 3 | Email attribute disabled on the instance → Clerk users have no `email_addresses`; backend required a primary email | every new Google user would get `403 EMAIL_UNVERIFIED` | `resolveVerifiedEmail()` falls back to the **verified** `oauth_google` external-account email |
| 4 | `ACCOUNT_LINK_REQUIRED` message told users to log in with a password | contradicts Google-only policy | message now explains explicit linking / verified recovery |
| 5 | Session-expired banner in English and routed to a removed login mode | wrong UX | Indonesian message on the Google screen |
| 6 | Callback could exchange twice (navigate + re-boot) and treated cancellation as an error | duplicate requests / confusing UX | in-place `handleRedirectCallback`, explicit "dibatalkan" state |
| 7 | No CI | PR checks empty | workflow prepared at `docs/ci/github-actions-ci.yml`; installing it in `.github/workflows/` is **BLOCKED** (GitHub App lacks `workflows` permission) — owner action |

Defects 1–3 were proven in a real Chromium against production Clerk; with fixes 1–2 applied the browser reaches Google's consent screen.

### Production state

`main` / production is still `4a5ee61`: `legacyPassword:true`, password register/login live, `clerk-js@5`, CSP without Protect. **Merge + deploy of PR #4 is required and requires owner authorization.** No production deploy, D1 change or secret change was made during this audit.
