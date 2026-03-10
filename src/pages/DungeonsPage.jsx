import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useSelectedProgram } from '../contexts/SelectedProgramContext'
import { DUNGEONS } from '../lib/dungeonConfig'
import { buildResidentQuestionStatus } from '../lib/dungeonProgress'
import { Card } from '../components/Card'
import { CompletionBadge } from '../components/CompletionBadge'
import { ProgressBar } from '../components/ProgressBar'

function formatModuleId(id) {
  return id
    .replace(/^CE_Q\d+_/, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export function DungeonsPage() {
  const { profileLoading } = useAuth()
  const { effectiveProgramId } = useSelectedProgram()
  const [residents, setResidents] = useState([])
  const [attempts, setAttempts] = useState([])
  const [loading, setLoading] = useState(true)

  async function fetchData() {
    setLoading(true)
    const { data: residentsData } = await supabase
      .from('residents')
      .select('id')
      .eq('program_id', effectiveProgramId)
    setResidents(residentsData ?? [])

    const { data: attemptsData } = await supabase
      .from('attempts')
      .select('resident_id, module_id, outcome')
      .eq('program_id', effectiveProgramId)
    setAttempts(attemptsData ?? [])
    setLoading(false)
  }

  useEffect(() => {
    if (profileLoading) return
    if (!effectiveProgramId) return
    fetchData() // eslint-disable-line react-hooks/set-state-in-effect -- data fetch
  }, [effectiveProgramId, profileLoading]) // eslint-disable-line react-hooks/exhaustive-deps -- fetch helper intentionally stable for this route

  const residentIds = new Set(residents.map((r) => r.id))
  const questionStatus = buildResidentQuestionStatus(attempts)

  const dungeonCards = DUNGEONS.map((d) => {
    const totalSlots = d.questionIds.length * residentIds.size
    let completedCount = 0
    let wrongCount = 0
    for (const rid of residentIds) {
      const byResident = questionStatus[rid] || {}
      for (const qid of d.questionIds) {
        const s = byResident[qid]
        if (s?.hasCorrect) completedCount++
        if (s?.hasWrong) wrongCount++
      }
    }
    const avgCompletion = totalSlots > 0 ? Math.round((completedCount / totalSlots) * 100) : 0
    const avgWrong = totalSlots > 0 ? Math.round((wrongCount / totalSlots) * 100) : 0
    return {
      ...d,
      avgCompletion,
      avgWrong,
    }
  })

  const questionRows = []
  const attemptCountByQuestion = {}
  for (const a of attempts) {
    if (!attemptCountByQuestion[a.module_id]) attemptCountByQuestion[a.module_id] = 0
    attemptCountByQuestion[a.module_id]++
  }

  for (const d of DUNGEONS) {
    for (const qid of d.questionIds) {
      let correctResidents = 0
      let wrongResidents = 0
      for (const rid of residentIds) {
        const byResident = questionStatus[rid] || {}
        const s = byResident[qid]
        if (s?.hasCorrect) correctResidents++
        if (s?.hasWrong) wrongResidents++
      }
      const totalResidents = residentIds.size || 1
      const pctCorrect = Math.round((correctResidents / totalResidents) * 100)
      const pctWrong = Math.round((wrongResidents / totalResidents) * 100)
      questionRows.push({
        questionId: qid,
        dungeon: d.name,
        pctCorrect,
        pctWrong,
        attempts: attemptCountByQuestion[qid] ?? 0,
      })
    }
  }

  if (!profileLoading && !effectiveProgramId) {
    return (
      <Card>
        <p className="text-text-muted text-sm py-12 text-center">
          Select a program to view dungeon analytics.
        </p>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-border-dark border-t-royal-blue rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <>
      <h1
        className="font-pixel text-base text-flag-yellow mb-7"
        style={{ textShadow: '0 0 12px rgba(244,196,48,0.3)' }}
      >
        DUNGEONS
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {dungeonCards.map((d) => (
          <Card key={d.id} className="text-center">
            <p className="font-pixel text-[9px] text-text-bright leading-relaxed">
              {d.name.toUpperCase()}
            </p>
            <p className="text-xs text-text-muted mb-4">{d.topic}</p>
            <p className="font-pixel text-2xl text-flag-yellow">{d.avgCompletion}%</p>
            <p className="text-xs text-text-muted mt-1">{d.questionIds.length} questions</p>
            <p className="text-[11px] text-roof-red mt-1">{d.avgWrong}% wrong</p>
            <ProgressBar pct={d.avgCompletion} className="mt-3" />
          </Card>
        ))}
      </div>

      <Card>
        <h2
          className="font-pixel text-[10px] text-text-bright mb-4"
          style={{ textShadow: '0 0 6px rgba(255,255,255,0.2)' }}
        >
          QUESTION DIFFICULTY
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-text-primary">
            <thead className="text-[10px] text-text-muted uppercase tracking-wider bg-surface-inner font-bold">
              <tr>
                <th className="px-3.5 py-2.5">Question ID</th>
                <th className="px-3.5 py-2.5">Dungeon</th>
                <th className="px-3.5 py-2.5">% Correct</th>
                <th className="px-3.5 py-2.5">% Wrong</th>
                <th className="px-3.5 py-2.5">Attempts</th>
              </tr>
            </thead>
            <tbody>
              {questionRows.map((row) => (
                <tr
                  key={row.questionId}
                  className="border-b border-border-dark hover:bg-[rgba(29,59,142,0.1)]"
                >
                  <td className="px-3.5 py-2.5 font-mono text-xs">
                    {formatModuleId(row.questionId)}
                  </td>
                  <td className="px-3.5 py-2.5">{row.dungeon}</td>
                  <td className="px-3.5 py-2.5">
                    <CompletionBadge pct={row.pctCorrect} />
                  </td>
                  <td className="px-3.5 py-2.5 text-roof-red text-sm">{row.pctWrong}%</td>
                  <td className="px-3.5 py-2.5">{row.attempts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  )
}
