import { Constants, type VenueCategory } from '@thesis/contracts'
import type { VenueSearch, VenueSort } from '@thesis/data'

/**
 * The search lives in the URL (?city=Nairobi&category=hair&q=braids&rating=4&sort=price),
 * so a search can be shared, bookmarked, reloaded, and walked with the back
 * button. These two functions are the only place the URL format is defined.
 * Unknown or invalid values are ignored rather than breaking the page.
 */

export const categories = Constants.public.Enums.venue_category
export const sorts: readonly VenueSort[] = ['rating', 'price', 'name']
export const ratingOptions = [4, 4.5] as const

const isCategory = (value: string | null): value is VenueCategory =>
  categories.includes(value as VenueCategory)
const isSort = (value: string | null): value is VenueSort => sorts.includes(value as VenueSort)

export function readSearch(params: URLSearchParams): VenueSearch {
  const search: VenueSearch = {}
  const city = params.get('city')?.trim()
  const category = params.get('category')
  const text = params.get('q')?.trim()
  const rating = Number(params.get('rating'))
  const sort = params.get('sort')

  if (city) search.city = city
  if (isCategory(category)) search.category = category
  if (text) search.text = text
  if (ratingOptions.includes(rating as (typeof ratingOptions)[number])) search.minRating = rating
  if (isSort(sort) && sort !== 'rating') search.sort = sort
  return search
}

export function writeSearch(search: VenueSearch): URLSearchParams {
  const params = new URLSearchParams()
  // Fixed order, so the same search always gives the same URL.
  if (search.city) params.set('city', search.city)
  if (search.category) params.set('category', search.category)
  if (search.text) params.set('q', search.text)
  if (search.minRating) params.set('rating', String(search.minRating))
  if (search.sort && search.sort !== 'rating') params.set('sort', search.sort)
  return params
}
