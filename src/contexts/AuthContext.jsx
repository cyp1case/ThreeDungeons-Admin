import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)
const AUTH_LOAD_TIMEOUT_MS = 5000
const FETCH_PROFILE_TIMEOUT_MS = 10000

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const timeout = setTimeout(() => {
      if (cancelled) return
      console.log('[Auth] 5s timeout fired')
      setSession(null)
      setProfile(null)
      setLoading(false)
    }, AUTH_LOAD_TIMEOUT_MS)

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (cancelled) return
        clearTimeout(timeout)
        console.log('[Auth] getSession resolved', session?.user?.email ?? 'null')
        setSession(session)
        if (session) fetchProfile(session.user.id)
        else setLoading(false)
      })
      .catch((err) => {
        if (cancelled) return
        clearTimeout(timeout)
        console.log('[Auth] getSession error', err)
        setSession(null)
        setProfile(null)
        setLoading(false)
      })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[Auth] onAuthStateChange', event, session?.user?.email ?? 'null')
      if (session) clearTimeout(timeout)
      setSession(session)
      if (session) {
        setLoading(true)
        await fetchProfile(session.user.id)
      } else {
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
    console.log('[Auth] fetchProfile start', userId)
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('fetchProfile timeout')), FETCH_PROFILE_TIMEOUT_MS)
    )
    try {
      const { data, error } = await Promise.race([
        supabase.from('profiles').select('id, email, role, program_id').eq('id', userId).single(),
        timeout,
      ])
      if (error) {
        console.log('[Auth] fetchProfile error', error.message, error.code)
        setProfile(null)
        await supabase.auth.signOut()
        return
      }
      console.log('[Auth] fetchProfile success', data?.email, data?.role)
      setProfile(data)
    } catch (err) {
      console.log('[Auth] fetchProfile error', err?.message ?? err)
      setProfile(null)
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
