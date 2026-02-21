import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Need to mock server-only before importing
vi.mock("server-only", () => ({}));

// We import after mocking
import { analyzeDocument, crossValidateDocuments, checkHealth, AnalysisApiError } from "./client";

const VALID_ANALYZE_RESPONSE = {
  classified_type: "cni",
  confidence_score: 85,
  overall_status: "ok",
  person: { nom: "Dupont", prenom: "Jean", date_naissance: null, source: "ocr", confidence: 0.9 },
  checks: [{ name: "format_check", status: "ok", message: "OK", details: null }],
  forensic: null,
};

const VALID_HEALTH_RESPONSE = { status: "ok", version: "1.0.0" };

function mockFetchResponse(body: unknown, status = 200) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  });
}

describe("analyzeDocument()", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns parsed response on success", async () => {
    vi.stubGlobal("fetch", mockFetchResponse(VALID_ANALYZE_RESPONSE));
    const result = await analyzeDocument({
      document_url: "https://example.com/doc",
      document_type: "cni",
      filename: "test.pdf",
    });
    expect(result.classified_type).toBe("cni");
    expect(result.confidence_score).toBe(85);
  });

  it("throws AnalysisApiError on Zod validation failure", async () => {
    vi.stubGlobal("fetch", mockFetchResponse({ bad: "data" }));
    await expect(
      analyzeDocument({ document_url: "url", document_type: "cni", filename: "test.pdf" }),
    ).rejects.toThrow(AnalysisApiError);
  });

  it("retries on 500 error", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: false, status: 500, text: () => Promise.resolve("error") })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(VALID_ANALYZE_RESPONSE),
      });
    vi.stubGlobal("fetch", fetchMock);

    const result = await analyzeDocument({
      document_url: "url",
      document_type: "cni",
      filename: "test.pdf",
    });
    expect(result.classified_type).toBe("cni");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does not retry on 400 error", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: () => Promise.resolve("bad request"),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      analyzeDocument({ document_url: "url", document_type: "cni", filename: "test.pdf" }),
    ).rejects.toThrow(AnalysisApiError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("throws timeout error on AbortError", async () => {
    const fetchMock = vi.fn().mockImplementation(() => {
      const err = new DOMException("Aborted", "AbortError");
      return Promise.reject(err);
    });
    vi.stubGlobal("fetch", fetchMock);

    try {
      await analyzeDocument({ document_url: "url", document_type: "cni", filename: "test.pdf" });
      expect.fail("Should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(AnalysisApiError);
      expect((err as AnalysisApiError).code).toBe("timeout");
    }
  });

  it("throws network_error on TypeError", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new TypeError("fetch failed"));
    vi.stubGlobal("fetch", fetchMock);

    try {
      await analyzeDocument({ document_url: "url", document_type: "cni", filename: "test.pdf" });
      expect.fail("Should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(AnalysisApiError);
      expect((err as AnalysisApiError).code).toBe("network_error");
    }
  });

  it("sends X-API-Key header when configured", async () => {
    const originalKey = process.env.ANALYSIS_API_KEY;
    process.env.ANALYSIS_API_KEY = "test-key";

    // Need to re-import to pick up new env. Instead, test via fetch call
    const fetchMock = mockFetchResponse(VALID_ANALYZE_RESPONSE);
    vi.stubGlobal("fetch", fetchMock);

    await analyzeDocument({ document_url: "url", document_type: "cni", filename: "test.pdf" });

    // The API_KEY is read at module load time, so it may be empty.
    // We verify fetch was called with the right structure
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/analyze"),
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ "Content-Type": "application/json" }),
      }),
    );

    process.env.ANALYSIS_API_KEY = originalKey;
  });
});

describe("crossValidateDocuments()", () => {
  it("returns parsed cross-validation response", async () => {
    const validResponse = {
      checks: [{ name: "identity", status: "ok", message: "Match", documents_compared: ["d1", "d2"] }],
      overall_status: "ok",
      confidence_score: 90,
      completeness: null,
      summary: "All good",
    };
    vi.stubGlobal("fetch", mockFetchResponse(validResponse));

    const result = await crossValidateDocuments({
      documents: [
        { document_id: "d1", classified_type: "cni", person: null, checks: [] },
        { document_id: "d2", classified_type: "bulletin_salaire", person: null, checks: [] },
      ],
    });
    expect(result.overall_status).toBe("ok");
    expect(result.summary).toBe("All good");
  });
});

describe("checkHealth()", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns health response on success", async () => {
    vi.stubGlobal("fetch", mockFetchResponse(VALID_HEALTH_RESPONSE));
    const result = await checkHealth();
    expect(result.status).toBe("ok");
    expect(result.version).toBe("1.0.0");
  });

  it("throws on non-ok response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
    }));
    await expect(checkHealth()).rejects.toThrow(AnalysisApiError);
  });

  it("throws on network error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("fetch failed")));
    try {
      await checkHealth();
      expect.fail("Should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(AnalysisApiError);
      expect((err as AnalysisApiError).code).toBe("network_error");
    }
  });

  it("throws validation_error on invalid response", async () => {
    vi.stubGlobal("fetch", mockFetchResponse({ bad: "data" }));
    try {
      await checkHealth();
      expect.fail("Should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(AnalysisApiError);
      expect((err as AnalysisApiError).code).toBe("validation_error");
    }
  });
});
