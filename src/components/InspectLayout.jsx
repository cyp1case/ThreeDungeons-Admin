import { useEffect, useState } from 'react'
import { Link, Outlet, useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export function InspectLayout() {
  const { programId } = useParams()
  const navigate = useNavigate()
  const [programName, setProgramName] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!programId) {
      setLoading(false)
      return
    }
    let cancelled = false
    supabase
      .from('programs')
      .select('id, name')
      .eq('id', programId)
      .single()
      .then(({ data, error }) => {
        if (cancelled) return
        if (error || !data) {
          navigate('/admin/programs', { replace: true })
          return
        }
        setProgramName(data.name)
        setLoading(false)
      })
    return () => { cancelled = true }
  }, [programId, navigate])

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-border-dark border-t-royal-blue rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <>
      <div className="sticky top-0 z-10 -mx-7 -mt-7 mb-6 px-7 py-3 bg-surface-card border-l-4 border-flag-yellow flex items-center justify-between gap-4">
        <span className="font-sans text-sm text-text-primary">
          Inspecting: <strong>{programName}</strong>
        </span>
        <Link
          to="/admin/programs"
          className="text-sm text-royal-blue-light hover:text-royal-blue hover:underline"
        >
          Back to Programs
        </Link>
      </div>
      <Outlet />
    </>
  )
}
