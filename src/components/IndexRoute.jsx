import { useAuth } from "../contexts/AuthContext";
import { DashboardPage } from "../pages/DashboardPage";
import { SuperadminDashboardPage } from "../pages/SuperadminDashboardPage";

/**
 * Renders DashboardPage for leaders, SuperadminDashboardPage for superadmins.
 */
export function IndexRoute() {
  const { isSuperAdmin, profileLoading } = useAuth();
  if (profileLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-border-dark border-t-royal-blue rounded-full animate-spin" />
      </div>
    );
  }
  if (isSuperAdmin()) {
    return <SuperadminDashboardPage />;
  }
  return <DashboardPage />;
}
