import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useToast } from '../contexts/ToastContext'
import { Modal } from 'flowbite-react'
import { Card } from '../components/Card'
import { StatusBadge } from '../components/StatusBadge'

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let s = ''
  for (let i = 0; i < 8; i++) s += chars[Math.floor(Math.random() * chars.length)]
  return s.slice(0, 4) + '-' + s.slice(4)
}

export function InvitesPage() {
  const { showToast } = useToast()
  const [invites, setInvites] = useState([])
  const [programs, setPrograms] = useState([])
  const [loading, setLoading] = useState(true)
  const [generateModalOpen, setGenerateModalOpen] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    const { data: progData } = await supabase.from('programs').select('id, name').order('name')
    const programsList = progData ?? []
    setPrograms(programsList)

    const { data: invData } = await supabase
      .from('invite_codes')
      .select('*')
      .order('created_at', { ascending: false })
    const progMap = Object.fromEntries(programsList.map((p) => [p.id, p.name]))
    setInvites(
      (invData ?? []).map((inv) => ({
        ...inv,
        programName: progMap[inv.program_id] ?? '—',
      }))
    )
    setLoading(false)
  }

  return (
    <>
      <h1
        className="font-pixel text-base text-flag-yellow mb-6"
        style={{ textShadow: '0 0 12px rgba(244,196,48,0.3)' }}
      >
        INVITE CODES
      </h1>

      <div className="flex justify-end mb-4">
        <button
          onClick={() => setGenerateModalOpen(true)}
          className="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-b from-royal-blue-light to-royal-blue border-2 border-royal-blue-dark rounded-sm font-bold uppercase tracking-wider text-xs"
        >
          Generate Invite
        </button>
      </div>

      <Card className="overflow-hidden !p-0">
        {loading ? (
          <div className="p-8 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-4 bg-surface-inner rounded animate-pulse" />
            ))}
          </div>
        ) : (
          <table className="w-full text-sm text-left text-text-primary">
            <thead className="text-[10px] text-text-muted uppercase tracking-wider bg-surface-inner font-bold">
              <tr>
                <th className="px-3.5 py-2.5">Code</th>
                <th className="px-3.5 py-2.5">Program</th>
                <th className="px-3.5 py-2.5">Status</th>
                <th className="px-3.5 py-2.5">Created</th>
              </tr>
            </thead>
            <tbody>
              {invites.map((inv) => (
                <tr key={inv.id} className="border-b border-border-dark hover:bg-[rgba(29,59,142,0.1)]">
                  <td className="px-3.5 py-2.5 font-mono text-sm text-text-bright">
                    {inv.code.length === 8
                      ? `${inv.code.slice(0, 4)}-${inv.code.slice(4)}`
                      : inv.code}
                  </td>
                  <td className="px-3.5 py-2.5 text-sm text-text-primary">
                    {inv.programName ?? '—'}
                  </td>
                  <td className="px-3.5 py-2.5">
                    {inv.used_at ? (
                      <span className="bg-[rgba(144,152,168,0.15)] text-text-muted border-2 border-border-accent rounded-sm px-2.5 py-0.5 text-xs font-bold">
                        Used
                      </span>
                    ) : (
                      <StatusBadge outcome="correct">Unused</StatusBadge>
                    )}
                  </td>
                  <td className="px-3.5 py-2.5 text-sm text-text-muted">
                    {new Date(inv.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
            </table>
          )}
      </Card>

      <GenerateInviteModal
        open={generateModalOpen}
        onClose={() => setGenerateModalOpen(false)}
        programs={programs}
        onSuccess={() => {
          fetchData()
          setGenerateModalOpen(false)
        }}
        showToast={showToast}
      />
    </>
  )
}

function GenerateInviteModal({ open, onClose, programs, onSuccess, showToast }) {
  const [programId, setProgramId] = useState('')
  const [loading, setLoading] = useState(false)
  const [generatedCode, setGeneratedCode] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!programId) return
    setLoading(true)
    const code = generateCode()
    const codeStored = code.replace('-', '')
    const { error } = await supabase.from('invite_codes').insert({
      code: codeStored,
      program_id: programId,
    })
    setLoading(false)
    if (error) {
      showToast(error.message, 'error')
      return
    }
    setGeneratedCode(code)
  }

  function handleClose() {
    setGeneratedCode(null)
    setProgramId('')
    onClose()
  }

  if (!open) return null
  return (
    <Modal show={open} onClose={handleClose}>
      <Modal.Header>Generate Invite Code</Modal.Header>
      {generatedCode ? (
        <>
          <Modal.Body>
            <p className="text-sm text-gray-600 mb-2">
              Share this code with the new leader. It can only be used once.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={generatedCode}
                readOnly
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block flex-1 p-2.5 font-mono text-lg"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(generatedCode)
                  showToast('Copied to clipboard', 'success')
                }}
                className="px-3 py-2 text-sm border rounded-lg hover:bg-gray-100"
              >
                Copy
              </button>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <button
              onClick={handleClose}
              className="px-5 py-2.5 text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-100"
            >
              Close
            </button>
          </Modal.Footer>
        </>
      ) : (
        <form onSubmit={handleSubmit}>
          <Modal.Body>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Program
              </label>
              <select
                value={programId}
                onChange={(e) => setProgramId(e.target.value)}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5"
                required
              >
                <option value="">Select a program</option>
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <button
              type="button"
              onClick={handleClose}
              className="px-5 py-2.5 text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 text-sm font-medium text-white bg-primary-700 rounded-lg hover:bg-primary-800"
            >
              {loading ? 'Generating...' : 'Generate'}
            </button>
          </Modal.Footer>
        </form>
      )}
    </Modal>
  )
}
