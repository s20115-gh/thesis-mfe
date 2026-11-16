import { createClient } from '@supabase/supabase-js'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { lazy, Suspense } from 'react'
import { BrowserRouter, Link, Route, Routes } from 'react-router'
import LoadedScripts from './LoadedScripts.tsx'

// Not bundled into the shell: fetched from the remote the first time
// someone visits /remote.
const RemoteHello = lazy(() => import('remote/Hello'))

// One QueryClient for the whole app, owned by the shell and used by remotes.
const queryClient = new QueryClient()

function Home() {
  return (
    <p>
      This page belongs to the shell (supabase-js{' '}
      {typeof createClient === 'function' ? 'loaded' : 'missing'}). Open the remote page above.
    </p>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <main style={{ padding: 24 }}>
          <h1>Shell</h1>
          <nav style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <Link to="/">Home</Link>
            <Link to="/remote">Remote page</Link>
          </nav>
          <Suspense fallback={<p>Loading remote…</p>}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/remote" element={<RemoteHello />} />
            </Routes>
          </Suspense>
          <LoadedScripts />
        </main>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
