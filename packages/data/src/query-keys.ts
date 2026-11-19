import type { BookingStatus, VenueCategory } from '@thesis/contracts'

/**
 * Query key factories for every feature.
 *
 * Keys are hierarchical, so a feature can invalidate a whole group, e.g.
 * `queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all() })`
 * after a booking changes. Features that read the same data use the same key
 * and therefore share a cache entry when they share a QueryClient.
 *
 * Every key starts with 'thesis' and the entity name. Parameters are plain
 * objects or strings so keys are stable and serialisable.
 */

/** Calendar dates in the venue's local time, as 'YYYY-MM-DD'. */
export type DateRange = { from: string; to: string }

export type VenueSearch = {
  city: string
  category?: VenueCategory
  /** Free text matched against venue and service names. */
  text?: string
}

export type BookingFilter = {
  status?: BookingStatus[]
  range?: DateRange
}

const root = ['thesis'] as const

const venues = {
  all: () => [...root, 'venues'] as const,
  search: (search: VenueSearch) => [...venues.all(), 'search', search] as const,
  detail: (venueId: string) => [...venues.all(), 'detail', venueId] as const,
  /** Venues owned by a merchant (merchant side). */
  owned: (ownerId: string) => [...venues.all(), 'owned', ownerId] as const,
}

const services = {
  all: () => [...root, 'services'] as const,
  byVenue: (venueId: string) => [...services.all(), 'venue', venueId] as const,
  detail: (serviceId: string) => [...services.all(), 'detail', serviceId] as const,
}

const staff = {
  all: () => [...root, 'staff'] as const,
  byVenue: (venueId: string) => [...staff.all(), 'venue', venueId] as const,
}

const availability = {
  all: () => [...root, 'availability'] as const,
  byVenue: (venueId: string) => [...availability.all(), 'venue', venueId] as const,
  /** Free slots from the get_available_slots RPC. */
  slots: (serviceId: string, day: string) =>
    [...availability.all(), 'slots', serviceId, day] as const,
}

const bookings = {
  all: () => [...root, 'bookings'] as const,
  /** The signed-in customer's bookings (account page). */
  mine: (customerId: string, filter: BookingFilter = {}) =>
    [...bookings.all(), 'customer', customerId, filter] as const,
  /** A venue's bookings (merchant calendar). */
  byVenue: (venueId: string, filter: BookingFilter = {}) =>
    [...bookings.all(), 'venue', venueId, filter] as const,
  detail: (bookingId: string) => [...bookings.all(), 'detail', bookingId] as const,
}

const payments = {
  all: () => [...root, 'payments'] as const,
  byBooking: (bookingId: string) => [...payments.all(), 'booking', bookingId] as const,
}

const analytics = {
  all: () => [...root, 'analytics'] as const,
  venue: (venueId: string, range: DateRange) =>
    [...analytics.all(), 'venue', venueId, range] as const,
}

const profile = {
  all: () => [...root, 'profile'] as const,
  me: (userId: string) => [...profile.all(), 'me', userId] as const,
}

export const queryKeys = {
  all: () => root,
  venues,
  services,
  staff,
  availability,
  bookings,
  payments,
  analytics,
  profile,
}
