import { z } from 'zod'
import { RUN_PRIORITIES, RUN_STATUSES, RUN_TYPES } from '../domain/models'

const optionalDate = z.string().datetime({ offset: true }).nullable().optional()
const tags = z.array(z.string().trim().min(1).max(32).regex(/^[\p{L}\p{N}][\p{L}\p{N} _-]*$/u)).max(10)
const localDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD')

export const registerSchema = z.object({
  email: z.string().email().max(254),
  displayName: z.string().trim().min(1).max(80),
  password: z.string().min(12).max(128),
}).strict()

export const loginSchema = z.object({ email: z.string().email().max(254), password: z.string().min(1).max(128) }).strict()

export const createRunSchema = z.object({
  title: z.string().trim().min(1).max(160),
  type: z.enum(RUN_TYPES),
  outcome: z.string().trim().max(1000).default(''),
  priority: z.enum(RUN_PRIORITIES).optional(),
  nextAction: z.string().trim().max(500).optional(),
  dueAt: optionalDate,
  tags: tags.optional(),
}).strict()

export const updateRunSchema = z.object({
  title: z.string().trim().min(1).max(160).optional(),
  type: z.enum(RUN_TYPES).optional(),
  outcome: z.string().trim().max(1000).optional(),
  priority: z.enum(RUN_PRIORITIES).optional(),
  dueAt: optionalDate,
  tags: tags.optional(),
}).strict().refine((body) => Object.keys(body).length > 0, 'At least one field is required')

export const nextActionSchema = z.object({ nextAction: z.string().trim().max(500) }).strict()
export const progressSchema = z.object({ progress: z.number().int().min(0).max(100) }).strict()
export const blockSchema = z.object({ blocker: z.string().trim().min(1).max(500) }).strict()
export const focusSchema = z.object({ focusDate: localDate.nullable(), focusOrder: z.number().int().min(1).max(3).nullable().optional() }).strict()
export const listRunsSchema = z.object({
  status: z.enum(RUN_STATUSES).optional(),
  priority: z.enum(RUN_PRIORITIES).optional(),
  type: z.enum(RUN_TYPES).optional(),
  tag: z.string().trim().min(1).max(32).optional(),
  search: z.string().trim().min(1).max(120).optional(),
  sort: z.enum(['priority', 'due', 'updated', 'title']).optional(),
  direction: z.enum(['asc', 'desc']).optional(),
}).strict()
export const todayQuerySchema = z.object({ date: localDate.optional() }).strict()

const nullableText = (max = 500) => z.string().trim().max(max).nullable().optional()
const stringList = z.array(z.string().trim().min(1).max(80)).max(20).default([])
const provenance = z.enum(['user_confirmed','user_provided','local_recorded','authorized_integration','public_source','derived_from_confirmed_data','unverified'])

export const profileSchema = z.object({
  displayName:z.string().trim().min(1).max(80), runningArea:nullableText(120).default(null), preferredDays:stringList,
  preferredTime:nullableText(40).default(null), preferredDistances:stringList, primaryGoal:nullableText(200).default(null),
  preferredEventTypes:stringList, runningWithOthersPreference:nullableText(120).default(null), communities:stringList,
  notes:nullableText(1000).default(null), onboardingCompletedAt:z.string().datetime({offset:true}).nullable().default(null),
}).strict()

export const recurringSchema = z.object({
  name:z.string().trim().min(1).max(120), activityType:z.enum(['community_run','running_training','structured_practice','coaching','learning','preparation','other']),
  recurrenceRule:z.string().trim().min(1).max(200), usualDay:nullableText(20).default(null), usualTime:nullableText(20).default(null),
  usualLocation:nullableText(160).default(null), community:nullableText(120).default(null), expectedDistanceMeters:z.number().positive().max(500000).nullable().default(null),
  notes:nullableText(1000).default(null), source:provenance.default('user_confirmed'), relevanceWeight:z.number().min(0).max(1).default(.5), active:z.boolean().default(true),
}).strict()
export const occurrenceSchema = z.object({ scheduledAt:z.string().datetime({offset:true}), status:z.enum(['planned','attended','skipped','unknown']), linkedRunningActivityId:z.string().uuid().nullable().default(null), notes:nullableText(1000).default(null) }).strict()

export const activitySchema = z.object({
  startedAt:z.string().datetime({offset:true}), endedAt:z.string().datetime({offset:true}).nullable().default(null), durationSeconds:z.number().int().nonnegative().nullable().default(null),
  distanceMeters:z.number().nonnegative().nullable().default(null), paceSecondsPerKm:z.number().int().positive().nullable().default(null), elevationMeters:z.number().nullable().default(null),
  effort:z.number().int().min(1).max(10).nullable().default(null), feeling:nullableText(120).default(null), source:z.string().trim().min(1).max(40).default('manual'), externalId:nullableText(160).default(null),
  eventId:z.string().uuid().nullable().default(null), recurringActivityId:z.string().uuid().nullable().default(null), notes:nullableText(1000).default(null),
}).strict().refine(x=>!x.endedAt||x.endedAt>=x.startedAt,{message:'endedAt must not be before startedAt'})

export const runningEventSchema = z.object({
  name:z.string().trim().min(1).max(160), aliases:stringList, editionYear:z.number().int().min(1900).max(2200).nullable().default(null), monthHint:nullableText(20).default(null),
  eventDate:z.string().datetime({offset:true}).nullable().default(null), location:nullableText(160).default(null), organizer:nullableText(160).default(null), distanceOrCategory:nullableText(160).default(null),
  registrationUrl:z.string().url().nullable().default(null), registrationDeadline:z.string().datetime({offset:true}).nullable().default(null), sourceUrl:z.string().url().nullable().default(null),
  status:z.enum(['candidate','upcoming','completed','cancelled']).default('candidate'), dateStatus:z.enum(['verified','unverified']).default('unverified'), participationIntent:z.enum(['none','interested','planned','confirmed']).default('none'), notes:nullableText(1000).default(null),
}).strict()
export const evidenceSchema = z.object({ evidenceType:z.enum(['prior_participation','instagram_post','instagram_highlight','repost','explicit_confirmation','registration','public_event_listing']), evidenceStrength:z.enum(['weak','moderate','strong','confirmed']), sourceUrl:z.string().url().nullable().default(null), observedAt:z.string().datetime({offset:true}), notes:nullableText(1000).default(null) }).strict()
export const occurrenceQuerySchema = z.object({ from:z.string().datetime({offset:true}).optional(), to:z.string().datetime({offset:true}).optional() }).strict()
export const aiQuestionSchema = z.object({ question:z.string().trim().min(2).max(500) }).strict()
