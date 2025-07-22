import { render, screen, waitFor } from "@testing-library/react";
import { AuthSessionProvider, useAuthSession } from "./AuthSessionContext";
import { vi } from "vitest";
import { supabase } from "../supabaseClient";
import type { Session } from "@supabase/supabase-js";
import { act } from "react";

vi.mock("../supabaseClient", () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(),
    },
  },
}));

const Consumer = () => {
  const { session, loading } = useAuthSession();
  return (
    <div>
      <div>Loading: {loading ? "true" : "false"}</div>
      <div>Session: {session ? "yes" : "no"}</div>
    </div>
  );
};

describe("AuthSessionProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders children and shows loading initially", async () => {
    (supabase.auth.getSession as any).mockResolvedValueOnce({ data: { session: null }, error: null });
    (supabase.auth.onAuthStateChange as any).mockImplementation((_cb: any) => {});

    render(
      <AuthSessionProvider>
        <Consumer />
      </AuthSessionProvider>
    );

    expect(screen.getByText("Loading: true")).toBeInTheDocument();
    expect(screen.getByText("Session: no")).toBeInTheDocument();
  });

  it("sets session and loading when session exists", async () => {
    const fakeSession = { user: { id: "abc123" } } as Session;

    (supabase.auth.getSession as any).mockResolvedValueOnce({
      data: { session: fakeSession },
      error: null,
    });

    (supabase.auth.onAuthStateChange as any).mockImplementation((cb: any) => {
      cb("SIGNED_IN", fakeSession);
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });

    render(
      <AuthSessionProvider>
        <Consumer />
      </AuthSessionProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Loading: false")).toBeInTheDocument();
      expect(screen.getByText("Session: yes")).toBeInTheDocument();
    });
  });

  it("updates session on auth state change", async () => {
    const fakeSession = { user: { id: "xyz789" } } as Session;

    (supabase.auth.getSession as any).mockResolvedValueOnce({
      data: { session: null },
      error: null,
    });

    let authCallback: any;
    (supabase.auth.onAuthStateChange as any).mockImplementation((cb: any) => {
      authCallback = cb;
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });

    render(
      <AuthSessionProvider>
        <Consumer />
      </AuthSessionProvider>
    );

    // Simulate login
    act(() => {
      authCallback("SIGNED_IN", fakeSession);
    });

    await waitFor(() => {
      expect(screen.getByText("Loading: false")).toBeInTheDocument();
      expect(screen.getByText("Session: yes")).toBeInTheDocument();
    });
  });
});