import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { paths, type AppSupabaseClient } from '@thesis/contracts'
import { queryKeys } from '@thesis/data'
import { Button, formatKes } from '@thesis/ui'
import type { ReactNode } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router'
import { fetchCheckoutBooking, payForBooking, type CheckoutBooking } from './api.ts'
import { BookingSummary } from './BookingSummary.tsx'

function Shell({ children }: { children: ReactNode }) {
  return (
    <section className="page checkout" data-testid="feature-checkout">
      {children}
    </section>
  )
}

/** Loads the booking from the URL and renders `children` with it. */
function WithBooking({
  supabase,
  children,
}: {
  supabase: AppSupabaseClient
  children: (booking: CheckoutBooking) => ReactNode
}) {
  const { bookingId = '' } = useParams()
  const booking = useQuery({
    queryKey: queryKeys.bookings.detail(bookingId),
    queryFn: () => fetchCheckoutBooking(supabase, bookingId),
  })

  if (booking.isPending) return <Shell>Loading…</Shell>
  if (booking.isError) {
    return (
      <Shell>
        <p className="error" role="alert">
          Could not load this booking. {booking.error.message}
        </p>
      </Shell>
    )
  }
  if (!booking.data) {
    return (
      <Shell>
        <h1>Booking not found</h1>
        <p>
          <Link to={paths.account}>My bookings</Link>
        </p>
      </Shell>
    )
  }
  return <Shell>{children(booking.data)}</Shell>
}

export function CheckoutPage({ supabase }: { supabase: AppSupabaseClient }) {
  return (
    <WithBooking supabase={supabase}>
      {(booking) => <Checkout supabase={supabase} booking={booking} />}
    </WithBooking>
  )
}

function Checkout({
  supabase,
  booking,
}: {
  supabase: AppSupabaseClient
  booking: CheckoutBooking
}) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const pay = useMutation({
    mutationFn: () => payForBooking(supabase, booking.id),
    onSettled: async () => {
      // Success or not, the booking may have changed (e.g. paid in another
      // tab), so reload it; a confirmed booking then shows the confirmation.
      await queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all() })
      await queryClient.invalidateQueries({ queryKey: queryKeys.payments.all() })
    },
    onSuccess: async () => {
      await navigate('confirmed', { replace: true })
    },
  })

  if (booking.status === 'confirmed' || booking.status === 'completed') {
    return <Navigate to="confirmed" replace />
  }

  if (booking.status !== 'pending') {
    return (
      <>
        <h1>This booking can’t be paid</h1>
        <p>
          It is <strong>{booking.status.replace('_', '-')}</strong>.{' '}
          <Link to={paths.account}>My bookings</Link>
        </p>
      </>
    )
  }

  return (
    <>
      <h1>Checkout</h1>
      <div className="panel summary">
        <BookingSummary booking={booking} />
        <div className="total">
          <span>Total</span>
          <span data-testid="total">{formatKes(booking.price_cents)}</span>
        </div>
        {pay.isError && (
          <p className="notice" role="alert">
            Payment failed. {pay.error.message}
          </p>
        )}
        <Button className="pay-button" disabled={pay.isPending} onClick={() => pay.mutate()}>
          {pay.isPending ? 'Paying…' : `Pay ${formatKes(booking.price_cents)}`}
        </Button>
        <p className="muted">This is a mock payment for testing. No money is taken.</p>
      </div>
    </>
  )
}

export function ConfirmationPage({ supabase }: { supabase: AppSupabaseClient }) {
  return (
    <WithBooking supabase={supabase}>
      {(booking) =>
        booking.status === 'pending' ? (
          // Not paid yet: back to checkout.
          <Navigate to=".." relative="path" replace />
        ) : (
          <Confirmation booking={booking} />
        )
      }
    </WithBooking>
  )
}

function Confirmation({ booking }: { booking: CheckoutBooking }) {
  const payment = booking.payments
  return (
    <>
      <div className="success-mark" aria-hidden="true">
        ✓
      </div>
      <h1>Booking confirmed</h1>
      <p>See you at {booking.venues.name}.</p>
      <div className="panel summary">
        <BookingSummary booking={booking} />
        {payment && (
          <div className="total">
            <span>Paid</span>
            <span data-testid="paid">{formatKes(payment.amount_cents)}</span>
          </div>
        )}
        {payment?.provider_ref && (
          <p className="muted">
            Payment reference <code data-testid="payment-ref">{payment.provider_ref}</code>
          </p>
        )}
      </div>
      <div className="actions">
        <Link to={paths.account} className="button-link">
          My bookings
        </Link>
        <Link to={paths.discovery} className="button-link secondary">
          Find another salon
        </Link>
      </div>
    </>
  )
}
