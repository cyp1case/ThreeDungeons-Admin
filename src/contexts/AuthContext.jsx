import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)
const AUTH_LOAD_TIMEOUT_MS = 5000

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const timeout = setTimeout(() => {
      if (cancelled) return
      setSession(null)
      setProfile(null)
      setLoading(false)
    }, AUTH_LOAD_TIMEOUT_MS)

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (cancelled) return
        clearTimeout(timeout)
        setSession(session)
        if (session) fetchProfile(session.user.id)
        else setLoading(false)
      })
      .catch(() => {
        if (cancelled) return
        clearTimeout(timeout)
        setSession(null)
        setProfile(null)
        setLoading(false)
      })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session)
      if (session) await fetchProfile(session.user.id)
      else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => {
      cancelled = true
      clearTimeout(timeout)
      subscription.unsubscribe()
    }
  }, [])

  async function fetchProfile(userId) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, role, program_id')
        .eq('id', userId)
        .single()
      if (error) {
        setProfile(null)
        setLoading(false)
        await supabase.auth.signOut()
        return
      }
      setProfile(data)
    } finally {
      setLoading(false)
    }
  }

  async function refetchProfile() {
    const session = (await supabase.auth.getSession()).data.session
    if (session) await fetchProfile(session.user.id)
  }

  const isSuperAdmin = () => {
    const email = import.meta.env.VITE_SUPER_ADMIN_EMAIL
    return profile?.role === 'super_admin' || (email && profile?.email === email)
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        profile,
        loading,
        isSuperAdmin,
        signOut,
        refetchProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
