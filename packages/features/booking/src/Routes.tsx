import { paths, type FeatureProps } from '@thesis/contracts'
import { Navigate, Route, Routes as RouterRoutes } from 'react-router'
import { BookingPage } from './BookingPage.tsx'

/**
 * Booking: pick a service, day, staff member and free time at a venue, then
 * create a pending booking and continue to checkout.
 * URL: <basePath>/:venueId?service=…&day=YYYY-MM-DD&staff=…
 */
export default function Routes({ supabase }: FeatureProps) {
  return (
    <RouterRoutes>
      <Route index element={<Navigate to={paths.discovery} replace />} />
      <Route path=":venueId" element={<BookingPage supabase={supabase} />} />
      <Route path="*" element={<Navigate to={paths.discovery} replace />} />
    </RouterRoutes>
  )
}
