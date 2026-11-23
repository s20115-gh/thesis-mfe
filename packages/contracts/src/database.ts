export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      availability: {
        Row: {
          end_time: string
          id: string
          staff_id: string
          start_time: string
          weekday: number
        }
        ComputedFields: never
        Insert: {
          end_time: string
          id?: string
          staff_id: string
          start_time: string
          weekday: number
        }
        Update: {
          end_time?: string
          id?: string
          staff_id?: string
          start_time?: string
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: 'availability_staff_id_fkey'
            columns: ['staff_id']
            isOneToOne: false
            referencedRelation: 'staff'
            referencedColumns: ['id']
          },
        ]
      }
      bookings: {
        Row: {
          created_at: string
          customer_id: string
          ends_at: string
          id: string
          price_cents: number
          service_id: string
          staff_id: string
          starts_at: string
          status: Database['public']['Enums']['booking_status']
          venue_id: string
        }
        ComputedFields: never
        Insert: {
          created_at?: string
          customer_id: string
          ends_at: string
          id?: string
          price_cents: number
          service_id: string
          staff_id: string
          starts_at: string
          status?: Database['public']['Enums']['booking_status']
          venue_id: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          ends_at?: string
          id?: string
          price_cents?: number
          service_id?: string
          staff_id?: string
          starts_at?: string
          status?: Database['public']['Enums']['booking_status']
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'bookings_customer_id_fkey'
            columns: ['customer_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'bookings_service_id_fkey'
            columns: ['service_id']
            isOneToOne: false
            referencedRelation: 'services'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'bookings_staff_id_fkey'
            columns: ['staff_id']
            isOneToOne: false
            referencedRelation: 'staff'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'bookings_venue_id_fkey'
            columns: ['venue_id']
            isOneToOne: false
            referencedRelation: 'venues'
            referencedColumns: ['id']
          },
        ]
      }
      payments: {
        Row: {
          amount_cents: number
          booking_id: string
          created_at: string
          currency: string
          id: string
          provider: string
          provider_ref: string | null
          status: Database['public']['Enums']['payment_status']
        }
        ComputedFields: never
        Insert: {
          amount_cents: number
          booking_id: string
          created_at?: string
          currency?: string
          id?: string
          provider?: string
          provider_ref?: string | null
          status?: Database['public']['Enums']['payment_status']
        }
        Update: {
          amount_cents?: number
          booking_id?: string
          created_at?: string
          currency?: string
          id?: string
          provider?: string
          provider_ref?: string | null
          status?: Database['public']['Enums']['payment_status']
        }
        Relationships: [
          {
            foreignKeyName: 'payments_booking_id_fkey'
            columns: ['booking_id']
            isOneToOne: true
            referencedRelation: 'bookings'
            referencedColumns: ['id']
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          phone: string | null
          role: Database['public']['Enums']['user_role']
        }
        ComputedFields: never
        Insert: {
          created_at?: string
          full_name?: string
          id: string
          phone?: string | null
          role?: Database['public']['Enums']['user_role']
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          phone?: string | null
          role?: Database['public']['Enums']['user_role']
        }
        Relationships: []
      }
      services: {
        Row: {
          created_at: string
          currency: string
          description: string
          duration_minutes: number
          id: string
          is_active: boolean
          name: string
          price_cents: number
          venue_id: string
        }
        ComputedFields: never
        Insert: {
          created_at?: string
          currency?: string
          description?: string
          duration_minutes: number
          id?: string
          is_active?: boolean
          name: string
          price_cents: number
          venue_id: string
        }
        Update: {
          created_at?: string
          currency?: string
          description?: string
          duration_minutes?: number
          id?: string
          is_active?: boolean
          name?: string
          price_cents?: number
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'services_venue_id_fkey'
            columns: ['venue_id']
            isOneToOne: false
            referencedRelation: 'venues'
            referencedColumns: ['id']
          },
        ]
      }
      staff: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          title: string
          venue_id: string
        }
        ComputedFields: never
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          title?: string
          venue_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          title?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'staff_venue_id_fkey'
            columns: ['venue_id']
            isOneToOne: false
            referencedRelation: 'venues'
            referencedColumns: ['id']
          },
        ]
      }
      venues: {
        Row: {
          address: string
          category: Database['public']['Enums']['venue_category']
          city: string
          cover_image_url: string | null
          created_at: string
          description: string
          id: string
          name: string
          owner_id: string
          rating: number | null
          review_count: number
          slug: string
          timezone: string
        }
        ComputedFields: never
        Insert: {
          address?: string
          category: Database['public']['Enums']['venue_category']
          city: string
          cover_image_url?: string | null
          created_at?: string
          description?: string
          id?: string
          name: string
          owner_id: string
          rating?: number | null
          review_count?: number
          slug: string
          timezone?: string
        }
        Update: {
          address?: string
          category?: Database['public']['Enums']['venue_category']
          city?: string
          cover_image_url?: string | null
          created_at?: string
          description?: string
          id?: string
          name?: string
          owner_id?: string
          rating?: number | null
          review_count?: number
          slug?: string
          timezone?: string
        }
        Relationships: [
          {
            foreignKeyName: 'venues_owner_id_fkey'
            columns: ['owner_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_booking: {
        Args: { p_service_id: string; p_staff_id: string; p_starts_at: string }
        Returns: string
      }
      get_available_slots: {
        Args: { p_day: string; p_service_id: string }
        Returns: {
          staff_id: string
          starts_at: string
        }[]
      }
      is_merchant: { Args: Record<PropertyKey, never>; Returns: boolean }
      is_venue_owner: { Args: { p_venue_id: string }; Returns: boolean }
      like_escape: { Args: { p_text: string }; Returns: string }
      list_cities: {
        Args: Record<PropertyKey, never>
        Returns: {
          city: string
          venue_count: number
        }[]
      }
      mock_checkout: { Args: { p_booking_id: string }; Returns: string }
      search_venues: {
        Args: {
          p_category?: Database['public']['Enums']['venue_category']
          p_city?: string
          p_min_rating?: number
          p_sort?: string
          p_text?: string
        }
        Returns: {
          address: string
          category: Database['public']['Enums']['venue_category']
          city: string
          cover_image_url: string
          id: string
          min_price_cents: number
          name: string
          rating: number
          review_count: number
          service_count: number
          slug: string
        }[]
      }
    }
    Enums: {
      booking_status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'
      payment_status: 'pending' | 'succeeded' | 'failed' | 'refunded'
      user_role: 'customer' | 'merchant'
      venue_category: 'hair' | 'barber' | 'nails' | 'spa' | 'makeup'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema['CompositeTypes'] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      booking_status: ['pending', 'confirmed', 'completed', 'cancelled', 'no_show'],
      payment_status: ['pending', 'succeeded', 'failed', 'refunded'],
      user_role: ['customer', 'merchant'],
      venue_category: ['hair', 'barber', 'nails', 'spa', 'makeup'],
    },
  },
} as const
