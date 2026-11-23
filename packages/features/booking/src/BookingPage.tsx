import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { paths, type AppSupabaseClient } from '@thesis/contracts'
import { queryKeys } from '@thesis/data'
import { Button, formatDuration, formatKes, formatTimeAt } from '@thesis/ui'
import { useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import {
  createBooking,
  fetchBookingVenue,
  fetchSlots,
  SlotTakenError,
  type BookingVenue,
} from './api.ts'
import {
  addDays,
  BOOKING_WINDOW_DAYS,
  dayLabel,
  isDay,
  longDayLabel,
  todayIn,
  weekdayOf,
} from './dates.ts'

type Selected = { staffId: string; startsAt: string }

export function BookingPage({ supabase }: { supabase: AppSupabaseClient }) {
  const { venueId = '' } = useParams()
  const venue = useQuery({
    queryKey: queryKeys.venues.detail(venueId),
    queryFn: () => fetchBookingVenue(supabase, venueId),
  })

  if (venue.isPending) return <Shell>Loading…</Shell>
  if (venue.isError) {
    return (
      <Shell>
        <p className="error" role="alert">
          Could not load this salon. {venue.error.message}
        </p>
      </Shell>
    )
  }
  if (!venue.data) {
    return (
      <Shell>
        <h1>Salon not found</h1>
        <p>
          <Link to={paths.discovery}>Find a salon</Link>
        </p>
      </Shell>
    )
  }
  return <SlotPicker supabase={supabase} venue={venue.data} />
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <section className="page" data-testid="feature-booking">
      {children}
    </section>
  )
}

