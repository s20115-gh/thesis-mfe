const kes = new Intl.NumberFormat('en-KE', {
  style: 'currency',
  currency: 'KES',
  maximumFractionDigits: 0,
})

/** 150000 (cents) -> "Ksh 1,500" */
export function formatKes(cents: number): string {
  return kes.format(cents / 100)
}

/** 4.6 -> "4.6" (always one decimal) */
export function formatRating(rating: number): string {
  return rating.toFixed(1)
}

/** 90 -> "1 h 30 min", 45 -> "45 min", 120 -> "2 h" */
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m} min`
  return m === 0 ? `${h} h` : `${h} h ${m} min`
}

/** "09:00:00" -> "09:00" */
export function formatTime(time: string): string {
  return time.slice(0, 5)
}

/** An ISO timestamp as local time in a timezone, e.g. '14:30'. */
export function formatTimeAt(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date(iso))
}

/** An ISO timestamp as a long local date in a timezone, e.g. 'Thursday 26 November'. */
export function formatDateAt(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date(iso))
}
