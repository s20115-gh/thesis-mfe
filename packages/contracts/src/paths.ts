/**
 * Public URLs of the app: the contract between features.
 *
 * A feature never imports another feature; when it needs to send the user
 * somewhere else it builds the URL here. The shell mounts each feature at its
 * base path, so these values and the shell's routes must agree.
 */
export const basePaths = {
  discovery: '/salons',
  venue: '/venues',
  booking: '/book',
  checkout: '/checkout',
  account: '/account',
  calendar: '/merchant/calendar',
  catalogStaff: '/merchant/catalog',
  analytics: '/merchant/analytics',
} as const

export const paths = {
  ...basePaths,
  /** A venue's profile page. */
  venue: (slug: string) => `${basePaths.venue}/${encodeURIComponent(slug)}`,
  /** Start booking at a venue, optionally with a service already chosen. */
  booking: (venueId: string, serviceId?: string) =>
    `${basePaths.booking}/${encodeURIComponent(venueId)}` +
    (serviceId ? `?service=${encodeURIComponent(serviceId)}` : ''),
  /** Pay for a pending booking. */
  checkout: (bookingId: string) => `${basePaths.checkout}/${encodeURIComponent(bookingId)}`,
} as const
