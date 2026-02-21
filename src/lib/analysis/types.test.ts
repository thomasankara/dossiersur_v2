import { describe, it, expect } from "vitest";
import { analyzeResponseSchema, crossValidateResponseSchema, healthResponseSchema } from "./types";

describe("analyzeResponseSchema", () => {
  const validResponse = {
    classified_type: "cni",
    confidence_score: 85,
    overall_status: "ok",
    person: {
      nom: "Dupont",
      prenom: "Jean",
      date_naissance: "1990-01-01",
      source: "ocr",
      confidence: 0.9,
    },
    checks: [
      { name: "format_check", status: "ok", message: "Format valid", details: null },
    ],
    forensic: null,
  };

  it("accepts a valid response", () => {
    const result = analyzeResponseSchema.safeParse(validResponse);
    expect(result.success).toBe(true);
  });

  it("accepts response with null person", () => {
    const result = analyzeResponseSchema.safeParse({ ...validResponse, person: null });
    expect(result.success).toBe(true);
  });

  it("rejects missing classified_type", () => {
    const { classified_type: _, ...rest } = validResponse;
    const result = analyzeResponseSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects confidence_score out of range", () => {
    const result = analyzeResponseSchema.safeParse({ ...validResponse, confidence_score: 150 });
    expect(result.success).toBe(false);
  });

  it("rejects invalid overall_status", () => {
    const result = analyzeResponseSchema.safeParse({ ...validResponse, overall_status: "invalid" });
    expect(result.success).toBe(false);
  });
});

describe("crossValidateResponseSchema", () => {
  const validResponse = {
    checks: [
      { name: "identity_match", status: "ok", message: "Match", documents_compared: ["doc1", "doc2"] },
    ],
    overall_status: "ok",
    confidence_score: 90,
    completeness: null,
    summary: "All good",
  };

  it("accepts a valid response", () => {
    const result = crossValidateResponseSchema.safeParse(validResponse);
    expect(result.success).toBe(true);
  });

  it("accepts response with completeness", () => {
    const result = crossValidateResponseSchema.safeParse({
      ...validResponse,
      completeness: {
        required_types: ["cni", "bulletin_salaire"],
        present_types: ["cni"],
        missing_types: ["bulletin_salaire"],
        score: 50,
      },
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing summary", () => {
    const { summary: _, ...rest } = validResponse;
    const result = crossValidateResponseSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects invalid check status", () => {
    const result = crossValidateResponseSchema.safeParse({
      ...validResponse,
      checks: [{ name: "test", status: "bad", message: "msg", documents_compared: [] }],
    });
    expect(result.success).toBe(false);
  });
});

describe("healthResponseSchema", () => {
  it("accepts valid health response", () => {
    expect(healthResponseSchema.safeParse({ status: "ok", version: "1.0.0" }).success).toBe(true);
  });

  it("accepts degraded status", () => {
    expect(healthResponseSchema.safeParse({ status: "degraded", version: "1.0.0" }).success).toBe(true);
  });

  it("rejects missing version", () => {
    expect(healthResponseSchema.safeParse({ status: "ok" }).success).toBe(false);
  });
});
