import type { AppSupabaseClient } from '@thesis/contracts'

/**
 * A venue with its active services (cheapest first) and active staff with
 * their weekly hours, in one request. Returns null if no venue has that slug.
 */
export async function fetchVenueBySlug(supabase: AppSupabaseClient, slug: string) {
  const { data, error } = await supabase
    .from('venues')
    .select(
      `id, name, slug, description, category, city, address, rating, review_count,
       services ( id, name, description, duration_minutes, price_cents ),
       staff ( id, name, title, availability ( weekday, start_time, end_time ) )`,
    )
    .eq('slug', slug)
    .eq('services.is_active', true)
    .eq('staff.is_active', true)
    .order('price_cents', { referencedTable: 'services', ascending: true })
    .order('name', { referencedTable: 'services', ascending: true })
    .order('name', { referencedTable: 'staff', ascending: true })
    .maybeSingle()
  if (error) throw error
  return data
}

export type VenueProfile = NonNullable<Awaited<ReturnType<typeof fetchVenueBySlug>>>
