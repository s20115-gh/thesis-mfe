import { paths, type VenueSearchResult } from '@thesis/contracts'
import { formatKes, formatRating } from '@thesis/ui'
import { Link } from 'react-router'
import { categoryLabels } from './labels.ts'

export function VenueCard({ venue }: { venue: VenueSearchResult }) {
  return (
    // Venue profile is another feature: link to it by URL, never import it.
    <Link to={paths.venue(venue.slug)} className="card" data-testid="venue-card">
      <h2>{venue.name}</h2>
      <p className="muted">{venue.address}</p>
      <div className="card-meta">
        <span className="badge">{categoryLabels[venue.category]}</span>
        {venue.rating !== null && (
          <span className="rating" aria-label={`Rated ${formatRating(venue.rating)} out of 5`}>
            ★ {formatRating(venue.rating)} <span className="muted">({venue.review_count})</span>
          </span>
        )}
        <span data-testid="venue-price">
          {venue.min_price_cents === null
            ? 'No services yet'
            : `From ${formatKes(venue.min_price_cents)}`}
        </span>
      </div>
    </Link>
  )
}
