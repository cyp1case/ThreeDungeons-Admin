/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

const STORAGE_KEY = 'threedungeons-selected-program'

const SelectedProgramContext = createContext(null)

export function SelectedProgramProvider({ children }) {
  const { profile, isSuperAdmin } = useAuth()
  const [programs, setPrograms] = useState([])
  const [selectedProgramId, setSelectedProgramIdState] = useState(null)

  const isSuper = isSuperAdmin()

  useEffect(() => {
    if (!isSuper) return
    let cancelled = false
    supabase
      .from('programs')
      .select('id, name')
      .order('name')
      .then(({ data }) => {
        if (!cancelled && data) {
          setPrograms(data)
          const stored = localStorage.getItem(STORAGE_KEY)
          const validStored = stored && data.some((p) => p.id === stored)
          if (validStored) {
            setSelectedProgramIdState(stored)
          } else if (data.length > 0) {
            const first = data[0].id
            setSelectedProgramIdState(first)
            localStorage.setItem(STORAGE_KEY, first)
          }
        }
      })
    return () => { cancelled = true }
  }, [isSuper])

  function setSelectedProgramId(id) {
    const val = id || null
    setSelectedProgramIdState(val)
    if (val) localStorage.setItem(STORAGE_KEY, val)
    else localStorage.removeItem(STORAGE_KEY)
  }

  const effectiveProgramId = isSuper ? selectedProgramId : profile?.program_id ?? null

  return (
    <SelectedProgramContext.Provider
      value={{ programs, selectedProgramId, setSelectedProgramId, effectiveProgramId }}
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
