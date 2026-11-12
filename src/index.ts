import { Hono, type MiddlewareHandler } from 'hono'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import type { ZodSchema } from 'zod'
import { AuthService, type PublicUser } from './application/auth-service'
import type { RunStore } from './application/ports'
import { RunService } from './application/run-service'
import { Phase4Service } from './application/phase4-service'
import { AIApplicationService, GroqProvider, type AIProvider } from './application/ai-service'
import { AppError } from './domain/errors'
import { D1RunStore } from './infrastructure/d1-store'
import { ClerkClient, clerkEnvironment, frontendApiFromPublishableKey, type ClerkGateway } from './infrastructure/clerk'
import { ClerkAuthService } from './application/clerk-auth-service'
import { activitySchema, aiQuestionSchema, clerkTokenSchema, blockSchema, createRunSchema, evidenceSchema, focusSchema, listRunsSchema, loginSchema, nextActionSchema, occurrenceQuerySchema, occurrenceSchema, profileSchema, progressSchema, recurringSchema, registerSchema, runningEventSchema, todayQuerySchema, updateRunSchema } from './http/schemas'
import { renderShell } from './view'

type Bindings = { DB: D1Database; GROQ_API_KEY?: string; GROQ_MODEL?: string; STRAVA_CLIENT_ID?: string; STRAVA_CLIENT_SECRET?: string; CLERK_PUBLISHABLE_KEY?: string; CLERK_SECRET_KEY?: string; CLERK_JWT_KEY?: string; CLERK_AUTHORIZED_PARTIES?: string }
type Variables = { user: PublicUser; store: RunStore }
type AppEnv = { Bindings: Bindings; Variables: Variables }

const SESSION_COOKIE = 'runner_session'

type StoreFactory = (env: Bindings) => RunStore
type AIProviderFactory = (env: Bindings) => AIProvider | null
type ClerkFactory = (env: Bindings) => ClerkGateway | null

/** Clerk is enabled only when BOTH the public key and the server secret are configured (fail closed). */
export const defaultClerkFactory: ClerkFactory = (env) => {
  if (!env?.CLERK_PUBLISHABLE_KEY || !env?.CLERK_SECRET_KEY) return null
  return new ClerkClient({ publishableKey: env.CLERK_PUBLISHABLE_KEY, secretKey: env.CLERK_SECRET_KEY, jwtKey: env.CLERK_JWT_KEY, authorizedParties: parseParties(env.CLERK_AUTHORIZED_PARTIES) })
}

function parseParties(raw?: string): string[] {
  return (raw ?? '').split(',').map((item) => item.trim()).filter((item) => /^https?:\/\/[a-z0-9.:-]+$/i.test(item))
}

function clerkFrontendApi(env?: Bindings): string | null {
  if (!env?.CLERK_PUBLISHABLE_KEY) return null
  try { return frontendApiFromPublishableKey(env.CLERK_PUBLISHABLE_KEY) } catch { return null }
}

