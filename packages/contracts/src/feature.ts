import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './database.ts'

/** The Supabase client typed with this app's schema. */
export type AppSupabaseClient = SupabaseClient<Database>

/**
 * What the shell gives every feature module. In the monolith this is passed
 * as props; in the federated builds it crosses the remote boundary, so it is
 * the only API between the shell and a remote. Keep it small.
 */
export type FeatureProps = {
  /** URL prefix the feature is mounted under, e.g. "/venues". */
  basePath: string
  /**
   * The one Supabase client, created by the shell. Features use it for data
   * and for the current session; they never create their own.
   */
  supabase: AppSupabaseClient
}
