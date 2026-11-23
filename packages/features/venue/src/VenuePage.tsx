import { useQuery } from '@tanstack/react-query'
import { paths, type AppSupabaseClient, type VenueCategory } from '@thesis/contracts'
import { queryKeys } from '@thesis/data'
import { formatDuration, formatKes, formatRating, formatTime } from '@thesis/ui'
import { Link, useParams } from 'react-router'
import { fetchVenueBySlug } from './api.ts'
import { openingHours } from './hours.ts'

const categoryLabels: Record<VenueCategory, string> = {
  hair: 'Hair',
  barber: 'Barber',
  nails: 'Nails',
  spa: 'Spa & massage',
  makeup: 'Makeup & lashes',
}

export function VenuePage({ supabase }: { supabase: AppSupabaseClient }) {
  const { slug = '' } = useParams()
  const venue = useQuery({
    queryKey: queryKeys.venues.bySlug(slug),
    queryFn: () => fetchVenueBySlug(supabase, slug),
  })

  if (venue.isPending) {
    return (
      <section className="page" data-testid="feature-venue">
        <p className="muted">Loading…</p>
      </section>
    )
  }

  if (venue.isError) {
    return (
      <section className="page" data-testid="feature-venue">
        <p className="error" role="alert">
          Could not load this salon. {venue.error.message}
        </p>
      </section>
    )
  }

  if (!venue.data) {
    return (
      <section className="page" data-testid="feature-venue">
        <h1>Salon not found</h1>
        <p>
          <Link to={paths.discovery}>Find a salon</Link>
        </p>
      </section>
    )
  }

  const v = venue.data
  return (
    <section className="page" data-testid="feature-venue">
      <Link to={paths.discovery} className="back-link">
        ← All salons
      </Link>

      <header className="detail-header">
        <h1>{v.name}</h1>
        <p className="muted">{v.address}</p>
        <div className="card-meta">
          <span className="badge">{categoryLabels[v.category]}</span>
          {v.rating !== null && (
            <span className="rating" aria-label={`Rated ${formatRating(v.rating)} out of 5`}>
              ★ {formatRating(v.rating)} <span className="muted">({v.review_count} reviews)</span>
            </span>
          )}
        </div>
        {v.description && <p>{v.description}</p>}
      </header>

      <div className="detail-layout">
        <section className="panel" aria-labelledby="services-heading">
          <h2 id="services-heading">Services</h2>
          {v.services.length === 0 ? (
            <p className="muted">This salon has no services listed yet.</p>
          ) : (
            <ul className="row-list">
              {v.services.map((service) => (
                <li key={service.id} data-testid="service-row">
                  <div className="row-main">
                    <strong>{service.name}</strong>
                    <p className="muted">{formatDuration(service.duration_minutes)}</p>
                  </div>
                  <span className="price">{formatKes(service.price_cents)}</span>
                  {/* Booking is another feature: go there by URL. */}
                  <Link
                    to={paths.booking(v.id, service.id)}
                    className="button-link"
                    aria-label={`Book ${service.name}`}
                  >
                    Book
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside>
          <section className="panel" aria-labelledby="staff-heading">
            <h2 id="staff-heading">Team</h2>
            <ul className="row-list">
              {v.staff.map((member) => (
                <li key={member.id} data-testid="staff-row">
                  <div className="row-main">
                    <strong>{member.name}</strong>
                    <p className="muted">{member.title}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="panel" aria-labelledby="hours-heading">
            <h2 id="hours-heading">Opening hours</h2>
            <dl className="hours">
              {openingHours(v.staff).map(({ day, open, close }) => (
                <div key={day} style={{ display: 'contents' }}>
                  <dt>{day}</dt>
                  <dd>{open && close ? `${formatTime(open)} – ${formatTime(close)}` : 'Closed'}</dd>
                </div>
              ))}
            </dl>
          </section>
        </aside>
      </div>
    </section>
  )
}
