import type { Database, Enums, Tables } from './database.ts'

// Generated from the Supabase schema by `pnpm db:types`. Do not edit
// database.ts by hand; change the migration and regenerate.
export type {
  CompositeTypes,
  Database,
  Enums,
  Json,
  Tables,
  TablesInsert,
  TablesUpdate,
} from './database.ts'
export { Constants } from './database.ts'

export type { AppSupabaseClient, FeatureProps } from './feature.ts'

// Short names for table rows, e.g. `Venue` instead of `Tables<'venues'>`.
export type Profile = Tables<'profiles'>
export type Venue = Tables<'venues'>
export type Service = Tables<'services'>
export type Staff = Tables<'staff'>
export type Availability = Tables<'availability'>
export type Booking = Tables<'bookings'>
export type Payment = Tables<'payments'>

export type UserRole = Enums<'user_role'>
export type VenueCategory = Enums<'venue_category'>
export type BookingStatus = Enums<'booking_status'>
export type PaymentStatus = Enums<'payment_status'>

// One row returned by the get_available_slots RPC.
export type AvailableSlot =
  Database['public']['Functions']['get_available_slots']['Returns'][number]
