import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { hashSync } from 'bcrypt-ts/browser'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { Modal, Dropdown } from 'flowbite-react'
import { StatusBadge } from '../components/StatusBadge'
import { Card } from '../components/Card'

function generatePassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let s = ''
  for (let i = 0; i < 8; i++) s += chars[Math.floor(Math.random() * chars.length)]
  return s
}

export function ResidentsPage() {
  const { profile } = useAuth()
  const { showToast } = useToast()
  const [residents, setResidents] = useState([])
  const [cohorts, setCohorts] = useState([])
  const [residentCohorts, setResidentCohorts] = useState({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [csvModalOpen, setCsvModalOpen] = useState(false)
  const [resetModalOpen, setResetModalOpen] = useState(null)
  const [deactivateModalOpen, setDeactivateModalOpen] = useState(null)
  const [resetResultModal, setResetResultModal] = useState(null)

  const pageSize = 10

  async function fetchResidents() {
    setLoading(true)
    const { data } = await supabase
      .from('residents')
      .select('*')
      .eq('program_id', profile.program_id)
      .order('created_at', { ascending: false })
    setResidents(data ?? [])
    const rc = {}
    const { data: rcData } = await supabase
      .from('resident_cohorts')
      .select('resident_id, cohort_id')
    rcData?.forEach((r) => {
      if (!rc[r.resident_id]) rc[r.resident_id] = []
      rc[r.resident_id].push(r.cohort_id)
    })
    setResidentCohorts(rc)
    setLoading(false)
  }

  async function fetchCohorts() {
    const { data } = await supabase
      .from('cohorts')
      .select('id, name')
      .eq('program_id', profile.program_id)
    setCohorts(data ?? [])
  }

  useEffect(() => {
    if (!profile?.program_id) return
    fetchResidents() // eslint-disable-line react-hooks/set-state-in-effect -- data fetch
    fetchCohorts()
  }, [profile?.program_id]) // eslint-disable-line react-hooks/exhaustive-deps -- fetch helpers intentionally stable for this route

  const filtered = residents.filter(
    (r) =>
      !search ||
      r.email?.toLowerCase().includes(search.toLowerCase()) ||
      r.display_name?.toLowerCase().includes(search.toLowerCase())
  )
  const totalPages = Math.ceil(filtered.length / pageSize) || 1
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)

  function getCohortNames(residentId) {
    const cohortIds = residentCohorts[residentId] ?? []
    return cohorts
      .filter((c) => cohortIds.includes(c.id))
      .map((c) => c.name)
      .join(', ') || '—'
  }

  return (
    <>
      <h1
        className="font-pixel text-base text-flag-yellow mb-6"
        style={{ textShadow: '0 0 12px rgba(244,196,48,0.3)' }}
      >
        RESIDENTS
      </h1>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search residents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-surface-inner border-2 border-border-dark text-text-primary text-sm rounded-sm block w-full p-2.5 pl-10 focus:ring-royal-blue focus:border-royal-blue"
          />
          <svg
            className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setCsvModalOpen(true)}
            className="px-5 py-2.5 text-sm font-medium bg-surface-inner border-2 border-border-dark text-text-primary rounded-sm hover:bg-surface-card"
          >
            Upload CSV
          </button>
          <button
            onClick={() => setAddModalOpen(true)}
            className="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-b from-royal-blue-light to-royal-blue border-2 border-royal-blue-dark rounded-sm font-bold uppercase tracking-wider text-xs"
          >
            Add Resident
          </button>
        </div>
      </div>

      <Card className="overflow-hidden !p-0">
        {loading ? (
          <div className="p-8 space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-4 bg-gray-200 rounded animate-pulse"
                style={{ width: '100%' }}
              />
            ))}
          </div>
        ) : (
          <>
            <table className="w-full text-sm text-left text-text-primary">
              <thead className="text-[10px] text-text-muted uppercase tracking-wider bg-surface-inner font-bold">
                <tr>
                  <th className="px-3.5 py-2.5">Name / Email</th>
                  <th className="px-3.5 py-2.5">Cohorts</th>
                  <th className="px-3.5 py-2.5">Status</th>
                  <th className="px-3.5 py-2.5 w-16">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((r) => (
                  <tr key={r.id} className="border-b border-border-dark hover:bg-[rgba(29,59,142,0.1)]">
                    <td className="px-3.5 py-2.5">
                      <Link
                        to={`/residents/${r.id}`}
                        className="font-semibold text-text-bright hover:underline"
                      >
                        {r.display_name || r.email}
                      </Link>
                      <div className="text-sm text-text-muted">{r.email}</div>
                    </td>
                    <td className="px-3.5 py-2.5 text-sm text-text-primary">
                      {getCohortNames(r.id)}
                    </td>
                    <td className="px-3.5 py-2.5">
                      {r.active ? (
                        <StatusBadge outcome="correct">Active</StatusBadge>
                      ) : (
                        <span className="bg-[rgba(144,152,168,0.15)] text-text-muted border-2 border-border-accent rounded-sm px-2.5 py-0.5 text-xs font-bold">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <ResidentActions
                        resident={r}
                        onReset={() => setResetModalOpen(r)}
                        onDeactivate={() => setDeactivateModalOpen(r)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex items-center justify-between px-4 py-3 border-t border-border-dark">
              <p className="text-sm text-text-muted">
                Showing {(page - 1) * pageSize + 1}–
                {Math.min(page * pageSize, filtered.length)} of {filtered.length}
              </p>
              <div className="flex gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-3 py-1 text-sm bg-surface-inner border-2 border-border-dark text-text-muted rounded-sm disabled:opacity-50"
                >
                  Prev
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const p = page <= 3 ? i + 1 : page - 2 + i
                  if (p < 1 || p > totalPages) return null
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`px-3 py-1 text-sm rounded-sm ${
                        page === p
                          ? 'bg-royal-blue text-white'
                          : 'bg-surface-inner border-2 border-border-dark text-text-muted'
                      }`}
                    >
                      {p}
                    </button>
                  )
                })}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="px-3 py-1 text-sm bg-surface-inner border-2 border-border-dark text-text-muted rounded-sm disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
            </>
          )}
      </Card>

      <AddResidentModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        programId={profile?.program_id}
        cohorts={cohorts}
        onSuccess={() => {
          fetchResidents()
          setAddModalOpen(false)
          showToast('Resident added', 'success')
        }}
        showToast={showToast}
      />

      <CsvUploadModal
        open={csvModalOpen}
        onClose={() => setCsvModalOpen(false)}
        programId={profile?.program_id}
        cohorts={cohorts}
        onSuccess={() => {
          fetchResidents()
          setCsvModalOpen(false)
          showToast('Residents uploaded', 'success')
        }}
        showToast={showToast}
      />

      {resetModalOpen && (
        <ResetPasswordModal
          resident={resetModalOpen}
          onClose={() => setResetModalOpen(null)}
          onSuccess={(newPassword) => {
            setResetModalOpen(null)
            setResetResultModal(newPassword)
            fetchResidents()
          }}
        />
      )}

      {resetResultModal && (
        <ResetResultModal
          password={resetResultModal}
          onClose={() => setResetResultModal(null)}
          showToast={showToast}
        />
      )}

      {deactivateModalOpen && (
        <DeactivateModal
          resident={deactivateModalOpen}
          onClose={() => setDeactivateModalOpen(null)}
          onSuccess={() => {
            setDeactivateModalOpen(null)
            fetchResidents()
            showToast(
              deactivateModalOpen.active ? 'Resident deactivated' : 'Resident activated',
              'success'
            )
          }}
        />
      )}
    </>
  )
}

