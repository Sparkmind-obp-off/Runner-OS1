import { describe, expect, it } from 'vitest'
import { assertTransition, availableTransitions, canTransition } from '../src/domain/lifecycle'
import type { RunStatus } from '../src/domain/models'

const valid: Array<[RunStatus, RunStatus]> = [
  ['planned','active'], ['active','paused'], ['paused','active'], ['active','blocked'],
  ['blocked','active'], ['active','completed'], ['paused','completed'], ['blocked','completed'],
  ['active','archived'], ['paused','archived'], ['blocked','archived'],
]

describe('Runner Core lifecycle', () => {
  it.each(valid)('allows %s → %s', (from, to) => {
    expect(canTransition(from, to)).toBe(true)
    expect(() => assertTransition(from, to)).not.toThrow()
  })

  it.each([
    ['planned','completed'], ['planned','paused'], ['planned','archived'], ['paused','blocked'],
    ['blocked','paused'], ['completed','active'], ['archived','active'], ['active','active'],
  ] as Array<[RunStatus, RunStatus]>)('rejects %s → %s', (from, to) => {
    expect(canTransition(from, to)).toBe(false)
    expect(() => assertTransition(from, to)).toThrowError(expect.objectContaining({ code: 'INVALID_TRANSITION' }))
  })

  it('makes completed and archived terminal', () => {
    expect(availableTransitions('completed')).toEqual([])
    expect(availableTransitions('archived')).toEqual([])
  })
})
