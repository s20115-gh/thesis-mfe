import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router'
import Hello from './Hello.tsx'

const queryClient = new QueryClient()

// Standalone page, so the remote can still be opened on its own (port 5174).
// In the shell, the router and QueryClient come from the shell instead.
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <main style={{ padding: 24 }}>
          <h1>Remote (standalone)</h1>
          <Hello />
        </main>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
