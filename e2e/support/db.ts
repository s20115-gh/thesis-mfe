import { createClient } from '@supabase/supabase-js'
import type { Database } from '@thesis/contracts'
import path from 'node:path'

process.loadEnvFile(path.join(import.meta.dirname, '../../.env.local'))

/**
 * Admin access to the local database for test setup and cleanup only, with
 * the service role key (bypasses row level security). Never used by the app.
 */
export const admin = createClient<Database>(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } },
)

/** Deletes bookings (and their payments) created by a test. */
export async function deleteBookings(ids: string[]) {
  if (ids.length === 0) return
  await admin.from('payments').delete().in('booking_id', ids)
  const { error } = await admin.from('bookings').delete().in('id', ids)
  if (error) throw error
}

/** The id a URL like /checkout/<uuid> points at. */
export function idFromUrl(url: string): string {
  const id = /([0-9a-f-]{36})(?:[?#].*)?$/.exec(url)?.[1]
  if (!id) throw new Error(`No id in ${url}`)
  return id
}

export const TEST_CUSTOMER_ID = '00000000-0000-4000-a000-000000000001'

/**
 * Creates a pending booking for the test customer at Amani Hair Studio on
 * the first free slot `daysAhead` days from now (skipping closed days), the
 * way a customer would have. Each spec uses its own days so parallel spec
 * files never compete for the same slot.
 */
export async function createPendingBooking(
  daysAhead: number,
  status: 'pending' | 'cancelled' = 'pending',
) {
  const { data: service } = await admin
    .from('services')
    .select('id, venue_id, venues!inner(slug)')
    .eq('venues.slug', 'amani-hair-studio')
    .eq('name', 'Wash & blow-dry')
    .single()
  for (let offset = daysAhead; offset < daysAhead + 7; offset++) {
    const day = new Date(Date.now() + offset * 86_400_000).toISOString().slice(0, 10)
    const { data: slots } = await admin.rpc('get_available_slots', {
      p_service_id: service!.id,
      p_day: day,
    })
    const slot = slots?.[0]
    if (!slot) continue
    const { data, error } = await admin
      .from('bookings')
      .insert({
        customer_id: TEST_CUSTOMER_ID,
        service_id: service!.id,
        staff_id: slot.staff_id,
        starts_at: slot.starts_at,
        status,
        // Replaced by the prepare_booking trigger:
        venue_id: service!.venue_id,
        ends_at: slot.starts_at,
        price_cents: 0,
      })
      .select('id, price_cents')
      .single()
    if (error) throw error
    return data
  }
  throw new Error(`No free slot ${daysAhead}-${daysAhead + 6} days ahead`)
}
