import path from 'node:path'

/** Seeded test accounts (supabase/seed.sql). */
export const users = {
  customer: {
    email: 'customer@example.com',
    password: 'password123',
    name: 'Test Customer',
    storageState: path.join(import.meta.dirname, '../.auth/customer.json'),
  },
  merchant: {
    email: 'merchant@example.com',
    password: 'password123',
    name: 'Test Merchant',
    storageState: path.join(import.meta.dirname, '../.auth/merchant.json'),
  },
} as const

export type Role = keyof typeof users

/** A browser state with nobody signed in. */
export const signedOut = { cookies: [], origins: [] }
