import type { RunStore, Runtime } from './ports'
import { defaultRuntime } from './ports'
import { AppError } from '../domain/errors'
import type { User } from '../domain/models'
import { hashPassword, randomToken, sha256, verifyPassword } from '../infrastructure/crypto'

const SESSION_DAYS = 30

export class AuthService {
  constructor(private readonly store: RunStore, private readonly runtime: Runtime = defaultRuntime) {}

  async register(email: string, displayName: string, password: string): Promise<{ user: PublicUser; token: string }> {
    const normalizedEmail = email.trim().toLowerCase()
    if (await this.store.findUserByEmail(normalizedEmail)) throw new AppError('CONFLICT', 'An account with this email already exists', 409)
    const passwordData = await hashPassword(password)
    const user: User = {
      id: this.runtime.id(),
      email: normalizedEmail,
      displayName: displayName.trim(),
      passwordHash: passwordData.hash,
      passwordSalt: passwordData.salt,
      createdAt: this.runtime.now(),
    }
    await this.store.createUser(user)
    const token = await this.issueSession(user.id)
    return { user: toPublicUser(user), token }
  }

  async login(email: string, password: string): Promise<{ user: PublicUser; token: string }> {
    const user = await this.store.findUserByEmail(email.trim().toLowerCase())
    if (!user || !(await verifyPassword(password, user.passwordHash, user.passwordSalt))) {
      throw new AppError('AUTH_INVALID', 'Invalid email or password', 401)
    }
    return { user: toPublicUser(user), token: await this.issueSession(user.id) }
  }

  async authenticate(token: string | undefined): Promise<PublicUser> {
    if (!token) throw new AppError('AUTH_REQUIRED', 'Authentication required', 401)
    const tokenHash = await sha256(token)
    const session = await this.store.findSessionByTokenHash(tokenHash)
    if (!session || session.expiresAt <= this.runtime.now()) throw new AppError('AUTH_REQUIRED', 'Authentication required', 401)
    const user = await this.store.findUserById(session.ownerId)
    if (!user) throw new AppError('AUTH_REQUIRED', 'Authentication required', 401)
    return toPublicUser(user)
  }

  async logout(token: string | undefined): Promise<void> {
    if (token) await this.store.deleteSessionByTokenHash(await sha256(token))
  }

  private async issueSession(ownerId: string): Promise<string> {
    const token = randomToken()
    const createdAt = this.runtime.now()
    const expiresAt = new Date(new Date(createdAt).getTime() + SESSION_DAYS * 86_400_000).toISOString()
    await this.store.createSession({ id: this.runtime.id(), ownerId, tokenHash: await sha256(token), createdAt, expiresAt })
    return token
  }
}

export interface PublicUser {
  id: string
  email: string
  displayName: string
}

function toPublicUser(user: User): PublicUser {
  return { id: user.id, email: user.email, displayName: user.displayName }
}
