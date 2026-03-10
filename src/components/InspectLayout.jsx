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
      <div className="sticky top-0 z-10 -mx-7 -mt-7 mb-6 px-7 py-3 bg-surface-card border-l-4 border-flag-yellow flex items-center justify-between gap-4">
        <span className="font-sans text-sm text-text-primary">
          Inspecting: <strong>{programName}</strong>
        </span>
        <Link
          to="/admin/programs"
          className="text-sm text-royal-blue-light hover:text-royal-blue hover:underline"
        >
          Back to Programs
        </Link>
      </div>
      <Outlet />
    </>
  );
}
