import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "./App";
import { vi } from "vitest";

// Mock the nested components
vi.mock("./Page/Page", () => ({
  Page: () => <div>Mock Page</div>,
}));
vi.mock("./auth/Auth", () => ({
  Auth: () => <div>Mock Auth</div>,
}));
vi.mock("./auth/Private", () => ({
  Private: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock("./state/AppStateContext", () => ({
  AppStateProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe("<App /> routing", () => {
  it("renders Auth page at /auth", () => {
    render(
      <MemoryRouter initialEntries={["/auth"]}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByText("Mock Auth")).toBeInTheDocument();
  });

  it("renders Page with Private and AppStateProvider at /", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByText("Mock Page")).toBeInTheDocument();
  });

  it("renders Page with Private and AppStateProvider at /123", () => {
    render(
      <MemoryRouter initialEntries={["/123"]}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByText("Mock Page")).toBeInTheDocument();
  });
});