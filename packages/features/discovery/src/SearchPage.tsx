import { keepPreviousData, useQuery } from '@tanstack/react-query'
import type { AppSupabaseClient, VenueCategory } from '@thesis/contracts'
import { queryKeys, type VenueSearch, type VenueSort } from '@thesis/data'
import { Button } from '@thesis/ui'
import type { FormEvent } from 'react'
import { useSearchParams } from 'react-router'
import { listCities, searchVenues } from './api.ts'
import { categoryLabels, sortLabels } from './labels.ts'
import { categories, ratingOptions, readSearch, sorts, writeSearch } from './search-params.ts'
import { VenueCard } from './VenueCard.tsx'

export function SearchPage({ supabase }: { supabase: AppSupabaseClient }) {
  const [params, setParams] = useSearchParams()
  const search = readSearch(params)

  const cities = useQuery({
    queryKey: [...queryKeys.venues.all(), 'cities'],
    queryFn: () => listCities(supabase),
    staleTime: Infinity,
  })

  const results = useQuery({
    queryKey: queryKeys.venues.search(search),
    queryFn: () => searchVenues(supabase, search),
    // Keep showing the previous results while a new search loads.
    placeholderData: keepPreviousData,
  })

  /** Every change becomes a new URL, so back/forward walk through searches. */
  function update(change: Partial<VenueSearch>) {
    void setParams(writeSearch({ ...search, ...change }))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const value = (name: string) => {
      const v = form.get(name)
      return typeof v === 'string' && v !== '' ? v : undefined
    }
    update({
      city: value('city'),
      category: value('category') as VenueCategory | undefined,
      text: value('q')?.trim() || undefined,
    })
  }

  const count = results.data?.length ?? 0
  const where = search.city ? ` in ${search.city}` : ''

  return (
    <section className="page" data-testid="feature-discovery">
      <h1>Find a salon</h1>

      <form className="search-bar" role="search" onSubmit={handleSubmit}>
        <label className="field">
          City
          <select
            name="city"
            value={search.city ?? ''}
            onChange={(e) => update({ city: e.target.value || undefined })}
          >
            <option value="">Any city</option>
            {cities.data?.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
            {/* Keep a city from the URL selectable even before the list loads. */}
            {search.city && !cities.data?.includes(search.city) && (
              <option value={search.city}>{search.city}</option>
            )}
          </select>
        </label>
        <label className="field">
          Service type
          <select
            name="category"
            value={search.category ?? ''}
            onChange={(e) =>
              update({ category: (e.target.value || undefined) as VenueCategory | undefined })
            }
          >
            <option value="">All services</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {categoryLabels[category]}
              </option>
            ))}
          </select>
        </label>
        <label className="field field-text">
          Salon or service
          <input
            // Remount when the URL text changes (e.g. back button), so the
            // box always shows the current search.
            key={search.text ?? ''}
            name="q"
            type="search"
            defaultValue={search.text ?? ''}
            placeholder="e.g. braids, silk press, Kilimani Cuts"
          />
        </label>
        <Button type="submit">Search</Button>
      </form>

      <div className="filters">
        <p className="result-count muted" aria-live="polite" data-testid="result-count">
          {results.isPending
            ? 'Searching…'
            : `${count} ${count === 1 ? 'salon' : 'salons'}${where}`}
        </p>
        <label className="field">
          Rating
          <select
            value={search.minRating ?? ''}
            onChange={(e) => update({ minRating: Number(e.target.value) || undefined })}
          >
            <option value="">Any rating</option>
            {ratingOptions.map((rating) => (
              <option key={rating} value={rating}>
                {rating}+ stars
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          Sort by
          <select
            value={search.sort ?? 'rating'}
            onChange={(e) => update({ sort: e.target.value as VenueSort })}
          >
            {sorts.map((sort) => (
              <option key={sort} value={sort}>
                {sortLabels[sort]}
              </option>
            ))}
          </select>
        </label>
      </div>

      {results.isError ? (
        <p className="error" role="alert">
          Could not load salons. {results.error.message}
        </p>
      ) : results.isPending ? null : count === 0 ? (
        <div className="empty">
          <p>No salons match this search.</p>
          <Button variant="secondary" onClick={() => void setParams(new URLSearchParams())}>
            Clear search
          </Button>
        </div>
      ) : (
        <ul className={`card-list ${results.isPlaceholderData ? 'is-refreshing' : ''}`}>
          {results.data.map((venue) => (
            <li key={venue.id}>
              <VenueCard venue={venue} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
