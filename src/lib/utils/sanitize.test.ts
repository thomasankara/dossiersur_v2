import { describe, it, expect } from "vitest";
import { sanitizeFilename } from "./sanitize";

describe("sanitizeFilename()", () => {
  it("preserves valid filename", () => {
    expect(sanitizeFilename("document.pdf")).toBe("document.pdf");
  });

  it("replaces special characters with underscore", () => {
    expect(sanitizeFilename("file<name>.pdf")).toBe("file_name_.pdf");
  });

  it("collapses multiple dots", () => {
    expect(sanitizeFilename("file...name.pdf")).toBe("file_name.pdf");
  });

  it("truncates to 200 characters", () => {
    const longName = "a".repeat(250) + ".pdf";
    expect(sanitizeFilename(longName).length).toBeLessThanOrEqual(200);
  });

  it("handles empty string", () => {
    expect(sanitizeFilename("")).toBe("");
  });

  it("blocks path traversal", () => {
    const result = sanitizeFilename("../../etc/passwd");
    expect(result).not.toContain("..");
    expect(result).not.toContain("/");
  });
});
