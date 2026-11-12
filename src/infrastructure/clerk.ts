import { AppError } from '../domain/errors'

/**
 * Clerk session-token verification for Cloudflare Workers (Web Crypto only, no Node APIs).
 * Verifies: RS256 signature against Clerk JWKS, `kid`, issuer (= Frontend API of THIS instance),
 * exp / nbf with small clock skew, authorized party (`azp`) and pending-session status.
 */

export interface ClerkConfig {
  publishableKey: string
  secretKey?: string
  /** Optional PEM public key (networkless verification). */
  jwtKey?: string
  /** Comma separated list of allowed origins for the `azp` claim. */
  authorizedParties: string[]
}

export interface VerifiedClerkSession {
  subject: string
  sessionId: string | null
  issuer: string
  expiresAt: number
}

export interface ClerkUserProfile {
  id: string
  primaryEmail: string | null
  primaryEmailVerified: boolean
  displayName: string
}

export interface ClerkGateway {
  verifySessionToken(token: string): Promise<VerifiedClerkSession>
  getUser(subject: string): Promise<ClerkUserProfile>
}

interface Jwk { kty: string; kid?: string; n: string; e: string; alg?: string; use?: string }

const CLOCK_SKEW_SECONDS = 60
const JWKS_TTL_MS = 60 * 60 * 1000
const jwksCache = new Map<string, { keys: Jwk[]; fetchedAt: number }>()

/** Derives the Frontend API origin from a publishable key: pk_(live|test)_base64("<host>$"). */
export function frontendApiFromPublishableKey(publishableKey: string): string {
  const match = /^pk_(live|test)_([A-Za-z0-9+/=_-]+)$/.exec(publishableKey.trim())
  if (!match) throw new AppError('IDENTITY_PROVIDER_UNAVAILABLE', 'Konfigurasi login belum valid.', 503)
  let decoded: string
  try { decoded = atob(match[2].replaceAll('-', '+').replaceAll('_', '/')) } catch { throw new AppError('IDENTITY_PROVIDER_UNAVAILABLE', 'Konfigurasi login belum valid.', 503) }
  const host = decoded.replace(/\$$/, '')
  if (!/^[a-z0-9.-]+$/i.test(host)) throw new AppError('IDENTITY_PROVIDER_UNAVAILABLE', 'Konfigurasi login belum valid.', 503)
  return `https://${host}`
}

export function clerkEnvironment(publishableKey: string): 'production' | 'development' {
  return publishableKey.startsWith('pk_live_') ? 'production' : 'development'
}

function base64UrlToBytes(value: string): Uint8Array<ArrayBuffer> {
  const normalized = value.replaceAll('-', '+').replaceAll('_', '/')
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4)
  let binary: string
  try { binary = atob(padded) } catch { throw invalidToken() }
  const bytes = new Uint8Array(new ArrayBuffer(binary.length))
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index)
  return bytes
}

function decodeJson(segment: string): Record<string, unknown> {
  try { return JSON.parse(new TextDecoder().decode(base64UrlToBytes(segment))) } catch { throw invalidToken() }
}

const invalidToken = () => new AppError('AUTH_INVALID', 'Sesi login tidak valid. Silakan masuk lagi.', 401)

export class ClerkClient implements ClerkGateway {
  readonly frontendApi: string
  constructor(private readonly config: ClerkConfig, private readonly fetcher: typeof fetch = (...args) => fetch(...args)) {
    this.frontendApi = frontendApiFromPublishableKey(config.publishableKey)
  }

  async verifySessionToken(token: string): Promise<VerifiedClerkSession> {
    const parts = token.split('.')
    if (parts.length !== 3 || token.length > 8192) throw invalidToken()
    const [headerSegment, payloadSegment, signatureSegment] = parts
    const header = decodeJson(headerSegment)
    const payload = decodeJson(payloadSegment)
    if (header.alg !== 'RS256') throw invalidToken()

    const key = await this.resolveKey(typeof header.kid === 'string' ? header.kid : undefined)
    const valid = await crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5',
      key,
      base64UrlToBytes(signatureSegment),
      new TextEncoder().encode(`${headerSegment}.${payloadSegment}`),
    )
    if (!valid) throw invalidToken()

