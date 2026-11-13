import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import defaultApp, { createApp } from '../src/index'
import { ClerkClient, resetClerkJwksCache, resolveVerifiedEmail } from '../src/infrastructure/clerk'
import { MemoryRunStore } from './memory-store'

// Journey-level tests for the Google-only (Clerk Production) policy — Doc 52 / Doc 53.
const HOST = 'clerk.runner-os.test'
const PK = `pk_live_${btoa(`${HOST}$`)}`
const ISS = `https://${HOST}`
const ORIGIN = 'https://runner-os.test'
const KID = 'ins_journey'

let keys: CryptoKeyPair
let jwk: JsonWebKey
let store: MemoryRunStore
let rawUsers: Map<string, any>
let app: ReturnType<typeof createApp>

const b64url = (input: Uint8Array | string) => {
  const bytes = typeof input === 'string' ? new TextEncoder().encode(input) : input
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '')
}
async function token(sub: string, extra: Record<string, unknown> = {}) {
  const now = Math.floor(Date.now() / 1000)
  const header = b64url(JSON.stringify({ alg: 'RS256', kid: KID, typ: 'JWT' }))
  const body = b64url(JSON.stringify({ iss: ISS, sub, sid: `sess_${sub}`, azp: ORIGIN, iat: now - 5, nbf: now - 5, exp: now + 60, ...extra }))
  const sig = new Uint8Array(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', keys.privateKey, new TextEncoder().encode(`${header}.${body}`)))
  return `${header}.${body}.${b64url(sig)}`
}

// Shape of a real Google-only Clerk user (email attribute disabled → email lives on the external account).
const googleOnlyUser = (id: string, email: string, verified = true) => ({
  id, first_name: id.replace('user_', ''), last_name: null, primary_email_address_id: null, email_addresses: [],
  external_accounts: [{ provider: 'oauth_google', email_address: email, verification: { status: verified ? 'verified' : 'unverified', strategy: 'oauth_google' } }],
})

const fakeFetch: typeof fetch = async (input) => {
  const url = String(input)
  if (url === 'https://api.clerk.com/v1/jwks' || url === `${ISS}/.well-known/jwks.json`) return Response.json({ keys: [{ ...jwk, kid: KID, alg: 'RS256', use: 'sig' }] })
  const match = /\/v1\/users\/(user_[A-Za-z0-9]+)$/.exec(url)
  if (match) { const user = rawUsers.get(match[1]); return user ? Response.json(user) : new Response('{}', { status: 404 }) }
  return new Response('not found', { status: 404 })
}
const clerkFactory = () => new ClerkClient({ publishableKey: PK, secretKey: 'sk_test_x', authorizedParties: [ORIGIN] }, fakeFetch)

async function call(path: string, init: RequestInit & { cookie?: string } = {}, target = app, env?: Record<string, unknown>) {
  const response = await target.request(`${ORIGIN}${path}`, { ...init, headers: { 'Content-Type': 'application/json', ...(init.cookie ? { Cookie: init.cookie } : {}) } }, env as any)
  const text = await response.text()
  let body: any = null
  try { body = JSON.parse(text) } catch { body = text }
  return { response, body, text, setCookie: response.headers.get('set-cookie'), cookie: response.headers.get('set-cookie')?.split(';')[0] }
}
const google = async (sub: string) => call('/api/auth/clerk/session', { method: 'POST', body: JSON.stringify({ token: await token(sub) }) })
const profile = (name: string) => ({ displayName: name, runningArea: 'Purwokerto', preferredDays: ['Minggu'], preferredTime: 'pagi', preferredDistances: ['5K'], primaryGoal: 'Konsisten', preferredEventTypes: [], runningWithOthersPreference: null, communities: [], notes: null, onboardingCompletedAt: '2026-11-12T00:00:00.000Z' })
const activity = () => ({ startedAt: '2026-11-10T22:00:00.000Z', distanceMeters: 5000, durationSeconds: 1800, source: 'manual' })

beforeAll(async () => {
  keys = await crypto.subtle.generateKey({ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['sign', 'verify']) as CryptoKeyPair
  jwk = await crypto.subtle.exportKey('jwk', keys.publicKey)
})

beforeEach(() => {
  resetClerkJwksCache()
  store = new MemoryRunStore()
  rawUsers = new Map([
    ['user_alice', googleOnlyUser('user_alice', 'alice@example.com')],
    ['user_bob', googleOnlyUser('user_bob', 'bob@example.com')],
    ['user_legacy', googleOnlyUser('user_legacy', 'legacy@example.com')],
    ['user_unverified', googleOnlyUser('user_unverified', 'nv@example.com', false)],
  ])
  // Production construction: no options → password auth retired.
  app = createApp(() => store, () => null, clerkFactory)
})

describe('Google-only policy (production construction)', () => {
  it('the deployed default export retires password register/login with 410 and advertises legacyPassword:false', async () => {
    for (const path of ['/api/auth/register', '/api/auth/login']) {
      const result = await call(path, { method: 'POST', body: JSON.stringify({ email: 'x@example.com', displayName: 'X', password: 'correct-horse-battery-staple' }) }, defaultApp as any, {})
      expect(result.response.status).toBe(410)
      expect(result.body.error.code).toBe('PASSWORD_AUTH_DISABLED')
      expect(result.setCookie).toBeNull()
    }
    const config = await call('/api/auth/config', {}, defaultApp as any, {})
    expect(config.body.data.legacyPassword).toBe(false)
    expect(config.body.data.clerk.enabled).toBe(false) // no bindings in tests → fail closed
  })

  it('environment variables cannot re-enable password auth (only explicit test construction can)', async () => {
    const env = { CLERK_PUBLISHABLE_KEY: PK, CLERK_SECRET_KEY: 'sk', ALLOW_LEGACY_PASSWORD_AUTH: 'true', LEGACY_PASSWORD: '1' } as any
    const response = await app.request(`${ORIGIN}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'x@example.com', password: 'whatever-password' }) }, env)
    expect(response.status).toBe(410)
  })

  it('no password fallback when Clerk is unavailable: Google returns 503, password stays 410', async () => {
    const noClerk = createApp(() => store, () => null, () => null)
    expect((await call('/api/auth/clerk/session', { method: 'POST', body: JSON.stringify({ token: await token('user_alice') }) }, noClerk)).response.status).toBe(503)
    expect((await call('/api/auth/login', { method: 'POST', body: JSON.stringify({ email: 'a@example.com', password: 'x' }) }, noClerk)).response.status).toBe(410)
    expect(store.users.size).toBe(0)
  })

  it('the HTML shell and frontend expose no password form', async () => {
    const shell = await call('/')
    expect(shell.text).not.toMatch(/type="password"|name="password"/)
  })
})

describe('Journey A — new Google user (Google-only Clerk instance, email on external account)', () => {
  it('reads the verified email from the Google external account when the email attribute is disabled', () => {
    expect(resolveVerifiedEmail(googleOnlyUser('user_x', 'X@Example.com'))).toEqual({ address: 'x@example.com', verified: true })
    expect(resolveVerifiedEmail(googleOnlyUser('user_x', 'x@example.com', false)).verified).toBe(false)
    expect(resolveVerifiedEmail({ email_addresses: [], external_accounts: [] })).toEqual({ address: null, verified: false })
  })

  it('creates exactly one user + identity, sets a secure cookie, never returns the session token in JSON, then onboarding → dashboard', async () => {
    const signIn = await google('user_alice')
    expect(signIn.response.status).toBe(201)
    expect(signIn.setCookie).toMatch(/HttpOnly/)
    expect(signIn.setCookie).toMatch(/Secure/)
    expect(signIn.setCookie).toMatch(/SameSite=Strict/)
    const sessionValue = decodeURIComponent(signIn.cookie!.split('=')[1])
    expect(signIn.text).not.toContain(sessionValue)
    expect(store.users.size).toBe(1)
    expect(store.identities.size).toBe(1)

    const me = await call('/api/auth/me', { cookie: signIn.cookie })
    expect(me.body.data).toMatchObject({ id: signIn.body.data.id, email: 'alice@example.com' })
    const before = await call('/api/profile', { cookie: signIn.cookie })
    expect(before.response.status).toBe(200)
    expect(before.body.data?.onboardingCompletedAt ?? null).toBeNull() // → onboarding
    expect((await call('/api/profile', { method: 'PUT', cookie: signIn.cookie, body: JSON.stringify(profile('Alice')) })).response.status).toBe(200)
    const home = await call('/api/home', { cookie: signIn.cookie })
    expect(home.response.status).toBe(200)
    expect(home.body.data.profile.onboardingCompletedAt).toBeTruthy() // → dashboard
    // "refresh": same cookie, new request
    expect((await call('/api/auth/me', { cookie: signIn.cookie })).body.data.id).toBe(signIn.body.data.id)
  })

  it('refuses unverified Google emails', async () => {
    const result = await google('user_unverified')
    expect(result.response.status).toBe(403)
    expect(store.users.size).toBe(0)
  })
})

describe('Journey B — returning Google user', () => {
  it('resolves the same internal id, creates no duplicate and keeps profile + activities', async () => {
    const first = await google('user_alice')
    await call('/api/profile', { method: 'PUT', cookie: first.cookie, body: JSON.stringify(profile('Alice')) })
    const saved = await call('/api/activities', { method: 'POST', cookie: first.cookie, body: JSON.stringify(activity()) })
    expect(saved.response.status).toBe(201)
    await call('/api/auth/logout', { method: 'POST', cookie: first.cookie })

    const again = await google('user_alice')
    expect(again.response.status).toBe(200)
    expect(again.body.data.id).toBe(first.body.data.id)
    expect(store.users.size).toBe(1)
    expect(store.identities.size).toBe(1)
    const activities = await call('/api/activities', { cookie: again.cookie })
    expect(activities.body.data.map((a: any) => a.id)).toEqual([saved.body.data.id])
    expect((await call('/api/profile', { cookie: again.cookie })).body.data.onboardingCompletedAt).toBeTruthy()
  })
})

describe('Journey C — explicit linking of an existing legacy account', () => {
  // Legacy sessions exist only in production data; tests create them with the explicit fixture flag.
  const legacyApp = () => createApp(() => store, () => null, clerkFactory, { allowLegacyPasswordAuth: true })
  async function legacyAccount() {
    const fixture = legacyApp()
    const created = await call('/api/auth/register', { method: 'POST', body: JSON.stringify({ email: 'legacy@example.com', displayName: 'Legacy', password: 'correct-horse-battery-staple' }) }, fixture)
    const run = await call('/api/activities', { method: 'POST', cookie: created.cookie, body: JSON.stringify(activity()) }, fixture)
    return { id: created.body.data.id, cookie: created.cookie!, activityId: run.body.data.id }
  }

  it('Google sign-in with a matching email never auto-links and never creates a second account', async () => {
    await legacyAccount()
    const result = await google('user_legacy')
    expect(result.response.status).toBe(409)
    expect(result.body.error.code).toBe('ACCOUNT_LINK_REQUIRED')
    expect(result.body.error.message).not.toMatch(/kata sandi|password/i)
    expect(store.users.size).toBe(1)
    expect(store.identities.size).toBe(0)
  })

  it('links from a valid legacy session (production app) and keeps users.id and data', async () => {
    const legacy = await legacyAccount()
    const link = await call('/api/auth/clerk/link', { method: 'POST', cookie: legacy.cookie, body: JSON.stringify({ token: await token('user_legacy') }) })
    expect(link.response.status).toBe(200)
    const signIn = await google('user_legacy')
    expect(signIn.body.data.id).toBe(legacy.id)
    expect((await call('/api/activities', { cookie: signIn.cookie })).body.data.map((a: any) => a.id)).toContain(legacy.activityId)
  })

  it('rejects linking when the legacy session has expired (no silent new account, no merge)', async () => {
    const legacy = await legacyAccount()
    for (const session of store.sessions.values()) session.expiresAt = '2000-01-01T00:00:00.000Z'
    const link = await call('/api/auth/clerk/link', { method: 'POST', cookie: legacy.cookie, body: JSON.stringify({ token: await token('user_legacy') }) })
    expect(link.response.status).toBe(401)
    expect(store.identities.size).toBe(0)
    expect(store.users.size).toBe(1)
  })

  it('rejects linking with a forged cookie or without any session', async () => {
    expect((await call('/api/auth/clerk/link', { method: 'POST', body: JSON.stringify({ token: await token('user_legacy') }) })).response.status).toBe(401)
    expect((await call('/api/auth/clerk/link', { method: 'POST', cookie: 'runner_session=forged', body: JSON.stringify({ token: await token('user_legacy') }) })).response.status).toBe(401)
  })

  it('a user cannot link another user\'s Clerk identity', async () => {
    const legacy = await legacyAccount()
    await google('user_bob')
    const steal = await call('/api/auth/clerk/link', { method: 'POST', cookie: legacy.cookie, body: JSON.stringify({ token: await token('user_bob') }) })
    expect(steal.response.status).toBe(409)
    expect(store.identities.size).toBe(1)
  })
})

describe('Journey D — logout', () => {
  it('revokes the server session, clears the cookie with matching attributes, and protected APIs return 401', async () => {
    const signIn = await google('user_alice')
    const logout = await call('/api/auth/logout', { method: 'POST', cookie: signIn.cookie })
    expect(logout.response.status).toBe(200)
    expect(logout.setCookie).toMatch(/runner_session=;/)
    expect(logout.setCookie).toMatch(/Max-Age=0/)
    expect(logout.setCookie).toMatch(/Path=\//)
    expect(logout.setCookie).toMatch(/Secure/)
    expect(logout.setCookie).toMatch(/SameSite=Strict/)
    expect(store.sessions.size).toBe(0)
    for (const path of ['/api/profile', '/api/home', '/api/activities', '/api/runs', '/api/auth/identities']) expect((await call(path, { cookie: signIn.cookie })).response.status).toBe(401)
    expect((await call('/api/auth/me', { cookie: signIn.cookie })).body.data).toBeNull()
    // a new Google sign-in works normally afterwards
    const again = await google('user_alice')
    expect(again.body.data.id).toBe(signIn.body.data.id)
  })
})

describe('Tenant isolation between two Google users', () => {
  it('A cannot read, modify or address B\'s profile/activities, even with a guessed owner id', async () => {
    const a = await google('user_alice')
    const b = await google('user_bob')
    await call('/api/profile', { method: 'PUT', cookie: b.cookie, body: JSON.stringify(profile('Bob')) })
    const bActivity = (await call('/api/activities', { method: 'POST', cookie: b.cookie, body: JSON.stringify(activity()) })).body.data

    expect((await call('/api/profile', { cookie: a.cookie })).body.data?.displayName ?? null).not.toBe('Bob')
    expect((await call('/api/activities', { cookie: a.cookie })).body.data).toEqual([])
    expect((await call(`/api/activities/${bActivity.id}`, { method: 'PUT', cookie: a.cookie, body: JSON.stringify({ ...activity(), notes: 'hijack' }) })).response.status).toBe(404)
    expect((await call(`/api/activities?ownerId=${b.body.data.id}`, { cookie: a.cookie })).body.data).toEqual([])
    expect((await call('/api/activities', { method: 'POST', cookie: a.cookie, body: JSON.stringify({ ...activity(), ownerId: b.body.data.id }) })).response.status).toBe(400)
    expect((await call('/api/activities', { cookie: b.cookie })).body.data[0].notes ?? null).toBeNull()

    // and the reverse direction
    const aRun = (await call('/api/runs', { method: 'POST', cookie: a.cookie, body: JSON.stringify({ title: 'A only', type: 'fitness' }) })).body.data
    expect((await call(`/api/runs/${aRun.id}`, { cookie: b.cookie })).response.status).toBe(404)
    expect((await call(`/api/runs/${aRun.id}`, { method: 'PATCH', cookie: b.cookie, body: JSON.stringify({ title: 'pwned' }) })).response.status).toBe(404)
  })
})

describe('Frontend Clerk SDK pin', () => {
  it('loads clerk-js v6 (Clerk Production rejects v5 sign-ins as outdated)', async () => {
    // @ts-expect-error -- Node built-in used only by the test runner; Worker types do not declare it.
    const { readFileSync } = await import('node:fs')
    const source = readFileSync(new URL('../public/static/clerk-auth.js', import.meta.url), 'utf8')
    expect(source).toContain('/npm/@clerk/clerk-js@6/dist/clerk.browser.js')
    expect(source).not.toContain('@clerk/clerk-js@5')
  })
})

describe('CSRF / Origin validation', () => {
  it('rejects state-changing API calls from a foreign Origin, even with a valid session cookie', async () => {
    const signIn = await google('user_alice')
    const foreign = await app.request(`${ORIGIN}/api/auth/logout`, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://evil.example', Cookie: signIn.cookie! } })
    expect(foreign.status).toBe(403)
    expect((await foreign.json() as any).error.code).toBe('ORIGIN_FORBIDDEN')
    // session must still be alive: the forged logout did nothing
    expect((await call('/api/auth/me', { cookie: signIn.cookie })).body.data?.id).toBe(signIn.body.data.id)
  })

  it('accepts same-origin writes and still serves GET regardless of Origin', async () => {
    const signIn = await google('user_alice')
    const same = await app.request(`${ORIGIN}/api/auth/logout`, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: ORIGIN, Cookie: signIn.cookie! } })
    expect(same.status).toBe(200)
    const get = await app.request(`${ORIGIN}/api/auth/config`, { headers: { Origin: 'https://other.example' } })
    expect(get.status).toBe(200)
  })
})
