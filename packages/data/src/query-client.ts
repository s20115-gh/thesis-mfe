import { QueryClient, type DefaultOptions } from '@tanstack/react-query'

/**
 * The one place QueryClient settings are defined. The monolith and every
 * federated configuration (including F4-qc, where each remote gets its own
 * QueryClient) use exactly these values, so cache behaviour is identical
 * across all builds being compared.
 *
 * Chosen for repeatable measurements, not for production:
 * - no retries: a failed request fails the run instead of adding hidden
 *   extra requests and time;
 * - no refetch on window focus or reconnect: nothing refetches unless the
 *   scripted journey causes it;
 * - a fixed staleTime, so revisiting a page within a journey reads from the
 *   cache the same way in every configuration.
 */
export const queryClientDefaults = {
  queries: {
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  },
  mutations: {
    retry: false,
  },
} as const satisfies DefaultOptions

export function createQueryClient(): QueryClient {
  return new QueryClient({ defaultOptions: queryClientDefaults })
}
