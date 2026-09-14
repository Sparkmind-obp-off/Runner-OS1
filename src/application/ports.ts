import type { Run, RunEvent, Session, User } from '../domain/models'

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
}

export interface Runtime {
  now(): string
  id(): string
}

export const defaultRuntime: Runtime = {
  now: () => new Date().toISOString(),
  id: () => crypto.randomUUID(),
}
