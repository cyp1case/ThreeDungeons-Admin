import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

function formatModuleId(id) {
  return id
    .replace(/^CE_Q\d+_/, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export function DashboardPage() {
  const { profile, isSuperAdmin } = useAuth()
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState({ total: 0, active: 0 })
  const [matrix, setMatrix] = useState([])
  const [modules, setModules] = useState([])

  useEffect(() => {
    if (!profile?.program_id) {
      setLoading(false)
      return
    }

    async function fetchData() {
      setLoading(true)
      const programId = profile.program_id

      const { data: residents } = await supabase
        .from('residents')
        .select('id, active')
        .eq('program_id', programId)

      const total = residents?.length ?? 0
      const active = residents?.filter((r) => r.active).length ?? 0
      setSummary({ total, active })

      const { data: attempts } = await supabase
        .from('attempts')
        .select('resident_id, module_id, outcome')
        .eq('program_id', programId)

      const { data: cohorts } = await supabase
        .from('cohorts')
        .select('id, name')
        .eq('program_id', programId)

      const { data: residentCohorts } = await supabase
        .from('resident_cohorts')
        .select('resident_id, cohort_id')

      const moduleIds = [...new Set(attempts?.map((a) => a.module_id) ?? [])]
      setModules(moduleIds)

      const correctByResidentModule = {}
      attempts?.forEach((a) => {
        const key = `${a.resident_id}:${a.module_id}`
        if (a.outcome === 'correct') correctByResidentModule[key] = true
      })

      const cohortResidents = {}
      residentCohorts?.forEach((rc) => {
        if (!cohortResidents[rc.cohort_id]) cohortResidents[rc.cohort_id] = new Set()
        cohortResidents[rc.cohort_id].add(rc.resident_id)
      })

      const rows = []
      cohorts?.forEach((c) => {
        const residentsInCohort = cohortResidents[c.id] ?? new Set()
        const row = { cohort: c.name, cohortId: c.id, cells: {} }
        moduleIds.forEach((mod) => {
          const completed = [...residentsInCohort].filter(
            (rid) => correctByResidentModule[`${rid}:${mod}`]
          ).length
          const pct =
            residentsInCohort.size > 0
              ? Math.round((completed / residentsInCohort.size) * 100)
              : 0
          row.cells[mod] = pct
        })
        rows.push(row)
      })

      const allResidents = new Set(residents?.map((r) => r.id) ?? [])
      const allRow = { cohort: 'All Residents', cohortId: null, cells: {} }
      moduleIds.forEach((mod) => {
        const completed = [...allResidents].filter(
          (rid) => correctByResidentModule[`${rid}:${mod}`]
        ).length
        const pct =
          allResidents.size > 0
            ? Math.round((completed / allResidents.size) * 100)
            : 0
        allRow.cells[mod] = pct
      })
      rows.push(allRow)

      setMatrix(rows)
      setLoading(false)
    }

    fetchData()
  }, [profile])

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-primary-700 rounded-full animate-spin" />
      </div>
    )
  }

  const avgCompletion =
    matrix.length > 0 && modules.length > 0
      ? Math.round(
          matrix
            .filter((r) => r.cohort === 'All Residents')
            .flatMap((r) => Object.values(r.cells))
            .reduce((a, b) => a + b, 0) / modules.length
        )
      : 0

  return (
    <>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Dashboard</h1>

      {!profile?.program_id && isSuperAdmin() ? (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <p className="text-gray-500 text-sm py-12 text-center">
            Create and manage programs from the{' '}
            <Link to="/admin/programs" className="text-primary-600 hover:underline">
              Programs
            </Link>{' '}
            page.
          </p>
        </div>
      ) : summary.total === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <p className="text-gray-500 text-sm py-12 text-center">
            No residents yet. Add residents from the{' '}
            <Link to="/residents" className="text-primary-600 hover:underline">
              Residents
            </Link>{' '}
            page.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <p className="text-sm text-gray-500 font-medium">Total Residents</p>
              <p className="text-2xl font-semibold text-gray-900">{summary.total}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4">
              <p className="text-sm text-gray-500 font-medium">Active Residents</p>
              <p className="text-2xl font-semibold text-gray-900">{summary.active}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4">
              <p className="text-sm text-gray-500 font-medium">Avg Completion</p>
              <p className="text-2xl font-semibold text-gray-900">{avgCompletion}%</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Completion by Cohort
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                  <tr>
                    <th className="px-4 py-3">Cohort</th>
                    {modules.map((mod) => (
                      <th key={mod} className="px-4 py-3">
                        {formatModuleId(mod)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {matrix.map((row) => (
                    <tr key={row.cohort} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {row.cohort}
                      </td>
                      {modules.map((mod) => {
                        const pct = row.cells[mod] ?? 0
                        const badgeClass =
                          pct >= 80
                            ? 'bg-green-100 text-green-800'
                            : pct >= 50
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
                        return (
                          <td key={mod} className="px-4 py-3">
                            <span
                              className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${badgeClass}`}
                            >
                              {pct}%
                            </span>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </>
  )
}
