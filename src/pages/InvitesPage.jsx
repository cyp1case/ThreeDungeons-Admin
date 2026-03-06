import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useToast } from '../contexts/ToastContext'
import { Modal } from 'flowbite-react'

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
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Invite Codes</h1>

      <div className="flex justify-end mb-4">
        <button
          onClick={() => setGenerateModalOpen(true)}
          className="px-5 py-2.5 text-sm font-medium text-white bg-primary-700 rounded-lg hover:bg-primary-800"
        >
          Generate Invite
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-4 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        ) : (
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Program</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created</th>
              </tr>
            </thead>
            <tbody>
              {invites.map((inv) => (
                <tr key={inv.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-sm text-gray-900">
                    {inv.code.length === 8
                      ? `${inv.code.slice(0, 4)}-${inv.code.slice(4)}`
                      : inv.code}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {inv.programName ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${
                        inv.used_at
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {inv.used_at ? 'Used' : 'Unused'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
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
      </div>

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
