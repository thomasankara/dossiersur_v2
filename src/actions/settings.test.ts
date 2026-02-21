import { describe, it, expect, vi, beforeEach } from "vitest";
import { buildFormData } from "@/__tests__/helpers/form-data";

const mockSupabase = {
  auth: {
    getUser: vi.fn(),
    signInWithPassword: vi.fn(),
    updateUser: vi.fn(),
    signOut: vi.fn(),
  },
};

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
}));

const mockAdminChain: Record<string, ReturnType<typeof vi.fn>> = {};
["from", "update", "eq"].forEach((m) => {
  mockAdminChain[m] = vi.fn(() => mockAdminChain);
});
Object.defineProperty(mockAdminChain, "then", {
  value: (resolve: (v: unknown) => void) => resolve({ data: null, error: null }),
  enumerable: false,
  configurable: true,
});

const mockAdmin = {
  ...mockAdminChain,
  auth: {
    admin: {
      deleteUser: vi.fn().mockResolvedValue({ error: null }),
    },
  },
};

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => mockAdmin),
}));

import { updateProfile, updatePassword, deleteAccount } from "./settings";
import { revalidatePath } from "next/cache";

function setupAuth(user = { id: "user-123", email: "test@example.com" }) {
  mockSupabase.auth.getUser.mockResolvedValue({
    data: { user },
    error: null,
  });
}

describe("updateProfile()", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupAuth();
    mockSupabase.auth.updateUser.mockResolvedValue({ data: {}, error: null });
  });

  it("returns error on empty name", async () => {
    const fd = buildFormData({ fullName: "" });
    const result = await updateProfile(fd);
    expect(result).toEqual({ error: "Nom requis" });
  });

  it("returns error when not authenticated", async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: null,
    });
    const fd = buildFormData({ fullName: "Test" });
    const result = await updateProfile(fd);
    expect(result).toEqual({ error: "Non authentifié" });
  });

  it("returns error if auth update fails", async () => {
    mockSupabase.auth.updateUser.mockResolvedValueOnce({
      error: { message: "Error" },
    });
    const fd = buildFormData({ fullName: "New Name" });
    const result = await updateProfile(fd);
    expect(result).toEqual({ error: "Erreur lors de la mise à jour" });
  });

  it("returns success and revalidates", async () => {
    const fd = buildFormData({ fullName: "New Name" });
    const result = await updateProfile(fd);
    expect(result).toEqual({ success: true });
    expect(revalidatePath).toHaveBeenCalledWith("/dashboard/settings");
  });
});

describe("updatePassword()", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupAuth();
    mockSupabase.auth.signInWithPassword.mockResolvedValue({ error: null });
    mockSupabase.auth.updateUser.mockResolvedValue({ data: {}, error: null });
  });

  it("returns error on password mismatch", async () => {
    const fd = buildFormData({
      currentPassword: "oldpass1",
      newPassword: "newpass123",
      confirmPassword: "different",
    });
    const result = await updatePassword(fd);
    expect(result).toEqual({ error: "Les mots de passe ne correspondent pas" });
  });

  it("returns error on short new password", async () => {
    const fd = buildFormData({
      currentPassword: "oldpass1",
      newPassword: "short",
      confirmPassword: "short",
    });
    const result = await updatePassword(fd);
    expect(result).toEqual({ error: "Mot de passe trop court (8 caractères minimum)" });
  });

  it("returns error if current password is wrong", async () => {
    mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
      error: { message: "Invalid" },
    });
    const fd = buildFormData({
      currentPassword: "wrong",
      newPassword: "newpass123",
      confirmPassword: "newpass123",
    });
    const result = await updatePassword(fd);
    expect(result).toEqual({ error: "Mot de passe actuel incorrect" });
  });

  it("returns success on valid password change", async () => {
    const fd = buildFormData({
      currentPassword: "oldpass1",
      newPassword: "newpass123",
      confirmPassword: "newpass123",
    });
    const result = await updatePassword(fd);
    expect(result).toEqual({ success: true });
  });

  it("returns error if updateUser fails", async () => {
    mockSupabase.auth.updateUser.mockResolvedValueOnce({
      error: { message: "Error" },
    });
    const fd = buildFormData({
      currentPassword: "oldpass1",
      newPassword: "newpass123",
      confirmPassword: "newpass123",
    });
    const result = await updatePassword(fd);
    expect(result).toEqual({ error: "Erreur lors du changement de mot de passe" });
  });
});

describe("deleteAccount()", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupAuth();
    mockSupabase.auth.signOut.mockResolvedValue({ error: null });
  });

  it("returns error when not authenticated", async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: null,
    });
    const result = await deleteAccount();
    expect(result).toEqual({ error: "Non authentifié" });
  });

  it("signs out globally and deletes via admin, then redirects", async () => {
    await expect(deleteAccount()).rejects.toThrow("NEXT_REDIRECT:/login");
    expect(mockSupabase.auth.signOut).toHaveBeenCalledWith({ scope: "global" });
    expect(mockAdmin.auth.admin.deleteUser).toHaveBeenCalledWith("user-123");
  });

  it("returns error if admin delete fails", async () => {
    mockAdmin.auth.admin.deleteUser.mockResolvedValueOnce({
      error: { message: "Error" },
    });
    const result = await deleteAccount();
    expect(result).toEqual({ error: "Erreur lors de la suppression du compte" });
  });
});
