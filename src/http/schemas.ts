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
