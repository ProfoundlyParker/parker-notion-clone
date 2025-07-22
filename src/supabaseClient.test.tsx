import { describe, it, expect, vi } from "vitest";

vi.stubEnv("VITE_SUPABASE_URL", "https://example.supabase.co");
vi.stubEnv("VITE_SUPABASE_API_KEY", "my-test-key");

describe("supabaseClient", () => {
  it("does not throw when env vars are present", async () => {
    const mod = await import("./supabaseClient");
    expect(mod.supabase).toBeDefined();
  });
});