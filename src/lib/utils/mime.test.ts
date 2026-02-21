import { describe, it, expect } from "vitest";
import { verifyMimeType } from "./mime";

function makeBuffer(bytes: number[]): ArrayBuffer {
  return new Uint8Array(bytes).buffer;
}

describe("verifyMimeType()", () => {
  it("accepts valid PDF magic bytes", () => {
    // %PDF
    expect(verifyMimeType(makeBuffer([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]), "application/pdf")).toBe(true);
  });

  it("accepts valid JPEG magic bytes", () => {
    expect(verifyMimeType(makeBuffer([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]), "image/jpeg")).toBe(true);
  });

  it("accepts valid PNG magic bytes", () => {
    expect(verifyMimeType(makeBuffer([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]), "image/png")).toBe(true);
  });

  it("accepts valid WebP magic bytes", () => {
    // RIFF header
    expect(verifyMimeType(makeBuffer([0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00]), "image/webp")).toBe(true);
  });

  it("rejects unsupported type", () => {
    expect(verifyMimeType(makeBuffer([0x00, 0x00]), "application/zip")).toBe(false);
  });

  it("rejects mismatched bytes (PDF header but declared JPEG)", () => {
    expect(verifyMimeType(makeBuffer([0x25, 0x50, 0x44, 0x46]), "image/jpeg")).toBe(false);
  });

  it("rejects buffer too short for PNG signature", () => {
    expect(verifyMimeType(makeBuffer([0x89, 0x50]), "image/png")).toBe(false);
  });

  it("rejects empty buffer", () => {
    expect(verifyMimeType(makeBuffer([]), "application/pdf")).toBe(false);
  });
});
