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

export type Provenance = 'user_confirmed' | 'user_provided' | 'local_recorded' | 'authorized_integration' | 'public_source' | 'derived_from_confirmed_data' | 'unverified'
export type OccurrenceStatus = 'planned' | 'attended' | 'skipped' | 'unknown'
export type EventEvidenceType = 'prior_participation' | 'instagram_post' | 'instagram_highlight' | 'repost' | 'explicit_confirmation' | 'registration' | 'public_event_listing'
export type EvidenceStrength = 'weak' | 'moderate' | 'strong' | 'confirmed'

export interface RunnerProfile {
  id: string
  ownerId: string
  displayName: string
  runningArea: string | null
  preferredDays: string[]
  preferredTime: string | null
  preferredDistances: string[]
  primaryGoal: string | null
  preferredEventTypes: string[]
  runningWithOthersPreference: string | null
  communities: string[]
  notes: string | null
  onboardingCompletedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface RecurringActivity {
  id: string
  ownerId: string
  name: string
  activityType: string
  recurrenceRule: string
  usualDay: string | null
  usualTime: string | null
  usualLocation: string | null
  community: string | null
  expectedDistanceMeters: number | null
  notes: string | null
  source: Provenance
  relevanceWeight: number
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface RecurringOccurrence {
  id: string
  ownerId: string
  recurringActivityId: string
  scheduledAt: string
  status: OccurrenceStatus
  linkedRunningActivityId: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface RunningActivity {
  id: string
  ownerId: string
  startedAt: string
  endedAt: string | null
  durationSeconds: number | null
  distanceMeters: number | null
  paceSecondsPerKm: number | null
  elevationMeters: number | null
  effort: number | null
  feeling: string | null
  source: string
  externalId: string | null
  eventId: string | null
  recurringActivityId: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface RunningEvent {
  id: string
  ownerId: string
  name: string
  aliases: string[]
  editionYear: number | null
  monthHint: string | null
  eventDate: string | null
  location: string | null
  organizer: string | null
  distanceOrCategory: string | null
  registrationUrl: string | null
  registrationDeadline: string | null
  sourceUrl: string | null
  status: string
  dateStatus: 'verified' | 'unverified'
  participationIntent: 'none' | 'interested' | 'planned' | 'confirmed'
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface EventEvidence {
  id: string
  ownerId: string
  eventId: string
  evidenceType: EventEvidenceType
  evidenceStrength: EvidenceStrength
  sourceUrl: string | null
  observedAt: string
  notes: string | null
  createdAt: string
}

export interface IntegrationAccount {
  id: string
  ownerId: string
  provider: 'strava'
  providerUserId: string | null
  status: 'disconnected' | 'connected' | 'error'
  scopes: string[]
  connectedAt: string | null
  lastSyncedAt: string | null
  lastErrorCode: string | null
  createdAt: string
  updatedAt: string
}
