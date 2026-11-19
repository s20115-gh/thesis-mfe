import { QueryClient } from '@tanstack/react-query'

/**
 * The one place QueryClient settings are defined. The monolith and every
 * federated configuration use these values, so cache behaviour is identical
 * across all builds being compared.
 */
export const queryClientDefaults = {
  queries: {
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    retry: 1,
    refetchOnWindowFocus: false,
  },
} as const

export function createQueryClient(): QueryClient {
  return new QueryClient({ defaultOptions: queryClientDefaults })
}
