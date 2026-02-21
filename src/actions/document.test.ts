import { describe, it, expect, vi, beforeEach } from "vitest";
import { buildFormData } from "@/__tests__/helpers/form-data";

const UUID = "550e8400-e29b-41d4-a716-446655440000";
const PDF_BYTES = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]);

function createFakeFile(name: string, type: string, bytes: Uint8Array): File {
  return new File([bytes], name, { type });
}

// --- Mock Supabase server client ---
const mockGetUser = vi.fn();
const mockFrom = vi.fn();
const mockRpc = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      from: mockFrom,
      auth: { getUser: mockGetUser },
      rpc: mockRpc,
    }),
  ),
}));

// --- Mock Admin client ---
const mockAdminFrom = vi.fn();
const mockAdminRpc = vi.fn();
const mockAdminUpload = vi.fn();
const mockAdminCreateSignedUrl = vi.fn();
const mockAdminRemove = vi.fn();

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => ({
    from: mockAdminFrom,
    rpc: mockAdminRpc,
    storage: {
      from: vi.fn(() => ({
        upload: mockAdminUpload,
        createSignedUrl: mockAdminCreateSignedUrl,
        remove: mockAdminRemove,
      })),
    },
  })),
}));

// --- Mock utilities ---
vi.mock("@/lib/utils/hash", () => ({
  computeSha256: vi.fn().mockResolvedValue("abc123hash"),
}));

const mockVerifyMimeType = vi.fn().mockReturnValue(true);
vi.mock("@/lib/utils/mime", () => ({
  verifyMimeType: (...args: unknown[]) => mockVerifyMimeType(...args),
}));

// --- Mock analysis client ---
const mockAnalyzeDocument = vi.fn();
const mockCrossValidateDocuments = vi.fn();

const { MockAnalysisApiError } = vi.hoisted(() => {
  class MockAnalysisApiError extends Error {
    status: number | null;
    code: string;
    constructor(message: string, status: number | null, code: string) {
      super(message);
      this.name = "AnalysisApiError";
      this.status = status;
      this.code = code;
    }
  }
  return { MockAnalysisApiError };
});

vi.mock("@/lib/analysis/client", () => ({
  analyzeDocument: (...args: unknown[]) => mockAnalyzeDocument(...args),
  crossValidateDocuments: (...args: unknown[]) => mockCrossValidateDocuments(...args),
  AnalysisApiError: MockAnalysisApiError,
}));

import { uploadAndAnalyzeDocument, deleteDocument } from "./document";
import { revalidatePath } from "next/cache";

// Helper to build a chain for supabase from() calls
function makeChain(overrides: {
  singleResult?: { data: unknown; error: unknown };
  thenResult?: { data: unknown; error: unknown };
} = {}) {
  const { singleResult, thenResult } = overrides;
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  ["select", "insert", "update", "delete", "upsert", "eq", "not", "limit", "single", "maybeSingle"].forEach((m) => {
    chain[m] = vi.fn(() => chain);
  });
  if (singleResult) {
    chain["single"]!.mockResolvedValue(singleResult);
  }
  if (thenResult) {
    Object.defineProperty(chain, "then", {
      value: (resolve: (v: unknown) => void) => resolve(thenResult),
      enumerable: false,
      configurable: true,
    });
  }
  return chain;
}

function makeUploadFormData(overrides: Record<string, string | File> = {}) {
  const file = createFakeFile("test.pdf", "application/pdf", PDF_BYTES);
  const fd = new FormData();
  fd.append("file", file);
  fd.append("candidatId", UUID);
  fd.append("dossierId", UUID);
  fd.append("docType", "cni");
  for (const [k, v] of Object.entries(overrides)) {
    fd.set(k, v);
  }
  return fd;
}

const validAnalysisResult = {
  classified_type: "cni",
  confidence_score: 85,
  overall_status: "ok" as const,
  person: { nom: "Dupont", prenom: "Jean", date_naissance: null, source: "ocr", confidence: 0.9 },
  checks: [{ name: "format_check", status: "ok" as const, message: "OK", details: null }],
  forensic: null,
};

