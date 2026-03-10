import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { hashSync } from 'bcrypt-ts/browser'
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
import { useSelectedProgram } from '../contexts/SelectedProgramContext'
import { useToast } from '../contexts/ToastContext'
import { Modal } from 'flowbite-react'
import { DUNGEONS } from '../lib/dungeonConfig'
import {
  getResidentDungeonProgress,
  getResidentQuestionBreakdown,
} from '../lib/dungeonProgress'
import { Card } from '../components/Card'
import { CardTitle } from '../components/CardTitle'
import { StatusBadge } from '../components/StatusBadge'
import { ProgressBar } from '../components/ProgressBar'
import { CHART_COLORS } from '../lib/chartTheme'

function generatePassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let s = ''
  for (let i = 0; i < 8; i++) s += chars[Math.floor(Math.random() * chars.length)]
  return s
}

function formatModuleId(id) {
  return id
    .replace(/^CE_Q\d+_/, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function ResidentDetailPage() {
  const { id } = useParams()
  const { effectiveProgramId, linkPrefix, programName, isInspecting } = useSelectedProgram()
  const { showToast } = useToast()
  const [resident, setResident] = useState(null)
  const [cohorts, setCohorts] = useState([])
  const [attempts, setAttempts] = useState([])
  const [loading, setLoading] = useState(true)
  const [moduleFilter, setModuleFilter] = useState('')
  const [dateFilter, setDateFilter] = useState('all')
  const [selectedDungeonForChart, setSelectedDungeonForChart] = useState(DUNGEONS[0]?.id ?? '')
  const [resetModalOpen, setResetModalOpen] = useState(false)
  const [deactivateModalOpen, setDeactivateModalOpen] = useState(false)
  const [resetResultModal, setResetResultModal] = useState(null)

  async function fetchData() {
    setLoading(true)
    const { data: resData } = await supabase
      .from('residents')
      .select('*')
      .eq('id', id)
      .eq('program_id', effectiveProgramId)
      .single()
    setResident(resData)

    const { data: cohortData } = await supabase
      .from('resident_cohorts')
      .select('cohort_id')
      .eq('resident_id', id)
    const cohortIds = cohortData?.map((c) => c.cohort_id) ?? []
    const { data: cohortNames } = await supabase
      .from('cohorts')
      .select('name')
      .in('id', cohortIds)
    setCohorts(cohortNames?.map((c) => c.name) ?? [])

    const { data: attemptData } = await supabase
      .from('attempts')
      .select('*')
      .eq('resident_id', id)
      .order('created_at', { ascending: false })
    setAttempts(attemptData ?? [])
    setLoading(false)
  }

  useEffect(() => {
    if (!id || !effectiveProgramId) return
    fetchData() // eslint-disable-line react-hooks/set-state-in-effect -- data fetch
  }, [id, effectiveProgramId]) // eslint-disable-line react-hooks/exhaustive-deps -- fetch helper intentionally stable for this route

  const filteredAttempts = attempts.filter((a) => {
    if (moduleFilter && a.module_id !== moduleFilter) return false
    if (dateFilter !== 'all') {
      const d = new Date(a.created_at)
      const now = new Date()
      if (dateFilter === '7') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        if (d < weekAgo) return false
      } else if (dateFilter === '30') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        if (d < monthAgo) return false
      }
    }
    return true
  })

  const moduleIds = [...new Set(attempts.map((a) => a.module_id))]
  const dungeonProgress = getResidentDungeonProgress(attempts, DUNGEONS, id)

  const radarData =
    dungeonProgress.length > 0
      ? dungeonProgress.map((d) => ({
          topic: `${d.topic} (${d.dungeonName.replace(/^The /, '').split(' ')[0]})`,
          completion: d.completionPct,
          wrong: d.wrongPct,
        }))
      : []

  const selectedDungeon = DUNGEONS.find((d) => d.id === selectedDungeonForChart) ?? DUNGEONS[0]
  const questionBreakdown = selectedDungeon
    ? getResidentQuestionBreakdown(attempts, selectedDungeon, id)
    : []

  const overallCompletion =
    dungeonProgress.length > 0
      ? Math.round(
          dungeonProgress.reduce((a, p) => a + p.completionPct, 0) / dungeonProgress.length
        )
      : 0

  if (loading && !resident) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-border-dark border-t-royal-blue rounded-full animate-spin" />
      </div>
    )
  }

  if (!resident) {
    return (
      <div className="bg-surface-card border-2 border-border-dark rounded-sm p-6">
        <p className="text-text-muted">Resident not found.</p>
        <Link to={`${linkPrefix}/residents`} className="text-royal-blue-light hover:underline mt-2 inline-block">
          Back to Residents
        </Link>
      </div>
    )
  }

  return (
    <>
      <nav className="text-xs text-text-muted mb-4">
        <Link to={`${linkPrefix}/residents`} className="text-royal-blue-light hover:text-text-bright">
          Residents
        </Link>
        <span className="mx-2">/</span>
        <span className="text-text-primary">{resident.display_name || resident.email}</span>
      </nav>

      <h1
        className="font-pixel text-sm text-flag-yellow mb-6"
        style={{ textShadow: '0 0 12px rgba(244,196,48,0.3)' }}
      >
        {resident.display_name || resident.email}
      </h1>

      <div className="bg-surface-card border-2 border-border-dark rounded-sm p-6 mb-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-royal-blue to-transparent opacity-50" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 mb-4">
          <div>
            <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">
              Email:
            </span>
            <span className="text-sm text-text-primary font-semibold ml-2">{resident.email}</span>
          </div>
          <div>
            <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">
              Status:
            </span>
            <span className="ml-2">
              {resident.active ? (
                <StatusBadge outcome="correct">Active</StatusBadge>
              ) : (
                <span className="bg-[rgba(144,152,168,0.15)] text-text-muted border-2 border-border-accent rounded-sm px-2.5 py-0.5 text-xs font-bold">
                  Inactive
                </span>
              )}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">
              Cohorts:
            </span>
            <span className="text-sm text-text-primary font-semibold ml-2">
              {cohorts.join(', ') || '—'}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">
              Joined:
            </span>
            <span className="text-sm text-text-primary font-semibold ml-2">
              {formatDate(resident.created_at)}
            </span>
          </div>
        </div>
        <div className="mb-2">
          <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">
            Overall completion:
          </span>
          <span
            className="text-fantasy-green font-bold ml-2"
            style={{ textShadow: '0 0 8px rgba(92,161,54,0.3)' }}
          >
            {overallCompletion}%
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setResetModalOpen(true)}
            className="bg-transparent text-text-muted border-2 border-border-accent rounded-sm hover:text-text-bright uppercase tracking-wider text-xs font-bold px-4 py-2"
          >
            Reset Password
          </button>
          <button
            onClick={() => setDeactivateModalOpen(true)}
            className="bg-gradient-to-b from-roof-red-light to-roof-red border-2 border-[#A82518] rounded-sm text-white shadow-[0_0_8px_rgba(211,47,35,0.3)] uppercase tracking-wider text-xs font-bold px-4 py-2"
          >
            {resident.active ? 'Deactivate' : 'Activate'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {dungeonProgress.map((d) => (
          <div
            key={d.dungeonId}
            className="relative bg-surface-card border-2 border-border-dark rounded-sm p-4 text-center overflow-hidden shadow-[0_4px_12px_rgba(0,0,0,0.3)]"
          >
            <div
              className={`absolute top-0 left-0 right-0 h-0.5 ${
                d.completionPct >= 80
                  ? 'bg-fantasy-green shadow-[0_0_8px_rgba(92,161,54,0.3)]'
                  : d.completionPct >= 50
                    ? 'bg-flag-yellow shadow-[0_0_8px_rgba(244,196,48,0.3)]'
                    : 'bg-roof-red shadow-[0_0_8px_rgba(211,47,35,0.3)]'
              }`}
            />
            <p className="font-pixel text-[8px] text-text-bright leading-relaxed">
              {d.dungeonName.toUpperCase()}
            </p>
            <p className="text-[11px] text-text-muted mb-3">{d.topic}</p>
            <p
              className={`font-pixel text-lg ${
                d.completionPct >= 80
                  ? 'text-fantasy-green'
                  : d.completionPct >= 50
                    ? 'text-flag-yellow'
                    : 'text-roof-red'
              }`}
              style={{
                textShadow:
                  d.completionPct >= 80
                    ? '0 0 8px rgba(92,161,54,0.3)'
                    : d.completionPct >= 50
                      ? '0 0 8px rgba(244,196,48,0.3)'
                      : '0 0 8px rgba(211,47,35,0.3)',
              }}
            >
              {d.completionPct}%
            </p>
            <p className="text-xs text-text-muted">
              {d.completedQuestions} / {d.totalQuestions} complete
            </p>
            <p className="text-[11px] text-roof-red mt-1">{d.wrongPct}% wrong</p>
            <div className="mt-2">
              <ProgressBar pct={d.completionPct} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardTitle>PERFORMANCE RADAR</CardTitle>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.06)" />
                <PolarAngleAxis dataKey="topic" tick={{ fill: '#AAAACC', fontSize: 10 }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#9098A8', fontSize: 10 }} />
                <Radar
                  name="Completion %"
                  dataKey="completion"
                  stroke={CHART_COLORS.royalBlue}
                  fill="rgba(51,102,204,0.12)"
                />
                <Radar
                  name="Wrong %"
                  dataKey="wrong"
                  stroke={CHART_COLORS.roofRed}
                  fill="rgba(211,47,35,0.08)"
                />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <CardTitle>QUESTION BREAKDOWN</CardTitle>
          <select
            value={selectedDungeonForChart}
            onChange={(e) => setSelectedDungeonForChart(e.target.value)}
            className="mb-3 bg-surface-inner border-2 border-border-dark text-text-primary text-sm rounded-sm p-2.5 font-sans"
          >
            {DUNGEONS.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={questionBreakdown}
                layout="vertical"
                margin={{ left: 80, right: 20 }}
              >
                <CartesianGrid stroke="rgba(255,255,255,0.04)" />
                <XAxis type="number" tick={{ fill: '#9098A8', fontSize: 10 }} />
                <YAxis
                  type="category"
                  dataKey="label"
                  tick={{ fill: '#9098A8', fontSize: 9 }}
                  width={75}
                />
                <Bar dataKey="correct" stackId="a" fill={CHART_COLORS.fantasyGreen} name="Correct" />
                <Bar dataKey="wrong" stackId="a" fill={CHART_COLORS.roofRed} name="Wrong" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card>
        <CardTitle>ATTEMPT LOG</CardTitle>
        <div className="flex gap-4 mb-4 flex-wrap">
          <select
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            className="bg-surface-inner border-2 border-border-dark text-text-primary text-sm rounded-sm p-2.5 font-sans"
          >
            <option value="">All Modules</option>
            {moduleIds.map((m) => (
              <option key={m} value={m}>
                {formatModuleId(m)}
              </option>
            ))}
          </select>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="bg-surface-inner border-2 border-border-dark text-text-primary text-sm rounded-sm p-2.5 font-sans"
          >
            <option value="all">All time</option>
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
          </select>
        </div>
        {filteredAttempts.length === 0 ? (
          <p className="text-text-muted text-sm py-8 text-center">
            No attempts recorded yet. This resident hasn&apos;t played the game.
          </p>
        ) : (
          <table className="w-full text-sm text-left text-text-primary">
            <thead className="text-[10px] text-text-muted uppercase tracking-wider bg-surface-inner font-bold">
              <tr>
                <th className="px-3.5 py-2.5">Timestamp</th>
                <th className="px-3.5 py-2.5">Module</th>
                <th className="px-3.5 py-2.5">Action</th>
                <th className="px-3.5 py-2.5">Outcome</th>
              </tr>
            </thead>
            <tbody>
              {filteredAttempts.map((a) => (
                <tr key={a.id} className="border-b border-border-dark hover:bg-[rgba(29,59,142,0.1)]">
                  <td className="px-3.5 py-2.5 text-xs text-text-muted font-mono">
                    {formatDate(a.created_at)}
                  </td>
                  <td className="px-3.5 py-2.5 text-sm text-text-bright">
                    {formatModuleId(a.module_id)}
                  </td>
                  <td className="px-3.5 py-2.5 text-sm text-text-primary">
                    {formatModuleId(a.action)}
                  </td>
                  <td className="px-3.5 py-2.5">
                    <StatusBadge outcome={a.outcome === 'correct' ? 'correct' : 'incorrect'}>
                      {a.outcome === 'correct' ? 'Correct' : 'Incorrect'}
                    </StatusBadge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {resetModalOpen && (
        <ResetPasswordModal
          resident={resident}
          isInspecting={isInspecting}
          programName={programName}
          onClose={() => setResetModalOpen(false)}
          onSuccess={(newPassword) => {
            setResetModalOpen(false)
            setResetResultModal(newPassword)
          }}
        />
      )}

      {resetResultModal && (
        <Modal show onClose={() => setResetResultModal(null)}>
          <Modal.Header>New Password</Modal.Header>
          <Modal.Body>
            <p className="text-sm text-text-muted mb-2">Copy and share with the resident.</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={resetResultModal}
                readOnly
                className="bg-surface-inner border-2 border-border-dark text-text-primary text-sm rounded-sm block flex-1 p-2.5 font-mono"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(resetResultModal)
                  showToast('Copied to clipboard', 'success')
                }}
                className="px-3 py-2 text-sm border-2 border-border-dark rounded-sm hover:bg-surface-inner text-text-primary"
              >
                Copy
              </button>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <button
              onClick={() => setResetResultModal(null)}
              className="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-b from-royal-blue-light to-royal-blue border-2 border-royal-blue-dark rounded-sm"
            >
              Close
            </button>
          </Modal.Footer>
        </Modal>
      )}

      {deactivateModalOpen && (
        <DeactivateModal
          resident={resident}
          isInspecting={isInspecting}
          programName={programName}
          onClose={() => setDeactivateModalOpen(false)}
          onSuccess={() => {
            setDeactivateModalOpen(false)
            fetchData()
            showToast(resident.active ? 'Resident deactivated' : 'Resident activated', 'success')
          }}
        />
      )}
    </>
  )
}

function ResetPasswordModal({ resident, isInspecting, programName, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false)

  async function handleConfirm() {
    setLoading(true)
    const newPassword = generatePassword()
    const hash = hashSync(newPassword, 10)
    await supabase
      .from('residents')
      .update({ password_hash: hash })
      .eq('id', resident.id)
    setLoading(false)
    onSuccess(newPassword)
  }

  return (
    <Modal show onClose={onClose}>
      <Modal.Header>Reset Password</Modal.Header>
      <Modal.Body>
        {isInspecting && programName && (
          <div className="mb-3 p-3 bg-[rgba(244,196,48,0.08)] border border-flag-yellow rounded-sm text-sm text-flag-yellow">
            You are modifying <strong>{programName}</strong> as a superadmin.
          </div>
        )}
        <p className="text-sm text-text-muted">
          Reset password for {resident.email}? They will need the new password to log in.
        </p>
      </Modal.Body>
      <Modal.Footer>
        <button
          onClick={onClose}
          className="px-5 py-2.5 text-sm font-medium bg-transparent text-text-muted border-2 border-border-accent rounded-sm hover:text-text-bright"
        >
          Cancel
        </button>
        <button
          onClick={handleConfirm}
          disabled={loading}
          className="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-b from-royal-blue-light to-royal-blue border-2 border-royal-blue-dark rounded-sm"
        >
          {loading ? 'Resetting...' : 'Reset'}
        </button>
      </Modal.Footer>
    </Modal>
  )
}

function DeactivateModal({ resident, isInspecting, programName, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false)

  async function handleConfirm() {
    setLoading(true)
    await supabase
      .from('residents')
      .update({ active: !resident.active })
      .eq('id', resident.id)
    setLoading(false)
    onSuccess()
  }

  return (
    <Modal show onClose={onClose}>
      <Modal.Header>{resident.active ? 'Deactivate' : 'Activate'}</Modal.Header>
      <Modal.Body>
        {isInspecting && programName && (
          <div className="mb-3 p-3 bg-[rgba(244,196,48,0.08)] border border-flag-yellow rounded-sm text-sm text-flag-yellow">
            You are modifying <strong>{programName}</strong> as a superadmin.
          </div>
        )}
        <p className="text-sm text-text-muted">
          {resident.active
            ? `Deactivate ${resident.email}? They will not be able to log into the game.`
            : `Activate ${resident.email}? They will be able to log in again.`}
        </p>
      </Modal.Body>
      <Modal.Footer>
        <button
          onClick={onClose}
          className="px-5 py-2.5 text-sm font-medium bg-transparent text-text-muted border-2 border-border-accent rounded-sm hover:text-text-bright"
        >
          Cancel
        </button>
        <button
          onClick={handleConfirm}
          disabled={loading}
          className={`px-5 py-2.5 text-sm font-medium text-white rounded-sm ${
            resident.active
              ? 'bg-gradient-to-b from-roof-red-light to-roof-red border-2 border-[#A82518]'
              : 'bg-gradient-to-b from-royal-blue-light to-royal-blue border-2 border-royal-blue-dark'
          }`}
        >
          {loading ? 'Saving...' : resident.active ? 'Deactivate' : 'Activate'}
        </button>
      </Modal.Footer>
    </Modal>
  )
}
