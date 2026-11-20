import { Suspense } from 'react'
import type { Feature } from '../features.ts'
import { RequireAuth } from './RequireAuth.tsx'
import { useSession } from './session.tsx'

/**
 * Mounts one feature: applies its access rule, shows a fallback while its
 * chunk downloads, and passes it the shell's props. A failed chunk download
 * throws to the route's error element.
 */
export function FeatureRoute({ feature }: { feature: Feature }) {
  const { supabase } = useSession()
  const { Routes, basePath, access } = feature

  const content = (
    <Suspense fallback={<p className="muted">Loading…</p>}>
      <Routes basePath={basePath} supabase={supabase} />
    </Suspense>
  )

  if (access === 'public') return content
  return <RequireAuth role={access === 'signed-in' ? undefined : access}>{content}</RequireAuth>
}