export function createApp(
  storeFactory: StoreFactory = (env) => new D1RunStore(env.DB),
  aiProviderFactory: AIProviderFactory = (env) => env?.GROQ_API_KEY ? new GroqProvider(env.GROQ_API_KEY, env.GROQ_MODEL) : null,
  clerkFactory: ClerkFactory = defaultClerkFactory,
  options: { allowLegacyPasswordAuth?: boolean } = {},
) {
  // Password auth exists only as a test fixture for explicit legacy-session migration tests.
  // Production defaults to Clerk-only and never exposes register/login endpoints.
  const allowLegacyPasswordAuth = options.allowLegacyPasswordAuth === true;
  const app = new Hono<AppEnv>()

  app.use('*', async (c, next) => {
    try {
      await next()
    } finally {
      c.header('X-Content-Type-Options', 'nosniff')
      c.header('X-Frame-Options', 'DENY')
      c.header('Referrer-Policy', 'no-referrer')
      c.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
      c.header('Content-Security-Policy', buildCsp(clerkFrontendApi(c.env)))
      if (isSecureRequest(c.req.url)) c.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
    }
  })

  app.use('/api/*', async (c, next) => {
    c.header('Cache-Control', 'no-store')
    c.set('store', storeFactory(c.env))
    await next()
  })

  const requireAuth: MiddlewareHandler<AppEnv> = async (c, next) => {
    const user = await new AuthService(c.get('store')).authenticate(getCookie(c, SESSION_COOKIE))
    c.set('user', user)
    await next()
  }

  app.post('/api/auth/register', async (c) => {
    if (!allowLegacyPasswordAuth) return c.json({ error: { code: 'PASSWORD_AUTH_DISABLED', message: 'Email/password registration has been retired. Continue with Google.' } }, 410)
    const body = await parseBody(c, registerSchema)
    const result = await new AuthService(c.get('store')).register(body.email, body.displayName, body.password)
    setSessionCookie(c, result.token)
    return c.json({ data: result.user }, 201)
  })

  app.post('/api/auth/login', async (c) => {
    if (!allowLegacyPasswordAuth) return c.json({ error: { code: 'PASSWORD_AUTH_DISABLED', message: 'Email/password login has been retired. Continue with Google.' } }, 410)
    const body = await parseBody(c, loginSchema)
    const result = await new AuthService(c.get('store')).login(body.email, body.password)
    setSessionCookie(c, result.token)
    return c.json({ data: result.user })
  })

  app.post('/api/auth/logout', async (c) => {
    await new AuthService(c.get('store')).logout(getCookie(c, SESSION_COOKIE))
    deleteCookie(c, SESSION_COOKIE, sessionCookieScope(c.req.url))
    return c.json({ data: { success: true } })
  })

  app.get('/api/auth/config', (c) => {
    const enabled = Boolean(c.env?.CLERK_PUBLISHABLE_KEY && c.env?.CLERK_SECRET_KEY && clerkFrontendApi(c.env))
    return c.json({ data: {
      legacyPassword: false,
      clerk: enabled
        ? { enabled: true, publishableKey: c.env!.CLERK_PUBLISHABLE_KEY, frontendApi: clerkFrontendApi(c.env), environment: clerkEnvironment(c.env!.CLERK_PUBLISHABLE_KEY!), providers: ['google'] }
        : { enabled: false },
    } })
  })

  app.post('/api/auth/clerk/session', async (c) => {
    const { token } = await parseBody(c, clerkTokenSchema)
    const result = await new ClerkAuthService(c.get('store'), requireClerk(c.env)).signIn(token)
    setSessionCookie(c, result.token, 60 * 60 * 24 * 7)
    return c.json({ data: { ...result.user, created: result.created } }, result.created ? 201 : 200)
  })

  app.post('/api/auth/clerk/link', requireAuth, async (c) => {
    const { token } = await parseBody(c, clerkTokenSchema)
    return c.json({ data: await new ClerkAuthService(c.get('store'), requireClerk(c.env)).link(c.get('user').id, token) })
  })

  app.get('/api/auth/identities', requireAuth, async (c) => {
    const gateway = clerkFactory(c.env)
    const identity = await c.get('store').findExternalIdentityByOwner(c.get('user').id, 'clerk')
    return c.json({ data: { google: { available: Boolean(gateway), linked: Boolean(identity), linkedAt: identity?.createdAt ?? null } } })
  })

  app.get('/api/auth/me', async (c) => {
    try { return c.json({ data: await new AuthService(c.get('store')).authenticate(getCookie(c, SESSION_COOKIE)) }) }
    catch (error) { if (error instanceof AppError && error.code === 'AUTH_REQUIRED') return c.json({ data: null }); throw error }
  })
  app.use('/api/runs', requireAuth)
  app.use('/api/runs/*', requireAuth)
  app.use('/api/today', requireAuth)
  for (const path of ['/api/profile','/api/profile/*','/api/home','/api/activities','/api/activities/*','/api/recurring-activities','/api/recurring-activities/*','/api/events','/api/events/*','/api/integrations/*','/api/ai/*']) app.use(path, requireAuth)

  app.get('/api/runs', async (c) => {
    const query = parseQuery(c.req.query(), listRunsSchema)
    return c.json({ data: await runs(c).list(c.get('user').id, query) })
  })
  app.post('/api/runs', async (c) => {
    const body = await parseBody(c, createRunSchema)
    return c.json({ data: await runs(c).create(c.get('user').id, body) }, 201)
  })
  app.get('/api/runs/:id', async (c) => c.json({ data: await runs(c).get(c.get('user').id, c.req.param('id')) }))
  app.patch('/api/runs/:id', async (c) => {
    const body = await parseBody(c, updateRunSchema)
    return c.json({ data: await runs(c).update(c.get('user').id, c.req.param('id'), body) })
  })
  app.delete('/api/runs/:id', async (c) => c.json({ data: await runs(c).archive(c.get('user').id, c.req.param('id')) }))
  app.patch('/api/runs/:id/next-action', async (c) => {
    const body = await parseBody(c, nextActionSchema)
    return c.json({ data: await runs(c).updateNextAction(c.get('user').id, c.req.param('id'), body.nextAction) })
  })
  app.patch('/api/runs/:id/progress', async (c) => {
    const body = await parseBody(c, progressSchema)
    return c.json({ data: await runs(c).updateProgress(c.get('user').id, c.req.param('id'), body.progress) })
  })
  app.patch('/api/runs/:id/focus', async (c) => {
    const body = await parseBody(c, focusSchema)
    return c.json({ data: await runs(c).updateFocus(c.get('user').id, c.req.param('id'), body) })
  })
  app.post('/api/runs/:id/start', (c) => lifecycle(c, 'start'))
  app.post('/api/runs/:id/pause', (c) => lifecycle(c, 'pause'))
  app.post('/api/runs/:id/resume', (c) => lifecycle(c, 'resume'))
  app.post('/api/runs/:id/complete', (c) => lifecycle(c, 'complete'))
  app.post('/api/runs/:id/archive', (c) => lifecycle(c, 'archive'))
  app.post('/api/runs/:id/block', async (c) => {
    const body = await parseBody(c, blockSchema)
    return c.json({ data: await runs(c).block(c.get('user').id, c.req.param('id'), body.blocker) })
  })
  app.get('/api/runs/:id/history', async (c) => c.json({ data: await runs(c).history(c.get('user').id, c.req.param('id')) }))
  app.get('/api/today', async (c) => {
    const query = parseQuery(c.req.query(), todayQuerySchema)
    return c.json({ data: await runs(c).today(c.get('user').id, query.date) })
  })

  app.get('/api/profile', async (c) => c.json({ data: await phase4(c).getProfile(c.get('user').id) }))
  app.put('/api/profile', async (c) => c.json({ data: await phase4(c).saveProfile(c.get('user').id, await parseBody(c, profileSchema) as any) }))

  app.get('/api/home', async (c) => c.json({ data: await phase4(c).getHome(c.get('user').id) }))

  app.get('/api/recurring-activities', async (c) => c.json({ data: await phase4(c).listRecurring(c.get('user').id) }))
  app.post('/api/recurring-activities', async (c) => c.json({ data: await phase4(c).saveRecurring(c.get('user').id, await parseBody(c, recurringSchema) as any) }, 201))
  app.put('/api/recurring-activities/:id', async (c) => c.json({ data: await phase4(c).saveRecurring(c.get('user').id, await parseBody(c, recurringSchema) as any, c.req.param('id')) }))
  app.get('/api/recurring-activities/occurrences', async (c) => { const q=parseQuery(c.req.query(),occurrenceQuerySchema); return c.json({data:await phase4(c).listOccurrences(c.get('user').id,q.from,q.to)}) })
  app.put('/api/recurring-activities/:id/occurrences', async (c) => c.json({ data: await phase4(c).saveOccurrence(c.get('user').id, c.req.param('id'), await parseBody(c, occurrenceSchema) as any) }))

  app.get('/api/activities', async (c) => c.json({ data: await phase4(c).listActivities(c.get('user').id) }))
  app.post('/api/activities', async (c) => c.json({ data: await phase4(c).saveActivity(c.get('user').id, await parseBody(c, activitySchema) as any) }, 201))
  app.put('/api/activities/:id', async (c) => c.json({ data: await phase4(c).saveActivity(c.get('user').id, await parseBody(c, activitySchema) as any, c.req.param('id')) }))

  app.get('/api/events', async (c) => c.json({ data: await phase4(c).listEvents(c.get('user').id) }))
  app.post('/api/events', async (c) => c.json({ data: await phase4(c).saveEvent(c.get('user').id, await parseBody(c, runningEventSchema) as any) }, 201))
  app.put('/api/events/:id', async (c) => c.json({ data: await phase4(c).saveEvent(c.get('user').id, await parseBody(c, runningEventSchema) as any, c.req.param('id')) }))
  app.get('/api/events/:id/context', async (c) => c.json({ data: await phase4(c).getEventWithRelevance(c.get('user').id, c.req.param('id')) }))
  app.get('/api/events/:id/evidence', async (c) => c.json({ data: await phase4(c).listEvidence(c.get('user').id, c.req.param('id')) }))
  app.post('/api/events/:id/evidence', async (c) => c.json({ data: await phase4(c).addEvidence(c.get('user').id, c.req.param('id'), await parseBody(c, evidenceSchema) as any) }, 201))

  app.get('/api/integrations/strava', async (c) => { const integration = await phase4(c).getIntegration(c.get('user').id); return c.json({ data: { ...integration, status: 'disconnected', providerUserId: null, scopes: [], connectedAt: null, lastSyncedAt: null, lastErrorCode: 'INTEGRATION_DEFERRED', available: false, capabilities: { oauth: false, sync: false, displayOnly: false, aiAccess: false } } }) })
  app.post('/api/integrations/strava/connect', async (c) => {
    if (!c.env?.STRAVA_CLIENT_ID || !c.env?.STRAVA_CLIENT_SECRET) throw new AppError('PROVIDER_UNAVAILABLE','Koneksi Strava belum tersedia karena kredensial produksi belum dikonfigurasi.',503)
    throw new AppError('PROVIDER_UNAVAILABLE','Alur OAuth Strava belum diaktifkan. Data lokal tetap aman.',503)
  })
  app.post('/api/integrations/strava/disconnect', async (c) => c.json({ data: await phase4(c).disconnectStrava(c.get('user').id) }))
  app.post('/api/integrations/strava/sync', async () => { throw new AppError('PROVIDER_UNAVAILABLE','Sinkronisasi Strava belum tersedia. Tidak ada data aktivitas yang dibuat.',503) })

  app.post('/api/ai/ask', async (c) => {
    const { question } = await parseBody(c, aiQuestionSchema, 'AI_INVALID_REQUEST')
    const env = c.env ?? ({} as Bindings)
    const result = await new AIApplicationService(c.get('store'), aiProviderFactory(env)).ask(c.get('user').id, question)
    return c.json({ data: result })
  })

  app.get('/health', (c) => c.json({ status: 'ok' }))
  app.get('*', (c) => c.html(renderShell()))

  app.notFound((c) => c.req.path.startsWith('/api/')
    ? c.json({ error: { code: 'NOT_FOUND', message: 'Endpoint not found' } }, 404)
    : c.html(renderShell()))

  app.onError((error, c) => {
    if (error instanceof AppError) return c.json({ error: { code: error.code, message: error.message, details: error.details } }, error.status as 400)
    console.error('Request failed', { method: c.req.method, path: c.req.path, error: error instanceof Error ? error.message : 'Unknown error' })
    return c.json({ error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } }, 500)
  })

  return app

  function requireClerk(env?: Bindings): ClerkGateway {
    const gateway = clerkFactory(env as Bindings)
    if (!gateway) throw new AppError('IDENTITY_PROVIDER_UNAVAILABLE', 'Login Google belum dikonfigurasi. Gunakan email dan kata sandi.', 503)
    return gateway
  }

  function runs(c: { get: (key: 'store') => RunStore }) { return new RunService(c.get('store')) }
  function phase4(c: { get: (key: 'store') => RunStore }) { return new Phase4Service(c.get('store')) }
  async function lifecycle(c: any, action: 'start' | 'pause' | 'resume' | 'complete' | 'archive') {
    const service = runs(c)
    return c.json({ data: await service[action](c.get('user').id, c.req.param('id')) })
  }
}

