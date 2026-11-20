import { Button } from '@thesis/ui'
import { NavLink, Outlet, useNavigate } from 'react-router'
import { feature, features } from '../features.ts'
import { useSession } from './session.tsx'

export function Layout() {
  const { status, profile, signOut } = useSession()
  const navigate = useNavigate()
  const isMerchant = profile?.role === 'merchant'

  async function handleSignOut() {
    await signOut()
    await navigate('/')
  }

  return (
    <div className="app">
      <header className="header">
        <NavLink to="/" className="brand">
          Salon booking
        </NavLink>
        <nav className="nav" aria-label="Main">
          <NavLink to={feature('discovery').basePath}>{feature('discovery').title}</NavLink>
          {status === 'signed-in' && !isMerchant && (
            <NavLink to={feature('account').basePath}>{feature('account').title}</NavLink>
          )}
          {isMerchant &&
            features
              .filter((f) => f.access === 'merchant')
              .map((f) => (
                <NavLink key={f.name} to={f.basePath}>
                  {f.title}
                </NavLink>
              ))}
        </nav>
        <div className="user">
          {status === 'signed-in' && (
            <>
              <span className="user-name" data-testid="user-name">
                {profile?.full_name}
              </span>
              <Button variant="secondary" onClick={() => void handleSignOut()}>
                Sign out
              </Button>
            </>
          )}
          {status === 'signed-out' && <NavLink to="/sign-in">Sign in</NavLink>}
        </div>
      </header>
      <main className="main">
        <Outlet />
      </main>
    </div>
  )
}
