/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

const INSPECT_PATH_REGEX = /^\/admin\/programs\/([^/]+)/

const SelectedProgramContext = createContext(null)

export function SelectedProgramProvider({ children }) {
  const { profile, isSuperAdmin } = useAuth()
  const location = useLocation()
  const [programName, setProgramName] = useState(null)
  const [programLoading, setProgramLoading] = useState(false)
  const [programExists, setProgramExists] = useState(true)

  const isSuper = isSuperAdmin()
  const programIdFromUrl = (location.pathname.match(INSPECT_PATH_REGEX) ?? [])[1]

  const effectiveProgramId = isSuper && programIdFromUrl
    ? programIdFromUrl
    : profile?.program_id ?? null

  const isInspecting = isSuper && !!programIdFromUrl

  useEffect(() => {
    if (!programIdFromUrl) {
      setProgramName(null)
      setProgramLoading(false)
      setProgramExists(true)
      return
    }
    let cancelled = false
    setProgramLoading(true)
    setProgramExists(true)
    supabase
      .from('programs')
      .select('name')
      .eq('id', programIdFromUrl)
      .single()
      .then(({ data, error }) => {
        if (cancelled) return
        if (error || !data) {
          setProgramName(null)
          setProgramExists(false)
          setProgramLoading(false)
          return
        }
        setProgramName(data.name)
        setProgramExists(true)
        setProgramLoading(false)
      })
    return () => { cancelled = true }
  }, [programIdFromUrl])

  const linkPrefix = isInspecting && effectiveProgramId
    ? `/admin/programs/${effectiveProgramId}`
    : ''

  return (
    <SelectedProgramContext.Provider
      value={{
        effectiveProgramId,
        programName: isInspecting ? programName : null,
        isInspecting,
        linkPrefix,
        programLoading,
        programExists,
      }}
    >
      {children}
    </SelectedProgramContext.Provider>
  )
}

export function useSelectedProgram() {
  const ctx = useContext(SelectedProgramContext)
  if (!ctx) throw new Error('useSelectedProgram must be used within SelectedProgramProvider')
  return ctx
}
