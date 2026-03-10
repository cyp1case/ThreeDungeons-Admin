import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ToastProvider } from './contexts/ToastContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { SelectedProgramProvider } from './contexts/SelectedProgramContext'
import { AdminRoute } from './components/AdminRoute'
import { AppShell } from './components/AppShell'
import { LoginPage } from './pages/LoginPage'
import { SignupPage } from './pages/SignupPage'
import { DashboardPage } from './pages/DashboardPage'
import { ResidentsPage } from './pages/ResidentsPage'
import { ResidentDetailPage } from './pages/ResidentDetailPage'
import { CohortsPage } from './pages/CohortsPage'
import { CohortDetailPage } from './pages/CohortDetailPage'
import { DungeonsPage } from './pages/DungeonsPage'
import { ProgramsPage } from './pages/ProgramsPage'
import { InvitesPage } from './pages/InvitesPage'

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route
              element={
                <ProtectedRoute>
                  <SelectedProgramProvider>
                    <AppShell />
                  </SelectedProgramProvider>
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<DashboardPage />} />
              <Route path="/residents" element={<ResidentsPage />} />
              <Route path="/residents/:id" element={<ResidentDetailPage />} />
              <Route path="/cohorts" element={<CohortsPage />} />
              <Route path="/cohorts/:id" element={<CohortDetailPage />} />
              <Route path="/dungeons" element={<DungeonsPage />} />
              <Route
                path="/admin/programs"
                element={
                  <AdminRoute>
                    <ProgramsPage />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/invites"
                element={
                  <AdminRoute>
                    <InvitesPage />
                  </AdminRoute>
                }
              />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  )
}
