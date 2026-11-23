import type { AppSupabaseClient, VenueSearchResult } from '@thesis/contracts'
import type { VenueSearch } from '@thesis/data'

export async function searchVenues(
  supabase: AppSupabaseClient,
  search: VenueSearch,
): Promise<VenueSearchResult[]> {
  const { data, error } = await supabase.rpc('search_venues', {
    p_city: search.city,
    p_category: search.category,
    p_text: search.text,
    p_min_rating: search.minRating,
    p_sort: search.sort ?? 'rating',
  })
  if (error) throw error
  return data
}

export async function listCities(supabase: AppSupabaseClient): Promise<string[]> {
  const { data, error } = await supabase.rpc('list_cities')
  if (error) throw error
  return data.map((row) => row.city)
}
