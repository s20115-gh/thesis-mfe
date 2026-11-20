import type { UserRole } from '@thesis/contracts'
import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'
import { useSession } from './session.tsx'

/**
 * Protects a route. Signed-out users go to the sign-in page and come back
 * afterwards; signed-in users without the required role see a message.
 */
export function RequireAuth({ role, children }: { role?: UserRole; children: ReactNode }) {
  const { status, profile } = useSession()
  const location = useLocation()

  if (status === 'loading') return <p className="muted">Loading…</p>
  if (status === 'signed-out') {
    return <Navigate to="/sign-in" replace state={{ from: location.pathname + location.search }} />
  }
  if (role && profile?.role !== role) {
    return (
      <section className="page">
        <h1>Not available</h1>
        <p>
          This page is for {role} accounts. You are signed in as a {profile?.role}.
        </p>
      </section>
    )
  }
  return children
}
