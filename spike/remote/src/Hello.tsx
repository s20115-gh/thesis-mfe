import { createClient } from '@supabase/supabase-js'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useLocation } from 'react-router'

// The component this remote exposes to the shell as "remote/Hello".
// It touches every shared library, so if one were NOT shared with the shell
// it would break (no router / no QueryClient found) or load a second copy.
export default function Hello() {
  const [count, setCount] = useState(0)
  const location = useLocation() // needs the shell's router
  const { data } = useQuery({
    // needs the shell's QueryClient
    queryKey: ['spike', 'greeting'],
    queryFn: async () => 'data from the shared QueryClient',
  })

  return (
    <section style={{ border: '2px dashed #646cff', padding: 16, borderRadius: 8 }}>
      <h2>Hello from the remote app</h2>
      <ul>
        <li>react-router: current path is <code>{location.pathname}</code></li>
        <li>react-query: {data ?? 'loading…'}</li>
        <li>supabase-js: {typeof createClient === 'function' ? 'loaded' : 'missing'}</li>
      </ul>
      <button onClick={() => setCount((c) => c + 1)}>clicked {count} times</button>
    </section>
  )
}
