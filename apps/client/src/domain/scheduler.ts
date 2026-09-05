import type { QuietHour, Settings } from './types'

/** Parse "HH:mm" into minutes from midnight. */
export function parseHm(hm: string): number {
  const [h, m] = hm.split(':').map((x) => Number(x))
  if (!Number.isFinite(h) || !Number.isFinite(m)) return 0
  return h * 60 + m
}

export function minutesFromDate(d: Date): number {
  return d.getHours() * 60 + d.getMinutes()
}

/** Quiet hour may wrap past midnight (e.g. 22:00–07:00). */
export function isInQuietHour(date: Date, q: QuietHour): boolean {
  const now = minutesFromDate(date)
  const start = parseHm(q.start)
  const end = parseHm(q.end)
  if (start === end) return false
  if (start < end) return now >= start && now < end
  return now >= start || now < end
}

export function isInAnyQuietHour(date: Date, quietHours: QuietHour[]): boolean {
  return quietHours.some((q) => isInQuietHour(date, q))
}

/** Advance `date` to the end of the quiet window that contains it. */
export function skipQuietHours(date: Date, quietHours: QuietHour[]): Date {
  let cursor = new Date(date.getTime())
  // Cap iterations to avoid infinite loops on bad data
  for (let i = 0; i < 48; i++) {
    const hit = quietHours.find((q) => isInQuietHour(cursor, q))
    if (!hit) return cursor

    const endMins = parseHm(hit.end)
    const next = new Date(cursor)
    next.setSeconds(0, 0)
    next.setHours(Math.floor(endMins / 60), endMins % 60, 0, 0)
    if (next <= cursor) {
      next.setDate(next.getDate() + 1)
    }
    cursor = next
  }
  return cursor
}

export function randomIntervalMinutes(settings: Settings): number {
  const min = Math.max(1, Math.min(settings.minIntervalMin, settings.maxIntervalMin))
  const max = Math.max(min, settings.maxIntervalMin)
  return min + Math.random() * (max - min)
}

/** Next fire Date from now, random interval then skip quiet hours. */
export function computeNextFireAt(settings: Settings, from = new Date()): Date {
  const delayMin = randomIntervalMinutes(settings)
  const candidate = new Date(from.getTime() + delayMin * 60_000)
  return skipQuietHours(candidate, settings.quietHours)
}

export function delayMinutesFromNow(fireAt: Date, from = new Date()): number {
  const ms = fireAt.getTime() - from.getTime()
  return Math.max(0.05, ms / 60_000)
}
