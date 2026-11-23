import type { AppSupabaseClient } from '@thesis/contracts'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * One booking with everything checkout and the confirmation page show.
 * Row level security returns only the signed-in customer's own bookings, so
 * someone else's booking id comes back as null ("not found").
 */
export async function fetchCheckoutBooking(supabase: AppSupabaseClient, bookingId: string) {
  if (!UUID.test(bookingId)) return null
  const { data, error } = await supabase
    .from('bookings')
    .select(
      `id, status, starts_at, price_cents,
       venues ( name, slug, address, timezone ),
       services ( name, duration_minutes ),
       staff ( name ),
       payments ( id, status, provider, provider_ref, amount_cents, created_at )`,
    )
    .eq('id', bookingId)
    .maybeSingle()
  if (error) throw error
  return data
}

export type CheckoutBooking = NonNullable<Awaited<ReturnType<typeof fetchCheckoutBooking>>>

/**
 * Mock payment: records a succeeded payment and confirms the booking in one
 * database transaction (mock_checkout). No payment provider, no delay.
 */
export async function payForBooking(supabase: AppSupabaseClient, bookingId: string) {
  const { data, error } = await supabase.rpc('mock_checkout', { p_booking_id: bookingId })
  if (error) throw error
  return data
}