function parseQuery<T>(raw: unknown, schema: ZodSchema<T>): T {
  const parsed = schema.safeParse(raw)
  if (!parsed.success) throw new AppError('VALIDATION_ERROR', 'Query validation failed', 400, parsed.error.flatten())
  return parsed.data
}

async function parseBody<T>(c: { req: { json: () => Promise<unknown> } }, schema: ZodSchema<T>, errorCode: 'VALIDATION_ERROR' | 'AI_INVALID_REQUEST' = 'VALIDATION_ERROR'): Promise<T> {
  let raw: unknown
  try { raw = await c.req.json() } catch { throw new AppError(errorCode, 'Request body must be valid JSON', 400) }
  const parsed = schema.safeParse(raw)
  if (!parsed.success) throw new AppError(errorCode, 'Request validation failed', 400, parsed.error.flatten())
  return parsed.data
}

function isSecureRequest(url: string): boolean {
  return new URL(url).protocol === 'https:'
}

function sessionCookieScope(url: string) {
  return {
    secure: isSecureRequest(url),
    sameSite: 'Strict' as const,
    path: '/',
  }
}

function setSessionCookie(c: any, token: string, maxAge = 60 * 60 * 24 * 30): void {
  setCookie(c, SESSION_COOKIE, token, {
    ...sessionCookieScope(c.req.url),
    httpOnly: true,
    maxAge,
  })
}

/** CSP: Clerk origins are added only when Clerk is configured. Clerk injects runtime styles, hence 'unsafe-inline' for style-src only. */
export function buildCsp(clerkOrigin: string | null): string {
  const clerk = clerkOrigin ? ` ${clerkOrigin}` : ''
  return [
    "default-src 'self'",
    `script-src 'self' https://static.cloudflareinsights.com${clerk}${clerkOrigin ? ' https://challenges.cloudflare.com' : ''}`,
    clerkOrigin ? "style-src 'self' 'unsafe-inline'" : "style-src 'self'",
    `img-src 'self' data:${clerkOrigin ? ' https://img.clerk.com' : ''}`,
    `connect-src 'self' https://cloudflareinsights.com${clerk}`,
    ...(clerkOrigin ? ["frame-src https://challenges.cloudflare.com", "worker-src 'self' blob:"] : []),
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join('; ')
}

export default createApp()
