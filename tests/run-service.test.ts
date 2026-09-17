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

  it('builds a timezone-safe Today decision surface', async () => {
    const store = new MemoryRunStore(); const service = new RunService(store, runtime)
    const overdue = await service.create('owner-a', { title:'Overdue', type:'project', dueAt:'2025-12-31T23:59:59.000Z', priority:'critical' })
    const upcoming = await service.create('owner-a', { title:'Upcoming', type:'project', dueAt:'2026-01-08T00:00:00.000Z' })
    const later = await service.create('owner-a', { title:'Later', type:'project', dueAt:'2026-01-08T00:00:00.001Z' })
    await service.updateFocus('owner-a', overdue.id, { focusDate:'2026-01-01', focusOrder:1 })
    await service.start('owner-a', overdue.id); await service.complete('owner-a', overdue.id)
    await service.updateFocus('owner-a', upcoming.id, { focusDate:'2026-01-01', focusOrder:2 })

    const today = await service.today('owner-a', '2026-01-01')
    expect(today.generatedAt).toBe('2026-01-01T00:00:00.000Z')
    expect(today.focusRuns.map((run) => run.id)).toEqual([upcoming.id])
    expect(today.overdue).toEqual([])
    expect(today.upcoming.map((run) => run.id)).toEqual([upcoming.id])
    expect(today.upcoming.some((run) => run.id === later.id)).toBe(false)
  })
})
