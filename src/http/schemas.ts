import { z } from 'zod'
import { RUN_PRIORITIES, RUN_TYPES } from '../domain/models'

const optionalDate = z.string().datetime({ offset: true }).nullable().optional()

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
}).strict()

export const updateRunSchema = z.object({
  title: z.string().trim().min(1).max(160).optional(),
  type: z.enum(RUN_TYPES).optional(),
  outcome: z.string().trim().max(1000).optional(),
  priority: z.enum(RUN_PRIORITIES).optional(),
  dueAt: optionalDate,
}).strict().refine((body) => Object.keys(body).length > 0, 'At least one field is required')

export const nextActionSchema = z.object({ nextAction: z.string().trim().max(500) }).strict()
export const progressSchema = z.object({ progress: z.number().int().min(0).max(100) }).strict()
export const blockSchema = z.object({ blocker: z.string().trim().min(1).max(500) }).strict()
