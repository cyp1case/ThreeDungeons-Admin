import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const initialised = useRef(false)

  useEffect(() => {
    let cancelled = false

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[Auth] onAuthStateChange', event, session?.user?.email ?? 'null')

        if (event === 'INITIAL_SESSION') {
          // Client is fully ready (token refresh complete). Safe to make API calls.
          initialised.current = true
          setSession(session)
          if (session) {
            await fetchProfile(session.user.id)
          } else {
            setLoading(false)
          }
          return
        }

        if (event === 'SIGNED_IN') {
          // On page load with stored creds, SIGNED_IN fires before INITIAL_SESSION
          // while the client is still refreshing tokens. Skip it — INITIAL_SESSION
          // will handle it. For fresh logins, initialised is already true.
          if (!initialised.current) return
          setSession(session)
          if (session) await fetchProfile(session.user.id)
          return
        }

        if (event === 'SIGNED_OUT') {
          setSession(null)
          setProfile(null)
          setLoading(false)
          return
        }

        if (event === 'TOKEN_REFRESHED') {
          setSession(session)
        }
      }
    )

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }

    async function fetchProfile(userId) {
      if (cancelled) return
      console.log('[Auth] fetchProfile start', userId)
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, email, role, program_id')
          .eq('id', userId)
          .single()
        if (cancelled) return
        if (error) {
          console.log('[Auth] fetchProfile error', error.message, error.code)
          setProfile(null)
          await supabase.auth.signOut()
          return
        }
        console.log('[Auth] fetchProfile success', data?.email, data?.role)
        setProfile(data)
      } catch (err) {
        console.log('[Auth] fetchProfile error', err)
        if (!cancelled) setProfile(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
  }, [])

  async function refetchProfile() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, role, program_id')
        .eq('id', session.user.id)
        .single()
      if (error) throw error
      setProfile(data)
    } finally {
      setLoading(false)
    }
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
      value={{ session, profile, loading, isSuperAdmin, signOut, refetchProfile }}
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
