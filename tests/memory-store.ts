import type { RunStore } from '../src/application/ports'
import type { Run, RunEvent, Session, User } from '../src/domain/models'

export class MemoryRunStore implements RunStore {
  users = new Map<string, User>()
  sessions = new Map<string, Session>()
  runs = new Map<string, Run>()
  events: RunEvent[] = []
  failNextTransactionalWrite = false

  async createUser(user: User) { if ([...this.users.values()].some((item) => item.email.toLowerCase() === user.email.toLowerCase())) throw new Error('unique'); this.users.set(user.id, clone(user)) }
  async findUserByEmail(email: string) { return cloneOrNull([...this.users.values()].find((user) => user.email.toLowerCase() === email.toLowerCase()) ?? null) }
  async findUserById(id: string) { return cloneOrNull(this.users.get(id) ?? null) }
  async createSession(session: Session) { this.sessions.set(session.tokenHash, clone(session)) }
  async findSessionByTokenHash(hash: string) { return cloneOrNull(this.sessions.get(hash) ?? null) }
  async deleteSessionByTokenHash(hash: string) { this.sessions.delete(hash) }
  async deleteExpiredSessions(now: string) { for (const [key, session] of this.sessions) if (session.expiresAt <= now) this.sessions.delete(key) }
  async createRunWithEvent(run: Run, event: RunEvent) { this.commit(run, event, true) }
  async getRun(ownerId: string, runId: string) { const run = this.runs.get(runId); return cloneOrNull(run?.ownerId === ownerId ? run : null) }
  async listRuns(ownerId: string) { return [...this.runs.values()].filter((run) => run.ownerId === ownerId).map(clone) }
  async saveRunWithEvent(run: Run, event: RunEvent) { this.commit(run, event, false) }
  async listEvents(ownerId: string, runId: string) { return this.events.filter((event) => event.ownerId === ownerId && event.runId === runId).map(clone).reverse() }
  async listRecentEvents(ownerId: string, limit: number) { return this.events.filter((event) => event.ownerId === ownerId).map(clone).reverse().slice(0, limit) }

  private commit(run: Run, event: RunEvent, creating: boolean) {
    if (this.failNextTransactionalWrite) { this.failNextTransactionalWrite = false; throw new Error('simulated transaction failure') }
    if (!creating && !this.runs.has(run.id)) throw new Error('missing run')
    this.runs.set(run.id, clone(run)); this.events.push(clone(event))
  }
}

function clone<T>(value: T): T { return structuredClone(value) }
function cloneOrNull<T>(value: T | null): T | null { return value === null ? null : clone(value) }