describe("uploadAndAnalyzeDocument()", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-123" } }, error: null });
    mockVerifyMimeType.mockReturnValue(true);
    mockRpc.mockResolvedValue({ data: true, error: null });
    mockAdminUpload.mockResolvedValue({ data: { path: "test/path" }, error: null });
    mockAdminCreateSignedUrl.mockResolvedValue({ data: { signedUrl: "https://signed.url" }, error: null });
    mockAdminRemove.mockResolvedValue({ data: null, error: null });
    mockAdminRpc.mockResolvedValue({ data: true, error: null });
    mockAnalyzeDocument.mockResolvedValue(validAnalysisResult);
    mockCrossValidateDocuments.mockResolvedValue({ checks: [], overall_status: "ok", confidence_score: 90, completeness: null, summary: "OK" });

    // Default chain for from() — candidat check (single), then doc query (thenable), etc.
    let fromCallCount = 0;
    mockFrom.mockImplementation(() => {
      fromCallCount++;
      // Call 1: candidat check → single() returns { id: UUID }
      // Call 2: duplicate check → thenable returns []
      // Call 3: doc insert → single() returns { id: "doc-123" }
      // Call 4: candidat name fetch → single()
      // Call 5+: various updates
      if (fromCallCount === 1) {
        return makeChain({ singleResult: { data: { id: UUID }, error: null } });
      }
      if (fromCallCount === 2) {
        return makeChain({ thenResult: { data: [], error: null } });
      }
      if (fromCallCount === 3) {
        return makeChain({ singleResult: { data: { id: "doc-123" }, error: null } });
      }
      if (fromCallCount === 4) {
        return makeChain({ singleResult: { data: { nom: null, prenom: null }, error: null } });
      }
      // Remaining calls: docs query for cross-validation & score recalc
      return makeChain({ thenResult: { data: [{ id: "doc-123", confidence_score: 85, overall_status: "ok", classified_type: "cni", person: null, validation_result: null }], error: null } });
    });

    // Admin from() for billing event insert
    const adminChain = makeChain({ thenResult: { data: null, error: null } });
    adminChain["maybeSingle"]!.mockResolvedValue({ data: null, error: null });
    mockAdminFrom.mockReturnValue(adminChain);
  });

  it("returns error when no file provided", async () => {
    const fd = new FormData();
    fd.append("candidatId", UUID);
    fd.append("dossierId", UUID);
    fd.append("docType", "cni");
    const result = await uploadAndAnalyzeDocument(fd);
    expect(result).toEqual({ error: "Aucun fichier sélectionné" });
  });

  it("returns error on unsupported file type", async () => {
    const file = createFakeFile("test.txt", "text/plain", PDF_BYTES);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("candidatId", UUID);
    fd.append("dossierId", UUID);
    fd.append("docType", "cni");
    const result = await uploadAndAnalyzeDocument(fd);
    expect(result).toEqual({ error: "Type de fichier non supporté. PDF, JPEG, PNG ou WebP uniquement." });
  });

  it("returns error on MIME mismatch", async () => {
    mockVerifyMimeType.mockReturnValueOnce(false);
    const fd = makeUploadFormData();
    const result = await uploadAndAnalyzeDocument(fd);
    expect(result).toEqual({ error: "Le contenu du fichier ne correspond pas à son type déclaré" });
  });

  it("returns error when not authenticated", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });
    const fd = makeUploadFormData();
    const result = await uploadAndAnalyzeDocument(fd);
    expect(result).toEqual({ error: "Non authentifié" });
  });

  it("returns error on invalid docType", async () => {
    const fd = makeUploadFormData({ docType: "invalid_type" });
    const result = await uploadAndAnalyzeDocument(fd);
    expect(result).toHaveProperty("error");
  });

  it("returns error on insufficient credits", async () => {
    mockRpc.mockResolvedValueOnce({ data: false, error: null });
    const fd = makeUploadFormData();
    const result = await uploadAndAnalyzeDocument(fd);
    expect(result).toEqual({ error: "Crédits insuffisants. Achetez des crédits pour continuer." });
  });

  it("returns error on candidat not in dossier", async () => {
    mockFrom.mockReturnValueOnce(
      makeChain({ singleResult: { data: null, error: null } }),
    );
    const fd = makeUploadFormData();
    const result = await uploadAndAnalyzeDocument(fd);
    expect(result).toEqual({ error: "Candidat invalide pour ce dossier" });
  });

  it("returns success on valid upload and analysis", async () => {
    const fd = makeUploadFormData();
    const result = await uploadAndAnalyzeDocument(fd);
    expect(result).toHaveProperty("success", true);
    expect(result).toHaveProperty("documentId", "doc-123");
    expect(revalidatePath).toHaveBeenCalled();
  });

  it("cleans up storage file in finally block", async () => {
    mockAdminCreateSignedUrl.mockResolvedValueOnce({ data: null, error: { message: "Error" } });
    const fd = makeUploadFormData();
    await uploadAndAnalyzeDocument(fd);
    expect(mockAdminRemove).toHaveBeenCalled();
  });

  it("handles timeout error from analysis API", async () => {
    mockAnalyzeDocument.mockRejectedValueOnce(new MockAnalysisApiError("Timeout", null, "timeout"));
    const fd = makeUploadFormData();
    const result = await uploadAndAnalyzeDocument(fd);
    expect(result).toEqual({ error: "L'analyse a pris trop de temps. Réessayez." });
  });

  it("handles network error from analysis API", async () => {
    mockAnalyzeDocument.mockRejectedValueOnce(new MockAnalysisApiError("Network", null, "network_error"));
    const fd = makeUploadFormData();
    const result = await uploadAndAnalyzeDocument(fd);
    expect(result).toEqual({ error: "Service d'analyse indisponible. Réessayez plus tard." });
  });

  it("handles generic analysis API error", async () => {
    mockAnalyzeDocument.mockRejectedValueOnce(new MockAnalysisApiError("API error", 500, "api_error"));
    const fd = makeUploadFormData();
    const result = await uploadAndAnalyzeDocument(fd);
    expect(result).toEqual({ error: "Le service d'analyse a retourné une erreur. Réessayez ou contactez le support." });
  });

  it("refunds credit on duplicate hash", async () => {
    // Override from: candidat check OK, then duplicate found
    let fromCallCount = 0;
    mockFrom.mockImplementation(() => {
      fromCallCount++;
      if (fromCallCount === 1) {
        return makeChain({ singleResult: { data: { id: UUID }, error: null } });
      }
      // Duplicate found
      return makeChain({ thenResult: { data: [{ id: "existing-doc" }], error: null } });
    });

    const fd = makeUploadFormData();
    const result = await uploadAndAnalyzeDocument(fd);
    expect(result).toEqual({ error: "Ce document a déjà été analysé dans ce dossier" });
    expect(mockAdminRpc).toHaveBeenCalled();
  });
});

