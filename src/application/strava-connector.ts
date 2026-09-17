import { AppError } from '../domain/errors'
import type { RunningActivity } from '../domain/models'
import type { Phase4Service } from './phase4-service'

export interface StravaActivityPayload {
  id: number | string
  sport_type?: string
  type?: string
  start_date: string
  moving_time?: number | null
  elapsed_time?: number | null
  distance?: number | null
  total_elevation_gain?: number | null
  name?: string | null
}

type NewRunningActivity = Omit<RunningActivity, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>

export interface ActivityConnector<TPayload> {
  normalizeActivity(payload: TPayload): NewRunningActivity
  importCompletedActivity(ownerId: string, payload: TPayload): Promise<RunningActivity>
}

/**
 * Strava connector boundary for completed running activities.
 * OAuth/token exchange deliberately remains outside this class until secure
 * production credential and token-storage prerequisites are available.
 */
export class StravaActivityConnector implements ActivityConnector<StravaActivityPayload> {
  constructor(private readonly service: Phase4Service) {}

  normalizeActivity(payload: StravaActivityPayload): NewRunningActivity {
    const activityType = payload.sport_type ?? payload.type
    if (!['Run', 'TrailRun', 'VirtualRun'].includes(activityType ?? '')) {
      throw new AppError('VALIDATION_ERROR', 'Aktivitas Strava bukan aktivitas lari yang didukung', 400)
    }
    if ((typeof payload.id !== 'number' && typeof payload.id !== 'string') || String(payload.id).trim() === '') {
      throw new AppError('VALIDATION_ERROR', 'External ID Strava tidak valid', 400)
    }
    const startedAt = parseDate(payload.start_date)
    const durationSeconds = positiveInteger(payload.moving_time ?? payload.elapsed_time)
    const distanceMeters = nonNegativeNumber(payload.distance)
    const elevationMeters = nonNegativeNumber(payload.total_elevation_gain)
    const endedAt = durationSeconds === null ? null : new Date(new Date(startedAt).getTime() + durationSeconds * 1000).toISOString()
    const paceSecondsPerKm = durationSeconds !== null && distanceMeters !== null && distanceMeters > 0
      ? Math.round(durationSeconds / (distanceMeters / 1000))
      : null

    return {
      startedAt,
      endedAt,
      durationSeconds,
      distanceMeters,
      paceSecondsPerKm,
      elevationMeters,
      effort: null,
      feeling: null,
      source: 'strava',
      externalId: String(payload.id),
      eventId: null,
      recurringActivityId: null,
      notes: payload.name?.trim() || null,
    }
  }

  importCompletedActivity(ownerId: string, payload: StravaActivityPayload): Promise<RunningActivity> {
    return this.service.saveActivity(ownerId, this.normalizeActivity(payload))
  }
}

function parseDate(value: string): string {
  const parsed = new Date(value)
  if (!value || Number.isNaN(parsed.getTime())) throw new AppError('VALIDATION_ERROR', 'Waktu aktivitas Strava tidak valid', 400)
  return parsed.toISOString()
}

function positiveInteger(value: number | null | undefined): number | null {
  if (value === null || value === undefined) return null
  if (!Number.isFinite(value) || value < 0) throw new AppError('VALIDATION_ERROR', 'Durasi aktivitas Strava tidak valid', 400)
  return Math.round(value)
}

function nonNegativeNumber(value: number | null | undefined): number | null {
  if (value === null || value === undefined) return null
  if (!Number.isFinite(value) || value < 0) throw new AppError('VALIDATION_ERROR', 'Metrik aktivitas Strava tidak valid', 400)
  return value
}
