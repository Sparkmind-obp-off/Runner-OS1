import { beforeEach, describe, expect, it } from 'vitest'
import { createApp } from '../src/index'
import { MemoryRunStore } from './memory-store'

let store: MemoryRunStore
let app: ReturnType<typeof createApp>

async function register(email: string, name = 'Runner'): Promise<{ cookie: string; user: any }> {
  const response = await app.request('http://localhost/api/auth/register', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body:JSON.stringify({ email, displayName:name, password:'correct-horse-battery-staple' }),
  })
  expect(response.status).toBe(201)
  return { cookie: response.headers.get('set-cookie')!.split(';')[0], user:(await response.json() as any).data }
}

async function request(path: string, cookie?: string, init: RequestInit = {}) {
  const response = await app.request(`http://localhost${path}`, { ...init, headers:{ ...(init.body ? {'Content-Type':'application/json'} : {}), ...(cookie ? {Cookie:cookie} : {}), ...init.headers } })
  return { response, body: await response.json() as any }
}

async function createRun(cookie: string, overrides: Record<string, unknown> = {}) {
  const result = await request('/api/runs', cookie, { method:'POST', body:JSON.stringify({ title:'Launch Runner Core', type:'project', outcome:'A verified vertical slice', nextAction:'Implement lifecycle', priority:'high', ...overrides }) })
  expect(result.response.status).toBe(201)
  return result.body.data
}

beforeEach(() => { store = new MemoryRunStore(); app = createApp(() => store) })

describe('Phase 3 authentication and session contract', () => {
  it('sets a persistent host-only secure cookie with deliberate production attributes', async () => {
    const response = await app.request('https://runner-os.biz.id/api/auth/register', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({ email:'cookie@example.com', displayName:'Cookie Runner', password:'correct-horse-battery-staple' }),
    })
    expect(response.status).toBe(201)
    const cookie = response.headers.get('set-cookie')!
    expect(cookie).toContain('runner_session=')
    expect(cookie).toContain('HttpOnly')
    expect(cookie).toContain('Secure')
    expect(cookie).toContain('SameSite=Strict')
    expect(cookie).toContain('Path=/')
    expect(cookie).toContain('Max-Age=2592000')
    expect(cookie).not.toContain('Domain=')
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(response.headers.get('strict-transport-security')).toContain('max-age=31536000')
  })

  it('registers, confirms the server session, logs in, and survives refresh-equivalent requests', async () => {
    const registered = await register('session@example.com', 'Session Runner')
    const firstMe = await request('/api/auth/me', registered.cookie)
    const refreshedMe = await request('/api/auth/me', registered.cookie)
    expect(firstMe.body.data).toEqual(registered.user)
    expect(refreshedMe.body.data).toEqual(registered.user)

    const login = await request('/api/auth/login', undefined, {
      method:'POST',
      body:JSON.stringify({ email:'session@example.com', password:'correct-horse-battery-staple' }),
    })
    expect(login.response.status).toBe(200)
    expect(login.body.data).toEqual(registered.user)
    const loginCookie = login.response.headers.get('set-cookie')!.split(';')[0]
    expect(loginCookie).not.toBe(registered.cookie)
    expect((await request('/api/runs', loginCookie)).response.status).toBe(200)
  })

  it('uses a generic invalid-credentials response for unknown email and wrong password', async () => {
    await register('credentials@example.com')
    for (const body of [
      { email:'missing@example.com', password:'wrong-password' },
      { email:'credentials@example.com', password:'wrong-password' },
    ]) {
      const result = await request('/api/auth/login', undefined, { method:'POST', body:JSON.stringify(body) })
      expect(result.response.status).toBe(401)
      expect(result.body.error).toMatchObject({ code:'AUTH_INVALID', message:'Invalid email or password' })
    }
  })

  it('invalidates the server session on logout and clears the matching cookie scope', async () => {
    const { cookie } = await register('logout@example.com')
    const logout = await request('/api/auth/logout', cookie, { method:'POST' })
    expect(logout.response.status).toBe(200)
    const cleared = logout.response.headers.get('set-cookie')!
    expect(cleared).toContain('runner_session=')
    expect(cleared).toContain('Max-Age=0')
    expect(cleared).toContain('Path=/')
    expect(cleared).toContain('SameSite=Strict')
    expect((await request('/api/auth/me', cookie)).body.data).toBeNull()
    expect((await request('/api/runs', cookie)).response.status).toBe(401)
  })

  it('rejects invalid and expired sessions and removes expired server records', async () => {
    expect((await request('/api/runs', 'runner_session=invalid-token')).response.status).toBe(401)
    const { cookie } = await register('expired@example.com')
    const session = [...store.sessions.values()][0]
    session.expiresAt = '2000-01-01T00:00:00.000Z'
    store.sessions.set(session.tokenHash, session)
    expect((await request('/api/runs', cookie)).response.status).toBe(401)
    expect(store.sessions.size).toBe(0)
  })
})

