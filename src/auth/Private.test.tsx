import { render, screen } from "@testing-library/react";
import { Private } from "./Private";
import { useAuthSession } from "./AuthSessionContext";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";

vi.mock("./AuthSessionContext", () => ({
  useAuthSession: vi.fn(),
}));

const mockedUseAuthSession = useAuthSession as vi.Mock;

describe("<Private />", () => {
  it("renders loading state when loading is true", () => {
    mockedUseAuthSession.mockReturnValue({ session: null, loading: true });

    render(<Private><div>Protected</div></Private>, { wrapper: MemoryRouter });

    expect(screen.getByText("Authenticating...")).toBeInTheDocument();
  });

  it("renders children when session exists", () => {
    mockedUseAuthSession.mockReturnValue({ session: { user: {} }, loading: false });

    render(<Private><div>Protected</div></Private>, { wrapper: MemoryRouter });

    expect(screen.getByText("Protected")).toBeInTheDocument();
  });

  it("redirects to /auth when session is null", () => {
    mockedUseAuthSession.mockReturnValue({ session: null, loading: false });

    render(<Private><div>Protected</div></Private>, { wrapper: MemoryRouter });

    expect(screen.queryByText("Protected")).not.toBeInTheDocument();
  });
});