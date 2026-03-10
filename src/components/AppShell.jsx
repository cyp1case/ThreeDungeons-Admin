import { useState, useEffect } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

const INSPECT_PATH_REGEX = /^\/admin\/programs\/([^/]+)/

export function AppShell() {
  const { profile, signOut, isSuperAdmin } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const programId = (location.pathname.match(INSPECT_PATH_REGEX) ?? [])[1]
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [inspectProgramName, setInspectProgramName] = useState(null)

  const isInspecting = isSuperAdmin() && programId

  useEffect(() => {
    if (!isInspecting || !programId) return
    let cancelled = false
    supabase
      .from('programs')
      .select('name')
      .eq('id', programId)
      .single()
      .then(({ data }) => {
        if (!cancelled && data) setInspectProgramName(data.name)
      })
    return () => { cancelled = true }
  }, [isInspecting, programId])

  const handleSignOut = async () => {
    await signOut()
    navigate('/login', { replace: true })
  }

  const leaderNavItems = [
    { path: '/', label: 'Dashboard' },
    { path: '/residents', label: 'Residents' },
    { path: '/cohorts', label: 'Cohorts' },
    { path: '/dungeons', label: 'Dungeons' },
  ]

  const inspectNavItems = programId
    ? [
        { path: `/admin/programs/${programId}/dashboard`, label: 'Dashboard' },
        { path: `/admin/programs/${programId}/residents`, label: 'Residents' },
        { path: `/admin/programs/${programId}/cohorts`, label: 'Cohorts' },
        { path: `/admin/programs/${programId}/dungeons`, label: 'Dungeons' },
      ]
    : []

  const adminItems = [
    { path: '/admin/programs', label: 'Programs' },
    { path: '/admin/invites', label: 'Invites' },
    { path: '/admin/game-settings', label: 'Game Settings' },
  ]

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/' && !isInspecting
    return location.pathname.startsWith(path)
  }

  const navItems = isInspecting ? inspectNavItems : leaderNavItems

  return (
    <>
      <aside
        className={`fixed top-0 left-0 z-40 w-[260px] h-full bg-surface-sidebar border-r-[3px] border-royal-blue shadow-[3px_0_20px_rgba(29,59,142,0.4)] transition-transform lg:translate-x-0 flex flex-col ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/60 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        <div className="px-5 py-6 border-b-[3px] border-border-dark flex items-start justify-between gap-2">
          <div>
            <div
              className="font-pixel text-xs text-flag-yellow leading-relaxed"
              style={{ textShadow: '0 0 10px rgba(244,196,48,0.3), 2px 2px 0 rgba(0,0,0,0.5)' }}
            >
              THREE<br />DUNGEONS
            </div>
            <div className="font-sans text-[10px] text-text-muted uppercase tracking-[2px] mt-1">
              Admin Portal
            </div>
          </div>
          <button
            type="button"
            className="lg:hidden shrink-0 p-2 text-text-muted hover:text-text-bright rounded-sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path clipRule="evenodd" fillRule="evenodd" d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10z" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-3 pb-4">
          <div className="font-sans text-[11px] font-bold uppercase tracking-[2px] text-text-muted px-3.5 pt-5 pb-2">
            Navigate
          </div>
          {isInspecting && (
            <>
              <Link
                to="/admin/programs"
                className="block py-2 text-xs text-text-muted hover:text-text-bright mb-2"
                onClick={() => setSidebarOpen(false)}
              >
                Back to Programs
              </Link>
              {inspectProgramName && (
                <p className="text-[10px] text-text-muted px-3.5 mb-3 truncate">
                  Inspecting: {inspectProgramName}
                </p>
              )}
            </>
          )}
          <ul className="space-y-1">
            {(isSuperAdmin() && !isInspecting ? adminItems : navItems).map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`block py-2.5 pl-6 pr-3.5 rounded-sm font-pixel text-[9px] uppercase tracking-wider leading-relaxed ${
                    isActive(item.path)
                      ? 'bg-royal-blue text-flag-yellow border-2 border-royal-blue-light shadow-[0_0_12px_rgba(29,59,142,0.4)]'
                      : 'text-text-muted border-2 border-transparent hover:bg-white/5 hover:text-text-bright hover:border-border-accent'
                  }`}
                  style={isActive(item.path) ? { textShadow: '0 0 8px rgba(244,196,48,0.3)' } : {}}
                  onClick={() => setSidebarOpen(false)}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="px-5 py-3 border-t border-border-dark mt-auto">
          <p className="text-xs text-text-muted truncate">{profile?.email}</p>
          <button
            onClick={handleSignOut}
            className="text-xs text-text-muted hover:text-text-bright mt-1"
          >
            Sign Out
          </button>
        </div>
      </aside>

      <main className="lg:ml-[260px] bg-surface-page min-h-screen relative">
        {!sidebarOpen && (
          <button
            type="button"
            className="lg:hidden fixed top-4 left-4 z-20 p-2 text-text-muted hover:text-text-bright rounded-sm bg-surface-card border border-border-dark"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path clipRule="evenodd" fillRule="evenodd" d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10z" />
          </svg>
          </button>
        )}
        <div className="p-7">
          <Outlet />
        </div>
      </main>
    </>
  )
}
