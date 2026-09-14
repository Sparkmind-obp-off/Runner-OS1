import type { RunStatus } from './models'
import { AppError } from './errors'

const transitions: Record<RunStatus, readonly RunStatus[]> = {
  planned: ['active'],
  active: ['paused', 'blocked', 'completed', 'archived'],
  paused: ['active', 'completed', 'archived'],
  blocked: ['active', 'completed', 'archived'],
  completed: [],
  archived: [],
}

export function canTransition(from: RunStatus, to: RunStatus): boolean {
  return transitions[from].includes(to)
}

export function assertTransition(from: RunStatus, to: RunStatus): void {
  if (!canTransition(from, to)) {
    throw new AppError('INVALID_TRANSITION', `Cannot transition Run from ${from} to ${to}`, 409, { from, to })
  }
}

export function availableTransitions(status: RunStatus): readonly RunStatus[] {
  return transitions[status]
}
