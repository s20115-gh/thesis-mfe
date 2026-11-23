import { formatDateAt, formatDuration, formatTimeAt } from '@thesis/ui'
import type { CheckoutBooking } from './api.ts'

/** The booking details shown on both checkout and confirmation. */
export function BookingSummary({ booking }: { booking: CheckoutBooking }) {
  const tz = booking.venues.timezone
  return (
    <dl>
      <dt>Salon</dt>
      <dd>
        {booking.venues.name}
        <br />
        <span className="muted">{booking.venues.address}</span>
      </dd>
      <dt>Service</dt>
      <dd>
        {booking.services.name}{' '}
        <span className="muted">({formatDuration(booking.services.duration_minutes)})</span>
      </dd>
      <dt>When</dt>
      <dd data-testid="booking-when">
        {formatDateAt(booking.starts_at, tz)}, {formatTimeAt(booking.starts_at, tz)}
      </dd>
      <dt>With</dt>
      <dd>{booking.staff.name}</dd>
    </dl>
  )
}
