import { describe, it, expect, vi, beforeEach } from "vitest";
import { buildFormData } from "@/__tests__/helpers/form-data";

const UUID = "550e8400-e29b-41d4-a716-446655440000";

// Shared mock state
const mockGetUser = vi.fn();
const mockFrom = vi.fn();

function setupChain(result: { data?: unknown; error?: unknown }) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  const methods = ["select", "insert", "update", "delete", "eq", "single"];
  for (const m of methods) {
    chain[m] = vi.fn(() => chain);
  }
  chain["single"]!.mockResolvedValue(result);
  Object.defineProperty(chain, "then", {
    value: (resolve: (v: unknown) => void) => resolve(result),
    enumerable: false,
    configurable: true,
  });
  return chain;
}

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      from: mockFrom,
      auth: { getUser: mockGetUser },
    }),
  ),
}));

import {
  createDossier,
  updateDossier,
  deleteDossier,
  addCandidat,
  removeCandidat,
} from "./dossier";
import { revalidatePath } from "next/cache";

function authenticateUser() {
  mockGetUser.mockResolvedValue({
    data: { user: { id: "user-123" } },
    error: null,
  });
}

function unauthenticateUser() {
  mockGetUser.mockResolvedValue({
    data: { user: null },
    error: null,
  });
}

describe("createDossier()", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authenticateUser();
    // Default: insert dossier succeeds, insert candidat succeeds
    const chain = setupChain({ data: { id: UUID }, error: null });
    mockFrom.mockReturnValue(chain);
  });

  it("returns error on validation failure (empty name)", async () => {
    const fd = buildFormData({ name: "", candidatRole: "locataire" });
    const result = await createDossier(fd);
    expect(result).toEqual({ error: "Nom du dossier requis" });
  });

  it("returns error on invalid role", async () => {
    const fd = buildFormData({ name: "Test", candidatRole: "invalid" });
    const result = await createDossier(fd);
    expect(result).toHaveProperty("error");
  });

  it("returns error when not authenticated", async () => {
    unauthenticateUser();
    const fd = buildFormData({ name: "Test", candidatRole: "locataire" });
    const result = await createDossier(fd);
    expect(result).toEqual({ error: "Non authentifié" });
  });

  it("redirects on successful creation", async () => {
    const fd = buildFormData({ name: "Mon dossier", candidatRole: "locataire" });
    await expect(createDossier(fd)).rejects.toThrow("NEXT_REDIRECT:");
  });

  it("returns error if dossier insert fails", async () => {
    const chain = setupChain({ data: null, error: { message: "DB error" } });
    mockFrom.mockReturnValue(chain);
    const fd = buildFormData({ name: "Mon dossier", candidatRole: "locataire" });
    const result = await createDossier(fd);
    expect(result).toEqual({ error: "Erreur lors de la création du dossier" });
  });

  it("rollback dossier if candidat creation fails", async () => {
    let insertCallCount = 0;
    const chain: Record<string, ReturnType<typeof vi.fn>> = {};
    const methods = ["select", "insert", "update", "delete", "eq", "single"];
    for (const m of methods) {
      chain[m] = vi.fn(() => chain);
    }
    chain["single"]!.mockResolvedValue({ data: { id: UUID }, error: null });

    chain["insert"]!.mockImplementation(() => {
      insertCallCount++;
      if (insertCallCount >= 2) {
        // Candidat insert: return error via thenable
        const errorChain = { ...chain };
        Object.defineProperty(errorChain, "then", {
          value: (resolve: (v: unknown) => void) =>
            resolve({ data: null, error: { message: "FK" } }),
          enumerable: false,
          configurable: true,
        });
        return errorChain;
      }
      return chain;
    });

    Object.defineProperty(chain, "then", {
      value: (resolve: (v: unknown) => void) =>
        resolve({ data: null, error: { message: "FK" } }),
      enumerable: false,
      configurable: true,
    });

    mockFrom.mockReturnValue(chain);

    const fd = buildFormData({ name: "Mon dossier", candidatRole: "locataire" });
    const result = await createDossier(fd);
    expect(result).toEqual({ error: "Erreur lors de l'ajout du candidat" });
    expect(chain["delete"]).toHaveBeenCalled();
  });
});

