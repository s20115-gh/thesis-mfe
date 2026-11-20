import type { FeatureProps } from '@thesis/contracts'
import { Link, Route, Routes as RouterRoutes } from 'react-router'

/**
 * Booking feature. The shell mounts this at `basePath` (with a trailing
 * `/*`), and every route below it belongs to this feature.
 *
 * Rules for every feature:
 * - Never import another feature. Link to it by URL instead.
 * - Get the Supabase client from props, never create one.
 * - Use queryKeys from @thesis/data so cache entries are shared.
 */
export default function Routes({ basePath }: FeatureProps) {
  return (
    <RouterRoutes>
      <Route index element={<Home />} />
      <Route path="*" element={<NotFound basePath={basePath} />} />
    </RouterRoutes>
  )
}

function Home() {
  return (
    <section className="page" data-testid="feature-booking">
      <h1>Booking</h1>
      <p className="muted">Placeholder for the Booking feature.</p>
    </section>
  )
}

function NotFound({ basePath }: { basePath: string }) {
  return (
    <section className="page">
      <h1>Not found</h1>
      <p>
        <Link to={basePath}>Back to Booking</Link>
      </p>
    </section>
  )
}
