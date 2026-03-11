import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "../contexts/AuthContext";
import { ToastProvider } from "../contexts/ToastContext";
import { SelectedProgramProvider } from "../contexts/SelectedProgramContext";

/**
 * Renders a component with router and all app providers.
 * Use when testing components that need auth, program context, or toast.
 *
 * @param {React.ReactElement} ui - Component to render
 * @param {{ initialEntries?: string[], initialIndex?: number }} options - Router options
 */
export function renderWithProviders(ui, options = {}) {
  const { initialEntries = ["/"], initialIndex = 0 } = options;

  return render(
    <MemoryRouter initialEntries={initialEntries} initialIndex={initialIndex}>
      <AuthProvider>
        <ToastProvider>
          <SelectedProgramProvider>{ui}</SelectedProgramProvider>
        </ToastProvider>
      </AuthProvider>
    </MemoryRouter>,
  );
}
