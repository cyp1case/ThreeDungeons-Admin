import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ToastProvider } from "./contexts/ToastContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { SelectedProgramProvider } from "./contexts/SelectedProgramContext";
import { AdminRoute } from "./components/AdminRoute";
import { AppShell } from "./components/AppShell";
import { SuperadminRedirectGuard } from "./components/SuperadminRedirectGuard";

const LoginPage = lazy(() =>
  import("./pages/LoginPage").then((m) => ({ default: m.LoginPage })),
);
const SignupPage = lazy(() =>
  import("./pages/SignupPage").then((m) => ({ default: m.SignupPage })),
);
const DashboardPage = lazy(() =>
  import("./pages/DashboardPage").then((m) => ({ default: m.DashboardPage })),
);
const ResidentsPage = lazy(() =>
  import("./pages/ResidentsPage").then((m) => ({ default: m.ResidentsPage })),
);
const ResidentDetailPage = lazy(() =>
  import("./pages/ResidentDetailPage").then((m) => ({
    default: m.ResidentDetailPage,
  })),
);
const CohortsPage = lazy(() =>
  import("./pages/CohortsPage").then((m) => ({ default: m.CohortsPage })),
);
const CohortDetailPage = lazy(() =>
  import("./pages/CohortDetailPage").then((m) => ({
    default: m.CohortDetailPage,
  })),
);
const DungeonsPage = lazy(() =>
  import("./pages/DungeonsPage").then((m) => ({ default: m.DungeonsPage })),
);
const ProgramsPage = lazy(() =>
  import("./pages/ProgramsPage").then((m) => ({ default: m.ProgramsPage })),
);
const InvitesPage = lazy(() =>
  import("./pages/InvitesPage").then((m) => ({ default: m.InvitesPage })),
);
const GameSettingsPage = lazy(() =>
  import("./pages/GameSettingsPage").then((m) => ({
    default: m.GameSettingsPage,
  })),
);
const IndexRoute = lazy(() =>
  import("./components/IndexRoute").then((m) => ({ default: m.IndexRoute })),
);
const InspectLayout = lazy(() =>
  import("./components/InspectLayout").then((m) => ({
    default: m.InspectLayout,
  })),
);

const RouteFallback = () => (
  <div className="min-h-screen bg-surface-page flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-border-dark border-t-royal-blue rounded-full animate-spin" />
  </div>
);

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <Suspense fallback={<RouteFallback />}>
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
                  <Route
                    path="residents/:id"
                    element={<ResidentDetailPage />}
                  />
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
          </Suspense>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
