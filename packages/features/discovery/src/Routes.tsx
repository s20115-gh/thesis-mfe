import type { FeatureProps } from '@thesis/contracts'
import { Link, Route, Routes as RouterRoutes } from 'react-router'
import { SearchPage } from './SearchPage.tsx'

/**
 * Discovery: search salons by city, service type and text, with rating and
 * sort filters. The search lives in the URL query string.
 */
export default function Routes({ basePath, supabase }: FeatureProps) {
  return (
    <RouterRoutes>
      <Route index element={<SearchPage supabase={supabase} />} />
      <Route path="*" element={<NotFound basePath={basePath} />} />
    </RouterRoutes>
  )
}

function NotFound({ basePath }: { basePath: string }) {
  return (
    <section className="page">
      <h1>Not found</h1>
      <p>
        <Link to={basePath}>Back to Discovery</Link>
      </p>
    </section>
  )
}
