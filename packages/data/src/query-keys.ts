/**
 * Query keys for every feature, kept in one place so features that read the
 * same data share cache entries. Filled in as features are built.
 */
export const queryKeys = {
  all: ['thesis'] as const,
}
