import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import { MemoryRouter } from "react-router-dom";

import {
  AppStateProvider,
  useAppState,
} from "./AppStateContext";

import * as pageStateModule from "./usePageState";

vi.mock("./withInitialState", () => ({
  withInitialState: (Component: any) => (props: any) => <Component {...props} />,
}));

describe("AppStateContext", () => {
  const mockPageState = {
    someState: 123,
    someHandler: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("AppStateProvider renders children and provides context", async () => {
    vi.spyOn(pageStateModule, "usePageState").mockReturnValue(mockPageState);

    const Child = () => {
      const context = useAppState();
      expect(context).toBe(mockPageState);
      return <div>Child Component</div>;
    };

    render(
      <MemoryRouter>
        <AppStateProvider initialState={{ id: "page1", title: "Page 1" }}>
          <Child />
        </AppStateProvider>
      </MemoryRouter>
    );

    expect(screen.getByText("Child Component")).toBeInTheDocument();

    expect(pageStateModule.usePageState).toHaveBeenCalledWith(
      expect.objectContaining({ id: "page1" })
    );
  });
});
