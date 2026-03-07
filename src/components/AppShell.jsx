import { useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useSelectedProgram } from '../contexts/SelectedProgramContext'

export function AppShell() {
  const { profile, signOut, isSuperAdmin } = useAuth()
  const { programs, selectedProgramId, setSelectedProgramId } =
    useSelectedProgram()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const navItems = [
    { path: '/', label: 'Dashboard' },
    { path: '/residents', label: 'Residents' },
    { path: '/cohorts', label: 'Cohorts' },
  ]

  const adminItems = [
    { path: '/admin/programs', label: 'Programs' },
    { path: '/admin/invites', label: 'Invites' },
  ]

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  return (
    <>
      <nav className="fixed top-0 z-30 w-full bg-white border-b border-gray-200 h-16">
        <div className="px-3 py-3 lg:px-5 lg:pl-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                type="button"
                className="lg:hidden p-2 text-gray-500 rounded-lg hover:bg-gray-100"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path clipRule="evenodd" fillRule="evenodd" d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10z" />
                </svg>
              </button>
              <span className="text-xl font-semibold text-gray-900 ml-2">
                ThreeDungeons
              </span>
            </div>
            <div className="flex items-center gap-4">
              {isSuperAdmin() && programs.length > 0 && (
                <select
                  value={selectedProgramId ?? ''}
                  onChange={(e) => setSelectedProgramId(e.target.value || null)}
                  className="text-sm border border-gray-300 rounded-lg px-2 py-1.5 bg-white text-gray-900"
                >
                  <option value="">Select program...</option>
                  {programs.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              )}
              <span className="text-sm text-gray-500">{profile?.email}</span>
              <button
                onClick={signOut}
                className="text-sm text-gray-500 hover:text-gray-900 cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <aside
        className={`fixed top-0 left-0 z-40 w-64 h-full pt-16 bg-white border-r border-gray-200 transition-transform lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-gray-900/50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        <div className="h-full px-3 pb-4 overflow-y-auto">
          <ul className="space-y-2 font-medium pt-4">
            {navItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center p-2 rounded-lg ${
                    isActive(item.path)
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <span className="ml-3">{item.label}</span>
                </Link>
              </li>
            ))}
            {isSuperAdmin() ? (
              <>
                <li className="pt-4 mt-4 border-t border-gray-200">
                  <span className="text-xs uppercase text-gray-500 px-2 py-2 block">
                    Admin
                  </span>
                </li>
                {adminItems.map((item) => (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className={`flex items-center p-2 rounded-lg ${
                        isActive(item.path)
                          ? 'bg-gray-100 text-gray-900'
                          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <span className="ml-3">{item.label}</span>
                    </Link>
                  </li>
                ))}
              </>
            ) : null}
          </ul>
        </div>
      </aside>

      <main className="lg:ml-64 bg-gray-50 pt-16 min-h-screen">
        <div className="p-4 lg:p-6">
          <Outlet />
        </div>
      </main>
    </>
  )
}
