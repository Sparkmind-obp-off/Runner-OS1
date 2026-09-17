import { describe, expect, it } from 'vitest'
import type { Run } from '../src/domain/models'
import { filterAndSortRuns, isOverdue, isUpcoming, normalizeTags } from '../src/domain/productivity'

const now = '2026-09-17T12:00:00.000Z'
const run = (overrides: Partial<Run> = {}): Run => ({
  id: overrides.id ?? crypto.randomUUID(), ownerId: 'owner-a', title: 'Default Run', type: 'project', outcome: '',
  status: 'active', priority: 'normal', nextAction: '', progress: 0, blocker: null, dueAt: null,
  tags: [], focusDate: null, focusOrder: null, createdAt: now, updatedAt: now, ...overrides,
})

describe('Phase 2 productivity rules', () => {
  it('normalizes, deduplicates, and bounds tags', () => {
    expect(normalizeTags([' Work ', 'work', 'Deep Focus'])).toEqual(['work', 'deep focus'])
    expect(normalizeTags(Array.from({ length: 12 }, (_, index) => `tag-${index}`))).toHaveLength(10)
  })

  it('treats only actionable Runs with an elapsed due instant as overdue', () => {
    const dueAt = '2026-09-17T11:59:59.999Z'
    expect(isOverdue(run({ dueAt }), now)).toBe(true)
    expect(isOverdue(run({ dueAt: now }), now)).toBe(false)
    expect(isOverdue(run({ dueAt, status: 'completed' }), now)).toBe(false)
    expect(isOverdue(run({ dueAt, status: 'archived' }), now)).toBe(false)
    expect(isOverdue(run({ dueAt: null }), now)).toBe(false)
  })

  it('identifies upcoming work inside a deterministic UTC horizon', () => {
    expect(isUpcoming(run({ dueAt: '2026-09-24T12:00:00.000Z' }), now)).toBe(true)
    expect(isUpcoming(run({ dueAt: '2026-09-24T12:00:00.001Z' }), now)).toBe(false)
    expect(isUpcoming(run({ dueAt: '2026-09-16T12:00:00.000Z' }), now)).toBe(false)
  })

  it('filters by owner-provided semantics and sorts deterministically', () => {
    const runs = [
      run({ id:'1', title:'Write release notes', priority:'normal', tags:['launch'], dueAt:'2026-09-20T00:00:00.000Z' }),
      run({ id:'2', title:'Fix launch blocker', priority:'critical', status:'blocked', tags:['launch'], dueAt:'2026-09-18T00:00:00.000Z' }),
      run({ id:'3', title:'Read a book', priority:'low', type:'learning', tags:['personal'] }),
    ]
    expect(filterAndSortRuns(runs, { tag:'launch', sort:'priority' }).map((item) => item.id)).toEqual(['2','1'])
    expect(filterAndSortRuns(runs, { search:'release' }).map((item) => item.id)).toEqual(['1'])
    expect(filterAndSortRuns(runs, { status:'blocked' }).map((item) => item.id)).toEqual(['2'])
    expect(filterAndSortRuns(runs, { sort:'due' }).map((item) => item.id)).toEqual(['2','1','3'])
  })
})
