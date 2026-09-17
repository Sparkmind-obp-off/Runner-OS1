import type { RunStore, Runtime } from './ports'
import { defaultRuntime } from './ports'
import { AppError } from '../domain/errors'
import type { EventEvidence, IntegrationAccount, RecurringActivity, RecurringOccurrence, RunnerProfile, RunningActivity, RunningEvent } from '../domain/models'

export class Phase4Service {
  constructor(private readonly store: RunStore, private readonly runtime: Runtime = defaultRuntime) {}

  getProfile(ownerId: string) { return this.store.getProfile(ownerId) }

  async saveProfile(ownerId: string, input: Omit<RunnerProfile, 'id'|'ownerId'|'createdAt'|'updatedAt'>): Promise<RunnerProfile> {
    const current = await this.store.getProfile(ownerId)
    const now = this.runtime.now()
    const profile: RunnerProfile = { ...input, id: current?.id ?? this.runtime.id(), ownerId, createdAt: current?.createdAt ?? now, updatedAt: now }
    await this.store.saveProfile(profile)
    return profile
  }

  listRecurring(ownerId: string) { return this.store.listRecurringActivities(ownerId) }
  async saveRecurring(ownerId: string, input: Omit<RecurringActivity, 'id'|'ownerId'|'createdAt'|'updatedAt'>, id?: string): Promise<RecurringActivity> {
    const current = id ? await this.store.getRecurringActivity(ownerId, id) : null
    if (id && !current) throw new AppError('NOT_FOUND', 'Recurring activity not found', 404)
    const now = this.runtime.now()
    const activity: RecurringActivity = { ...input, id: current?.id ?? this.runtime.id(), ownerId, createdAt: current?.createdAt ?? now, updatedAt: now }
    await this.store.saveRecurringActivity(activity)
    return activity
  }

  listOccurrences(ownerId: string, from?: string, to?: string) { return this.store.listOccurrences(ownerId, from, to) }
  async saveOccurrence(ownerId: string, recurringActivityId: string, input: Omit<RecurringOccurrence, 'id'|'ownerId'|'recurringActivityId'|'createdAt'|'updatedAt'>): Promise<RecurringOccurrence> {
    if (!await this.store.getRecurringActivity(ownerId, recurringActivityId)) throw new AppError('NOT_FOUND', 'Recurring activity not found', 404)
    if (input.linkedRunningActivityId && !await this.store.getRunningActivity(ownerId, input.linkedRunningActivityId)) {
      throw new AppError('NOT_FOUND', 'Running activity not found', 404)
    }
    const existing = (await this.store.listOccurrences(ownerId, input.scheduledAt, input.scheduledAt)).find((item) => item.recurringActivityId === recurringActivityId)
    const now = this.runtime.now()
    const occurrence: RecurringOccurrence = { ...input, id: existing?.id ?? this.runtime.id(), ownerId, recurringActivityId, createdAt: existing?.createdAt ?? now, updatedAt: now }
    await this.store.saveOccurrence(occurrence)
    return occurrence
  }

  listActivities(ownerId: string) { return this.store.listRunningActivities(ownerId) }
  async saveActivity(ownerId: string, input: Omit<RunningActivity, 'id'|'ownerId'|'createdAt'|'updatedAt'>, id?: string): Promise<RunningActivity> {
    const current = id ? await this.store.getRunningActivity(ownerId, id) : null
    if (id && !current) throw new AppError('NOT_FOUND', 'Running activity not found', 404)
    if (!id && input.externalId) {
      const duplicate = await this.store.findRunningActivityByExternalId(ownerId, input.source, input.externalId)
      if (duplicate) return duplicate
    }
    if (input.eventId && !await this.store.getRunningEvent(ownerId, input.eventId)) throw new AppError('NOT_FOUND', 'Event not found', 404)
    if (input.recurringActivityId && !await this.store.getRecurringActivity(ownerId, input.recurringActivityId)) throw new AppError('NOT_FOUND', 'Recurring activity not found', 404)
    const now = this.runtime.now()
    const activity: RunningActivity = { ...input, id: current?.id ?? this.runtime.id(), ownerId, createdAt: current?.createdAt ?? now, updatedAt: now }
    await this.store.saveRunningActivity(activity)
    return activity
  }

