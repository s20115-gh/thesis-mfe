import path from 'node:path'

/** Fails fast with a clear message if the local Supabase stack is down. */
export default async function globalSetup() {
  process.loadEnvFile(path.join(import.meta.dirname, '../.env.local'))
  const url = process.env.VITE_SUPABASE_URL
  const key = process.env.VITE_SUPABASE_ANON_KEY ?? ''
  try {
    const res = await fetch(`${url}/auth/v1/health`, { headers: { apikey: key } })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
  } catch (error) {
    throw new Error(
      `Supabase is not reachable at ${url} (${String(error)}). Run \`supabase start\` first.`,
      { cause: error },
    )
  }
}
