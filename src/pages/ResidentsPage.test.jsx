import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { ResidentsPage } from "./ResidentsPage";
import { setSupabaseMockData } from "../test/mocks/supabase";

vi.mock("../lib/supabase", async () => {
  const { createSupabaseMock } = await import("../test/mocks/supabase.js");
  return { supabase: createSupabaseMock() };
});
vi.mock("../contexts/SelectedProgramContext", () => ({
  useSelectedProgram: vi.fn(),
}));
vi.mock("../contexts/ToastContext", () => ({
  useToast: vi.fn(() => ({ showToast: vi.fn() })),
}));

import { useSelectedProgram } from "../contexts/SelectedProgramContext";

describe("ResidentsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useSelectedProgram.mockReturnValue({
      effectiveProgramId: "prog-1",
      linkPrefix: "",
      programName: null,
      isInspecting: false,
    });
    setSupabaseMockData({
      residents: [
        {
          id: "r1",
          email: "alice@test.com",
          display_name: "Alice",
          active: true,
        },
        {
          id: "r2",
          email: "bob@example.com",
          display_name: "Bob Smith",
          active: true,
        },
      ],
      cohorts: [{ id: "c1", name: "Cohort A" }],
      resident_cohorts: [{ resident_id: "r1", cohort_id: "c1" }],
    });
  });

  it("renders residents table from mock data", async () => {
    render(
      <MemoryRouter>
        <ResidentsPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("RESIDENTS")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText("Alice")).toBeInTheDocument();
      expect(screen.getByText("Bob Smith")).toBeInTheDocument();
    });
  });

  it("filters residents by search input", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <ResidentsPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Alice")).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText("Search residents...");
    await user.type(searchInput, "bob");

    await waitFor(() => {
      expect(screen.queryByText("Alice")).not.toBeInTheDocument();
      expect(screen.getByText("Bob Smith")).toBeInTheDocument();
    });
  });

  it("opens Add Resident modal when Add Resident button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <ResidentsPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("RESIDENTS")).toBeInTheDocument();
    });

    const addButton = screen.getByRole("button", { name: /Add Resident/i });
    await user.click(addButton);

    await waitFor(() => {
      expect(screen.getByText("Email (required)")).toBeInTheDocument();
    });
  });
});
