import { createBrowserRouter, Navigate } from 'react-router'
import { feature, features } from './features.ts'
import { NotFoundPage, RouteError } from './pages/errors.tsx'
import { SignInPage } from './pages/SignInPage.tsx'
import { FeatureRoute } from './shell/FeatureRoute.tsx'
import { Layout } from './shell/Layout.tsx'

/**
 * Top-level routes, owned by the shell. Each feature is mounted at
 * `<basePath>/*` and owns everything below it.
 */
export const router = createBrowserRouter([
  {
    element: <Layout />,
    errorElement: <RouteError />,
    children: [
      { path: '/', element: <Navigate to={feature('discovery').basePath} replace /> },
      { path: '/merchant', element: <Navigate to={feature('calendar').basePath} replace /> },
      { path: '/sign-in', element: <SignInPage /> },
      ...features.map((f) => ({
        path: `${f.basePath}/*`,
        element: <FeatureRoute feature={f} />,
      })),
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
