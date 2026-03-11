import { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useSelectedProgram } from "../contexts/SelectedProgramContext";

export function AppShell() {
  const { profile, signOut, isSuperAdmin, profileLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { programName, isInspecting, linkPrefix } = useSelectedProgram();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  const leaderNavItems = [
    { path: "/", label: "Dashboard" },
    { path: "/residents", label: "Residents" },
    { path: "/cohorts", label: "Cohorts" },
    { path: "/dungeons", label: "Dungeons" },
  ];

  const inspectNavItems = isInspecting
    ? [
        { path: `${linkPrefix}/dashboard`, label: "Dashboard" },
        { path: `${linkPrefix}/residents`, label: "Residents" },
        { path: `${linkPrefix}/cohorts`, label: "Cohorts" },
        { path: `${linkPrefix}/dungeons`, label: "Dungeons" },
      ]
    : [];

  const adminItems = [
    { path: "/admin/programs", label: "Programs" },
    { path: "/admin/invites", label: "Invites" },
    { path: "/admin/game-settings", label: "Game Settings" },
  ];

  const isActive = (path) => {
    if (path === "/") return location.pathname === "/" && !isInspecting;
    return location.pathname.startsWith(path);
  };

  const renderNavLink = (item) => (
    <li key={item.path}>
      <Link
        to={item.path}
        className={`block py-2.5 pl-6 pr-3.5 rounded-sm font-pixel text-[9px] uppercase tracking-wider leading-relaxed ${
          isActive(item.path)
            ? "bg-royal-blue text-flag-yellow border-2 border-royal-blue-light shadow-[0_0_12px_rgba(29,59,142,0.4)]"
            : "text-text-muted border-2 border-transparent hover:bg-white/5 hover:text-text-bright hover:border-border-accent"
        }`}
        style={
          isActive(item.path)
            ? { textShadow: "0 0 8px rgba(244,196,48,0.3)" }
            : {}
        }
        onClick={() => setSidebarOpen(false)}
      >
        {item.label}
      </Link>
    </li>
  );

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-surface-page flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-border-dark border-t-royal-blue rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <aside
        className={`fixed top-0 left-0 z-40 w-[260px] h-full bg-surface-sidebar border-r-[3px] border-royal-blue shadow-[3px_0_20px_rgba(29,59,142,0.4)] transition-transform lg:translate-x-0 flex flex-col ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
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
              style={{
                textShadow:
                  "0 0 10px rgba(244,196,48,0.3), 2px 2px 0 rgba(0,0,0,0.5)",
              }}
            >
              THREE
              <br />
              DUNGEONS
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
              <path
                clipRule="evenodd"
                fillRule="evenodd"
                d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10z"
              />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-3 pb-4">
          {isInspecting ? (
            <>
              {programName && (
                <div
                  className="font-pixel text-[9px] text-flag-yellow px-3.5 pt-5 pb-2 truncate"
                  style={{
                    textShadow:
                      "0 0 8px rgba(244,196,48,0.3), 2px 2px 0 rgba(0,0,0,0.5)",
                  }}
                >
                  {programName}
                </div>
              )}
              <ul className="space-y-1">
                {inspectNavItems.map(renderNavLink)}
              </ul>
              <hr className="border-border-dark my-3" />
              <div className="font-sans text-[11px] font-bold uppercase tracking-[2px] text-text-muted px-3.5 pb-2">
                Admin
              </div>
              <ul className="space-y-1">{adminItems.map(renderNavLink)}</ul>
            </>
          ) : (
            <>
              <div className="font-sans text-[11px] font-bold uppercase tracking-[2px] text-text-muted px-3.5 pt-5 pb-2">
                Navigate
              </div>
              <ul className="space-y-1">
                {(isSuperAdmin() ? adminItems : leaderNavItems).map(
                  renderNavLink,
                )}
              </ul>
            </>
          )}
        </div>
        <div className="px-5 py-3 border-t border-border-dark mt-auto">
          <p className="text-xs text-text-muted truncate">{profile?.email}</p>
          <button
            onClick={handleSignOut}
            className="w-full mt-2 px-4 py-2 text-white bg-gradient-to-b from-roof-red-light to-roof-red border-2 border-[#A82518] rounded-sm shadow-[0_0_8px_rgba(211,47,35,0.3)] uppercase tracking-wider text-[10px] font-bold"
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
              <path
                clipRule="evenodd"
                fillRule="evenodd"
                d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10z"
              />
            </svg>
          </button>
        )}
        <div className="p-7">
          <Outlet />
        </div>
      </main>
    </>
  );
}
