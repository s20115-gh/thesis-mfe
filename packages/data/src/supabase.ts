import { createClient } from '@supabase/supabase-js'
import type { AppSupabaseClient, Database } from '@thesis/contracts'

export type { AppSupabaseClient }

export type SupabaseConfig = {
  url: string
  anonKey: string
}

/**
 * Every app stores the session under this key, so a user signed in through
 * the shell is signed in for every feature, in every configuration.
 */
export const AUTH_STORAGE_KEY = 'thesis-auth'

/**
 * Creates the Supabase client.
 *
 * Call this ONCE, in the app shell, and pass the client to features through
 * FeatureProps. Never create a client inside a feature or at module level in
 * a shared package: in federated builds each remote has its own copy of this
 * package, so a module-level client would mean one auth client (with its own
 * token refresh timer) per remote.
 */
export function createSupabase({ url, anonKey }: SupabaseConfig): AppSupabaseClient {
  return createClient<Database>(url, anonKey, {
    auth: {
      storageKey: AUTH_STORAGE_KEY,
      persistSession: true,
      autoRefreshToken: true,
      // Email/password only; no OAuth redirects to parse.
      detectSessionInUrl: false,
    },
  })
}

/**
 * Reads the Supabase settings from a Vite env object (`import.meta.env`) and
 * fails early with a clear message if one is missing.
 */
export function supabaseConfigFromEnv(env: Record<string, string | undefined>): SupabaseConfig {
  const url = env.VITE_SUPABASE_URL
  const anonKey = env.VITE_SUPABASE_ANON_KEY
  if (!url || !anonKey) {
    throw new Error(
      'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Copy .env.example to .env.local.',
    )
  }
  return { url, anonKey }
}
