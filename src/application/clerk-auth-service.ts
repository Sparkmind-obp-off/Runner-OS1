import type { RunStore, Runtime } from './ports'
import { defaultRuntime } from './ports'
import { AuthService, type PublicUser } from './auth-service'
import { AppError } from '../domain/errors'
import type { AuthEvent, ExternalIdentity, User } from '../domain/models'
import type { ClerkGateway } from '../infrastructure/clerk'
import { randomToken } from '../infrastructure/crypto'

/** Internal sessions created from a Clerk sign-in are shorter-lived than legacy password sessions. */
export const CLERK_SESSION_DAYS = 7

/** Marker that can never match a PBKDF2 hash → password login is impossible for Google-only accounts. */
const NO_PASSWORD = '!clerk-only'

/**
 * Maps a verified Clerk subject onto the canonical internal Runner OS user id.
 * Security rules:
 *  - identity is derived only from a server-verified Clerk session token;
 *  - an email collision with an existing legacy account NEVER links automatically (no takeover);
 *  - linking requires an authenticated legacy session AND a verified Clerk token at the same time;
 *  - one Clerk subject ↔ one internal user (DB unique constraints enforce it).
 */
export class ClerkAuthService {
  private readonly auth: AuthService
  constructor(private readonly store: RunStore, private readonly clerk: ClerkGateway, private readonly runtime: Runtime = defaultRuntime) {
    this.auth = new AuthService(store, runtime)
  }

  async signIn(sessionToken: string): Promise<{ user: PublicUser; token: string; created: boolean }> {
    const verified = await this.clerk.verifySessionToken(sessionToken)
    const existing = await this.store.findExternalIdentity('clerk', verified.subject)
    if (existing) {
      const user = await this.store.findUserById(existing.ownerId)
      if (!user) throw new AppError('AUTH_INVALID', 'Akun tidak ditemukan.', 401)
      await this.store.touchExternalIdentity(existing.id, this.runtime.now())
      await this.audit(user.id, 'identity.signin', {})
      return { user: toPublic(user), token: await this.auth.issueSession(user.id, CLERK_SESSION_DAYS), created: false }
    }

    const profile = await this.clerk.getUser(verified.subject)
    if (!profile.primaryEmail || !profile.primaryEmailVerified) {
      throw new AppError('EMAIL_UNVERIFIED', 'Email akun Google belum terverifikasi. Gunakan akun dengan email terverifikasi.', 403)
    }
    const collision = await this.store.findUserByEmail(profile.primaryEmail)
    if (collision) {
      await this.audit(collision.id, 'identity.link_required', {})
      throw new AppError('ACCOUNT_LINK_REQUIRED', 'Email ini sudah terdaftar di Runner OS. Masuk dengan kata sandi lama terlebih dahulu, lalu hubungkan Google dari halaman Profil.', 409)
    }

    const now = this.runtime.now()
    const user: User = { id: this.runtime.id(), email: profile.primaryEmail, displayName: profile.displayName, passwordHash: NO_PASSWORD, passwordSalt: randomToken(16), createdAt: now }
    const identity: ExternalIdentity = { id: this.runtime.id(), ownerId: user.id, provider: 'clerk', subject: verified.subject, emailAtLink: profile.primaryEmail, createdAt: now, lastSeenAt: now }
    try {
      await this.store.createUserWithIdentity(user, identity)
    } catch {
      // Lost a race with a concurrent request for the same subject/email: re-resolve safely, never duplicate.
      const raced = await this.store.findExternalIdentity('clerk', verified.subject)
      if (raced) return this.signIn(sessionToken)
      throw new AppError('IDENTITY_CONFLICT', 'Akun tidak dapat dibuat karena konflik identitas. Coba lagi.', 409)
    }
    await this.audit(user.id, 'identity.created', {})
    return { user: toPublic(user), token: await this.auth.issueSession(user.id, CLERK_SESSION_DAYS), created: true }
  }

  /** Link Google (Clerk) to an already authenticated legacy account. */
  async link(ownerId: string, sessionToken: string): Promise<{ linked: true }> {
    const verified = await this.clerk.verifySessionToken(sessionToken)
    const bySubject = await this.store.findExternalIdentity('clerk', verified.subject)
    if (bySubject) {
      if (bySubject.ownerId === ownerId) return { linked: true }
      await this.audit(ownerId, 'identity.conflict', { reason: 'subject_already_linked' })
      throw new AppError('IDENTITY_CONFLICT', 'Akun Google ini sudah terhubung ke akun Runner OS lain.', 409)
    }
    const byOwner = await this.store.findExternalIdentityByOwner(ownerId, 'clerk')
    if (byOwner) {
      await this.audit(ownerId, 'identity.conflict', { reason: 'owner_already_linked' })
      throw new AppError('IDENTITY_CONFLICT', 'Akun ini sudah terhubung ke akun Google lain.', 409)
    }
    const profile = await this.clerk.getUser(verified.subject)
    if (!profile.primaryEmailVerified) throw new AppError('EMAIL_UNVERIFIED', 'Email akun Google belum terverifikasi.', 403)
    const now = this.runtime.now()
    try {
      await this.store.createExternalIdentity({ id: this.runtime.id(), ownerId, provider: 'clerk', subject: verified.subject, emailAtLink: profile.primaryEmail, createdAt: now, lastSeenAt: now })
    } catch {
      throw new AppError('IDENTITY_CONFLICT', 'Akun Google tidak dapat dihubungkan karena konflik identitas.', 409)
    }
    await this.audit(ownerId, 'identity.linked', {})
    return { linked: true }
  }

  async status(ownerId: string): Promise<{ google: { linked: boolean; linkedAt: string | null } }> {
    const identity = await this.store.findExternalIdentityByOwner(ownerId, 'clerk')
    return { google: { linked: Boolean(identity), linkedAt: identity?.createdAt ?? null } }
  }

  private async audit(ownerId: string | null, eventType: AuthEvent['eventType'], metadata: Record<string, unknown>) {
    try { await this.store.recordAuthEvent({ id: this.runtime.id(), ownerId, eventType, provider: 'clerk', metadata, createdAt: this.runtime.now() }) } catch { /* audit must not break auth */ }
  }
}

function toPublic(user: User): PublicUser { return { id: user.id, email: user.email, displayName: user.displayName } }
