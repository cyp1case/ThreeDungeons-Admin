import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import bcrypt from 'bcryptjs'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { Modal } from 'flowbite-react'

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
  const { profile } = useAuth()
  const { showToast } = useToast()
  const [resident, setResident] = useState(null)
  const [cohorts, setCohorts] = useState([])
  const [attempts, setAttempts] = useState([])
  const [loading, setLoading] = useState(true)
  const [moduleFilter, setModuleFilter] = useState('')
  const [dateFilter, setDateFilter] = useState('all')
  const [resetModalOpen, setResetModalOpen] = useState(false)
  const [deactivateModalOpen, setDeactivateModalOpen] = useState(false)
  const [resetResultModal, setResetResultModal] = useState(null)

  useEffect(() => {
    if (!id || !profile?.program_id) return
    fetchData()
  }, [id, profile?.program_id])

  async function fetchData() {
    setLoading(true)
    const { data: resData } = await supabase
      .from('residents')
      .select('*')
      .eq('id', id)
      .eq('program_id', profile.program_id)
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

  if (loading && !resident) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-primary-700 rounded-full animate-spin" />
      </div>
    )
  }

  if (!resident) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <p className="text-gray-500">Resident not found.</p>
        <Link to="/residents" className="text-primary-600 hover:underline mt-2 inline-block">
          Back to Residents
        </Link>
      </div>
    )
  }

  return (
    <>
      <nav className="text-sm text-gray-500 mb-4">
        <Link to="/residents" className="hover:text-gray-700">
          Residents
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">{resident.display_name || resident.email}</span>
      </nav>

      <h1 className="text-2xl font-semibold text-gray-900 mb-6">
        {resident.display_name || resident.email}
      </h1>

      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 mb-4">
          <div>
            <span className="text-sm text-gray-500">Email:</span>
            <span className="text-sm text-gray-900 font-medium ml-2">{resident.email}</span>
          </div>
          <div>
            <span className="text-sm text-gray-500">Status:</span>
            <span
              className={`ml-2 px-2.5 py-0.5 text-xs font-medium rounded-full ${
                resident.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}
            >
              {resident.active ? 'Active' : 'Inactive'}
            </span>
          </div>
          <div>
            <span className="text-sm text-gray-500">Cohorts:</span>
            <span className="text-sm text-gray-900 font-medium ml-2">
              {cohorts.join(', ') || '—'}
            </span>
          </div>
          <div>
            <span className="text-sm text-gray-500">Joined:</span>
            <span className="text-sm text-gray-900 font-medium ml-2">
              {formatDate(resident.created_at)}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setResetModalOpen(true)}
            className="px-4 py-2 text-sm font-medium text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-100"
          >
            Reset Password
          </button>
          <button
            onClick={() => setDeactivateModalOpen(true)}
            className="px-4 py-2 text-sm font-medium text-red-600 border border-red-300 rounded-lg hover:bg-red-50"
          >
            {resident.active ? 'Deactivate' : 'Activate'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Attempt Log</h2>
        <div className="flex gap-4 mb-4 flex-wrap">
          <select
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg p-2.5"
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
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg p-2.5"
          >
            <option value="all">All time</option>
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
          </select>
        </div>
        {filteredAttempts.length === 0 ? (
          <p className="text-gray-500 text-sm py-8 text-center">
            No attempts recorded yet. This resident hasn&apos;t played the game.
          </p>
        ) : (
          <>
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Module</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Outcome</th>
                </tr>
              </thead>
              <tbody>
                {filteredAttempts.map((a) => (
                  <tr key={a.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-500 font-mono">
                      {formatDate(a.created_at)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {formatModuleId(a.module_id)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {formatModuleId(a.action)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${
                          a.outcome === 'correct'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {a.outcome === 'correct' ? 'Correct' : 'Incorrect'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>

      {resetModalOpen && (
        <ResetPasswordModal
          resident={resident}
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
            <p className="text-sm text-gray-600 mb-2">
              Copy and share with the resident.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={resetResultModal}
                readOnly
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block flex-1 p-2.5 font-mono"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(resetResultModal)
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
              onClick={() => setResetResultModal(null)}
              className="px-5 py-2.5 text-sm font-medium text-white bg-primary-700 rounded-lg hover:bg-primary-800"
            >
              Close
            </button>
          </Modal.Footer>
        </Modal>
      )}

      {deactivateModalOpen && (
        <DeactivateModal
          resident={resident}
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

function ResetPasswordModal({ resident, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false)

  async function handleConfirm() {
    setLoading(true)
    const newPassword = generatePassword()
    const hash = bcrypt.hashSync(newPassword, 10)
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
        <p className="text-sm text-gray-600">
          Reset password for {resident.email}? They will need the new password to log in.
        </p>
      </Modal.Body>
      <Modal.Footer>
        <button
          onClick={onClose}
          className="px-5 py-2.5 text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-100"
        >
          Cancel
        </button>
        <button
          onClick={handleConfirm}
          disabled={loading}
          className="px-5 py-2.5 text-sm font-medium text-white bg-primary-700 rounded-lg hover:bg-primary-800"
        >
          {loading ? 'Resetting...' : 'Reset'}
        </button>
      </Modal.Footer>
    </Modal>
  )
}

function DeactivateModal({ resident, onClose, onSuccess }) {
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
        <p className="text-sm text-gray-600">
          {resident.active
            ? `Deactivate ${resident.email}? They will not be able to log into the game.`
            : `Activate ${resident.email}? They will be able to log in again.`}
        </p>
      </Modal.Body>
      <Modal.Footer>
        <button
          onClick={onClose}
          className="px-5 py-2.5 text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-100"
        >
          Cancel
        </button>
        <button
          onClick={handleConfirm}
          disabled={loading}
          className={`px-5 py-2.5 text-sm font-medium text-white rounded-lg ${
            resident.active ? 'bg-red-600 hover:bg-red-700' : 'bg-primary-700 hover:bg-primary-800'
          }`}
        >
          {loading ? 'Saving...' : resident.active ? 'Deactivate' : 'Activate'}
        </button>
      </Modal.Footer>
    </Modal>
  )
}
