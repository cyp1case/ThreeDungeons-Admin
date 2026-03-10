import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Legend, ResponsiveContainer } from 'recharts'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { DUNGEONS } from '../lib/dungeonConfig'
import {
  getCohortDungeonMetrics,
  getResidentDungeonProgress,
} from '../lib/dungeonProgress'
import { Card } from '../components/Card'
import { CardTitle } from '../components/CardTitle'
import { SummaryCard } from '../components/SummaryCard'
import { CompletionBadge } from '../components/CompletionBadge'
import { ProgressBar } from '../components/ProgressBar'
import { CHART_COLORS } from '../lib/chartTheme'

export function CohortDetailPage() {
  const { id } = useParams()
  const { profile } = useAuth()
  const [cohort, setCohort] = useState(null)
  const [residents, setResidents] = useState([])
  const [attempts, setAttempts] = useState([])
  const [loading, setLoading] = useState(true)

  async function fetchData() {
    setLoading(true)
    const { data: cohortData } = await supabase
      .from('cohorts')
      .select('*')
      .eq('id', id)
      .eq('program_id', profile.program_id)
      .single()
    setCohort(cohortData)

    const { data: rcData } = await supabase
      .from('resident_cohorts')
      .select('resident_id')
      .eq('cohort_id', id)
    const residentIds = rcData?.map((r) => r.resident_id) ?? []

    const { data: residentsData } = await supabase
      .from('residents')
      .select('id, display_name, email')
      .in('id', residentIds)
    setResidents(residentsData ?? [])

    const { data: attemptsData } = await supabase
      .from('attempts')
      .select('resident_id, module_id, outcome')
      .eq('program_id', profile.program_id)
      .in('resident_id', residentIds)
    setAttempts(attemptsData ?? [])
    setLoading(false)
  }

  useEffect(() => {
    if (!id || !profile?.program_id) return
    fetchData() // eslint-disable-line react-hooks/set-state-in-effect -- data fetch
  }, [id, profile?.program_id]) // eslint-disable-line react-hooks/exhaustive-deps -- fetch helper intentionally stable for this route

  if (loading && !cohort) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-border-dark border-t-royal-blue rounded-full animate-spin" />
      </div>
    )
  }

  if (!cohort) {
    return (
      <div className="bg-surface-card border-2 border-border-dark rounded-sm p-6">
        <p className="text-text-muted">Cohort not found.</p>
        <Link to="/cohorts" className="text-royal-blue-light hover:underline mt-2 inline-block">
          Back to Cohorts
        </Link>
      </div>
    )
  }

  const residentIds = new Set(residents.map((r) => r.id))
  const cohortMetrics = getCohortDungeonMetrics(residentIds, attempts, DUNGEONS)

  const avgCompletion =
    cohortMetrics.length > 0
      ? Math.round(
          cohortMetrics.reduce((a, m) => a + m.completionPct, 0) / cohortMetrics.length
        )
      : 0

  const avgWrong =
    cohortMetrics.length > 0
      ? Math.round(
          cohortMetrics.reduce((a, m) => a + m.wrongPct, 0) / cohortMetrics.length
        )
      : 0

  const barData = cohortMetrics.map((m) => ({
    dungeon: m.dungeonName.replace(/^The /, '').split(' ')[0],
    completion: m.completionPct,
    wrong: m.wrongPct,
  }))

  const residentRows = residents.map((r) => {
    const residentAttempts = attempts.filter((a) => a.resident_id === r.id)
    const progress = getResidentDungeonProgress(residentAttempts, DUNGEONS, r.id)
    const overallPct =
      progress.length > 0
        ? Math.round(
            progress.reduce((a, p) => a + p.completionPct, 0) / progress.length
          )
        : 0
    const byDungeon = Object.fromEntries(
      progress.map((p) => [p.dungeonId, p.completionPct])
    )
    return {
      id: r.id,
      name: r.display_name || r.email,
      overallPct,
      byDungeon,
    }
  })

  return (
    <>
      <nav className="text-xs text-text-muted mb-4">
        <Link to="/cohorts" className="text-royal-blue-light hover:text-text-bright">
          Cohorts
        </Link>
        <span className="mx-2">/</span>
        <span className="text-text-primary">{cohort.name}</span>
      </nav>

      <h1
        className="font-pixel text-sm text-flag-yellow mb-6"
        style={{ textShadow: '0 0 12px rgba(244,196,48,0.3)' }}
      >
        {cohort.name}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <SummaryCard label="Members" value={residents.length} color="blue" />
        <SummaryCard
          label="Avg Completion"
          value={`${avgCompletion}%`}
          color="yellow"
        />
        <SummaryCard
          label="Avg Wrong Rate"
          value={`${avgWrong}%`}
          subtitle="Questions with wrong"
          color="red"
        />
      </div>

      <Card className="mb-6">
        <CardTitle>DUNGEON PROGRESS</CardTitle>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData}>
              <CartesianGrid stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="dungeon" tick={{ fill: '#9098A8', fontSize: 10 }} />
              <YAxis
                domain={[0, 100]}
                tickFormatter={(v) => `${v}%`}
                tick={{ fill: '#9098A8', fontSize: 10 }}
              />
              <Bar
                dataKey="completion"
                fill={CHART_COLORS.royalBlue}
                name="Completion %"
              />
              <Bar dataKey="wrong" fill={CHART_COLORS.roofRed} name="Wrong %" />
              <Legend />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card>
        <CardTitle>RESIDENTS</CardTitle>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-text-primary">
            <thead className="text-[10px] text-text-muted uppercase tracking-wider bg-surface-inner font-bold">
              <tr>
                <th className="px-3.5 py-2.5">Name</th>
                <th className="px-3.5 py-2.5">Overall %</th>
                {DUNGEONS.map((d) => (
                  <th key={d.id} className="px-3.5 py-2.5">
                    {d.name.replace(/^The /, '').split(' ')[0]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {residentRows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-border-dark hover:bg-[rgba(29,59,142,0.1)]"
                >
                  <td className="px-3.5 py-2.5">
                    <Link
                      to={`/residents/${row.id}`}
                      className="text-text-primary hover:text-text-bright font-semibold"
                    >
                      {row.name}
                    </Link>
                  </td>
                  <td className="px-3.5 py-2.5">
                    <CompletionBadge pct={row.overallPct} />
                  </td>
                  {DUNGEONS.map((d) => (
                    <td key={d.id} className="px-3.5 py-2.5">
                      <div className="w-24">
                        <ProgressBar
                          pct={row.byDungeon[d.id] ?? 0}
                          className="!h-2"
                        />
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  )
}
