import { lazy, Suspense } from 'react'
import { BrowserRouter, Link, Route, Routes } from 'react-router'

// Not bundled into the shell: fetched from the remote the first time
// someone visits /remote.
const RemoteHello = lazy(() => import('remote/Hello'))

function Home() {
  return <p>This page belongs to the shell. Open the remote page above.</p>
}

export default function App() {
  return (
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
      </main>
    </BrowserRouter>
  )
}
