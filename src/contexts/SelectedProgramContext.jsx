/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthContext";

const INSPECT_PATH_REGEX = /^\/admin\/programs\/([^/]+)/;

const SelectedProgramContext = createContext(null);

export function SelectedProgramProvider({ children }) {
  const { profile, isSuperAdmin } = useAuth();
  const location = useLocation();
  const [loadedProgramId, setLoadedProgramId] = useState(null);
  const [programName, setProgramName] = useState(null);
  const [programExists, setProgramExists] = useState(true);

  const isSuper = isSuperAdmin();
  const programIdFromUrl = (location.pathname.match(INSPECT_PATH_REGEX) ??
    [])[1];

  const effectiveProgramId =
    isSuper && programIdFromUrl
      ? programIdFromUrl
      : (profile?.program_id ?? null);

  const isInspecting = isSuper && !!programIdFromUrl;

  useEffect(() => {
    if (!programIdFromUrl) {
      return;
    }
    let cancelled = false;
    async function loadProgram() {
      const { data, error } = await supabase
        .from("programs")
        .select("name")
        .eq("id", programIdFromUrl)
        .single();

      if (cancelled) return;

      setLoadedProgramId(programIdFromUrl);
      if (error || !data) {
        setProgramName(null);
        setProgramExists(false);
        return;
      }

      setProgramName(data.name);
      setProgramExists(true);
    }

    loadProgram();
    return () => {
      cancelled = true;
    };
  }, [programIdFromUrl]);

  const programLoading = isInspecting && loadedProgramId !== programIdFromUrl;

  const linkPrefix =
    isInspecting && effectiveProgramId
      ? `/admin/programs/${effectiveProgramId}`
      : "";

  const resolvedProgramName =
    isInspecting && !programLoading ? programName : null;
  const resolvedProgramExists = isInspecting
    ? programLoading || programExists
    : true;
  const resolvedProgramLoading = isInspecting ? programLoading : false;

  return (
    <SelectedProgramContext.Provider
      value={{
        effectiveProgramId,
        programName: resolvedProgramName,
        isInspecting,
        linkPrefix,
        programLoading: resolvedProgramLoading,
        programExists: resolvedProgramExists,
      }}
    >
      {children}
    </SelectedProgramContext.Provider>
  );
}

export function useSelectedProgram() {
  const ctx = useContext(SelectedProgramContext);
  if (!ctx)
    throw new Error(
      "useSelectedProgram must be used within SelectedProgramProvider",
    );
  return ctx;
}
