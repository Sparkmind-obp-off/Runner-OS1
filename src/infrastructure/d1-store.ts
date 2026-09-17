import type { RunStore } from '../application/ports'
import type { Run, RunEvent, Session, User } from '../domain/models'

interface UserRow { id: string; email: string; display_name: string; password_hash: string; password_salt: string; created_at: string }
interface SessionRow { id: string; owner_id: string; token_hash: string; expires_at: string; created_at: string }
interface RunRow { id: string; owner_id: string; title: string; type: Run['type']; outcome: string; status: Run['status']; priority: Run['priority']; next_action: string; progress: number; blocker: string | null; due_at: string | null; tags: string; focus_date: string | null; focus_order: number | null; created_at: string; updated_at: string }
interface EventRow { id: string; run_id: string; owner_id: string; event_type: RunEvent['eventType']; previous_state: RunEvent['previousState']; new_state: RunEvent['newState']; metadata: string; created_at: string }

export class D1RunStore implements RunStore {
  constructor(private readonly db: D1Database) {}

  async createUser(user: User): Promise<void> {
    await this.db.prepare('INSERT INTO users (id,email,display_name,password_hash,password_salt,created_at) VALUES (?,?,?,?,?,?)')
      .bind(user.id, user.email, user.displayName, user.passwordHash, user.passwordSalt, user.createdAt).run()
  }
  async findUserByEmail(email: string): Promise<User | null> {
    return mapUser(await this.db.prepare('SELECT * FROM users WHERE email = ? COLLATE NOCASE').bind(email).first<UserRow>())
  }
  async findUserById(id: string): Promise<User | null> {
    return mapUser(await this.db.prepare('SELECT * FROM users WHERE id = ?').bind(id).first<UserRow>())
  }
  async createSession(session: Session): Promise<void> {
    await this.db.batch([
      this.db.prepare('DELETE FROM sessions WHERE expires_at <= ?').bind(session.createdAt),
      this.db.prepare('INSERT INTO sessions (id,owner_id,token_hash,expires_at,created_at) VALUES (?,?,?,?,?)').bind(session.id, session.ownerId, session.tokenHash, session.expiresAt, session.createdAt),
    ])
  }
  async findSessionByTokenHash(tokenHash: string): Promise<Session | null> {
    return mapSession(await this.db.prepare('SELECT * FROM sessions WHERE token_hash = ?').bind(tokenHash).first<SessionRow>())
  }
  async deleteSessionByTokenHash(tokenHash: string): Promise<void> { await this.db.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(tokenHash).run() }
  async deleteExpiredSessions(now: string): Promise<void> { await this.db.prepare('DELETE FROM sessions WHERE expires_at <= ?').bind(now).run() }

  async createRunWithEvent(run: Run, event: RunEvent): Promise<void> {
    await this.db.batch([this.insertRun(run), this.insertEvent(event)])
  }
  async getRun(ownerId: string, runId: string): Promise<Run | null> {
    return mapRun(await this.db.prepare('SELECT * FROM runs WHERE id = ? AND owner_id = ?').bind(runId, ownerId).first<RunRow>())
  }
  async listRuns(ownerId: string): Promise<Run[]> {
    const result = await this.db.prepare("SELECT * FROM runs WHERE owner_id = ? ORDER BY CASE priority WHEN 'critical' THEN 0 WHEN 'high' THEN 1 WHEN 'normal' THEN 2 ELSE 3 END, updated_at DESC").bind(ownerId).all<RunRow>()
    return result.results.map(mapRunNonNull)
  }
  async saveRunWithEvent(run: Run, event: RunEvent): Promise<void> {
    await this.db.batch([
      this.db.prepare('UPDATE runs SET title=?,type=?,outcome=?,status=?,priority=?,next_action=?,progress=?,blocker=?,due_at=?,tags=?,focus_date=?,focus_order=?,updated_at=? WHERE id=? AND owner_id=?')
        .bind(run.title, run.type, run.outcome, run.status, run.priority, run.nextAction, run.progress, run.blocker, run.dueAt, JSON.stringify(run.tags), run.focusDate, run.focusOrder, run.updatedAt, run.id, run.ownerId),
      this.insertEvent(event),
    ])
  }
  async listEvents(ownerId: string, runId: string): Promise<RunEvent[]> {
    const result = await this.db.prepare('SELECT * FROM run_events WHERE owner_id = ? AND run_id = ? ORDER BY created_at DESC, id DESC').bind(ownerId, runId).all<EventRow>()
    return result.results.map(mapEvent)
  }
  async listRecentEvents(ownerId: string, limit: number): Promise<RunEvent[]> {
    const result = await this.db.prepare('SELECT * FROM run_events WHERE owner_id = ? ORDER BY created_at DESC, id DESC LIMIT ?').bind(ownerId, limit).all<EventRow>()
    return result.results.map(mapEvent)
  }

  private insertRun(run: Run): D1PreparedStatement {
    return this.db.prepare('INSERT INTO runs (id,owner_id,title,type,outcome,status,priority,next_action,progress,blocker,due_at,tags,focus_date,focus_order,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)')
      .bind(run.id, run.ownerId, run.title, run.type, run.outcome, run.status, run.priority, run.nextAction, run.progress, run.blocker, run.dueAt, JSON.stringify(run.tags), run.focusDate, run.focusOrder, run.createdAt, run.updatedAt)
  }
  private insertEvent(event: RunEvent): D1PreparedStatement {
    return this.db.prepare('INSERT INTO run_events (id,run_id,owner_id,event_type,previous_state,new_state,metadata,created_at) VALUES (?,?,?,?,?,?,?,?)')
      .bind(event.id, event.runId, event.ownerId, event.eventType, event.previousState, event.newState, JSON.stringify(event.metadata), event.createdAt)
  }
}

function mapUser(row: UserRow | null): User | null { return row ? { id: row.id, email: row.email, displayName: row.display_name, passwordHash: row.password_hash, passwordSalt: row.password_salt, createdAt: row.created_at } : null }
function mapSession(row: SessionRow | null): Session | null { return row ? { id: row.id, ownerId: row.owner_id, tokenHash: row.token_hash, expiresAt: row.expires_at, createdAt: row.created_at } : null }
function mapRun(row: RunRow | null): Run | null { return row ? mapRunNonNull(row) : null }
function mapRunNonNull(row: RunRow): Run { let tags: string[] = []; try { const parsed = JSON.parse(row.tags ?? '[]'); if (Array.isArray(parsed)) tags = parsed.filter((tag): tag is string => typeof tag === 'string') } catch { tags = [] } return { id: row.id, ownerId: row.owner_id, title: row.title, type: row.type, outcome: row.outcome, status: row.status, priority: row.priority, nextAction: row.next_action, progress: row.progress, blocker: row.blocker, dueAt: row.due_at, tags, focusDate: row.focus_date, focusOrder: row.focus_order, createdAt: row.created_at, updatedAt: row.updated_at } }
function mapEvent(row: EventRow): RunEvent { let metadata: Record<string, unknown> = {}; try { metadata = JSON.parse(row.metadata) as Record<string, unknown> } catch { metadata = {} } return { id: row.id, runId: row.run_id, ownerId: row.owner_id, eventType: row.event_type, previousState: row.previous_state, newState: row.new_state, metadata, createdAt: row.created_at } }
