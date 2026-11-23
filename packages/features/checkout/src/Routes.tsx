import { paths, type FeatureProps } from '@thesis/contracts'
import { Navigate, Route, Routes as RouterRoutes } from 'react-router'
import { CheckoutPage, ConfirmationPage } from './pages.tsx'

/**
 * Checkout: pay for a pending booking (mock payment) and see the
 * confirmation.
 *   <basePath>/:bookingId            pay
 *   <basePath>/:bookingId/confirmed  confirmation
 */
export default function Routes({ supabase }: FeatureProps) {
  return (
    <RouterRoutes>
      <Route index element={<Navigate to={paths.account} replace />} />
      <Route path=":bookingId" element={<CheckoutPage supabase={supabase} />} />
      <Route path=":bookingId/confirmed" element={<ConfirmationPage supabase={supabase} />} />
      <Route path="*" element={<Navigate to={paths.account} replace />} />
    </RouterRoutes>
  )
}