describe('Runner OS API', () => {
  it('protects Run and Today endpoints from unauthenticated requests', async () => {
    for (const path of ['/api/runs','/api/today','/api/runs/unknown']) {
      const { response, body } = await request(path)
      expect(response.status).toBe(401); expect(body.error.code).toBe('AUTH_REQUIRED')
    }
  })

  it('supports create, get, list, and metadata update', async () => {
    const { cookie } = await register('a@example.com')
    const run = await createRun(cookie)
    const fetched = await request(`/api/runs/${run.id}`, cookie)
    expect(fetched.body.data).toMatchObject({ title:'Launch Runner Core', status:'planned', progress:0 })
    const listed = await request('/api/runs', cookie)
    expect(listed.body.data).toHaveLength(1)
    const updated = await request(`/api/runs/${run.id}`, cookie, { method:'PATCH', body:JSON.stringify({ title:'Ship Runner Core', priority:'critical' }) })
    expect(updated.body.data).toMatchObject({ title:'Ship Runner Core', priority:'critical' })
  })

  it('fails closed for cross-owner read, update, lifecycle, history, and delete', async () => {
    const ownerA = await register('owner-a@example.com', 'Owner A')
    const ownerB = await register('owner-b@example.com', 'Owner B')
    const run = await createRun(ownerA.cookie)
    const attempts: Array<[string, RequestInit]> = [
      [`/api/runs/${run.id}`, {}],
      [`/api/runs/${run.id}`, { method:'PATCH', body:JSON.stringify({ title:'Stolen' }) }],
      [`/api/runs/${run.id}/start`, { method:'POST' }],
      [`/api/runs/${run.id}/focus`, { method:'PATCH', body:JSON.stringify({ focusDate:'2026-09-17', focusOrder:1 }) }],
      [`/api/runs/${run.id}/history`, {}],
      [`/api/runs/${run.id}`, { method:'DELETE' }],
    ]
    for (const [path, init] of attempts) {
      const { response, body } = await request(path, ownerB.cookie, init)
      expect(response.status).toBe(404); expect(body.error.code).toBe('NOT_FOUND')
    }
  })

  it('enforces lifecycle server-side and creates immutable event history', async () => {
    const { cookie } = await register('life@example.com')
    const run = await createRun(cookie)
    expect((await request(`/api/runs/${run.id}/complete`, cookie, { method:'POST' })).body.error.code).toBe('INVALID_TRANSITION')
    expect((await request(`/api/runs/${run.id}/start`, cookie, { method:'POST' })).body.data.status).toBe('active')
    expect((await request(`/api/runs/${run.id}/pause`, cookie, { method:'POST' })).body.data.status).toBe('paused')
    expect((await request(`/api/runs/${run.id}/resume`, cookie, { method:'POST' })).body.data.status).toBe('active')
    expect((await request(`/api/runs/${run.id}/complete`, cookie, { method:'POST' })).body.data).toMatchObject({ status:'completed', progress:100 })
    const history = await request(`/api/runs/${run.id}/history`, cookie)
    expect(history.body.data.map((event: any) => event.eventType)).toEqual(expect.arrayContaining(['run.created','run.lifecycle_changed']))
    expect(history.body.data).toHaveLength(5)
  })

  it('validates progress bounds and blocker input', async () => {
    const { cookie } = await register('validation@example.com')
    const run = await createRun(cookie); await request(`/api/runs/${run.id}/start`, cookie, { method:'POST' })
    for (const progress of [-1, 101, 10.5]) {
      const result = await request(`/api/runs/${run.id}/progress`, cookie, { method:'PATCH', body:JSON.stringify({ progress }) })
      expect(result.response.status).toBe(400); expect(result.body.error.code).toBe('VALIDATION_ERROR')
    }
    const blocked = await request(`/api/runs/${run.id}/block`, cookie, { method:'POST', body:JSON.stringify({ blocker:'' }) })
    expect(blocked.response.status).toBe(400)
  })

  it('supports owner-scoped organization, filtering, sorting, and stable validation errors', async () => {
    const { cookie } = await register('organize@example.com')
    await createRun(cookie, { title:'Low personal Run', priority:'low', type:'learning', tags:['Personal'] })
    await createRun(cookie, { title:'Critical launch Run', priority:'critical', tags:['Launch', 'Work'] })
    const filtered = await request('/api/runs?tag=launch&sort=priority&direction=asc', cookie)
    expect(filtered.response.status).toBe(200)
    expect(filtered.body.data.map((run: any) => run.title)).toEqual(['Critical launch Run'])
    expect(filtered.body.data[0].tags).toEqual(['launch','work'])
    const invalid = await request('/api/runs?sort=unknown', cookie)
    expect(invalid.response.status).toBe(400)
    expect(invalid.body.error.code).toBe('VALIDATION_ERROR')
  })

  it('limits daily focus, records focus history, and excludes terminal Runs from overdue', async () => {
    const { cookie } = await register('focus@example.com')
    const runs: Array<{ id: string }> = []
    for (let index = 0; index < 4; index++) runs.push(await createRun(cookie, { title:`Focus ${index}`, dueAt:'2000-01-01T00:00:00.000Z' }))
    for (const [index, run] of runs.slice(0, 3).entries()) {
      const focused = await request(`/api/runs/${run.id}/focus`, cookie, { method:'PATCH', body:JSON.stringify({ focusDate:'2026-09-17', focusOrder:index + 1 }) })
      expect(focused.response.status).toBe(200)
    }
    const overflow = await request(`/api/runs/${runs[3].id}/focus`, cookie, { method:'PATCH', body:JSON.stringify({ focusDate:'2026-09-17', focusOrder:1 }) })
    expect(overflow.response.status).toBe(409)
    expect(overflow.body.error.code).toBe('CONFLICT')

    await request(`/api/runs/${runs[0].id}/start`, cookie, { method:'POST' })
    await request(`/api/runs/${runs[0].id}/complete`, cookie, { method:'POST' })
    const today = await request('/api/today?date=2026-09-17', cookie)
    expect(today.body.data.focusRuns).toHaveLength(2)
    expect(today.body.data.overdue.some((run: any) => run.id === runs[0].id)).toBe(false)
    const history = await request(`/api/runs/${runs[0].id}/history`, cookie)
    expect(history.body.data.some((event: any) => event.eventType === 'run.focus_updated')).toBe(true)
    expect(history.body.data.find((event: any) => event.newState === 'completed').metadata.focusCleared).toBe(true)
  })

  it('does not expose password material or session token in API payloads', async () => {
    const registered = await register('private@example.com')
    const payload = JSON.stringify(registered.user)
    expect(payload).not.toContain('password')
    expect(payload).not.toContain('token')
    const me = await request('/api/auth/me', registered.cookie)
    expect(JSON.stringify(me.body)).not.toContain('passwordHash')
    expect(JSON.stringify(me.body)).not.toContain('passwordSalt')
  })
})

