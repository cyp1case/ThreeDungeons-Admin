import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ToastProvider } from './contexts/ToastContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { SelectedProgramProvider } from './contexts/SelectedProgramContext'
import { AdminRoute } from './components/AdminRoute'
import { AppShell } from './components/AppShell'
import { IndexRoute } from './components/IndexRoute'
import { SuperadminRedirectGuard } from './components/SuperadminRedirectGuard'
import { InspectLayout } from './components/InspectLayout'
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
import { GameSettingsPage } from './pages/GameSettingsPage'

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
              <Route path="/" element={<IndexRoute />} />
              <Route
                path="/residents"
                element={
                  <SuperadminRedirectGuard>
                    <ResidentsPage />
                  </SuperadminRedirectGuard>
                }
              />
              <Route
                path="/residents/:id"
                element={
                  <SuperadminRedirectGuard>
                    <ResidentDetailPage />
                  </SuperadminRedirectGuard>
                }
              />
              <Route
                path="/cohorts"
                element={
                  <SuperadminRedirectGuard>
                    <CohortsPage />
                  </SuperadminRedirectGuard>
                }
              />
              <Route
                path="/cohorts/:id"
                element={
                  <SuperadminRedirectGuard>
                    <CohortDetailPage />
                  </SuperadminRedirectGuard>
                }
              />
              <Route
                path="/dungeons"
                element={
                  <SuperadminRedirectGuard>
                    <DungeonsPage />
                  </SuperadminRedirectGuard>
                }
              />
              <Route
                path="/admin/programs"
                element={
                  <AdminRoute>
                    <ProgramsPage />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/programs/:programId"
                element={
                  <AdminRoute>
                    <InspectLayout />
                  </AdminRoute>
                }
              >
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="residents" element={<ResidentsPage />} />
                <Route path="residents/:id" element={<ResidentDetailPage />} />
                <Route path="cohorts" element={<CohortsPage />} />
                <Route path="cohorts/:id" element={<CohortDetailPage />} />
                <Route path="dungeons" element={<DungeonsPage />} />
              </Route>
              <Route
                path="/admin/invites"
                element={
                  <AdminRoute>
                    <InvitesPage />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/game-settings"
                element={
                  <AdminRoute>
                    <GameSettingsPage />
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