    const now = Math.floor(Date.now() / 1000)
    if (payload.iss !== this.frontendApi) throw invalidToken()
    if (typeof payload.exp !== 'number' || payload.exp < now - CLOCK_SKEW_SECONDS) throw invalidToken()
    if (typeof payload.nbf === 'number' && payload.nbf > now + CLOCK_SKEW_SECONDS) throw invalidToken()
    if (typeof payload.iat === 'number' && payload.iat > now + CLOCK_SKEW_SECONDS) throw invalidToken()
    if (typeof payload.sub !== 'string' || !/^user_[A-Za-z0-9]+$/.test(payload.sub)) throw invalidToken()
    if (payload.azp !== undefined) {
      if (typeof payload.azp !== 'string' || !this.config.authorizedParties.includes(payload.azp)) throw invalidToken()
    }
    if (payload.sts === 'pending') throw invalidToken()

    return { subject: payload.sub, sessionId: typeof payload.sid === 'string' ? payload.sid : null, issuer: payload.iss as string, expiresAt: payload.exp }
  }

  async getUser(subject: string): Promise<ClerkUserProfile> {
    if (!this.config.secretKey) throw new AppError('IDENTITY_PROVIDER_UNAVAILABLE', 'Layanan login belum dikonfigurasi lengkap.', 503)
    if (!/^user_[A-Za-z0-9]+$/.test(subject)) throw invalidToken()
    let response: Response
    try {
      response = await this.fetcher(`https://api.clerk.com/v1/users/${subject}`, { headers: { Authorization: `Bearer ${this.config.secretKey}` } })
    } catch { throw new AppError('IDENTITY_PROVIDER_UNAVAILABLE', 'Layanan login sedang tidak dapat dihubungi.', 503) }
    if (response.status === 404) throw invalidToken()
    if (!response.ok) throw new AppError('IDENTITY_PROVIDER_UNAVAILABLE', 'Layanan login sedang tidak dapat dihubungi.', 503)
    const user = await response.json() as any
    const primary = Array.isArray(user.email_addresses) ? user.email_addresses.find((item: any) => item.id === user.primary_email_address_id) : null
    const name = [user.first_name, user.last_name].filter((part: unknown) => typeof part === 'string' && part.trim()).join(' ').trim()
    return {
      id: String(user.id),
      primaryEmail: typeof primary?.email_address === 'string' ? primary.email_address.trim().toLowerCase() : null,
      primaryEmailVerified: primary?.verification?.status === 'verified',
      displayName: (name || user.username || 'Runner').toString().slice(0, 80),
    }
  }

  private async resolveKey(kid: string | undefined): Promise<CryptoKey> {
    if (this.config.jwtKey) return importPem(this.config.jwtKey)
    let keys = await this.loadJwks(false)
    let jwk = keys.find((key) => key.kid === kid)
    if (!jwk) { keys = await this.loadJwks(true); jwk = keys.find((key) => key.kid === kid) }
    if (!jwk || jwk.kty !== 'RSA') throw invalidToken()
    return crypto.subtle.importKey('jwk', { kty: 'RSA', n: jwk.n, e: jwk.e, alg: 'RS256', ext: true }, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify'])
  }

  private async loadJwks(force: boolean): Promise<Jwk[]> {
    const cacheKey = this.frontendApi
    const cached = jwksCache.get(cacheKey)
    if (!force && cached && Date.now() - cached.fetchedAt < JWKS_TTL_MS) return cached.keys
    // Prefer the Backend API JWKS (works even before the Frontend API custom domain resolves).
    const sources: Array<[string, RequestInit]> = []
    if (this.config.secretKey) sources.push(['https://api.clerk.com/v1/jwks', { headers: { Authorization: `Bearer ${this.config.secretKey}` } }])
    sources.push([`${this.frontendApi}/.well-known/jwks.json`, {}])
    for (const [url, init] of sources) {
      try {
        const response = await this.fetcher(url, init)
        if (!response.ok) continue
        const body = await response.json() as { keys?: Jwk[] }
        if (Array.isArray(body.keys) && body.keys.length) {
          jwksCache.set(cacheKey, { keys: body.keys, fetchedAt: Date.now() })
          return body.keys
        }
      } catch { /* try next source */ }
    }
    if (cached) return cached.keys
    throw new AppError('IDENTITY_PROVIDER_UNAVAILABLE', 'Kunci verifikasi login belum dapat dimuat.', 503)
  }
}

async function importPem(pem: string): Promise<CryptoKey> {
  const body = pem.replace(/-----(BEGIN|END) PUBLIC KEY-----/g, '').replace(/\s+/g, '')
  const der = Uint8Array.from(atob(body), (char) => char.charCodeAt(0))
  return crypto.subtle.importKey('spki', der.buffer as ArrayBuffer, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify'])
}

/** Test helper: clears cached JWKS between tests. */
export function resetClerkJwksCache(): void { jwksCache.clear() }
