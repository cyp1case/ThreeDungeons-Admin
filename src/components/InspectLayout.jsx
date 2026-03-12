import { useEffect } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { useSelectedProgram } from "../contexts/SelectedProgramContext";

export function InspectLayout() {
  const navigate = useNavigate();
  const { isInspecting, programExists, programLoading, programName } =
    useSelectedProgram();

  useEffect(() => {
    if (!isInspecting || programLoading || programExists) return;
    navigate("/admin/programs", { replace: true });
  }, [isInspecting, navigate, programExists, programLoading]);

  if (programLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-border-dark border-t-royal-blue rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="sticky top-0 z-10 -mx-7 -mt-7 mb-6 px-7 py-3 bg-gradient-to-b from-roof-red-light to-roof-red border-b-[3px] border-[#A82518] flex items-center justify-between gap-4">
        <span
          className="font-pixel text-[10px] text-white uppercase tracking-wider"
          style={{
            textShadow:
              "0 0 8px rgba(255,255,255,0.3), 2px 2px 0 rgba(0,0,0,0.5)",
          }}
        >
          {programName}
        </span>
        <Link
          to="/admin/programs"
          className="px-3 py-1.5 text-white bg-surface-sidebar/60 border-2 border-white/30 rounded-sm uppercase tracking-wider text-[10px] font-bold hover:bg-surface-sidebar"
        >
          Exit Program View
        </Link>
      </div>
      <Outlet />
    </>
  );
}
