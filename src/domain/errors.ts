export type ErrorCode = 'AUTH_REQUIRED' | 'AUTH_INVALID' | 'FORBIDDEN' | 'NOT_FOUND' | 'VALIDATION_ERROR' | 'INVALID_TRANSITION' | 'CONFLICT' | 'PROVIDER_UNAVAILABLE' | 'AI_INVALID_REQUEST' | 'AI_PROVIDER_UNAVAILABLE' | 'AI_PROVIDER_TIMEOUT' | 'AI_PROVIDER_RATE_LIMITED' | 'AI_PROVIDER_ERROR' | 'INTERNAL_ERROR'

export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly status: number,
    public readonly details?: unknown,
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export const notFound = () => new AppError('NOT_FOUND', 'Run not found', 404)
