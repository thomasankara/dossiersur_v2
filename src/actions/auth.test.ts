import { describe, it, expect, vi, beforeEach } from "vitest";
import { buildFormData } from "@/__tests__/helpers/form-data";

// Mocks
const mockSupabase = {
  auth: {
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    signInWithOAuth: vi.fn(),
    signOut: vi.fn(),
    resetPasswordForEmail: vi.fn(),
  },
};

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
}));

vi.mock("@/lib/rate-limit", () => ({
  rateLimit: vi.fn(() => ({ success: true, remaining: 4 })),
}));

// Import after mocks
import { login, signup, loginWithGoogle, logout, resetPassword } from "./auth";
import { rateLimit } from "@/lib/rate-limit";

describe("login()", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns error on invalid email", async () => {
    const fd = buildFormData({ email: "not-an-email", password: "123456" });
    const result = await login(fd);
    expect(result).toEqual({ error: "Email invalide" });
  });

  it("returns error on short password", async () => {
    const fd = buildFormData({ email: "test@example.com", password: "123" });
    const result = await login(fd);
    expect(result).toEqual({ error: "Mot de passe trop court (6 caractères minimum)" });
  });

  it("returns error on signIn failure", async () => {
    mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
      error: { message: "Invalid" },
    });
    const fd = buildFormData({ email: "test@example.com", password: "123456" });
    const result = await login(fd);
    expect(result).toEqual({ error: "Email ou mot de passe incorrect" });
  });

  it("redirects on success", async () => {
    mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({ error: null });
    const fd = buildFormData({ email: "test@example.com", password: "123456" });
    await expect(login(fd)).rejects.toThrow("NEXT_REDIRECT:/dashboard");
  });

  it("uses safe redirect for redirect param", async () => {
    mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({ error: null });
    const fd = buildFormData({
      email: "test@example.com",
      password: "123456",
      redirect: "https://evil.com",
    });
    await expect(login(fd)).rejects.toThrow("NEXT_REDIRECT:/dashboard");
  });

  it("allows valid internal redirect", async () => {
    mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({ error: null });
    const fd = buildFormData({
      email: "test@example.com",
      password: "123456",
      redirect: "/dashboard/billing",
    });
    await expect(login(fd)).rejects.toThrow("NEXT_REDIRECT:/dashboard/billing");
  });

  it("returns error when rate limited", async () => {
    vi.mocked(rateLimit).mockReturnValueOnce({ success: false, remaining: 0 });
    const fd = buildFormData({ email: "test@example.com", password: "123456" });
    const result = await login(fd);
    expect(result).toEqual({ error: "Trop de tentatives. Réessayez dans une minute." });
  });
});

describe("signup()", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns error on validation failure", async () => {
    const fd = buildFormData({ email: "bad", password: "123456", fullName: "Test" });
    const result = await signup(fd);
    expect(result).toEqual({ error: "Email invalide" });
  });

  it("returns error for already registered", async () => {
    mockSupabase.auth.signUp.mockResolvedValueOnce({
      error: { message: "User already registered" },
    });
    const fd = buildFormData({ email: "test@example.com", password: "123456", fullName: "Test" });
    const result = await signup(fd);
    expect(result).toEqual({ error: "Un compte existe déjà avec cet email" });
  });

  it("redirects on success", async () => {
    mockSupabase.auth.signUp.mockResolvedValueOnce({ error: null });
    const fd = buildFormData({ email: "test@example.com", password: "123456", fullName: "Test" });
    await expect(signup(fd)).rejects.toThrow("NEXT_REDIRECT:/dashboard");
  });
});

describe("loginWithGoogle()", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns error on OAuth failure", async () => {
    mockSupabase.auth.signInWithOAuth.mockResolvedValueOnce({
      data: { url: null },
      error: { message: "Error" },
    });
    const result = await loginWithGoogle();
    expect(result).toEqual({ error: "Erreur de connexion Google" });
  });

  it("redirects to OAuth URL on success", async () => {
    mockSupabase.auth.signInWithOAuth.mockResolvedValueOnce({
      data: { url: "https://accounts.google.com/oauth" },
      error: null,
    });
    await expect(loginWithGoogle()).rejects.toThrow(
      "NEXT_REDIRECT:https://accounts.google.com/oauth",
    );
  });
});

describe("logout()", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("signs out and redirects to /login", async () => {
    mockSupabase.auth.signOut.mockResolvedValueOnce({ error: null });
    await expect(logout()).rejects.toThrow("NEXT_REDIRECT:/login");
    expect(mockSupabase.auth.signOut).toHaveBeenCalled();
  });
});

describe("resetPassword()", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns error on invalid email", async () => {
    const fd = buildFormData({ email: "not-an-email" });
    const result = await resetPassword(fd);
    expect(result).toEqual({ error: "Email invalide" });
  });

  it("returns success on valid reset", async () => {
    mockSupabase.auth.resetPasswordForEmail.mockResolvedValueOnce({ error: null });
    const fd = buildFormData({ email: "test@example.com" });
    const result = await resetPassword(fd);
    expect(result).toEqual({ success: "Lien de réinitialisation envoyé par email" });
  });

  it("returns error on supabase failure", async () => {
    mockSupabase.auth.resetPasswordForEmail.mockResolvedValueOnce({
      error: { message: "Error" },
    });
    const fd = buildFormData({ email: "test@example.com" });
    const result = await resetPassword(fd);
    expect(result).toEqual({ error: "Erreur lors de l'envoi du lien" });
  });
});