  listEvents(ownerId: string) { return this.store.listRunningEvents(ownerId) }
  async saveEvent(ownerId: string, input: Omit<RunningEvent, 'id'|'ownerId'|'createdAt'|'updatedAt'>, id?: string): Promise<RunningEvent> {
    const current = id ? await this.store.getRunningEvent(ownerId, id) : null
    if (id && !current) throw new AppError('NOT_FOUND', 'Event not found', 404)
    const normalizedIdentity = [input.name, ...input.aliases].join(' ').toLowerCase()
    if (normalizedIdentity.includes('skybridge') && normalizedIdentity.includes('commuter run')) {
      throw new AppError('VALIDATION_ERROR', 'Skybridge Race Run berbeda dari KAI Commuter Run Jakarta', 400)
    }
    if (normalizedIdentity.includes('skybridge') && input.editionYear === 2026 && input.dateStatus === 'unverified' && input.eventDate) {
      throw new AppError('VALIDATION_ERROR', 'Tanggal Skybridge Race Run 2026 belum terverifikasi', 400)
    }
    if (input.dateStatus === 'verified' && !input.eventDate) throw new AppError('VALIDATION_ERROR', 'Event terverifikasi harus memiliki tanggal', 400)
    const now = this.runtime.now()
    const event: RunningEvent = { ...input, id: current?.id ?? this.runtime.id(), ownerId, createdAt: current?.createdAt ?? now, updatedAt: now }
    await this.store.saveRunningEvent(event)
    return event
  }

  async listEvidence(ownerId: string, eventId: string) {
    if (!await this.store.getRunningEvent(ownerId, eventId)) throw new AppError('NOT_FOUND', 'Event not found', 404)
    return this.store.listEventEvidence(ownerId, eventId)
  }
  async addEvidence(ownerId: string, eventId: string, input: Omit<EventEvidence, 'id'|'ownerId'|'eventId'|'createdAt'>): Promise<EventEvidence> {
    if (!await this.store.getRunningEvent(ownerId, eventId)) throw new AppError('NOT_FOUND', 'Event not found', 404)
    const evidence: EventEvidence = { ...input, id: this.runtime.id(), ownerId, eventId, createdAt: this.runtime.now() }
    await this.store.saveEventEvidence(evidence)
    return evidence
  }

  async getEventWithRelevance(ownerId: string, eventId: string) {
    const event = await this.store.getRunningEvent(ownerId, eventId)
    if (!event) throw new AppError('NOT_FOUND', 'Event not found', 404)
    const evidence = await this.store.listEventEvidence(ownerId, eventId)
    const types = new Set(evidence.map((item) => item.evidenceType))
    const score = Math.min(100, (types.has('prior_participation') ? 45 : 0) + (types.has('repost') ? 25 : 0) + (types.has('explicit_confirmation') ? 25 : 0) + (types.has('registration') ? 40 : 0) + (types.has('public_event_listing') ? 10 : 0))
    return { event, evidence, relevance: score >= 60 ? 'high' : score >= 25 ? 'medium' : 'normal', relevanceScore: score, attendancePredicted: false }
  }

  async getHome(ownerId: string) {
    const [profile, recurringActivities, activities, events, occurrences, integration] = await Promise.all([
      this.getProfile(ownerId), this.listRecurring(ownerId), this.listActivities(ownerId), this.listEvents(ownerId), this.listOccurrences(ownerId), this.getIntegration(ownerId),
    ])
    const eventContexts = await Promise.all(events.slice(0, 20).map((event) => this.getEventWithRelevance(ownerId, event.id)))
    eventContexts.sort((a, b) => b.relevanceScore - a.relevanceScore || eventSortKey(a.event).localeCompare(eventSortKey(b.event)))
    const activeRecurring = recurringActivities.filter((item) => item.active).sort((a, b) => b.relevanceWeight - a.relevanceWeight)
    const now = this.runtime.now()
    const futureOccurrences = occurrences.filter((item) => item.scheduledAt >= now).sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))
    return {
      profile,
      todayContext: futureOccurrences[0] ?? null,
      recurringActivities: activeRecurring,
      recentActivities: activities.slice(0, 5),
      eventContexts: eventContexts.slice(0, 5),
      events: eventContexts.slice(0, 5).map((item) => item.event),
      occurrences: occurrences.slice(0, 10),
      integration,
    }
  }

  async getIntegration(ownerId: string): Promise<IntegrationAccount> {
    const current = await this.store.getIntegration(ownerId, 'strava')
    if (current) return current
    const now = this.runtime.now()
    return { id: this.runtime.id(), ownerId, provider:'strava', providerUserId:null, status:'disconnected', scopes:[], connectedAt:null, lastSyncedAt:null, lastErrorCode:null, createdAt:now, updatedAt:now }
  }

  async disconnectStrava(ownerId: string): Promise<IntegrationAccount> {
    const current = await this.getIntegration(ownerId)
    const next = { ...current, status:'disconnected' as const, providerUserId:null, scopes:[], connectedAt:null, lastErrorCode:null, updatedAt:this.runtime.now() }
    await this.store.saveIntegration(next)
    return next
  }
}

function eventSortKey(event: RunningEvent): string {
  if (event.eventDate) return event.eventDate
  return `${event.editionYear ?? 9999}-${monthNumber(event.monthHint)}-99`
}

function monthNumber(month: string | null): string {
  const months: Record<string, string> = { januari:'01', februari:'02', maret:'03', april:'04', mei:'05', juni:'06', juli:'07', agustus:'08', september:'09', oktober:'10', november:'11', desember:'12' }
  return months[(month ?? '').toLowerCase()] ?? '99'
}
