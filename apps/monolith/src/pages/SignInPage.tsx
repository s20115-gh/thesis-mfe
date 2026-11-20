import { Button } from '@thesis/ui'
import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router'
import { useSession } from '../shell/session.tsx'

export function SignInPage() {
  const { status, profile, signIn } = useSession()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Already signed in (e.g. opened /sign-in directly): leave the page.
  if (status === 'signed-in' && !submitting) {
    return <Navigate to={from ?? (profile?.role === 'merchant' ? '/merchant' : '/')} replace />
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const field = (name: string) => {
      const value = form.get(name)
      return typeof value === 'string' ? value : ''
    }
    setSubmitting(true)
    setError(null)
    const result = await signIn(field('email'), field('password'))
    if ('error' in result) {
      setError(result.error)
      setSubmitting(false)
      return
    }
    await navigate(from ?? (result.profile.role === 'merchant' ? '/merchant' : '/'), {
      replace: true,
    })
  }

  return (
    <section className="page narrow">
      <h1>Sign in</h1>
      <form className="form" onSubmit={(e) => void handleSubmit(e)}>
        <label>
          Email
          <input name="email" type="email" autoComplete="email" required />
        </label>
        <label>
          Password
          <input name="password" type="password" autoComplete="current-password" required />
        </label>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
    </section>
  )
}