describe('Phase 1 UX acceptance journey', () => {
  it('creates, clarifies, runs, tracks, recovers, completes, and inspects history', async () => {
    const { cookie } = await register('journey@example.com')
    const run = await createRun(cookie, { outcome:'Release tested Runner Core', nextAction:'Start implementation' })
    await request(`/api/runs/${run.id}/start`, cookie, { method:'POST' })
    expect((await request(`/api/runs/${run.id}/progress`, cookie, { method:'PATCH', body:JSON.stringify({progress:35}) })).body.data.progress).toBe(35)
    expect((await request(`/api/runs/${run.id}/block`, cookie, { method:'POST', body:JSON.stringify({blocker:'Migration decision'}) })).body.data.status).toBe('blocked')
    await request(`/api/runs/${run.id}/next-action`, cookie, { method:'PATCH', body:JSON.stringify({nextAction:'Validate D1 migration locally'}) })
    expect((await request(`/api/runs/${run.id}/resume`, cookie, { method:'POST' })).body.data).toMatchObject({status:'active',blocker:null})
    expect((await request(`/api/runs/${run.id}/complete`, cookie, { method:'POST' })).body.data.status).toBe('completed')
    const history = await request(`/api/runs/${run.id}/history`, cookie)
    expect(history.body.data).toHaveLength(7)
    expect(history.body.data.some((event: any) => event.previousState === 'blocked' && event.newState === 'active')).toBe(true)
  })
})
