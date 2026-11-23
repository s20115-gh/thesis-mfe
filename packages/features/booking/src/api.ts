import type { AppSupabaseClient, AvailableSlot } from '@thesis/contracts'

/** What the booking page needs about a venue, in one request. */
export async function fetchBookingVenue(supabase: AppSupabaseClient, venueId: string) {
  const { data, error } = await supabase
    .from('venues')
    .select(
      `id, name, slug, timezone,
       services ( id, name, duration_minutes, price_cents ),
       staff ( id, name, title, availability ( weekday ) )`,
    )
    .eq('id', venueId)
    .eq('services.is_active', true)
    .eq('staff.is_active', true)
    .order('price_cents', { referencedTable: 'services', ascending: true })
    .order('name', { referencedTable: 'services', ascending: true })
    .order('name', { referencedTable: 'staff', ascending: true })
    .maybeSingle()
  if (error) throw error
  return data
}

export type BookingVenue = NonNullable<Awaited<ReturnType<typeof fetchBookingVenue>>>

/** Free start times for a service on a day (all staff), from the database. */
export async function fetchSlots(
  supabase: AppSupabaseClient,
  serviceId: string,
  day: string,
): Promise<AvailableSlot[]> {
  const { data, error } = await supabase.rpc('get_available_slots', {
    p_service_id: serviceId,
    p_day: day,
  })
  if (error) throw error
  return data
}

/** Thrown when someone else booked the time between showing and confirming. */
export class SlotTakenError extends Error {
  constructor() {
    super('That time was just taken. Please pick another.')
  }
}

export async function createBooking(
  supabase: AppSupabaseClient,
  booking: { serviceId: string; staffId: string; startsAt: string },
): Promise<string> {
  const { data, error } = await supabase.rpc('create_booking', {
    p_service_id: booking.serviceId,
    p_staff_id: booking.staffId,
    p_starts_at: booking.startsAt,
  })
  // 23P01: the bookings_no_overlap exclusion constraint.
  if (error?.code === '23P01') throw new SlotTakenError()
  if (error) throw error
  return data
}
