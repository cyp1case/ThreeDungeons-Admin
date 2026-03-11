import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { DashboardPage } from "./DashboardPage";
import { setSupabaseMockData } from "../test/mocks/supabase";

vi.mock("../lib/supabase", async () => {
  const { createSupabaseMock } = await import("../test/mocks/supabase.js");
  return { supabase: createSupabaseMock() };
});
vi.mock("../contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));
vi.mock("../contexts/SelectedProgramContext", () => ({
  useSelectedProgram: vi.fn(),
}));

import { useAuth } from "../contexts/AuthContext";
import { useSelectedProgram } from "../contexts/SelectedProgramContext";

describe("DashboardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({ profileLoading: false });
    useSelectedProgram.mockReturnValue({
      effectiveProgramId: "prog-1",
      linkPrefix: "",
    });
  });

  it("shows empty state when no residents", async () => {
    setSupabaseMockData({
      residents: [],
      cohorts: [],
      attempts: [],
      resident_cohorts: [],
    });

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/No residents yet/)).toBeInTheDocument();
    });
  });

  it("shows summary cards when residents exist", async () => {
    setSupabaseMockData({
      residents: [
        {
          id: "r1",
          active: true,
          display_name: "Alice",
          email: "alice@test.com",
        },
        {
          id: "r2",
          active: true,
          display_name: "Bob",
          email: "bob@test.com",
        },
      ],
      cohorts: [{ id: "c1", name: "Cohort A" }],
      attempts: [
        {
          resident_id: "r1",
          module_id: "Cradle_Sentinel_Q1",
          outcome: "correct",
        },
      ],
      resident_cohorts: [{ resident_id: "r1", cohort_id: "c1" }],
    });

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("DASHBOARD")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText("Total Residents")).toBeInTheDocument();
    });
  });
});
