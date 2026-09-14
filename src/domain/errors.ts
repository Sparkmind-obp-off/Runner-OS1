export type ErrorCode = 'AUTH_REQUIRED' | 'AUTH_INVALID' | 'FORBIDDEN' | 'NOT_FOUND' | 'VALIDATION_ERROR' | 'INVALID_TRANSITION' | 'CONFLICT' | 'INTERNAL_ERROR'

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