function SlotPicker({ supabase, venue }: { supabase: AppSupabaseClient; venue: BookingVenue }) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const [selected, setSelected] = useState<Selected | null>(null)

  // ---- state from the URL, validated against this venue ----
  const today = todayIn(venue.timezone)
  const days = Array.from({ length: BOOKING_WINDOW_DAYS }, (_, i) => addDays(today, i))
  const openWeekdays = new Set(venue.staff.flatMap((s) => s.availability.map((a) => a.weekday)))
  const isOpen = (day: string) => openWeekdays.has(weekdayOf(day))

  const service = venue.services.find((s) => s.id === params.get('service')) ?? null
  const dayParam = params.get('day')
  const day =
    isDay(dayParam) && days.includes(dayParam) ? dayParam : (days.find(isOpen) ?? days[0]!)
  const staffParam = params.get('staff')
  const staffId = venue.staff.some((s) => s.id === staffParam) ? staffParam : null

  function update(change: Record<string, string | null>) {
    const next = new URLSearchParams(params)
    for (const [key, value] of Object.entries(change)) {
      if (value) next.set(key, value)
      else next.delete(key)
    }
    setSelected(null)
    void setParams(next)
  }

  // ---- free times ----
  const slots = useQuery({
    queryKey: queryKeys.availability.slots(service?.id ?? 'none', day),
    queryFn: () => fetchSlots(supabase, service!.id, day),
    enabled: service !== null,
  })

  // One button per start time. With "Anyone", the time goes to the first
  // free staff member (the database returns them in a fixed order).
  const times = new Map<string, string>()
  for (const slot of slots.data ?? []) {
    if (staffId && slot.staff_id !== staffId) continue
    if (!times.has(slot.starts_at)) times.set(slot.starts_at, slot.staff_id)
  }

  const book = useMutation({
    mutationFn: (choice: Selected) =>
      createBooking(supabase, { serviceId: service!.id, ...choice }),
    onSuccess: async (bookingId) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.availability.all() })
      await queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all() })
      // Payment is the checkout feature: go there by URL.
      await navigate(paths.checkout(bookingId))
    },
    onError: async (error) => {
      if (error instanceof SlotTakenError) {
        setSelected(null)
        await slots.refetch()
      }
    },
  })

  const staffName = (id: string) => venue.staff.find((s) => s.id === id)?.name ?? ''

  return (
    <Shell>
      <Link to={paths.venue(venue.slug)} className="back-link">
        ← {venue.name}
      </Link>
      <h1>Book at {venue.name}</h1>

      <div className="detail-layout">
        <div className="panel">
          <section className="step" aria-labelledby="service-heading">
            <h2 id="service-heading">Service</h2>
            <div className="chip-row" role="group" aria-label="Service">
              {venue.services.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className="chip"
                  aria-pressed={s.id === service?.id}
                  onClick={() => update({ service: s.id })}
                >
                  {s.name}
                  <small>
                    {formatDuration(s.duration_minutes)} · {formatKes(s.price_cents)}
                  </small>
                </button>
              ))}
            </div>
          </section>

          {service && (
            <>
              <section className="step" aria-labelledby="day-heading">
                <h2 id="day-heading">Day</h2>
                <div className="chip-row" role="group" aria-label="Day">
                  {days.map((d, i) => {
                    const label = dayLabel(d)
                    return (
                      <button
                        key={d}
                        type="button"
                        className="chip"
                        data-day={d}
                        aria-pressed={d === day}
                        aria-label={`${longDayLabel(d)}${isOpen(d) ? '' : ', closed'}`}
                        disabled={!isOpen(d)}
                        onClick={() => update({ day: d })}
                      >
                        {i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : label.weekday}
                        <small>{label.date}</small>
                      </button>
                    )
                  })}
                </div>
              </section>

              <section className="step" aria-labelledby="staff-heading">
                <h2 id="staff-heading">With</h2>
                <div className="chip-row" role="group" aria-label="Staff">
                  <button
                    type="button"
                    className="chip"
                    aria-pressed={staffId === null}
                    onClick={() => update({ staff: null })}
                  >
                    Anyone
                  </button>
                  {venue.staff.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      className="chip"
                      aria-pressed={s.id === staffId}
                      onClick={() => update({ staff: s.id })}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              </section>

              <section className="step" aria-labelledby="time-heading">
                <h2 id="time-heading">Time</h2>
                {slots.isPending ? (
                  <p className="muted">Finding free times…</p>
                ) : slots.isError ? (
                  <p className="error" role="alert">
                    Could not load free times. {slots.error.message}
                  </p>
                ) : times.size === 0 ? (
                  <p className="muted" data-testid="no-times">
                    No free times on this day. Try another day
                    {staffId ? ' or anyone' : ''}.
                  </p>
                ) : (
                  <div className="slot-grid" role="group" aria-label="Time">
                    {[...times].map(([startsAt, slotStaffId]) => (
                      <button
                        key={startsAt}
                        type="button"
                        className="chip"
                        aria-pressed={selected?.startsAt === startsAt}
                        onClick={() => setSelected({ startsAt, staffId: slotStaffId })}
                      >
                        {formatTimeAt(startsAt, venue.timezone)}
                      </button>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </div>

        <aside className="panel summary" aria-labelledby="summary-heading">
          <h2 id="summary-heading">Your booking</h2>
          {!service ? (
            <p className="muted">Choose a service to see free times.</p>
          ) : (
            <>
              {book.error && (
                <p className="notice" role="alert">
                  {book.error.message}
                </p>
              )}
              <dl>
                <dt>Service</dt>
                <dd>{service.name}</dd>
                <dt>Length</dt>
                <dd>{formatDuration(service.duration_minutes)}</dd>
                <dt>Price</dt>
                <dd>{formatKes(service.price_cents)}</dd>
                <dt>When</dt>
                <dd data-testid="summary-when">
                  {selected
                    ? `${longDayLabel(day)}, ${formatTimeAt(selected.startsAt, venue.timezone)}`
                    : 'Pick a time'}
                </dd>
                <dt>With</dt>
                <dd data-testid="summary-staff">
                  {selected ? staffName(selected.staffId) : staffId ? staffName(staffId) : 'Anyone'}
                </dd>
              </dl>
              <Button
                disabled={!selected || book.isPending}
                onClick={() => selected && book.mutate(selected)}
              >
                {book.isPending ? 'Booking…' : 'Confirm booking'}
              </Button>
              <p className="muted">You pay in the next step.</p>
            </>
          )}
        </aside>
      </div>
    </Shell>
  )
}
