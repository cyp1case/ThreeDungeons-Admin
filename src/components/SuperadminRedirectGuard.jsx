import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

/**
 * Redirects superadmin to / when they try to access leader-only routes directly.
 * Leaders pass through unchanged.
 */
export function SuperadminRedirectGuard({ children }) {
  const { isSuperAdmin } = useAuth()
  if (isSuperAdmin()) {
    return <Navigate to="/" replace />
  }
  return children
}
