import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@thesis/contracts'

export type AppSupabaseClient = SupabaseClient<Database>

/**
 * Creates the Supabase client. Apps call this once with values from their
 * environment; features never create their own client.
 */
export function createSupabase(url: string, anonKey: string): AppSupabaseClient {
  return createClient<Database>(url, anonKey)
}
