import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { buildCsp, createApp } from '../src/index'
import { ClerkClient, frontendApiFromPublishableKey, resetClerkJwksCache, type ClerkUserProfile } from '../src/infrastructure/clerk'
import { MemoryRunStore } from './memory-store'

const HOST = 'clerk.runner-os.test'
const PK = `pk_live_${btoa(`${HOST}$`)}`
const ISS = `https://${HOST}`
const ORIGIN = 'https://runner-os.test'
const KID = 'ins_test'

let keys: CryptoKeyPair
let otherKeys: CryptoKeyPair
let jwk: JsonWebKey
let store: MemoryRunStore
let users: Map<string, ClerkUserProfile>
let app: ReturnType<typeof createApp>

const b64url = (input: Uint8Array | string) => {
  const bytes = typeof input === 'string' ? new TextEncoder().encode(input) : input
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '')
}

async function sign(payload: Record<string, unknown>, opts: { key?: CryptoKey; kid?: string; alg?: string } = {}) {
  const header = b64url(JSON.stringify({ alg: opts.alg ?? 'RS256', kid: opts.kid ?? KID, typ: 'JWT' }))
  const body = b64url(JSON.stringify(payload))
  const signature = new Uint8Array(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', opts.key ?? keys.privateKey, new TextEncoder().encode(`${header}.${body}`)))
  return `${header}.${body}.${b64url(signature)}`
}

const now = () => Math.floor(Date.now() / 1000)
const claims = (sub: string, extra: Record<string, unknown> = {}) => ({ iss: ISS, sub, sid: 'sess_1', azp: ORIGIN, iat: now() - 5, nbf: now() - 5, exp: now() + 60, ...extra })

const fakeFetch: typeof fetch = async (input) => {
  const url = String(input)
  if (url === 'https://api.clerk.com/v1/jwks' || url === `${ISS}/.well-known/jwks.json`) return Response.json({ keys: [{ ...jwk, kid: KID, alg: 'RS256', use: 'sig' }] })
  const match = /\/v1\/users\/(user_[A-Za-z0-9]+)$/.exec(url)
  if (match) {
    const user = users.get(match[1])
    if (!user) return new Response('{}', { status: 404 })
    return Response.json({ id: user.id, first_name: user.displayName, last_name: null, primary_email_address_id: 'em_1', email_addresses: user.primaryEmail ? [{ id: 'em_1', email_address: user.primaryEmail, verification: { status: user.primaryEmailVerified ? 'verified' : 'unverified' } }] : [] })
  }
  return new Response('not found', { status: 404 })
}

const clerkFactory = () => new ClerkClient({ publishableKey: PK, secretKey: 'sk_test_x', authorizedParties: [ORIGIN] }, fakeFetch)

async function call(path: string, init: RequestInit & { cookie?: string } = {}) {
  const response = await app.request(`${ORIGIN}${path}`, { ...init, headers: { 'Content-Type': 'application/json', ...(init.cookie ? { Cookie: init.cookie } : {}) } })
  return { response, body: await response.json() as any, cookie: response.headers.get('set-cookie')?.split(';')[0] }
}
const clerkSignIn = async (token: string) => call('/api/auth/clerk/session', { method: 'POST', body: JSON.stringify({ token }) })

beforeAll(async () => {
  const gen = { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }
  keys = await crypto.subtle.generateKey(gen, true, ['sign', 'verify']) as CryptoKeyPair
  otherKeys = await crypto.subtle.generateKey(gen, true, ['sign', 'verify']) as CryptoKeyPair
  jwk = await crypto.subtle.exportKey('jwk', keys.publicKey)
})

beforeEach(() => {
  resetClerkJwksCache()
  store = new MemoryRunStore()
  users = new Map([
    ['user_alice', { id: 'user_alice', primaryEmail: 'alice@example.com', primaryEmailVerified: true, displayName: 'Alice' }],
    ['user_bob', { id: 'user_bob', primaryEmail: 'bob@example.com', primaryEmailVerified: true, displayName: 'Bob' }],
    ['user_legacy', { id: 'user_legacy', primaryEmail: 'legacy@example.com', primaryEmailVerified: true, displayName: 'Legacy' }],
    ['user_unverified', { id: 'user_unverified', primaryEmail: 'u@example.com', primaryEmailVerified: false, displayName: 'U' }],
  ])
  app = createApp(() => store, () => null, clerkFactory, { allowLegacyPasswordAuth: true })
})

describe('Clerk publishable key', () => {
  it('derives the Frontend API issuer from the publishable key', () => {
    expect(frontendApiFromPublishableKey(PK)).toBe(ISS)
    expect(frontendApiFromPublishableKey('pk_live_Y2xlcmsucnVubmVyLW9zLmJpei5pZCQ')).toBe('https://clerk.runner-os.biz.id')
    expect(() => frontendApiFromPublishableKey('sk_live_nope')).toThrow()
  })
})

describe('Clerk sign-in (server-side verification)', () => {
  it('keeps password endpoints retired even when Clerk is unavailable', async () => {
    const clerkOnly = createApp(() => store, () => null, () => null)
    for (const path of ['/api/auth/register', '/api/auth/login']) {
      const response = await clerkOnly.request(`${ORIGIN}${path}`, { method: 'POST', body: JSON.stringify({ email: 'legacy@example.com', displayName: 'Legacy', password: 'correct-horse-battery-staple' }) })
      expect(response.status).toBe(410)
      expect((await response.json() as any).error.code).toBe('PASSWORD_AUTH_DISABLED')
    }
    expect(store.users.size).toBe(0)
  })

  it('creates a new internal user + identity from a verified token and issues an HttpOnly session', async () => {
    const result = await clerkSignIn(await sign(claims('user_alice')))
    expect(result.response.status).toBe(201)
    expect(result.body.data.email).toBe('alice@example.com')
    expect(result.response.headers.get('set-cookie')).toContain('HttpOnly')
    expect(store.identities.size).toBe(1)
    const me = await call('/api/auth/me', { cookie: result.cookie })
    expect(me.body.data.id).toBe(result.body.data.id)
  })

  it('returns the same internal user id on repeat sign-in (no duplicates)', async () => {
    const first = await clerkSignIn(await sign(claims('user_alice')))
    const second = await clerkSignIn(await sign(claims('user_alice')))
    expect(second.response.status).toBe(200)
    expect(second.body.data.id).toBe(first.body.data.id)
    expect(store.users.size).toBe(1)
    expect(store.identities.size).toBe(1)
  })

  it.each([
    ['expired', async () => sign(claims('user_alice', { exp: now() - 600 }))],
    ['wrong issuer', async () => sign(claims('user_alice', { iss: 'https://evil.example' }))],
    ['wrong authorized party', async () => sign(claims('user_alice', { azp: 'https://evil.example' }))],
    ['not yet valid', async () => sign(claims('user_alice', { nbf: now() + 600 }))],
    ['pending session', async () => sign(claims('user_alice', { sts: 'pending' }))],
    ['foreign signing key', async () => sign(claims('user_alice'), { key: otherKeys.privateKey })],
    ['unknown kid', async () => sign(claims('user_alice'), { kid: 'other' })],
    ['alg none', async () => { const t = await sign(claims('user_alice')); const [, p] = t.split('.'); return `${b64url(JSON.stringify({ alg: 'none', kid: KID }))}.${p}.${t.split('.')[2]}` }],
    ['tampered payload', async () => { const t = await sign(claims('user_alice')); const [h, , s] = t.split('.'); return `${h}.${b64url(JSON.stringify(claims('user_bob')))}.${s}` }],
  ])('rejects %s tokens with 401 and creates nothing', async (_label, make) => {
    const result = await clerkSignIn(await make())
    expect(result.response.status).toBe(401)
    expect(result.cookie).toBeUndefined()
    expect(store.users.size).toBe(0)
  })

  it('rejects malformed and oversized payloads', async () => {
    expect((await clerkSignIn('not-a-jwt')).response.status).toBe(400)
    expect((await call('/api/auth/clerk/session', { method: 'POST', body: JSON.stringify({ token: 'a.b.c', userId: 'x' }) })).response.status).toBe(400)
    expect((await clerkSignIn(`${'a'.repeat(9000)}.b.c`)).response.status).toBe(400)
  })

  it('refuses unverified Google emails', async () => {
    const result = await clerkSignIn(await sign(claims('user_unverified')))
    expect(result.response.status).toBe(403)
    expect(result.body.error.code).toBe('EMAIL_UNVERIFIED')
    expect(store.users.size).toBe(0)
  })

  it('never links an existing legacy account by email collision alone (anti-takeover)', async () => {
    const legacy = await call('/api/auth/register', { method: 'POST', body: JSON.stringify({ email: 'legacy@example.com', displayName: 'Legacy', password: 'correct-horse-battery-staple' }) })
    const result = await clerkSignIn(await sign(claims('user_legacy')))
    expect(result.response.status).toBe(409)
    expect(result.body.error.code).toBe('ACCOUNT_LINK_REQUIRED')
    expect(result.cookie).toBeUndefined()
    expect(store.identities.size).toBe(0)
    expect(store.users.size).toBe(1)
    expect(store.authEvents.some((e) => e.eventType === 'identity.link_required' && e.ownerId === legacy.body.data.id)).toBe(true)
  })

  it('fails closed with 503 when Clerk is not configured', async () => {
    app = createApp(() => store, () => null, () => null)
    const result = await clerkSignIn(await sign(claims('user_alice')))
    expect(result.response.status).toBe(503)
    expect(result.body.error.code).toBe('IDENTITY_PROVIDER_UNAVAILABLE')
    const config = await call('/api/auth/config')
    expect(config.body.data.clerk.enabled).toBe(false)
  })
})

describe('Explicit account linking (legacy → Google)', () => {
  async function legacy(email = 'legacy@example.com') {
    return call('/api/auth/register', { method: 'POST', body: JSON.stringify({ email, displayName: 'Legacy', password: 'correct-horse-battery-staple' }) })
  }

  it('requires an authenticated legacy session', async () => {
    const result = await call('/api/auth/clerk/link', { method: 'POST', body: JSON.stringify({ token: await sign(claims('user_legacy')) }) })
    expect(result.response.status).toBe(401)
  })

  it('links, preserves the internal user id and owner data, then Google sign-in resolves to that same user', async () => {
    const account = await legacy()
    const run = await call('/api/runs', { method: 'POST', cookie: account.cookie, body: JSON.stringify({ title: 'Long run', type: 'fitness' }) })
    const link = await call('/api/auth/clerk/link', { method: 'POST', cookie: account.cookie, body: JSON.stringify({ token: await sign(claims('user_legacy')) }) })
    expect(link.response.status).toBe(200)
    const signIn = await clerkSignIn(await sign(claims('user_legacy')))
    expect(signIn.body.data.id).toBe(account.body.data.id)
    const runs = await call('/api/runs', { cookie: signIn.cookie })
    expect(runs.body.data.map((r: any) => r.id)).toContain(run.body.data.id)
    const identities = await call('/api/auth/identities', { cookie: signIn.cookie })
    expect(identities.body.data.google.linked).toBe(true)
  })

  it('refuses to link a Google subject that already belongs to another tenant', async () => {
    await clerkSignIn(await sign(claims('user_alice')))
    const other = await legacy('other@example.com')
    const result = await call('/api/auth/clerk/link', { method: 'POST', cookie: other.cookie, body: JSON.stringify({ token: await sign(claims('user_alice')) }) })
    expect(result.response.status).toBe(409)
    expect(result.body.error.code).toBe('IDENTITY_CONFLICT')
  })

  it('refuses to link a second Google account to the same tenant', async () => {
    const account = await legacy()
    await call('/api/auth/clerk/link', { method: 'POST', cookie: account.cookie, body: JSON.stringify({ token: await sign(claims('user_legacy')) }) })
    const second = await call('/api/auth/clerk/link', { method: 'POST', cookie: account.cookie, body: JSON.stringify({ token: await sign(claims('user_bob')) }) })
    expect(second.response.status).toBe(409)
  })

  it('cross-tenant isolation holds between two Google users', async () => {
    const alice = await clerkSignIn(await sign(claims('user_alice')))
    const bob = await clerkSignIn(await sign(claims('user_bob')))
    const run = await call('/api/runs', { method: 'POST', cookie: alice.cookie, body: JSON.stringify({ title: 'Private', type: 'fitness' }) })
    const peek = await call(`/api/runs/${run.body.data.id}`, { cookie: bob.cookie })
    expect(peek.response.status).toBe(404)
  })

  it('Google-only accounts cannot be accessed with a password', async () => {
    await clerkSignIn(await sign(claims('user_alice')))
    const login = await call('/api/auth/login', { method: 'POST', body: JSON.stringify({ email: 'alice@example.com', password: '!clerk-only' }) })
    expect(login.response.status).toBe(401)
  })

  it('logout revokes the internal session issued from Clerk', async () => {
    const alice = await clerkSignIn(await sign(claims('user_alice')))
    await call('/api/auth/logout', { method: 'POST', cookie: alice.cookie })
    const runs = await call('/api/runs', { cookie: alice.cookie })
    expect(runs.response.status).toBe(401)
  })
})

describe('CSP', () => {
  it('only allows the Clerk origin when configured', () => {
    expect(buildCsp(null)).not.toContain('clerk')
    expect(buildCsp(null)).toContain("style-src 'self';")
    const csp = buildCsp(ISS)
    expect(csp).toContain(`script-src 'self' https://static.cloudflareinsights.com ${ISS}`)
    expect(csp).toContain(`connect-src 'self' https://cloudflareinsights.com ${ISS}`)
    expect(csp).toContain("frame-ancestors 'none'")
  })
})
