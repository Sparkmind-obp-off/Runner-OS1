# 52 — Clerk Google-Only Authentication: User Journey & Architecture

**Policy:** Google via Clerk Production is the only way to sign in or sign up to Runner OS. There is no native email/password registration, no password login and no password fallback.
**Branch:** `feat/clerk-production-only-auth` (PR #4). Status labels follow Doc 50 A11.

## 1. Architecture

```
Browser (static app.js + clerk-auth.js)
  │ 1. GET /api/auth/config  → { legacyPassword:false, clerk:{ enabled, publishableKey, frontendApi } }
  │ 2. load clerk-js@6 from https://clerk.runner-os.biz.id (Clerk Production FAPI)
  │ 3. signIn.authenticateWithRedirect({ strategy:'oauth_google' })
  ▼
Clerk FAPI ──► accounts.google.com ──► https://clerk.runner-os.biz.id/v1/oauth_callback
  │ 4. back to https://runner-os.biz.id/sso-callback → handleRedirectCallback → Clerk session
  │ 5. POST /api/auth/clerk/session { token: <short-lived Clerk session JWT> }
  ▼
Hono Worker (Cloudflare Pages)
  6. verify RS256 signature (JWKS) · iss = FAPI from publishable key · exp/nbf/iat · azp allow-list · sts≠pending
  7. GET api.clerk.com/v1/users/{sub} (server secret) → verified Google email
  8. external_identities(provider='clerk', subject) → users.id   (create both atomically if new)
  9. issue opaque session token, store SHA-256 hash in D1 `sessions`, Set-Cookie runner_session (HttpOnly; Secure; SameSite=Strict; Path=/; 7 days)
  ▼
All /api/* use only the runner_session cookie; owner id is always derived server-side.
```

Clerk proves identity; Runner OS keeps its own internal user id and session. The Clerk token is a one-time bridge and is never stored. Session tokens are never returned in JSON.

## 2. Authentication states

| State | Trigger | Next |
|---|---|---|
| `anonymous` | no/expired/revoked `runner_session` | auth screen (one button, disabled until Clerk loads) |
| `clerk_loading` | page load | `ready` (button enabled) or `unavailable` (button disabled + reason) |
| `redirecting` | click **Lanjutkan dengan Google** | Google consent |
| `callback` | `/sso-callback` | `exchanging`, or `cancelled` (no Clerk session) |
| `exchanging` | POST `/api/auth/clerk/session` | `authenticated`, or `refused` (Clerk session signed out, message shown) |
| `authenticated` | cookie valid | onboarding (profile incomplete) → dashboard |
| `logged_out` | POST `/api/auth/logout` + Clerk signOut | `anonymous` |

No success UI is shown before the backend confirms the session with `/api/auth/me`.

## 3. Journeys

**A — new user.** Google → callback → backend verifies → no identity for `sub` and no user with that email → creates one `users` row + one `external_identities` row in a single D1 batch → cookie → `/api/auth/me` → profile empty → onboarding → dashboard. Refresh keeps the session.

**B — returning user.** Same `sub` → existing identity → same `users.id`; no new rows; profile, activities, plans unchanged.

**C — existing legacy account (Option B, explicit linking only).**
- Google sign-in with an email that already belongs to a legacy account → `409 ACCOUNT_LINK_REQUIRED`; nothing is created or linked.
- Linking is possible only from a still-valid legacy session: **Profil → Hubungkan akun Google** → Google → `POST /api/auth/clerk/link` (requires cookie **and** verified Clerk token) → identity row bound to the current `users.id`.
- Rejected: no session / expired session (401), subject already owned by another account (409), second Google account on the same user (409).
- If the legacy session has expired there is no self-service path: a separately verified recovery by support is required. The system never creates a new account and merges data.

**D — logout.** Server deletes the session row, cookie cleared with identical attributes (`Max-Age=0; Path=/; Secure; SameSite=Strict; HttpOnly`), Clerk browser session signed out, protected APIs return 401, `/api/auth/me` returns `null`. A new Google sign-in works normally.

## 4. Error and recovery cases

| Case | Server response | UI |
|---|---|---|
| Clerk not configured | `config.clerk.enabled=false`; `/clerk/session` → 503 | button disabled, admin message |
| Clerk SDK unreachable | — | button disabled, network message |
| OAuth cancelled / incomplete | no Clerk session | "Login Google dibatalkan atau belum selesai…" |
| Forged / expired / wrong issuer / wrong azp / pending token | 401 `AUTH_INVALID` | message, Clerk session signed out |
| Unverified Google email | 403 `EMAIL_UNVERIFIED` | message |
| Email belongs to legacy account | 409 `ACCOUNT_LINK_REQUIRED` | explanation, no auto-link |
| Identity conflict | 409 `IDENTITY_CONFLICT` | message |
| Password register/login | 410 `PASSWORD_AUTH_DISABLED` | not reachable from UI |
| App session expired | 401 `AUTH_REQUIRED` | "Sesi berakhir. Lanjutkan dengan Google…" |

## 5. Email source for a Google-only Clerk instance

The production Clerk instance has the email *attribute* disabled (only `oauth_google` enabled). The email therefore lives on the Google external account, not in `email_addresses`. `resolveVerifiedEmail()` uses the primary email when verified, otherwise the email of a **verified** `oauth_google` external account; anything else is treated as unverified and refused.

## 6. Configuration requirements (names only)

`CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` (secret), `CLERK_AUTHORIZED_PARTIES`, optional `CLERK_JWT_KEY`. CSP (only when Clerk is configured) allows: the Clerk FAPI origin, `https://challenges.cloudflare.com`, `https://cdn.protect.clerk.com` (script), `https://*.protect.clerk.com:*` (connect), `https://img.clerk.com` (img). Clerk Protect needs the last two; without them production sign-in attempts are rejected.