describe("deleteDocument()", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-123" } }, error: null });

    // Default: delete succeeds, then remaining docs query
    let fromCallCount = 0;
    mockFrom.mockImplementation(() => {
      fromCallCount++;
      if (fromCallCount === 1) {
        // delete chain
        return makeChain({ thenResult: { data: null, error: null } });
      }
      if (fromCallCount === 2) {
        // remaining docs: empty → <2
        return makeChain({ thenResult: { data: [], error: null } });
      }
      // cross_validations delete + dossier score recalc
      return makeChain({ thenResult: { data: [], error: null } });
    });
  });

  it("returns error on invalid input", async () => {
    const fd = buildFormData({ documentId: "bad", dossierId: UUID, candidatId: UUID });
    const result = await deleteDocument(fd);
    expect(result).toHaveProperty("error");
  });

  it("returns error when not authenticated", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });
    const fd = buildFormData({ documentId: UUID, dossierId: UUID, candidatId: UUID });
    const result = await deleteDocument(fd);
    expect(result).toEqual({ error: "Non authentifié" });
  });

  it("returns success on valid delete", async () => {
    const fd = buildFormData({ documentId: UUID, dossierId: UUID, candidatId: UUID });
    const result = await deleteDocument(fd);
    expect(result).toEqual({ success: true });
    expect(revalidatePath).toHaveBeenCalled();
  });

  it("removes cross-validation if <2 docs remain", async () => {
    let fromCallCount = 0;
    const deleteChainFn = vi.fn();
    mockFrom.mockImplementation(() => {
      fromCallCount++;
      const chain = makeChain({ thenResult: { data: fromCallCount === 2 ? [{ id: "d1" }] : null, error: null } });
      chain["delete"] = deleteChainFn.mockReturnValue(chain);
      return chain;
    });

    const fd = buildFormData({ documentId: UUID, dossierId: UUID, candidatId: UUID });
    await deleteDocument(fd);
    // cross_validations delete is called since only 1 doc remains (<2)
    expect(deleteChainFn).toHaveBeenCalled();
  });
});
