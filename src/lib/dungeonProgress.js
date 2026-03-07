/**
 * Dungeon progress helpers. Aggregates attempts by dungeon using the dungeon catalog.
 * Only precise module_ids (in catalog) contribute to dungeon metrics.
 */

/**
 * @param {Array<{resident_id: string, module_id: string, outcome: string}>} attempts
 * @returns {{ [residentId: string]: { [questionId: string]: { hasCorrect: boolean, hasWrong: boolean } } }}
 */
export function buildResidentQuestionStatus(attempts) {
  const status = {}
  for (const a of attempts || []) {
    if (!a.resident_id || !a.module_id) continue
    if (!status[a.resident_id]) status[a.resident_id] = {}
    if (!status[a.resident_id][a.module_id]) {
      status[a.resident_id][a.module_id] = { hasCorrect: false, hasWrong: false }
    }
    if (a.outcome === 'correct') status[a.resident_id][a.module_id].hasCorrect = true
    if (a.outcome === 'incorrect') status[a.resident_id][a.module_id].hasWrong = true
  }
  return status
}

/**
 * @param {Array<{resident_id: string, module_id: string, outcome: string}>} attempts - one resident's attempts
 * @param {typeof import('./dungeonConfig').DUNGEONS} dungeons
 * @param {string} [residentId] - optional; inferred from attempts[0] if omitted
 * @returns {Array<{ dungeonId: string, dungeonName: string, topic: string, totalQuestions: number, completedQuestions: number, wrongQuestions: number, completionPct: number, wrongPct: number }>}
 */
export function getResidentDungeonProgress(attempts, dungeons, residentId) {
  const rid = residentId || attempts?.[0]?.resident_id
  if (!rid) return dungeons.map((d) => ({ dungeonId: d.id, dungeonName: d.name, topic: d.topic, totalQuestions: d.questionIds.length, completedQuestions: 0, wrongQuestions: 0, completionPct: 0, wrongPct: 0 }))
  const questionStatus = buildResidentQuestionStatus(attempts)
  const byResident = questionStatus[rid] || {}

  return dungeons.map((d) => {
    const total = d.questionIds.length
    let completed = 0
    let wrong = 0
    for (const qid of d.questionIds) {
      const s = byResident[qid]
      if (s?.hasCorrect) completed++
      if (s?.hasWrong) wrong++
    }
    return {
      dungeonId: d.id,
      dungeonName: d.name,
      topic: d.topic,
      totalQuestions: total,
      completedQuestions: completed,
      wrongQuestions: wrong,
      completionPct: total > 0 ? Math.round((completed / total) * 100) : 0,
      wrongPct: total > 0 ? Math.round((wrong / total) * 100) : 0,
    }
  })
}

/**
 * @param {Array<{resident_id: string, module_id: string, outcome: string}>} attempts
 * @param {{ id: string, questionIds: string[] }} dungeon
 * @param {string} residentId
 * @returns {Array<{ questionId: string, label: string, correct: number, wrong: number }>}
 */
export function getResidentQuestionBreakdown(attempts, dungeon, residentId) {
  const byQuestion = {}
  for (const a of attempts || []) {
    if (a.resident_id !== residentId || !dungeon.questionIds.includes(a.module_id)) continue
    if (!byQuestion[a.module_id]) byQuestion[a.module_id] = { correct: 0, wrong: 0 }
    if (a.outcome === 'correct') byQuestion[a.module_id].correct++
    if (a.outcome === 'incorrect') byQuestion[a.module_id].wrong++
  }
  return dungeon.questionIds.map((qid) => {
    const s = byQuestion[qid] || { correct: 0, wrong: 0 }
    const label = qid.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    return { questionId: qid, label, correct: s.correct, wrong: s.wrong }
  })
}

/**
 * @param {Set<string>} residentIds
 * @param {Array<{resident_id: string, module_id: string, outcome: string}>} attempts
 * @param {typeof import('./dungeonConfig').DUNGEONS} dungeons
 * @returns {Array<{ dungeonId: string, dungeonName: string, topic: string, completionPct: number, wrongPct: number }>}
 */
export function getCohortDungeonMetrics(residentIds, attempts, dungeons) {
  const questionStatus = buildResidentQuestionStatus(attempts)
  const ids = [...residentIds]
  if (ids.length === 0) return dungeons.map((d) => ({ dungeonId: d.id, dungeonName: d.name, topic: d.topic, completionPct: 0, wrongPct: 0 }))

  return dungeons.map((d) => {
    const total = d.questionIds.length * ids.length
    let completedCount = 0
    let wrongCount = 0
    for (const rid of ids) {
      const byResident = questionStatus[rid] || {}
      for (const qid of d.questionIds) {
        const s = byResident[qid]
        if (s?.hasCorrect) completedCount++
        if (s?.hasWrong) wrongCount++
      }
    }
    const questionSlots = d.questionIds.length * ids.length
    return {
      dungeonId: d.id,
      dungeonName: d.name,
      topic: d.topic,
      completionPct: questionSlots > 0 ? Math.round((completedCount / questionSlots) * 100) : 0,
      wrongPct: questionSlots > 0 ? Math.round((wrongCount / questionSlots) * 100) : 0,
    }
  })
}
