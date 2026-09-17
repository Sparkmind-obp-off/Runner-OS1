import type { Run, RunListOptions, RunPriority } from './models'

const PRIORITY_WEIGHT: Record<RunPriority, number> = { critical: 0, high: 1, normal: 2, low: 3 }
const TERMINAL_STATUSES = new Set(['completed', 'archived'])

export function normalizeTags(tags: readonly string[]): string[] {
  return [...new Set(tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean))].slice(0, 10)
}

export function isActionable(run: Run): boolean {
  return !TERMINAL_STATUSES.has(run.status)
}

export function isOverdue(run: Run, now: string): boolean {
  return isActionable(run) && run.dueAt !== null && run.dueAt < now
}

export function isUpcoming(run: Run, now: string, horizonDays = 7): boolean {
  if (!isActionable(run) || run.dueAt === null || run.dueAt < now) return false
  const horizon = new Date(new Date(now).getTime() + horizonDays * 86_400_000).toISOString()
  return run.dueAt <= horizon
}

export function filterAndSortRuns(runs: Run[], options: RunListOptions = {}): Run[] {
  const search = options.search?.trim().toLowerCase()
  const tag = options.tag?.trim().toLowerCase()
  const filtered = runs.filter((run) => {
    if (options.status && run.status !== options.status) return false
    if (options.priority && run.priority !== options.priority) return false
    if (options.type && run.type !== options.type) return false
    if (tag && !run.tags.includes(tag)) return false
    if (search && ![run.title, run.outcome, run.nextAction, ...run.tags].some((value) => value.toLowerCase().includes(search))) return false
    return true
  })

  const direction = options.direction === 'desc' ? -1 : 1
  const sort = options.sort ?? 'priority'
  return filtered.sort((a, b) => {
    let result = 0
    if (sort === 'priority') result = PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority]
    if (sort === 'due') result = compareNullableDates(a.dueAt, b.dueAt)
    if (sort === 'updated') result = a.updatedAt.localeCompare(b.updatedAt)
    if (sort === 'title') result = a.title.localeCompare(b.title)
    if (result === 0 && sort !== 'updated') result = b.updatedAt.localeCompare(a.updatedAt)
    return result * direction
  })
}

function compareNullableDates(a: string | null, b: string | null): number {
  if (a === null && b === null) return 0
  if (a === null) return 1
  if (b === null) return -1
  return a.localeCompare(b)
}
