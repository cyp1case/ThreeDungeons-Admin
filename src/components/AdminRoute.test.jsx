import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AdminRoute } from "./AdminRoute";

vi.mock("../contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from "../contexts/AuthContext";

describe("AdminRoute", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows spinner when loading", () => {
    useAuth.mockReturnValue({
      session: null,
      loading: true,
      profileLoading: false,
      isSuperAdmin: () => false,
    });
    render(
      <MemoryRouter>
        <AdminRoute>
          <div>Admin content</div>
        </AdminRoute>
      </MemoryRouter>,
    );
    expect(screen.queryByText("Admin content")).not.toBeInTheDocument();
    const spinner = document.querySelector(".animate-spin");
    expect(spinner).toBeInTheDocument();
  });

  it("shows spinner when session exists but profile is loading", () => {
    useAuth.mockReturnValue({
      session: { user: { id: "u1" } },
      loading: false,
      profileLoading: true,
      isSuperAdmin: () => false,
    });
    render(
      <MemoryRouter>
        <AdminRoute>
          <div>Admin content</div>
        </AdminRoute>
      </MemoryRouter>,
    );
    expect(screen.queryByText("Admin content")).not.toBeInTheDocument();
    const spinner = document.querySelector(".animate-spin");
    expect(spinner).toBeInTheDocument();
  });

  it("does not render children when not superadmin", () => {
    useAuth.mockReturnValue({
      session: { user: { id: "u1" } },
      loading: false,
      profileLoading: false,
      isSuperAdmin: () => false,
    });
    render(
      <MemoryRouter initialEntries={["/admin/programs"]}>
        <AdminRoute>
          <div>Admin content</div>
        </AdminRoute>
      </MemoryRouter>,
    );
    expect(screen.queryByText("Admin content")).not.toBeInTheDocument();
  });

  it("does not render children when no session", () => {
    useAuth.mockReturnValue({
      session: null,
      loading: false,
      profileLoading: false,
      isSuperAdmin: () => false,
    });
    render(
      <MemoryRouter initialEntries={["/admin/programs"]}>
        <AdminRoute>
          <div>Admin content</div>
        </AdminRoute>
      </MemoryRouter>,
    );
    expect(screen.queryByText("Admin content")).not.toBeInTheDocument();
  });

  it("renders children when superadmin", () => {
    useAuth.mockReturnValue({
      session: { user: { id: "u1" } },
      loading: false,
      profileLoading: false,
      isSuperAdmin: () => true,
    });
    render(
      <MemoryRouter>
        <AdminRoute>
          <div>Admin content</div>
        </AdminRoute>
      </MemoryRouter>,
    );
    expect(screen.getByText("Admin content")).toBeInTheDocument();
  });
});
