# Phase 3 — Authentication, Session Reliability, and Production Access Status

Date: 2026-09-17

## Scope

Phase 3 hardens the existing email/password and opaque server-side session model. Runner Core and the Phase 2 productivity model are unchanged. No JWT, local-storage token, OAuth provider, or client-only authentication state was introduced.

## Baseline and root cause

### VERIFIED

- The pre-change regression baseline passed: 36 tests, TypeScript, production build, and `npm audit` with zero vulnerabilities.
- `runner-os.biz.id` resolved through Cloudflare, served HTTPS, loaded the application shell, and returned `200` from `/health`.
- The Pages project listed both `runner-os.pages.dev` and `runner-os.biz.id` as attached domains.
- Production registration consistently returned `500` before the fix.
- A live Cloudflare Pages tail captured the exact error: `Pbkdf2 failed: iteration counts above 100000 are not supported (requested 210000).`
- Production D1 contained zero users and zero sessions at the time of the audit, so changing the iteration count did not invalidate production accounts.
- The frontend uses relative `/api/...` requests with `credentials: same-origin`; it has no localhost, preview-domain, or hard-coded production API dependency.
- No service worker exists.
- Static JavaScript and CSS used an unversioned URL together with a one-year `immutable` cache policy, which could leave different browsers on different client bundles after a deployment.

### Root causes corrected

1. **Authentication outage:** PBKDF2 used 210,000 iterations, while the deployed Cloudflare Workers Web Crypto runtime accepts at most 100,000. Registration failed before creating the user, and any password verification requiring that operation would also fail.
2. **Cross-browser stale-client risk:** `/static/app.js` and `/static/style.css` were unversioned but marked immutable for one year. This could produce browser-dependent behavior after deployments.

### Important expected behavior, not a defect

Sessions are intentionally host-only. A session created on `runner-os.biz.id` is not sent to `runner-os.pages.dev`, and the reverse is also true. Preview deployment origins also have independent sessions. No broad cookie `Domain` was added.

## Authentication architecture

1. Registration and login accept validated JSON requests.
2. Passwords are hashed server-side with PBKDF2-HMAC-SHA-256, a random 16-byte salt, a 256-bit output, and 100,000 iterations (the Cloudflare Web Crypto maximum).
3. A successful authentication creates a random opaque 32-byte session token.
4. Only the SHA-256 hash of the token is stored in D1; the opaque token is returned only in the HTTP-only cookie.
5. Protected middleware hashes the presented cookie, loads the server-side session, checks expiration, resolves the owner, and fails closed.
6. Every Run and Run Event operation uses the authenticated server-side owner ID. Client-supplied IDs never establish identity.
7. Expired or orphaned session records are deleted when encountered.
8. Logout deletes the server-side session and expires the cookie with matching path, SameSite, and Secure scope.

## Cookie contract

| Attribute | Local HTTP | Preview/production HTTPS | Reason |
|---|---:|---:|---|
| Name | `runner_session` | `runner_session` | Stable opaque-session cookie |
| `HttpOnly` | Yes | Yes | Session identifier is unavailable to JavaScript |
| `Secure` | No | Yes | Allows local HTTP development; mandatory over HTTPS |
| `SameSite` | `Strict` | `Strict` | Same-origin application/API; limits cross-site sending |
| `Path` | `/` | `/` | Available to all application and API paths |
| `Domain` | Omitted | Omitted | Host-only isolation is deliberate |
| `Max-Age` | 30 days | 30 days | Matches server-side session lifetime |

A browser restart may retain the session because the cookie is persistent. Private-browsing policy or user settings can still remove it.

## Origin and deployment contract

- Intended production origin: `https://runner-os.biz.id`.
- Canonical Pages origin: `https://runner-os.pages.dev`.
- Frontend requests are relative and same-origin.
- CORS is not enabled because the frontend and API share an origin.
- Custom, Pages, and preview origins do not share cookies.
- Dynamic API responses use `Cache-Control: no-store`.
- Unversioned `/static/*` assets now use `max-age=0, must-revalidate` instead of `immutable`.
- Worker responses set CSP, frame, content-type, referrer, permissions, and HTTPS HSTS headers. Static responses receive equivalent headers through `public/_headers`.
- Pages `_routes.json` sends application routes through the Worker and excludes static assets plus `_headers`; the Worker supplies the SPA fallback.

