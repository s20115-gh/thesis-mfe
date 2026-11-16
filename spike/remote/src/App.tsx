import Hello from './Hello.tsx'

// Standalone page, so the remote can still be opened on its own (port 5174).
export default function App() {
  return (
    <main style={{ padding: 24 }}>
      <h1>Remote (standalone)</h1>
      <Hello />
    </main>
  )
}
