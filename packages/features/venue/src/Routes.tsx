import { paths, type FeatureProps } from '@thesis/contracts'
import { Navigate, Route, Routes as RouterRoutes } from 'react-router'
import { VenuePage } from './VenuePage.tsx'

/**
 * Venue profile: details, services (each with a Book link), team and opening
 * hours, at <basePath>/:slug. There is no venue list here; that is Discovery.
 */
export default function Routes({ supabase }: FeatureProps) {
  return (
    <RouterRoutes>
      <Route index element={<Navigate to={paths.discovery} replace />} />
      <Route path=":slug" element={<VenuePage supabase={supabase} />} />
      <Route path="*" element={<Navigate to={paths.discovery} replace />} />
    </RouterRoutes>
  )
}
