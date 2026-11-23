import type { VenueProfile } from './api.ts'

const weekdayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export type DayHours = { day: string; open: string | null; close: string | null }

/**
 * Opening hours per weekday, Monday first: from the earliest start to the
 * latest end of any staff member working that day. Null = closed.
 */
export function openingHours(staff: VenueProfile['staff']): DayHours[] {
  const order = [1, 2, 3, 4, 5, 6, 0]
  return order.map((weekday) => {
    const slots = staff.flatMap((s) => s.availability.filter((a) => a.weekday === weekday))
    if (slots.length === 0) return { day: weekdayNames[weekday]!, open: null, close: null }
    return {
      day: weekdayNames[weekday]!,
      open: slots.map((a) => a.start_time).sort()[0]!,
      close: slots
        .map((a) => a.end_time)
        .sort()
        .at(-1)!,
    }
  })
}
