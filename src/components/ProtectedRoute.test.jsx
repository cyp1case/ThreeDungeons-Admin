/**
 * Excluded from default test run (vite.config.js) due to hang when run.
 * TODO: Debug mock/Navigate interaction and re-enable.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { ProtectedRoute } from "./ProtectedRoute";

vi.mock("../contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));

describe("ProtectedRoute", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({ session: null, loading: true });
  });

  it("shows spinner when loading", () => {
    useAuth.mockReturnValue({ session: null, loading: true });
    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Protected content</div>
        </ProtectedRoute>
      </MemoryRouter>,
    );
    expect(screen.queryByText("Protected content")).not.toBeInTheDocument();
    const spinner = document.querySelector(".animate-spin");
    expect(spinner).toBeInTheDocument();
  });

  it("renders children when authenticated", () => {
    useAuth.mockReturnValue({
      session: { user: { id: "u1" } },
      loading: false,
    });
    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Protected content</div>
        </ProtectedRoute>
      </MemoryRouter>,
    );
    expect(screen.getByText("Protected content")).toBeInTheDocument();
  });
});
