import { isRouteErrorResponse, Link, useRouteError } from 'react-router'

export function NotFoundPage() {
  return (
    <section className="page">
      <h1>Page not found</h1>
      <p>
        <Link to="/">Back to the start</Link>
      </p>
    </section>
  )
}

/** Shown when a route throws while rendering or loading. */
export function RouteError() {
  const error = useRouteError()
  const message = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
      ? error.message
      : 'Unknown error'
  return (
    <section className="page" role="alert">
      <h1>Something went wrong</h1>
      <p className="error">{message}</p>
    </section>
  )
}
