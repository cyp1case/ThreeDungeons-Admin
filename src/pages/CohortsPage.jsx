import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { Modal } from 'flowbite-react'

export function CohortsPage() {
  const { profile } = useAuth()
  const { showToast } = useToast()
  const [cohorts, setCohorts] = useState([])
  const [residents, setResidents] = useState([])
  const [residentCohorts, setResidentCohorts] = useState({})
  const [loading, setLoading] = useState(true)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [manageModalOpen, setManageModalOpen] = useState(null)

  useEffect(() => {
    if (!profile?.program_id) return
    fetchData()
  }, [profile?.program_id])

  async function fetchData() {
    setLoading(true)
    const { data: cohortData } = await supabase
      .from('cohorts')
      .select('*')
      .eq('program_id', profile.program_id)
      .order('name')
    setCohorts(cohortData ?? [])

    const { data: residentData } = await supabase
      .from('residents')
      .select('id, email, display_name')
      .eq('program_id', profile.program_id)
      .eq('active', true)
    setResidents(residentData ?? [])

    const { data: rcData } = await supabase.from('resident_cohorts').select('resident_id, cohort_id')
    const rc = {}
    rcData?.forEach((r) => {
      if (!rc[r.cohort_id]) rc[r.cohort_id] = new Set()
      rc[r.cohort_id].add(r.resident_id)
    })
    setResidentCohorts(rc)
    setLoading(false)
  }

  function getMemberCount(cohortId) {
    return residentCohorts[cohortId]?.size ?? 0
  }

  return (
    <>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Cohorts</h1>

      <div className="flex justify-end mb-4">
        <button
          onClick={() => setCreateModalOpen(true)}
          className="px-5 py-2.5 text-sm font-medium text-white bg-primary-700 rounded-lg hover:bg-primary-800"
        >
          Create Cohort
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-primary-700 rounded-full animate-spin" />
        </div>
      ) : cohorts.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <p className="text-gray-500 text-sm py-12 text-center">
            No cohorts yet. Create one to group your residents.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cohorts.map((c) => (
            <div key={c.id} className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="text-lg font-semibold text-gray-900">{c.name}</h3>
              <p className="text-sm text-gray-500 mt-1">
                {getMemberCount(c.id)} residents
              </p>
              <button
                onClick={() => setManageModalOpen(c)}
                className="text-sm text-primary-600 hover:underline mt-4 inline-block"
              >
                Manage Members
              </button>
            </div>
          ))}
        </div>
      )}

      <CreateCohortModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        programId={profile?.program_id}
        onSuccess={() => {
          fetchData()
          setCreateModalOpen(false)
          showToast('Cohort created', 'success')
        }}
        showToast={showToast}
      />

      {manageModalOpen && (
        <ManageMembersModal
          cohort={manageModalOpen}
          residents={residents}
          selectedIds={Array.from(residentCohorts[manageModalOpen.id] ?? [])}
          onClose={() => setManageModalOpen(null)}
          onSuccess={() => {
            fetchData()
            setManageModalOpen(null)
            showToast('Members updated', 'success')
          }}
          showToast={showToast}
        />
      )}
    </>
  )
}

function CreateCohortModal({ open, onClose, programId, onSuccess, showToast }) {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!programId) return
    setLoading(true)
    const { error } = await supabase.from('cohorts').insert({
      program_id: programId,
      name: name.trim(),
    })
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
      <Modal.Header>Create Cohort</Modal.Header>
      <form onSubmit={handleSubmit}>
        <Modal.Body>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Cohort Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., PGY-1, ICU Rotation"
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

function ManageMembersModal({
  cohort,
  residents,
  selectedIds,
  onClose,
  onSuccess,
  showToast,
}) {
  const [selected, setSelected] = useState(new Set(selectedIds))
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setSelected(new Set(selectedIds))
  }, [cohort.id, selectedIds])

  const filtered = residents.filter(
    (r) =>
      !search ||
      r.email?.toLowerCase().includes(search.toLowerCase()) ||
      r.display_name?.toLowerCase().includes(search.toLowerCase())
  )

  async function handleSave() {
    setLoading(true)
    await supabase
      .from('resident_cohorts')
      .delete()
      .eq('cohort_id', cohort.id)
    if (selected.size > 0) {
      await supabase.from('resident_cohorts').insert(
        [...selected].map((resident_id) => ({ resident_id, cohort_id: cohort.id }))
      )
    }
    setLoading(false)
    onSuccess()
  }

  function toggle(residentId) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(residentId)) next.delete(residentId)
      else next.add(residentId)
      return next
    })
  }

  return (
    <Modal show onClose={onClose} size="lg">
      <Modal.Header>{cohort.name} — Members</Modal.Header>
      <Modal.Body>
        <input
          type="text"
          placeholder="Search residents..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5 mb-4"
        />
        <div className="max-h-64 overflow-y-auto space-y-2">
          {filtered.map((r) => (
            <label
              key={r.id}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selected.has(r.id)}
                onChange={() => toggle(r.id)}
              />
              <span className="text-sm font-medium text-gray-900">
                {r.display_name || r.email}
              </span>
              <span className="text-sm text-gray-500">{r.email}</span>
            </label>
          ))}
        </div>
      </Modal.Body>
      <Modal.Footer>
        <button
          onClick={onClose}
          className="px-5 py-2.5 text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-100"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={loading}
          className="px-5 py-2.5 text-sm font-medium text-white bg-primary-700 rounded-lg hover:bg-primary-800"
        >
          {loading ? 'Saving...' : 'Save'}
        </button>
      </Modal.Footer>
    </Modal>
  )
}
