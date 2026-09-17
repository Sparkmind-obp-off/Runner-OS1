export const RUN_TYPES = ['project', 'task_stream', 'habit', 'fitness', 'learning', 'hobby', 'custom'] as const
export const RUN_STATUSES = ['planned', 'active', 'paused', 'blocked', 'completed', 'archived'] as const
export const RUN_PRIORITIES = ['low', 'normal', 'high', 'critical'] as const

export type RunType = (typeof RUN_TYPES)[number]
export type RunStatus = (typeof RUN_STATUSES)[number]
export type RunPriority = (typeof RUN_PRIORITIES)[number]

export interface User {
  id: string
  email: string
  displayName: string
  passwordHash: string
  passwordSalt: string
  createdAt: string
}

export interface Session {
  id: string
  ownerId: string
  tokenHash: string
  expiresAt: string
  createdAt: string
}

export interface Run {
  id: string
  ownerId: string
  title: string
  type: RunType
  outcome: string
  status: RunStatus
  priority: RunPriority
  nextAction: string
  progress: number
  blocker: string | null
  dueAt: string | null
  tags: string[]
  focusDate: string | null
  focusOrder: number | null
  createdAt: string
  updatedAt: string
}

export type RunSort = 'priority' | 'due' | 'updated' | 'title'
export type SortDirection = 'asc' | 'desc'

export interface RunListOptions {
  status?: RunStatus
  priority?: RunPriority
  type?: RunType
  tag?: string
  search?: string
  sort?: RunSort
  direction?: SortDirection
}

export type RunEventType = 'run.created' | 'run.updated' | 'run.progress_updated' | 'run.next_action_updated' | 'run.focus_updated' | 'run.lifecycle_changed'

export interface RunEvent {
  id: string
  runId: string
  ownerId: string
  eventType: RunEventType
  previousState: RunStatus | null
  newState: RunStatus | null
  metadata: Record<string, unknown>
  createdAt: string
}

export interface TodayData {
  generatedAt: string
  focusDate: string
  focusRuns: Run[]
  priorityRuns: Run[]
  nextActions: Run[]
  blocked: Run[]
  resumable: Run[]
  overdue: Run[]
  upcoming: Run[]
  recentChanges: RunEvent[]
}
