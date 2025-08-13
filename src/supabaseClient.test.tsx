import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const SUPABASE_PATH = "./supabaseClient";

// Save original env vars
const originalEnv = {
  VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_API_KEY: process.env.VITE_SUPABASE_API_KEY,
};

beforeEach(() => {
  vi.resetModules(); // <-- resets module cache
});

afterEach(() => {
  // Restore original env vars
  vi.stubEnv("VITE_SUPABASE_URL", originalEnv.VITE_SUPABASE_URL || "");
  vi.stubEnv("VITE_SUPABASE_API_KEY", originalEnv.VITE_SUPABASE_API_KEY || "");
});

describe("supabaseClient", () => {
  it("does not throw when env vars are present", async () => {
    vi.stubEnv("VITE_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("VITE_SUPABASE_API_KEY", "my-test-key");

    const mod = await import(SUPABASE_PATH);
    expect(mod.supabase).toBeDefined();
  });

  it("throws when env vars are missing", async () => {
    vi.stubEnv("VITE_SUPABASE_URL", "");
    vi.stubEnv("VITE_SUPABASE_API_KEY", "");

    // Clear module cache so import re-evaluates with new env
    vi.resetModules();

    await expect(async () => {
      await import(SUPABASE_PATH);
    }).rejects.toThrowError("Missing Supabase url or key");
  });
});