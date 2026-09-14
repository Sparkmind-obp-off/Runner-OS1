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
