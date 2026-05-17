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

    const fetchProfile = async (user) => {
      if (!user) {
        if (mounted) {
          setProfile(null)
          setProfileLoading(false)
        }
        return
      }
      setProfileLoading(true)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()
      
      if (!mounted) return
      
      if (error) console.error('Profile fetch failed:', error)
      setProfile(data ?? null)
      setProfileLoading(false)
    }

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return
      setSession(session)
      await fetchProfile(session?.user)
      if (mounted) setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return
        if (event === 'INITIAL_SESSION') return // Handled by getSession above

        setSession(session)
        await fetchProfile(session?.user)
        if (mounted) setLoading(false)
      }
    )

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
