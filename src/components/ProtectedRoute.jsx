import { useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export function ProtectedRoute({ children }) {
  const { session, profile, loading, signOut } = useAuth()
  const location = useLocation()

  useEffect(() => {
    if (!loading && session && !profile) {
      signOut()
    }
  }, [loading, session, profile, signOut])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-primary-700 rounded-full animate-spin" />
      </div>
    )
  }

  if (!session || !profile) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}
