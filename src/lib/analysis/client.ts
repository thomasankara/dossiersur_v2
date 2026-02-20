import "server-only";

import type {
  AnalyzeRequest,
  AnalyzeResponse,
  CrossValidateRequest,
  CrossValidateResponse,
  HealthResponse,
} from "@/types";
import {
  analyzeResponseSchema,
  crossValidateResponseSchema,
  healthResponseSchema,
} from "./types";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const API_URL = process.env.ANALYSIS_API_URL ?? "http://localhost:8000";
const API_KEY = (process.env.ANALYSIS_API_KEY ?? "").trim();
const TIMEOUT_MS = 60_000;
const MAX_RETRIES = 1;

// ---------------------------------------------------------------------------
// Error
// ---------------------------------------------------------------------------

export class AnalysisApiError extends Error {
  constructor(
    message: string,
    public readonly status: number | null,
    public readonly code: string,
  ) {
    super(message);
    this.name = "AnalysisApiError";
  }
}

// ---------------------------------------------------------------------------
// Internal fetch with timeout + retry
// ---------------------------------------------------------------------------

async function apiFetch<T>(
  path: string,
  body: unknown,
  validate: (data: unknown) => T,
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const res = await fetch(`${API_URL}${path}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(API_KEY ? { "X-API-Key": API_KEY } : {}),
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!res.ok) {
        const isRetryable = res.status >= 500;
        if (isRetryable && attempt < MAX_RETRIES) {
          lastError = new AnalysisApiError(
            `API returned ${res.status}`,
            res.status,
            "api_error",
          );
          continue;
        }
        throw new AnalysisApiError(
          `API returned ${res.status}: ${await res.text().catch(() => "")}`,
          res.status,
          "api_error",
        );
      }

      const json: unknown = await res.json();
      return validate(json);
    } catch (err) {
      clearTimeout(timer);

      if (err instanceof AnalysisApiError) throw err;

      const isNetworkError =
        err instanceof TypeError || (err instanceof DOMException && err.name === "AbortError");

      if (isNetworkError && attempt < MAX_RETRIES) {
        lastError = err instanceof Error ? err : new Error(String(err));
        continue;
      }

      if (err instanceof DOMException && err.name === "AbortError") {
        throw new AnalysisApiError("Request timeout", null, "timeout");
      }

      throw new AnalysisApiError(
        `Network error: ${err instanceof Error ? err.message : String(err)}`,
        null,
        "network_error",
      );
    }
  }

  throw lastError ?? new AnalysisApiError("Unknown error", null, "unknown");
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function analyzeDocument(
  request: AnalyzeRequest,
): Promise<AnalyzeResponse> {
  return apiFetch("/analyze", request, (data) => {
    const parsed = analyzeResponseSchema.safeParse(data);
    if (!parsed.success) {
      throw new AnalysisApiError(
        `Invalid API response: ${parsed.error.issues[0]?.message ?? "validation failed"}`,
        null,
        "validation_error",
      );
    }
    return parsed.data;
  });
}

export async function crossValidateDocuments(
  request: CrossValidateRequest,
): Promise<CrossValidateResponse> {
  return apiFetch("/cross-validate", request, (data) => {
    const parsed = crossValidateResponseSchema.safeParse(data);
    if (!parsed.success) {
      throw new AnalysisApiError(
        `Invalid API response: ${parsed.error.issues[0]?.message ?? "validation failed"}`,
        null,
        "validation_error",
      );
    }
    return parsed.data;
  });
}

export async function checkHealth(): Promise<HealthResponse> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5_000);

  try {
    const res = await fetch(`${API_URL}/health`, {
      headers: API_KEY ? { "X-API-Key": API_KEY } : {},
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!res.ok) {
      throw new AnalysisApiError(`Health check failed: ${res.status}`, res.status, "api_error");
    }

    const json: unknown = await res.json();
    const parsed = healthResponseSchema.safeParse(json);
    if (!parsed.success) {
      throw new AnalysisApiError("Invalid health response", null, "validation_error");
    }
    return parsed.data;
  } catch (err) {
    clearTimeout(timer);
    if (err instanceof AnalysisApiError) throw err;
    throw new AnalysisApiError(
      `Health check error: ${err instanceof Error ? err.message : String(err)}`,
      null,
      "network_error",
    );
  }
}
