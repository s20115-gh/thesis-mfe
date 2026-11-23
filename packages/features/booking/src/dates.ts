/**
 * Calendar days are 'YYYY-MM-DD' strings in the venue's timezone. Day
 * arithmetic is done on UTC midnights so it never shifts with the browser's
 * own timezone or daylight saving.
 */

export const BOOKING_WINDOW_DAYS = 14

/** Today's date in a timezone, e.g. todayIn('Africa/Nairobi') -> '2026-11-23'. */
export function todayIn(timeZone: string, now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone }).format(now)
}

export function addDays(day: string, days: number): string {
  const date = new Date(`${day}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

/** 0 = Sunday ... 6 = Saturday, matching availability.weekday. */
export function weekdayOf(day: string): number {
  return new Date(`${day}T00:00:00Z`).getUTCDay()
}

export function isDay(value: string | null): value is string {
  return value !== null && /^\d{4}-\d{2}-\d{2}$/.test(value) && !isNaN(Date.parse(value))
}

/** '2026-11-24' -> { weekday: 'Tue', date: '24 Nov' } */
export function dayLabel(day: string): { weekday: string; date: string } {
  const date = new Date(`${day}T00:00:00Z`)
  return {
    weekday: date.toLocaleDateString('en-GB', { weekday: 'short', timeZone: 'UTC' }),
    date: date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' }),
  }
}

/** '2026-11-24' -> 'Tuesday 24 November' */
export function longDayLabel(day: string): string {
  return new Date(`${day}T00:00:00Z`).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  })
}
