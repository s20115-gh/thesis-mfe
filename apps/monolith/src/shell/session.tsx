import type { Session, User } from '@supabase/supabase-js'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { AppSupabaseClient, Profile } from '@thesis/contracts'
import { queryKeys } from '@thesis/data'
import { createContext, use, useEffect, useMemo, useState, type ReactNode } from 'react'

type SessionStatus = 'loading' | 'signed-out' | 'signed-in'

type SessionValue = {
  supabase: AppSupabaseClient
  status: SessionStatus
  session: Session | null
  user: User | null
  /** Null while loading or when signed out. */
  profile: Profile | null
  /** Signs in and returns the profile, or an error message. */
  signIn: (email: string, password: string) => Promise<{ profile: Profile } | { error: string }>
  signOut: () => Promise<void>
}

const SessionContext = createContext<SessionValue | null>(null)

async function fetchProfile(supabase: AppSupabaseClient, userId: string): Promise<Profile> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single()
  if (error) throw error
  return data
}

/**
 * Owns the Supabase session for the app shell: who is signed in and their
 * profile (including role). Features do not use this context; they receive
 * the Supabase client in FeatureProps and read the session from it, so the
 * same feature code works inside a federated remote.
 */
export function SessionProvider({
  supabase,
  children,
}: {
  supabase: AppSupabaseClient
  children: ReactNode
}) {
  const queryClient = useQueryClient()
  const [session, setSession] = useState<Session | null>(null)
  const [authReady, setAuthReady] = useState(false)

  useEffect(() => {
    // Fires once straight away with the stored session (INITIAL_SESSION),
    // then on every sign-in, sign-out and token refresh.
    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next)
      setAuthReady(true)
    })
    return () => data.subscription.unsubscribe()
  }, [supabase])

  const userId = session?.user.id
  const profileQuery = useQuery({
    queryKey: queryKeys.profile.me(userId ?? 'none'),
    queryFn: () => fetchProfile(supabase, userId!),
    enabled: Boolean(userId),
    staleTime: Infinity,
  })

  const status: SessionStatus = !authReady
    ? 'loading'
    : !session
      ? 'signed-out'
      : profileQuery.isPending
        ? 'loading'
        : 'signed-in'

  const value = useMemo<SessionValue>(
    () => ({
      supabase,
      status,
      session,
      user: session?.user ?? null,
      profile: profileQuery.data ?? null,
      async signIn(email, password) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) return { error: error.message }
        const profile = await queryClient.fetchQuery({
          queryKey: queryKeys.profile.me(data.user.id),
          queryFn: () => fetchProfile(supabase, data.user.id),
          staleTime: Infinity,
        })
        return { profile }
      },
      async signOut() {
        await supabase.auth.signOut()
        // Drop every cached query so the next user never sees this user's data.
        queryClient.clear()
      },
    }),
    [supabase, status, session, profileQuery.data, queryClient],
  )

  return <SessionContext value={value}>{children}</SessionContext>
}

export function useSession(): SessionValue {
  const value = use(SessionContext)
  if (!value) throw new Error('useSession must be used inside <SessionProvider>')
  return value
}
