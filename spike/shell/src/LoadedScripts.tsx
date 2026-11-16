import { useEffect, useState } from 'react'
import { useLocation } from 'react-router'

// Spike-only debug panel: lists every JS file the browser has downloaded,
// grouped by server. Used to check that shared libraries load only once.
export default function LoadedScripts() {
  const location = useLocation()
  const [files, setFiles] = useState<string[]>([])

  useEffect(() => {
    const id = setTimeout(() => {
      const urls = performance
        .getEntriesByType('resource')
        .map((e) => e.name)
        .filter((n) => n.endsWith('.js'))
        .map((n) => {
          const u = new URL(n)
          return `${u.port} ${u.pathname.split('/').pop()}`
        })
      setFiles(urls)
    }, 1000)
    return () => clearTimeout(id)
  }, [location.pathname])

  return (
    <details style={{ marginTop: 24 }}>
      <summary>Loaded JS files ({files.length})</summary>
      <ul id="loaded-scripts">
        {files.map((f) => (
          <li key={f}><code>{f}</code></li>
        ))}
      </ul>
    </details>
  )
}
