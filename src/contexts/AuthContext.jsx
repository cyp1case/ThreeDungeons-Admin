/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(false)
  const profileRequestIdRef = useRef(0)

  async function fetchProfile(userId, requestId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, role, program_id')
      .eq('id', userId)
      .single()
    if (profileRequestIdRef.current !== requestId) return
    if (error) {
      setProfile(null)
      setProfileLoading(false)
      return
    }
    setProfile(data)
    setProfileLoading(false)
  }

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        if (session) {
          const requestId = profileRequestIdRef.current + 1
          profileRequestIdRef.current = requestId
          setAuthLoading(false)
          setProfileLoading(true)
          // Supabase auth callbacks should not await more Supabase calls.
          setTimeout(() => {
            void fetchProfile(session.user.id, requestId)
          }, 0)
        } else {
          profileRequestIdRef.current += 1
          setProfile(null)
          setProfileLoading(false)
          setAuthLoading(false)
        }
      }
    )
    return () => subscription.unsubscribe()
  }, [])

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
        loading: authLoading,
        authLoading,
        profileLoading,
        isSuperAdmin,
        signOut,
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
