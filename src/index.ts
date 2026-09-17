import { Hono, type MiddlewareHandler } from 'hono'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import type { ZodSchema } from 'zod'
import { AuthService, type PublicUser } from './application/auth-service'
import type { RunStore } from './application/ports'
import { RunService } from './application/run-service'
import { AppError } from './domain/errors'
import { D1RunStore } from './infrastructure/d1-store'
import { blockSchema, createRunSchema, focusSchema, listRunsSchema, loginSchema, nextActionSchema, progressSchema, registerSchema, todayQuerySchema, updateRunSchema } from './http/schemas'
import { renderShell } from './view'

type Bindings = { DB: D1Database }
type Variables = { user: PublicUser; store: RunStore }
type AppEnv = { Bindings: Bindings; Variables: Variables }

const SESSION_COOKIE = 'runner_session'

type StoreFactory = (env: Bindings) => RunStore

export function createApp(storeFactory: StoreFactory = (env) => new D1RunStore(env.DB)) {
  const app = new Hono<AppEnv>()

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
    const body = await parseBody(c, registerSchema)
    const result = await new AuthService(c.get('store')).register(body.email, body.displayName, body.password)
    setSessionCookie(c, result.token)
    return c.json({ data: result.user }, 201)
  })

  app.post('/api/auth/login', async (c) => {
    const body = await parseBody(c, loginSchema)
    const result = await new AuthService(c.get('store')).login(body.email, body.password)
    setSessionCookie(c, result.token)
    return c.json({ data: result.user })
  })

  app.post('/api/auth/logout', async (c) => {
    await new AuthService(c.get('store')).logout(getCookie(c, SESSION_COOKIE))
    deleteCookie(c, SESSION_COOKIE, { path: '/', secure: new URL(c.req.url).protocol === 'https:', sameSite: 'Strict' })
    return c.json({ data: { success: true } })
  })

  app.get('/api/auth/me', async (c) => {
    try { return c.json({ data: await new AuthService(c.get('store')).authenticate(getCookie(c, SESSION_COOKIE)) }) }
    catch (error) { if (error instanceof AppError && error.code === 'AUTH_REQUIRED') return c.json({ data: null }); throw error }
  })
  app.use('/api/runs', requireAuth)
  app.use('/api/runs/*', requireAuth)
  app.use('/api/today', requireAuth)

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

  function runs(c: { get: (key: 'store') => RunStore }) { return new RunService(c.get('store')) }
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

async function parseBody<T>(c: { req: { json: () => Promise<unknown> } }, schema: ZodSchema<T>): Promise<T> {
  let raw: unknown
  try { raw = await c.req.json() } catch { throw new AppError('VALIDATION_ERROR', 'Request body must be valid JSON', 400) }
  const parsed = schema.safeParse(raw)
  if (!parsed.success) throw new AppError('VALIDATION_ERROR', 'Request validation failed', 400, parsed.error.flatten())
  return parsed.data
}

function setSessionCookie(c: any, token: string): void {
  setCookie(c, SESSION_COOKIE, token, {
    httpOnly: true,
    secure: new URL(c.req.url).protocol === 'https:',
    sameSite: 'Strict',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  })
}

export default createApp()
