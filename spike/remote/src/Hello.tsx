import { useState } from 'react'

// The component this remote exposes to the shell as "remote/Hello".
export default function Hello() {
  const [count, setCount] = useState(0)
  return (
    <section style={{ border: '2px dashed #646cff', padding: 16, borderRadius: 8 }}>
      <h2>Hello from the remote app</h2>
      <p>This component was built separately and loaded at runtime.</p>
      <button onClick={() => setCount((c) => c + 1)}>clicked {count} times</button>
    </section>
  )
}