function ResidentActions({ resident, onReset, onDeactivate }) {
  const navigate = useNavigate()
  return (
    <Dropdown label="•••" dismissOnClick>
      <Dropdown.Item onClick={() => navigate(`/residents/${resident.id}`)}>
        View Details
      </Dropdown.Item>
      <Dropdown.Item onClick={onReset}>Reset Password</Dropdown.Item>
      <Dropdown.Item onClick={onDeactivate}>
        {resident.active ? 'Deactivate' : 'Activate'}
      </Dropdown.Item>
    </Dropdown>
  )
}

function AddResidentModal({ open, onClose, programId, cohorts, onSuccess, showToast }) {
  const [email, setEmail] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [password, setPassword] = useState('')
  const [cohortIds, setCohortIds] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      setEmail('') // eslint-disable-line react-hooks/set-state-in-effect -- reset form when modal opens
      setDisplayName('')
      setPassword(generatePassword())
      setCohortIds([])
    }
  }, [open])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!programId) return
    setLoading(true)
    const hash = hashSync(password, 10)
    const { error } = await supabase.from('residents').insert({
      program_id: programId,
      email,
      display_name: displayName || null,
      password_hash: hash,
      active: true,
    })
    setLoading(false)
    if (error) {
      showToast(error.message, 'error')
      return
    }
    const { data: newResident } = await supabase
      .from('residents')
      .select('id')
      .eq('program_id', programId)
      .eq('email', email)
      .single()
    if (newResident && cohortIds.length > 0) {
      await supabase.from('resident_cohorts').insert(
        cohortIds.map((cid) => ({ resident_id: newResident.id, cohort_id: cid }))
      )
    }
    onSuccess()
  }

  if (!open) return null
  return (
    <Modal show={open} onClose={onClose}>
      <Modal.Header>Add Resident</Modal.Header>
      <form onSubmit={handleSubmit}>
        <Modal.Body>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Email (required)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Display Name (optional)
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Password (copy and share)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={password}
                  readOnly
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block flex-1 p-2.5 font-mono"
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(password)
                    showToast('Copied to clipboard', 'success')
                  }}
                  className="px-3 py-2 text-sm border rounded-lg hover:bg-gray-100"
                >
                  Copy
                </button>
              </div>
            </div>
            {cohorts.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Cohorts (optional)
                </label>
                <div className="space-y-2">
                  {cohorts.map((c) => (
                    <label key={c.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={cohortIds.includes(c.id)}
                        onChange={(e) =>
                          setCohortIds((prev) =>
                            e.target.checked
                              ? [...prev, c.id]
                              : prev.filter((id) => id !== c.id)
                          )
                        }
                      />
                      <span className="text-sm">{c.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
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
            {loading ? 'Adding...' : 'Add'}
          </button>
        </Modal.Footer>
      </form>
    </Modal>
  )
}

function CsvUploadModal({ open, onClose, programId, cohorts: _cohorts, onSuccess, showToast }) {
  const [, setFile] = useState(null)
  const [parsed, setParsed] = useState([])
  const [loading, setLoading] = useState(false)
  const [credentials, setCredentials] = useState([])

  function parseCsv(text) {
    const lines = text.trim().split(/\r?\n/)
    if (lines.length < 2) return []
    const headers = lines[0].toLowerCase().split(',').map((h) => h.trim())
    const emailIdx = headers.findIndex((h) => h === 'email')
    const nameIdx = headers.findIndex((h) => h === 'display_name' || h === 'displayname')
    const cohortIdx = headers.findIndex((h) => h === 'cohort' || h === 'cohorts')
    if (emailIdx < 0) return []
    const rows = []
    for (let i = 1; i < lines.length; i++) {
      const vals = lines[i].split(',').map((v) => v.trim())
      const email = vals[emailIdx] || ''
      if (!email) continue
      rows.push({
        email,
        display_name: nameIdx >= 0 ? vals[nameIdx] || '' : '',
        cohort: cohortIdx >= 0 ? vals[cohortIdx] || '' : '',
      })
    }
    return rows
  }

  function handleFile(e) {
    const f = e.target.files?.[0]
    if (!f?.name.endsWith('.csv')) {
      showToast('Please select a CSV file', 'error')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const rows = parseCsv(reader.result)
      setParsed(rows)
      setFile(f)
    }
    reader.readAsText(f)
  }

  async function handleUpload() {
    if (!programId || parsed.length === 0) return
    setLoading(true)
    const creds = []
    for (const row of parsed) {
      const password = generatePassword()
      const hash = hashSync(password, 10)
      const { error } = await supabase.from('residents').insert({
        program_id: programId,
        email: row.email,
        display_name: row.display_name || null,
        password_hash: hash,
        active: true,
      })
      if (error) {
        showToast(`Failed to add ${row.email}: ${error.message}`, 'error')
        continue
      }
      creds.push({ email: row.email, password })
    }
    setCredentials(creds)
    setLoading(false)
    if (creds.length > 0) onSuccess()
  }

  function downloadCreds() {
    const csv = 'email,password\n' + credentials.map((c) => `${c.email},${c.password}`).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'resident-credentials.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!open) return null
  return (
    <Modal show={open} onClose={onClose} size="lg">
      <Modal.Header>Bulk Upload Residents</Modal.Header>
      <Modal.Body>
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            const f = e.dataTransfer.files?.[0]
            if (f) handleFile({ target: { files: [f] } })
          }}
        >
          <input
            type="file"
            accept=".csv"
            onChange={handleFile}
            className="hidden"
            id="csv-input"
          />
          <label htmlFor="csv-input" className="cursor-pointer text-gray-500">
            Drop CSV here or click to browse
          </label>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          CSV columns: <code>email</code>, <code>display_name</code> (optional),{' '}
          <code>cohort</code> (optional). One resident per row. First row must be headers.
        </p>
        {parsed.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-900 mb-2">
              Preview ({parsed.length} residents)
            </p>
            <div className="max-h-32 overflow-y-auto border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left">Email</th>
                    <th className="px-3 py-2 text-left">Name</th>
                  </tr>
                </thead>
                <tbody>
                  {parsed.slice(0, 5).map((r, i) => (
                    <tr key={i} className="border-t">
                      <td className="px-3 py-2">{r.email}</td>
                      <td className="px-3 py-2">{r.display_name || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {parsed.length > 5 && (
              <p className="text-sm text-gray-500 mt-1">and {parsed.length - 5} more...</p>
            )}
          </div>
        )}
        {credentials.length > 0 && (
          <div className="mt-4 p-4 bg-green-50 rounded-lg">
            <p className="text-sm font-medium text-green-800 mb-2">
              {credentials.length} residents added. Download credentials to distribute:
            </p>
            <button
              onClick={downloadCreds}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-700 rounded-lg hover:bg-primary-800"
            >
              Download CSV
            </button>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <button
          onClick={onClose}
          className="px-5 py-2.5 text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-100"
        >
          {credentials.length > 0 ? 'Close' : 'Cancel'}
        </button>
        {credentials.length === 0 && (
          <button
            onClick={handleUpload}
            disabled={loading || parsed.length === 0}
            className="px-5 py-2.5 text-sm font-medium text-white bg-primary-700 rounded-lg hover:bg-primary-800 disabled:opacity-50"
          >
            {loading ? 'Uploading...' : 'Upload'}
          </button>
        )}
      </Modal.Footer>
    </Modal>
  )
}

function ResetPasswordModal({ resident, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false)

  async function handleConfirm() {
    setLoading(true)
    const newPassword = generatePassword()
    const hash = hashSync(newPassword, 10)
    const { error } = await supabase
      .from('residents')
      .update({ password_hash: hash })
      .eq('id', resident.id)
    setLoading(false)
    if (error) return
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

function ResetResultModal({ password, onClose, showToast }) {
  return (
    <Modal show onClose={onClose}>
      <Modal.Header>New Password</Modal.Header>
      <Modal.Body>
        <p className="text-sm text-gray-600 mb-2">
          Copy and share with the resident. It can only be used once.
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={password}
            readOnly
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block flex-1 p-2.5 font-mono"
          />
          <button
            onClick={() => {
              navigator.clipboard.writeText(password)
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
          onClick={onClose}
          className="px-5 py-2.5 text-sm font-medium text-white bg-primary-700 rounded-lg hover:bg-primary-800"
        >
          Close
        </button>
      </Modal.Footer>
    </Modal>
  )
}

function DeactivateModal({ resident, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false)

  async function handleConfirm() {
    setLoading(true)
    const { error } = await supabase
      .from('residents')
      .update({ active: !resident.active })
      .eq('id', resident.id)
    setLoading(false)
    if (error) return
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
