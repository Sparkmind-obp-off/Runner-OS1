# 53 — Clerk Production (Google-only) QA Report

**Date:** 2026-11-13 · **Branch:** `feat/clerk-production-only-auth` (PR #4) · **Base:** `main` @ `4a5ee61` · **Environment:** Genspark Linux sandbox, Node 22, wrangler 4.131.2, Chromium headless (Playwright 1.x).

Labels: IMPLEMENTED / TESTED / DEPLOYED / PRODUCTION VERIFIED / NOT RUN / BLOCKED (Doc 50 A11). A mock-provider test does not prove a live provider; a browser run against production Clerk without a real Google login does not prove Google sign-in.

## 1. Commands actually executed (all exit 0)

| # | Command | Result |
|---|---|---|
| 1 | `npm ci` | installed from lockfile |
| 2 | `npm run typecheck` | clean |
| 3 | `npm test` | **8 files, 109/109 passed** |
| 4 | `npm run build` | `dist/_worker.js` 267.7 KB; `dist/static/{app.js,clerk-auth.js,style.css}` |
| 5 | `wrangler d1 migrations apply runner-os-core-production --local --persist-to /tmp/d1iso` | 0001–0004 applied on an empty isolated DB |
| 6 | `grep -rn 'type="password"' dist/static/` | no match |
| 7 | `grep -rnE 'sk_(live\|test)_[A-Za-z0-9]{10,}' dist/ src/ public/` + `git diff origin/main` scan | no secret; `.dev.vars` untracked |
| 8 | Built worker run in Node to read the exact CSP | Clerk FAPI + Turnstile + Clerk Protect allowed only when Clerk is configured |
| 9 | Playwright scripts (`branch-ui.mjs`, `probe*.mjs`) against `https://runner-os.biz.id` + Clerk Production | see §3 |

`npm audit`: remaining `zod <4.6.6` (high, needs major upgrade) — not addressed in this change set.

## 2. Automated test matrix

| Requirement | Test (file › case) | Result |
|---|---|---|
| Google-only config `legacyPassword:false` | journey › deployed default export… | TESTED |
| Register → 410 `PASSWORD_AUTH_DISABLED` | journey › deployed default export…; api › disables password… | TESTED |
| Login → 410 | same | TESTED |
| Env vars cannot re-enable password | journey › environment variables cannot re-enable… | TESTED |
| Missing Clerk config → 503, no fallback | journey › no password fallback…; clerk › fails closed… | TESTED |
| No password input in served HTML | journey › HTML shell… + CI grep | TESTED |
| Forged JWT / invalid signature | clerk › foreign signing key, tampered payload, alg none | TESTED |
| Expired JWT | clerk › expired | TESTED |
| Wrong issuer / wrong `azp` / nbf / pending / unknown kid | clerk › rejects … | TESTED |
| Malformed / oversized / extra fields | clerk › malformed and oversized | TESTED |
| Unverified email | clerk › refuses unverified; journey › refuses unverified | TESTED |
| Verified email from Google external account (email attribute disabled) | journey › reads the verified email… | TESTED |
| New identity → 1 user + 1 identity, onboarding → dashboard, refresh | journey › Journey A | TESTED |
| Cookie HttpOnly + Secure + SameSite=Strict; token never in JSON | journey › Journey A | TESTED |
| Returning identity → same id, no duplicate, data kept | journey › Journey B; clerk › repeat sign-in | TESTED |
| Explicit linking from valid legacy session, same `users.id` + data | journey › links from a valid legacy session; clerk › links, preserves… | TESTED |
| Linking without session / forged cookie / expired session | journey › rejects linking… (×2); clerk › requires an authenticated legacy session | TESTED |
| No email-based auto-link | journey › never auto-links; clerk › anti-takeover | TESTED |
| Identity takeover (link another user's subject; 2nd Google on same user) | journey › cannot link another user's…; clerk › refuses… (×2) | TESTED |
| Cross-user read/modify, guessed owner id, both directions | journey › Tenant isolation; clerk › cross-tenant isolation | TESTED |
| Logout: session row deleted, cookie cleared with matching attributes, 401s, re-login | journey › Journey D; clerk › logout revokes | TESTED |
| Google-only account cannot use a password | clerk › Google-only accounts cannot… | TESTED |
| CSP only adds Clerk/Protect origins when configured | clerk › CSP | TESTED |
| Frontend pins `clerk-js@6` | journey › Frontend Clerk SDK pin | TESTED |

## 3. Browser evidence (Chromium, no Google account used)

### 3a. Production as deployed (`main` @ `4a5ee61`)

| Step | Result |
|---|---|
| Landing loads, Google button visible + enabled | PASS |
| Clerk SDK loads (`clerk-js 5.128.0`, instance `production`) | PASS |
| Click → Google | **FAIL**: CSP blocks `cdn.protect.clerk.com/.../bootstrap.js`; `POST /v1/client/sign_ins` → **403** "This app uses an outdated version of Clerk, so signing in isn't available right now" |

**Conclusion: Google sign-in on the currently deployed production is broken.**

### 3b. Branch build injected into the production origin (assets + CSP from `dist/`, real Clerk Production, no deploy)

| Step | Result |
|---|---|
| 360 / 390 / 768 / 1024 / 1440 px: exactly one button "Lanjutkan dengan Google", 0 forms, 0 email inputs, 0 password inputs | PASS ×5 |
| Button enabled after Clerk loads; status "Autentikasi aman oleh Clerk · Google" | PASS ×5 |
| No horizontal overflow | PASS ×5 |
| Click → `accounts.google.com/v3/signin/identifier` | PASS |
| `redirect_uri` = `https://clerk.runner-os.biz.id/v1/oauth_callback`; Google `client_id` present | PASS |
| `POST /v1/client/sign_ins` → 200 (clerk-js 6.42.3) | PASS |
| Browser console errors | none |
| `/sso-callback` with no Clerk session → "Login Google dibatalkan atau belum selesai…", back on `/`, `/api/auth/me` = `null` | PASS |

Screenshots were captured locally in the sandbox (`/tmp/e2e/branch-auth-*.png`, `03-google-consent.png`); they are not committed because they show third-party pages and are not needed as artefacts.

### 3c. Not run

| Step | Status | Reason |
|---|---|---|
| Completing Google authentication, callback with a real session, backend session from a real Clerk token | **NOT RUN** | needs an owner-controlled Google test account in an authorized browser session; no account was used |
| `/api/auth/me`, onboarding, dashboard, refresh, logout after a **real** Google login | **NOT RUN** | depends on the step above (covered by automated tests with signed JWTs only) |
| Legacy linking with a real legacy session in production | **NOT RUN** | 1 production user has a valid legacy session; only that owner can perform it |
| Safari/WebKit, real mobile devices | **NOT RUN** | — |

## 4. Configuration audit (no secret values read or printed)

| Item | Result |
|---|---|
| Publishable key → `clerk.runner-os.biz.id`, instance `production` | verified |
| Google redirect URI | `https://clerk.runner-os.biz.id/v1/oauth_callback` (observed) |
| Production secrets in Cloudflare (encrypted) | present: `CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `CLERK_AUTHORIZED_PARTIES` |
| Secret in browser bundle / Git | none |
| Preview environment | no Clerk keys, no D1 → fails closed; **a Development Clerk instance is not configured** (not blocking production) |
| Exposed `CLERK_SECRET_KEY` | **still valid** — rotation required (security finding S1) |

## 5. Security findings

| ID | Severity | Finding | Status |
|---|---|---|---|
| S1 | High | Clerk secret key shared in a chat transcript is still active | OPEN — owner must rotate |
| S2 | High | Production still exposes password register/login (`main`) | FIXED on branch, not deployed |
| S3 | High | Production Google sign-in non-functional (SDK v5 + CSP) | FIXED on branch, not deployed |
| S4 | High | Google-only instance would cause `EMAIL_UNVERIFIED` for every new user | FIXED on branch |
| S5 | Medium | `zod` advisory (needs major upgrade) | OPEN |
| S6 | Medium | No rate limiting on `/api/auth/*` | OPEN (next phase) |
| S7 | Low | Preview has no Development Clerk instance | OPEN |

No user rows were deleted or reassigned; no production D1 write occurred in this audit.

## 6. CI

**BLOCKED / NOT RUN.** The repository has no GitHub Actions workflow, and the agent's GitHub App token was refused when creating one (`refusing to allow a GitHub App to create or update workflow … without workflows permission`). The ready-to-use workflow is committed as [`docs/ci/github-actions-ci.yml`](ci/github-actions-ci.yml) (typecheck, tests, build, isolated D1 migrations, password-input and secret greps). Owner action: copy it to `.github/workflows/ci.yml` (GitHub web UI → Add file), or grant the app `workflows` permission. Until then PR #4 has **no CI checks**; only the local runs in §1 are evidence.

## 7. Release decision

**Code: locally verified (§1–3). Merge requires owner review; CI is BLOCKED until the workflow is installed (§6).**
**Production: NOT VERIFIED.** Release gate requires, in order:
1. Owner rotates `CLERK_SECRET_KEY` and updates the Cloudflare secret.
2. Owner authorizes merge of PR #4 and production deploy (BYOK).
3. Post-deploy: real Google sign-up + sign-in + logout with an owner-controlled test account; the one legacy user with a valid session links Google from Profil.
Until step 3 has evidence, Google sign-in must not be reported as PRODUCTION VERIFIED.
