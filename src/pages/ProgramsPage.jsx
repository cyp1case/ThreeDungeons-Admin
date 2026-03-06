import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useToast } from '../contexts/ToastContext'
import { Modal } from 'flowbite-react'

export function ProgramsPage() {
  const { showToast } = useToast()
  const [programs, setPrograms] = useState([])
  const [leaderCounts, setLeaderCounts] = useState({})
  const [residentCounts, setResidentCounts] = useState({})
  const [loading, setLoading] = useState(true)
  const [createModalOpen, setCreateModalOpen] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    const { data: progData } = await supabase.from('programs').select('*').order('name')
    setPrograms(progData ?? [])

    const { data: profiles } = await supabase
      .from('profiles')
      .select('program_id')
      .eq('role', 'leader')
    const lc = {}
    profiles?.forEach((p) => {
      if (p.program_id) {
        lc[p.program_id] = (lc[p.program_id] ?? 0) + 1
      }
    })
    setLeaderCounts(lc)

    const { data: residents } = await supabase.from('residents').select('program_id')
    const rc = {}
    residents?.forEach((r) => {
      rc[r.program_id] = (rc[r.program_id] ?? 0) + 1
    })
    setResidentCounts(rc)
    setLoading(false)
  }

  return (
    <>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Programs</h1>

      <div className="flex justify-end mb-4">
        <button
          onClick={() => setCreateModalOpen(true)}
          className="px-5 py-2.5 text-sm font-medium text-white bg-primary-700 rounded-lg hover:bg-primary-800"
        >
          Create Program
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
                <th className="px-4 py-3">Program Name</th>
                <th className="px-4 py-3">Leaders</th>
                <th className="px-4 py-3">Residents</th>
              </tr>
            </thead>
            <tbody>
              {programs.map((p) => (
                <tr key={p.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
                  <td className="px-4 py-3">{leaderCounts[p.id] ?? 0}</td>
                  <td className="px-4 py-3">{residentCounts[p.id] ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <CreateProgramModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={() => {
          fetchData()
          setCreateModalOpen(false)
          showToast('Program created', 'success')
        }}
        showToast={showToast}
      />
    </>
  )
}

function CreateProgramModal({ open, onClose, onSuccess, showToast }) {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.from('programs').insert({ name: name.trim() })
    setLoading(false)
    if (error) {
      showToast(error.message, 'error')
      return
    }
    onSuccess()
  }

  if (!open) return null
  return (
    <Modal show={open} onClose={onClose}>
      <Modal.Header>Create Program</Modal.Header>
      <form onSubmit={handleSubmit}>
        <Modal.Body>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Program Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., General Surgery Residency"
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5"
              required
            />
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 text-sm font-medium text-white bg-primary-700 rounded-lg hover:bg-primary-800"
          >
            {loading ? 'Creating...' : 'Create'}
          </button>
        </Modal.Footer>
      </form>
    </Modal>
  )
}
