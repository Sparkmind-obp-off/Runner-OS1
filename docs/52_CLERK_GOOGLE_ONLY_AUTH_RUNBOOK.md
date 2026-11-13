# 52 — Clerk Google-only Auth Runbook

See also: `52_CLERK_GOOGLE_ONLY_USER_JOURNEY.md` (user journeys).

## Architecture
Browser -> Clerk hosted sign-in (Google OAuth) -> Clerk session JWT -> `POST /api/auth/clerk/session` -> server verifies RS256 signature (JWKS), `iss`, `exp/nbf/iat`, `azp`, rejects pending sessions -> maps Clerk `sub` to one internal `users.id` (`external_identities`, unique per provider+subject and per owner) -> internal opaque session in HttpOnly, Secure, SameSite=Strict cookie (7 days, hashed server-side) -> onboarding -> dashboard.

## Policy
- Google via Clerk is the only sign-in method. `/api/auth/register` and `/api/auth/login` return 410; env vars cannot re-enable them (only an explicit test-construction option).
- Clerk outage -> 503 `IDENTITY_PROVIDER_UNAVAILABLE`; no password fallback.
- Email equality never links accounts (409 `ACCOUNT_LINK_REQUIRED`). Linking requires a valid internal session plus a verified Clerk token; one Google subject maps to one account.
- Expired legacy session: no automatic recovery; a separate verified recovery process is required (not implemented).
- State-changing `/api/*` calls with a foreign `Origin` are rejected (403) in addition to SameSite=Strict.

## Environment names (values never stored in repo)
`CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `CLERK_AUTHORIZED_PARTIES`, optional `CLERK_JWT_KEY`; plus `GROQ_API_KEY`, `GROQ_MODEL`. Preview must use a separate Clerk development instance.

## Domains
Production `https://runner-os.biz.id`; Clerk FAPI `https://clerk.runner-os.biz.id`; accounts `https://accounts.runner-os.biz.id`. Authorized party: `https://runner-os.biz.id`.

## Database
Migration `0004_clerk_identity.sql` (additive: `external_identities`, `auth_events`). Rollback: `DROP TABLE auth_events; DROP TABLE external_identities;`.

## Rollback
Cloudflare dashboard -> Pages -> runner-os -> Deployments -> roll back to `5426fa65-d5a4-4f07-a712-3eb862dac932` (previous build), or remove `CLERK_SECRET_KEY` to disable Clerk (fail closed).

## Out of scope
No Strava integration, and no Strava data to AI, was added.
