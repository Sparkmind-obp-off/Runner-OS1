import { AppError, notFound } from '../domain/errors'
import { assertTransition } from '../domain/lifecycle'
import type { Run, RunEvent, RunPriority, RunStatus, RunType, TodayData } from '../domain/models'
import type { RunStore, Runtime } from './ports'
import { defaultRuntime } from './ports'

export interface CreateRunInput {
  title: string
  type: RunType
  outcome?: string
  priority?: RunPriority
  nextAction?: string
  dueAt?: string | null
}

export interface UpdateRunInput {
  title?: string
  type?: RunType
  outcome?: string
  priority?: RunPriority
  dueAt?: string | null
}

export class RunService {
  constructor(private readonly store: RunStore, private readonly runtime: Runtime = defaultRuntime) {}

  async create(ownerId: string, input: CreateRunInput): Promise<Run> {
    const now = this.runtime.now()
    const run: Run = {
      id: this.runtime.id(), ownerId, title: input.title.trim(), type: input.type,
      outcome: input.outcome?.trim() ?? '', status: 'planned', priority: input.priority ?? 'normal',
      nextAction: input.nextAction?.trim() ?? '', progress: 0, blocker: null,
      dueAt: input.dueAt ?? null, createdAt: now, updatedAt: now,
    }
    await this.store.createRunWithEvent(run, this.event(run, 'run.created', null, 'planned', { title: run.title }))
    return run
  }

  async get(ownerId: string, runId: string): Promise<Run> {
    const run = await this.store.getRun(ownerId, runId)
    if (!run) throw notFound()
    return run
  }

  list(ownerId: string): Promise<Run[]> { return this.store.listRuns(ownerId) }

  async update(ownerId: string, runId: string, input: UpdateRunInput): Promise<Run> {
    const run = await this.get(ownerId, runId)
    const changes: Record<string, unknown> = {}
    for (const key of ['title', 'type', 'outcome', 'priority', 'dueAt'] as const) {
      if (input[key] !== undefined) changes[key] = input[key]
    }
    const updated: Run = {
      ...run,
      ...(input.title !== undefined ? { title: input.title.trim() } : {}),
      ...(input.type !== undefined ? { type: input.type } : {}),
      ...(input.outcome !== undefined ? { outcome: input.outcome.trim() } : {}),
      ...(input.priority !== undefined ? { priority: input.priority } : {}),
      ...(input.dueAt !== undefined ? { dueAt: input.dueAt } : {}),
      updatedAt: this.runtime.now(),
    }
    await this.store.saveRunWithEvent(updated, this.event(updated, 'run.updated', run.status, run.status, changes))
    return updated
  }

  async updateNextAction(ownerId: string, runId: string, nextAction: string): Promise<Run> {
    const run = await this.get(ownerId, runId)
    const updated = { ...run, nextAction: nextAction.trim(), updatedAt: this.runtime.now() }
    await this.store.saveRunWithEvent(updated, this.event(updated, 'run.next_action_updated', run.status, run.status, { previous: run.nextAction, next: updated.nextAction }))
    return updated
  }

  async updateProgress(ownerId: string, runId: string, progress: number): Promise<Run> {
    if (!Number.isInteger(progress) || progress < 0 || progress > 100) throw new AppError('VALIDATION_ERROR', 'Progress must be an integer from 0 to 100', 400)
    const run = await this.get(ownerId, runId)
    const updated = { ...run, progress, updatedAt: this.runtime.now() }
    await this.store.saveRunWithEvent(updated, this.event(updated, 'run.progress_updated', run.status, run.status, { previous: run.progress, next: progress }))
    return updated
  }

  async transition(ownerId: string, runId: string, target: RunStatus, blocker?: string): Promise<Run> {
    const run = await this.get(ownerId, runId)
    assertTransition(run.status, target)
    if (target === 'blocked' && !blocker?.trim()) throw new AppError('VALIDATION_ERROR', 'A blocker is required when blocking a Run', 400)
    if (target === 'active' && run.status === 'blocked' && !run.nextAction.trim()) {
      throw new AppError('VALIDATION_ERROR', 'Set a recovery next action before resuming a blocked Run', 400)
    }
    const updated: Run = {
      ...run,
      status: target,
      blocker: target === 'blocked' ? blocker!.trim() : target === 'active' ? null : run.blocker,
      progress: target === 'completed' ? 100 : run.progress,
      updatedAt: this.runtime.now(),
    }
    await this.store.saveRunWithEvent(updated, this.event(updated, 'run.lifecycle_changed', run.status, target, { blocker: updated.blocker }))
    return updated
  }

  start(ownerId: string, runId: string) { return this.transition(ownerId, runId, 'active') }
  pause(ownerId: string, runId: string) { return this.transition(ownerId, runId, 'paused') }
  block(ownerId: string, runId: string, blocker: string) { return this.transition(ownerId, runId, 'blocked', blocker) }
  resume(ownerId: string, runId: string) { return this.transition(ownerId, runId, 'active') }
  complete(ownerId: string, runId: string) { return this.transition(ownerId, runId, 'completed') }
  archive(ownerId: string, runId: string) { return this.transition(ownerId, runId, 'archived') }

  async history(ownerId: string, runId: string): Promise<RunEvent[]> {
    await this.get(ownerId, runId)
    return this.store.listEvents(ownerId, runId)
  }

  async today(ownerId: string): Promise<TodayData> {
    const runs = await this.store.listRuns(ownerId)
    const active = runs.filter((run) => run.status === 'active')
    return {
      priorityRuns: active.filter((run) => run.priority === 'high' || run.priority === 'critical'),
      nextActions: active.filter((run) => run.nextAction).slice(0, 8),
      blocked: runs.filter((run) => run.status === 'blocked'),
      resumable: runs.filter((run) => run.status === 'paused'),
      recentChanges: await this.store.listRecentEvents(ownerId, 10),
    }
  }

  private event(run: Run, eventType: RunEvent['eventType'], previousState: RunStatus | null, newState: RunStatus | null, metadata: Record<string, unknown>): RunEvent {
    return { id: this.runtime.id(), runId: run.id, ownerId: run.ownerId, eventType, previousState, newState, metadata, createdAt: run.updatedAt }
  }
}
