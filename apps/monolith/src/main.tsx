import { QueryClientProvider } from '@tanstack/react-query'
import { createQueryClient, createSupabase, supabaseConfigFromEnv } from '@thesis/data'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router/dom'
import { router } from './router.tsx'
import { SessionProvider } from './shell/session.tsx'
import '@thesis/ui/styles.css'
import './styles.css'

// Created exactly once for the whole app. Features get the client through
// FeatureProps and the QueryClient through React context.
const supabase = createSupabase(supabaseConfigFromEnv(import.meta.env))
const queryClient = createQueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <SessionProvider supabase={supabase}>
        <RouterProvider router={router} />
      </SessionProvider>
    </QueryClientProvider>
  </StrictMode>,
)