describe("updateDossier()", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authenticateUser();
    const chain = setupChain({ data: null, error: null });
    // Make the update chain resolve without error (thenable)
    Object.defineProperty(chain, "then", {
      value: (resolve: (v: unknown) => void) => resolve({ data: null, error: null }),
      enumerable: false,
      configurable: true,
    });
    mockFrom.mockReturnValue(chain);
  });

  it("returns error on invalid UUID", async () => {
    const fd = buildFormData({ dossierId: "not-a-uuid", name: "Test" });
    const result = await updateDossier(fd);
    expect(result).toHaveProperty("error");
  });

  it("returns success and revalidates on update", async () => {
    const fd = buildFormData({ dossierId: UUID, name: "Updated" });
    const result = await updateDossier(fd);
    expect(result).toEqual({ success: true });
    expect(revalidatePath).toHaveBeenCalledWith(`/dashboard/dossier/${UUID}`);
  });

  it("returns error on DB failure", async () => {
    const chain = setupChain({ data: null, error: null });
    Object.defineProperty(chain, "then", {
      value: (resolve: (v: unknown) => void) =>
        resolve({ data: null, error: { message: "DB error" } }),
      enumerable: false,
      configurable: true,
    });
    mockFrom.mockReturnValue(chain);
    const fd = buildFormData({ dossierId: UUID, name: "Updated" });
    const result = await updateDossier(fd);
    expect(result).toEqual({ error: "Erreur lors de la mise à jour" });
  });
});

describe("deleteDossier()", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authenticateUser();
    const chain = setupChain({ data: null, error: null });
    Object.defineProperty(chain, "then", {
      value: (resolve: (v: unknown) => void) => resolve({ data: null, error: null }),
      enumerable: false,
      configurable: true,
    });
    mockFrom.mockReturnValue(chain);
  });

  it("returns error on invalid UUID", async () => {
    const fd = buildFormData({ dossierId: "bad" });
    const result = await deleteDossier(fd);
    expect(result).toHaveProperty("error");
  });

  it("redirects on successful delete", async () => {
    const fd = buildFormData({ dossierId: UUID });
    await expect(deleteDossier(fd)).rejects.toThrow("NEXT_REDIRECT:/dashboard");
  });
});

describe("addCandidat()", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authenticateUser();
    const chain = setupChain({ data: null, error: null });
    Object.defineProperty(chain, "then", {
      value: (resolve: (v: unknown) => void) => resolve({ data: null, error: null }),
      enumerable: false,
      configurable: true,
    });
    mockFrom.mockReturnValue(chain);
  });

  it("returns error on validation failure", async () => {
    const fd = buildFormData({ dossierId: "bad", role: "locataire" });
    const result = await addCandidat(fd);
    expect(result).toHaveProperty("error");
  });

  it("returns success and revalidates", async () => {
    const fd = buildFormData({ dossierId: UUID, role: "garant" });
    const result = await addCandidat(fd);
    expect(result).toEqual({ success: true });
    expect(revalidatePath).toHaveBeenCalled();
  });
});

describe("removeCandidat()", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authenticateUser();
    const chain = setupChain({ data: null, error: null });
    Object.defineProperty(chain, "then", {
      value: (resolve: (v: unknown) => void) => resolve({ data: null, error: null }),
      enumerable: false,
      configurable: true,
    });
    mockFrom.mockReturnValue(chain);
  });

  it("returns error on validation failure", async () => {
    const fd = buildFormData({ candidatId: "bad", dossierId: UUID });
    const result = await removeCandidat(fd);
    expect(result).toHaveProperty("error");
  });

  it("returns success and revalidates", async () => {
    const fd = buildFormData({ candidatId: UUID, dossierId: UUID });
    const result = await removeCandidat(fd);
    expect(result).toEqual({ success: true });
    expect(revalidatePath).toHaveBeenCalled();
  });
});
