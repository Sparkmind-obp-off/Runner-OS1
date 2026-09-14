import { describe, expect, it } from 'vitest'
import { RunService } from '../src/application/run-service'
import { MemoryRunStore } from './memory-store'

const runtime = (() => { let id = 0; return { id: () => `id-${++id}`, now: () => '2026-01-01T00:00:00.000Z' } })()

describe('RunService transactional behavior', () => {
  it('keeps state and event consistent when a transactional write fails', async () => {
    const store = new MemoryRunStore(); const service = new RunService(store, runtime)
    const run = await service.create('owner-a', { title:'Ship core', type:'project', outcome:'Working slice' })
    const initialEvents = store.events.length
    store.failNextTransactionalWrite = true
    await expect(service.start('owner-a', run.id)).rejects.toThrow('simulated transaction failure')
    expect((await service.get('owner-a', run.id)).status).toBe('planned')
    expect(store.events).toHaveLength(initialEvents)
  })

  it('requires a recovery next action before blocked → active', async () => {
    const store = new MemoryRunStore(); const service = new RunService(store, runtime)
    const run = await service.create('owner-a', { title:'Recover', type:'project', outcome:'' })
    await service.start('owner-a', run.id); await service.block('owner-a', run.id, 'Waiting')
    await expect(service.resume('owner-a', run.id)).rejects.toMatchObject({ code:'VALIDATION_ERROR' })
    await service.updateNextAction('owner-a', run.id, 'Call supplier')
    await expect(service.resume('owner-a', run.id)).resolves.toMatchObject({ status:'active', blocker:null })
  })
})
