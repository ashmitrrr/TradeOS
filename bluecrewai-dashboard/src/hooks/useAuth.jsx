import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession]               = useState(null)
  const [profile, setProfile]               = useState(null)
  const [loading, setLoading]               = useState(true)   // true until session is resolved
  const [profileLoading, setProfileLoading] = useState(false)  // true while profile row is fetching

  useEffect(() => {
    let mounted = true

    // onAuthStateChange is the single source of truth for session + profile.
    // getSession() below is only used to unblock the loading state quickly when
    // there is no session (e.g. fresh visitor) before the INITIAL_SESSION event fires.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mounted) return

        setSession(session)

        if (session?.user) {
          setProfileLoading(true)
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle()

          if (!mounted) return

          if (error) {
            // Fetch error — keep profile as null but do NOT sign the user out.
            console.error('Profile fetch failed:', error)
          }
          // data is null when no row exists (new user) — that's correct, send to onboarding.
          setProfile(data ?? null)
          setProfileLoading(false)
        } else {
          setProfile(null)
          setProfileLoading(false)
        }

        if (mounted) setLoading(false)
      }
    )

    // Resolve the no-session case quickly so the spinner doesn't linger for
    // unauthenticated visitors waiting for the INITIAL_SESSION event.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return
      if (!session) {
        setSession(null)
        setLoading(false)
      }
      // If there IS a session, onAuthStateChange handles everything above.
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  async function refreshProfile() {
    if (!session?.user) return
    setProfileLoading(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .maybeSingle()
    if (error) console.error('Profile refresh failed:', error)
    else setProfile(data ?? null)
    setProfileLoading(false)
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ session, profile, loading, profileLoading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext)
}
