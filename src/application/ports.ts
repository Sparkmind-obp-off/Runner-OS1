import type { EventEvidence, IntegrationAccount, RecurringActivity, RecurringOccurrence, Run, RunEvent, RunnerProfile, RunningActivity, RunningEvent, Session, User } from '../domain/models'

export interface RunStore {
  createUser(user: User): Promise<void>
  findUserByEmail(email: string): Promise<User | null>
  findUserById(id: string): Promise<User | null>
  createSession(session: Session): Promise<void>
  findSessionByTokenHash(tokenHash: string): Promise<Session | null>
  deleteSessionByTokenHash(tokenHash: string): Promise<void>
  deleteExpiredSessions(now: string): Promise<void>

  createRunWithEvent(run: Run, event: RunEvent): Promise<void>
  getRun(ownerId: string, runId: string): Promise<Run | null>
  listRuns(ownerId: string): Promise<Run[]>
  saveRunWithEvent(run: Run, event: RunEvent): Promise<void>
  listEvents(ownerId: string, runId: string): Promise<RunEvent[]>
  listRecentEvents(ownerId: string, limit: number): Promise<RunEvent[]>

  getProfile(ownerId: string): Promise<RunnerProfile | null>
  saveProfile(profile: RunnerProfile): Promise<void>
  listRecurringActivities(ownerId: string): Promise<RecurringActivity[]>
  getRecurringActivity(ownerId: string, id: string): Promise<RecurringActivity | null>
  saveRecurringActivity(activity: RecurringActivity): Promise<void>
  listOccurrences(ownerId: string, from?: string, to?: string): Promise<RecurringOccurrence[]>
  saveOccurrence(occurrence: RecurringOccurrence): Promise<void>
  listRunningActivities(ownerId: string): Promise<RunningActivity[]>
  getRunningActivity(ownerId: string, id: string): Promise<RunningActivity | null>
  findRunningActivityByExternalId(ownerId: string, source: string, externalId: string): Promise<RunningActivity | null>
  saveRunningActivity(activity: RunningActivity): Promise<void>
  listRunningEvents(ownerId: string): Promise<RunningEvent[]>
  getRunningEvent(ownerId: string, id: string): Promise<RunningEvent | null>
  saveRunningEvent(event: RunningEvent): Promise<void>
  listEventEvidence(ownerId: string, eventId: string): Promise<EventEvidence[]>
  saveEventEvidence(evidence: EventEvidence): Promise<void>
  getIntegration(ownerId: string, provider: 'strava'): Promise<IntegrationAccount | null>
  saveIntegration(account: IntegrationAccount): Promise<void>
}

export interface Runtime {
  now(): string
  id(): string
}

export const defaultRuntime: Runtime = {
  now: () => new Date().toISOString(),
  id: () => crypto.randomUUID(),
}
