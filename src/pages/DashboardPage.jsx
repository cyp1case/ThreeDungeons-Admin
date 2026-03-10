import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  ResponsiveContainer,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Bar,
} from 'recharts'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { DUNGEONS } from '../lib/dungeonConfig'
import { getCohortDungeonMetrics, getResidentDungeonProgress } from '../lib/dungeonProgress'
import { Card } from '../components/Card'
import { CardTitle } from '../components/CardTitle'
import { SummaryCard } from '../components/SummaryCard'
import { CompletionBadge } from '../components/CompletionBadge'
import { ProgressBar } from '../components/ProgressBar'
import { CHART_COLORS } from '../lib/chartTheme'

const COHORT_COLORS = [CHART_COLORS.royalBlue, CHART_COLORS.fantasyGreen, CHART_COLORS.flagYellow, CHART_COLORS.roofRed]

export function DashboardPage() {
  const { profile, profileLoading, isSuperAdmin } = useAuth()
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState({ total: 0, active: 0 })
  const [matrix, setMatrix] = useState([])
  const [modules, setModules] = useState([])
  const [residents, setResidents] = useState([])
  const [attempts, setAttempts] = useState([])
  const [cohortCount, setCohortCount] = useState(0)

  useEffect(() => {
    if (profileLoading) return
    if (!profile?.program_id) {
      setLoading(false)
      return
    }

    async function fetchData() {
      setLoading(true)
      const programId = profile.program_id

      const { data: residentsData } = await supabase
        .from('residents')
        .select('id, active, display_name, email')
        .eq('program_id', programId)

      setResidents(residentsData ?? [])

      const total = residentsData?.length ?? 0
      const active = residentsData?.filter((r) => r.active).length ?? 0
      setSummary({ total, active })

      const { data: attemptsData } = await supabase
        .from('attempts')
        .select('resident_id, module_id, outcome')
        .eq('program_id', programId)

      setAttempts(attemptsData ?? [])

      const { data: cohorts } = await supabase
        .from('cohorts')
        .select('id, name')
        .eq('program_id', programId)

      setCohortCount(cohorts?.length ?? 0)

      const { data: residentCohorts } = await supabase
        .from('resident_cohorts')
        .select('resident_id, cohort_id')

      const cohortResidents = {}
      residentCohorts?.forEach((rc) => {
        if (!cohortResidents[rc.cohort_id]) cohortResidents[rc.cohort_id] = new Set()
        cohortResidents[rc.cohort_id].add(rc.resident_id)
      })

      const allResidentIds = new Set(residentsData?.map((r) => r.id) ?? [])
      setModules(DUNGEONS)

      const rows = []
      cohorts?.forEach((c) => {
        const residentsInCohort = cohortResidents[c.id] ?? new Set()
        const metrics = getCohortDungeonMetrics(residentsInCohort, attemptsData ?? [], DUNGEONS)
        rows.push({
          cohort: c.name,
          cohortId: c.id,
          cells: Object.fromEntries(
            metrics.map((m) => [m.dungeonId, { completionPct: m.completionPct, wrongPct: m.wrongPct }])
          ),
        })
      })

      const allMetrics = getCohortDungeonMetrics(allResidentIds, attemptsData ?? [], DUNGEONS)
      rows.push({
        cohort: 'All Residents',
        cohortId: null,
        cells: Object.fromEntries(
          allMetrics.map((m) => [m.dungeonId, { completionPct: m.completionPct, wrongPct: m.wrongPct }])
        ),
      })

      setMatrix(rows)
      setLoading(false)
    }

    fetchData()
  }, [profile, profileLoading])

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-border-dark border-t-royal-blue rounded-full animate-spin" />
      </div>
    )
  }

  const allRow = matrix.find((r) => r.cohort === 'All Residents')
  const avgCompletion =
    allRow && modules.length > 0
      ? Math.round(
          Object.values(allRow.cells).reduce((a, c) => a + (c?.completionPct ?? 0), 0) / modules.length
        )
      : 0

  const avgWrong =
    allRow && modules.length > 0
      ? Math.round(
          Object.values(allRow.cells).reduce((a, c) => a + (c?.wrongPct ?? 0), 0) / modules.length
        )
      : 0

  const activeRate = summary.total > 0 ? Math.round((summary.active / summary.total) * 100) : 0

  const radarData =
    allRow && modules.length > 0
      ? modules.map((d) => {
          const cell = allRow.cells[d.id] ?? {}
          return {
            topic: `${d.topic} (${d.name.replace(/^The /, '')})`,
            completion: cell.completionPct ?? 0,
            wrong: cell.wrongPct ?? 0,
          }
        })
      : []

  const cohortBarData =
    modules.length > 0 && matrix.length > 1
      ? modules.map((d) => {
          const obj = { dungeon: d.name.replace(/^The /, '').split(' ')[0] }
          matrix
            .filter((r) => r.cohort !== 'All Residents')
            .forEach((row) => {
              const cell = row.cells[d.id] ?? {}
              obj[row.cohort] = cell.completionPct ?? 0
            })
          return obj
        })
      : []

  const leaderboard = (() => {
    const list = residents
      .filter((r) => r.active)
      .map((r) => {
        const residentAttempts = attempts.filter((a) => a.resident_id === r.id)
        const progress = getResidentDungeonProgress(residentAttempts, DUNGEONS, r.id)
        const pct =
          progress.length > 0
            ? Math.round(
                progress.reduce((a, p) => a + p.completionPct, 0) / progress.length
              )
            : 0
        return {
          id: r.id,
          name: r.display_name || r.email,
          pct,
        }
      })
      .filter((e) => e.pct > 0)
      .sort((a, b) => b.pct - a.pct)
      .slice(0, 5)
    return list
  })()

  return (
    <>
      <h1
        className="font-pixel text-base text-flag-yellow mb-7"
        style={{ textShadow: '0 0 12px rgba(244,196,48,0.3)' }}
      >
        DASHBOARD
      </h1>
      <p className="text-text-muted text-sm -mt-5 mb-7">
        Overview of resident progress across cohorts and dungeons.
      </p>

      {!profile?.program_id && isSuperAdmin() ? (
        <div className="bg-surface-card border-2 border-border-dark rounded-sm p-6">
          <p className="text-text-muted text-sm py-12 text-center">
            Create and manage programs from the{' '}
            <Link to="/admin/programs" className="text-royal-blue-light hover:underline">
              Programs
            </Link>{' '}
            page.
          </p>
        </div>
      ) : summary.total === 0 ? (
        <div className="bg-surface-card border-2 border-border-dark rounded-sm p-6">
          <p className="text-text-muted text-sm py-12 text-center">
            No residents yet. Add residents from the{' '}
            <Link to="/residents" className="text-royal-blue-light hover:underline">
              Residents
            </Link>{' '}
            page.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <SummaryCard
              label="Total Residents"
              value={summary.total}
              subtitle={`Across ${cohortCount} cohorts`}
              color="blue"
            />
            <SummaryCard
              label="Active Residents"
              value={summary.active}
              subtitle={`${activeRate}% active rate`}
              color="green"
            />
            <SummaryCard
              label="Avg Completion"
              value={`${avgCompletion}%`}
              subtitle="Across all dungeons"
              color="yellow"
            />
            <SummaryCard
              label="Avg Wrong Rate"
              value={`${avgWrong}%`}
              subtitle="Questions with wrong"
              color="red"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <Card>
              <CardTitle>DUNGEON PROGRESS</CardTitle>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="rgba(255,255,255,0.06)" />
                    <PolarAngleAxis dataKey="topic" tick={{ fill: '#AAAACC', fontSize: 10 }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#9098A8', fontSize: 10 }} />
                    <Radar
                      name="Completion %"
                      dataKey="completion"
                      stroke="#3366CC"
                      fill="rgba(51,102,204,0.12)"
                    />
                    <Radar name="Wrong %" dataKey="wrong" stroke="#D32F23" fill="rgba(211,47,35,0.08)" />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </Card>
            <Card>
              <CardTitle>COHORT COMPARISON</CardTitle>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={cohortBarData}>
                    <CartesianGrid stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="dungeon" tick={{ fill: '#9098A8', fontSize: 10 }} />
                    <YAxis
                      domain={[0, 100]}
                      tickFormatter={(v) => `${v}%`}
                      tick={{ fill: '#9098A8', fontSize: 10 }}
                    />
                    {matrix
                      .filter((r) => r.cohort !== 'All Residents')
                      .map((row, i) => (
                        <Bar
                          key={row.cohort}
                          dataKey={row.cohort}
                          fill={COHORT_COLORS[i % COHORT_COLORS.length]}
                          name={row.cohort}
                        />
                      ))}
                    <Legend />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardTitle>COMPLETION MATRIX</CardTitle>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-text-primary">
                  <thead className="text-[10px] text-text-muted uppercase tracking-wider bg-surface-inner font-bold">
                    <tr>
                      <th className="px-3.5 py-2.5">Cohort</th>
                      {modules.map((d) => (
                        <th key={d.id} className="px-3.5 py-2.5">
                          {d.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {matrix.map((row) => (
                      <tr key={row.cohort} className="border-b border-border-dark hover:bg-[rgba(29,59,142,0.1)]">
                        <td
                          className={`px-3.5 py-2.5 font-bold ${
                            row.cohort === 'All Residents' ? 'text-flag-yellow' : 'text-text-bright'
                          }`}
                        >
                          {row.cohort}
                        </td>
                        {modules.map((d) => {
                          const cell = row.cells[d.id] ?? {}
                          const pct = cell.completionPct ?? 0
                          const wrongPct = cell.wrongPct ?? 0
                          return (
                            <td key={d.id} className="px-3.5 py-2.5">
                              <div>
                                <CompletionBadge pct={pct} />
                                <p className="text-[10px] text-text-muted mt-1">{wrongPct}% wrong</p>
                              </div>
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
            <Card>
              <CardTitle>LEADERBOARD</CardTitle>
              <p className="text-[10px] uppercase tracking-[1.5px] font-bold text-text-muted mb-3">
                Top residents by overall completion
              </p>
              {leaderboard.length === 0 ? (
                <p className="text-text-muted text-sm py-4">No completion data yet.</p>
              ) : (
                leaderboard.map((entry, i) => (
                  <div
                    key={entry.id}
                    className="flex items-center gap-3.5 py-2.5 border-b border-border-dark last:border-b-0"
                  >
                    <div
                      className={`w-9 h-9 flex items-center justify-center font-pixel text-[10px] rounded-sm border-2 ${
                        i === 0
                          ? 'bg-gradient-to-br from-flag-yellow to-[#B8941E] text-surface-sidebar border-flag-yellow shadow-[0_0_12px_rgba(244,196,48,0.3)]'
                          : i === 1
                            ? 'bg-gradient-to-br from-[#B0B0B0] to-[#808080] text-surface-sidebar border-[#999] shadow-[0_0_8px_rgba(180,180,180,0.3)]'
                            : i === 2
                              ? 'bg-gradient-to-br from-[#CD7F32] to-[#8B5A20] text-surface-sidebar border-[#CD7F32] shadow-[0_0_8px_rgba(205,127,50,0.3)]'
                              : 'bg-surface-inner text-text-muted border-border-dark'
                      }`}
                    >
                      {i + 1}
                    </div>
                    <Link
                      to={`/residents/${entry.id}`}
                      className="flex-1 font-semibold text-sm text-text-primary hover:text-text-bright"
                    >
                      {entry.name}
                    </Link>
                    <span
                      className="font-pixel text-[10px] text-flag-yellow"
                      style={{ textShadow: '0 0 6px rgba(244,196,48,0.3)' }}
                    >
                      {entry.pct}%
                    </span>
                    <div className="w-[120px]">
                      <ProgressBar pct={entry.pct} color="blue" />
                    </div>
                  </div>
                ))
              )}
            </Card>
          </div>
        </>
      )}
    </>
  )
}
