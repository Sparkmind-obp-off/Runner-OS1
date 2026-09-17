import type { RunStore } from './ports'
import { AppError } from '../domain/errors'

export interface AIProvider {
  answer(question: string, context: unknown): Promise<string>
}

export class GrokProvider implements AIProvider {
  constructor(private readonly apiKey: string, private readonly model = 'grok-3-mini') {}

  async answer(question: string, context: unknown): Promise<string> {
    let response: Response
    try {
      response = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.apiKey}` },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'Kamu adalah Tanya AI di Runner OS. Jawab singkat dalam bahasa Indonesia. Bedakan fakta terkonfirmasi, data impor, informasi publik, dan saran. Jangan mengarang riwayat pribadi atau melakukan mutasi.',
            },
            { role: 'user', content: `Konteks terpilih:\n${JSON.stringify(context)}\n\nPertanyaan: ${question}` },
          ],
          temperature: 0.2,
        }),
        signal: AbortSignal.timeout(15_000),
      })
    } catch {
      throw unavailable()
    }
    if (!response.ok) throw unavailable()
    const payload = await response.json().catch(() => null) as any
    const text = payload?.choices?.[0]?.message?.content
    if (typeof text !== 'string' || !text.trim()) throw unavailable()
    return text.trim()
  }
}

export async function selectAIContext(store: RunStore, ownerId: string, question: string) {
  const q = question.toLowerCase()
  const needsSchedule = /jadwal|besok|minggu|mjw|biasanya|latihan/.test(q)
  const needsHistory = /sudah lari|riwayat|terakhir|berapa|aktivitas/.test(q)
  const needsEvents = /event|race|lomba|skybridge/.test(q)
  const [profile, recurring, activities, events] = await Promise.all([
    store.getProfile(ownerId),
    needsSchedule ? store.listRecurringActivities(ownerId) : Promise.resolve([]),
    needsHistory ? store.listRunningActivities(ownerId) : Promise.resolve([]),
    needsEvents ? store.listRunningEvents(ownerId) : Promise.resolve([]),
  ])
  const relevantEvents = await Promise.all(events.slice(0, 10).map(async (event) => ({
    name: event.name,
    editionYear: event.editionYear,
    monthHint: event.monthHint,
    eventDate: event.eventDate,
    dateStatus: event.dateStatus,
    status: event.status,
    participationIntent: event.participationIntent,
    evidence: (await store.listEventEvidence(ownerId, event.id)).slice(0, 10).map((item) => ({
      evidenceType: item.evidenceType,
      evidenceStrength: item.evidenceStrength,
      observedAt: item.observedAt,
      source: item.sourceUrl ? 'public_or_user_supplied_url' : 'runner_os_record',
    })),
  })))

  return {
    contextPolicy: 'minimum_relevant',
    profile: profile ? {
      source: 'user_confirmed_or_provided',
      displayName: profile.displayName,
      runningArea: profile.runningArea,
      preferredDays: profile.preferredDays,
      preferredTime: profile.preferredTime,
      preferredDistances: profile.preferredDistances,
      primaryGoal: profile.primaryGoal,
      runningWithOthersPreference: profile.runningWithOthersPreference,
    } : null,
    recurringActivities: recurring.slice(0, 10).map((item) => ({
      name: item.name,
      activityType: item.activityType,
      recurrenceRule: item.recurrenceRule,
      usualDay: item.usualDay,
      usualTime: item.usualTime,
      active: item.active,
      source: item.source,
      attendanceIsGuaranteed: false,
    })),
    recentActivities: activities.slice(0, 10).map((item) => ({
      startedAt: item.startedAt,
      durationSeconds: item.durationSeconds,
      distanceMeters: item.distanceMeters,
      source: item.source,
      notes: item.notes,
    })),
    relevantEvents,
  }
}

function unavailable(): AppError {
  return new AppError('AI_PROVIDER_UNAVAILABLE', 'Tanya AI sedang tidak tersedia. Coba lagi nanti.', 503)
}