## Login and session UX

- The UI boots from `GET /api/auth/me`; no local-storage authentication flag exists.
- Login/registration disables the submit button and presents an in-progress state.
- After login/registration, the UI calls `/api/auth/me` and requires server confirmation before loading protected data.
- A `401 AUTH_REQUIRED` clears client identity and shows a session-expired sign-in state.
- Logout first invalidates the server session, then clears local user, Run, and Today state.
- Network/server failures are not presented as successful authentication.

## Automated verification

The Phase 3 API suite adds coverage for:

- production cookie attributes and host-only scope;
- server-confirmed registration/session retrieval;
- valid login and a second opaque session;
- generic failures for unknown email and wrong password;
- refresh-equivalent repeated authenticated requests;
- logout cookie deletion and server invalidation;
- protected access after logout;
- invalid session rejection;
- expired session rejection and record cleanup.

Existing owner-isolation, cross-owner denial, lifecycle, event, focus, filter, due-time, and complete UX journey tests remain intact.

## Browser compatibility matrix

| Target | Result | Evidence / remaining work |
|---|---|---|
| Chromium (automated page load) | VERIFIED | Local HTTPS sandbox preview and pre-deploy `runner-os.biz.id` loaded the auth form with no console errors. Full interactive browser flow remains manual. |
| Firefox | UNVERIFIED | Browser engine is not installed in the implementation sandbox. Run the checklist below. |
| Safari/WebKit | UNVERIFIED | Browser engine is not available in the Linux implementation sandbox. Run on macOS/iOS. |
| Mobile Chrome | UNVERIFIED | Requires a physical device or mobile browser service. |
| Mobile Safari | UNVERIFIED | Requires iOS/iPadOS hardware or a browser service. |

Standards-level compatibility is supported by same-origin relative fetches, a host-only HTTP-only cookie, HTTPS `Secure`, `SameSite=Strict`, `Path=/`, and no dependency on third-party cookies.

## Manual browser acceptance checklist

Run separately in each browser and record the result; do not copy a pass between browsers:

1. Open `https://runner-os.biz.id` in a normal window.
2. Register a disposable test account or sign in with a valid account.
3. Confirm the authenticated Today UI appears.
4. Hard-refresh and confirm the session remains valid.
5. Navigate to Today and Runs.
6. Open a Run, or create one if required.
7. Perform a safe mutation such as changing its next action.
8. Return to Today and confirm the update.
9. Open a second tab at the same origin and confirm the session.
10. Close and reopen the browser and verify persistence if local browser policy permits it.
11. Sign out.
12. Request a protected path/API and confirm it is rejected or returns the sign-in state.
13. Confirm a login on `runner-os.biz.id` does not implicitly authenticate `runner-os.pages.dev`.

For failures, inspect DNS/TLS, document and asset responses, cookie storage/transmission, `/api/auth/me`, protected API status, and browser console/network output in that order.

## Security and limitations

### VERIFIED

- Password and session-token values are absent from API response bodies.
- Session tokens are not logged by application code.
- No API token, Cloudflare credential, password, or session secret is committed.
- Authentication fails closed and ownership remains server-enforced.
- Registration failures do not partially create users because hashing occurs before persistence.

### UNVERIFIED / external

- Full interactive Firefox, Safari/WebKit, and mobile acceptance tests require external browsers.
- Browser persistence after a complete browser restart depends on each browser's privacy settings.

### Known limitation

There is no account recovery/password-reset workflow and no dedicated login rate limiter. These were not added because Phase 3 prohibits unrelated authentication expansion; they should be addressed as a separately scoped security phase.

## Migration impact

No database migration was required. The production database had no user or session rows before the PBKDF2 correction, so no production password material required migration. If another environment contains hashes produced with the former 210,000-iteration implementation, those accounts require an explicit password reset before moving that environment to Cloudflare Workers because the runtime cannot evaluate that iteration count.

## Quality gates

Final source quality gates and post-deployment production verification are recorded in the Phase 3 delivery commit and final implementation report.
