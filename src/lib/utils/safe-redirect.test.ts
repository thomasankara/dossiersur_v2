import { describe, it, expect } from "vitest";
import { getSafeRedirect } from "./safe-redirect";

describe("getSafeRedirect()", () => {
  it("returns /dashboard for null", () => {
    expect(getSafeRedirect(null)).toBe("/dashboard");
  });

  it("returns /dashboard for empty string", () => {
    expect(getSafeRedirect("")).toBe("/dashboard");
  });

  it("allows valid internal path", () => {
    expect(getSafeRedirect("/dashboard/billing")).toBe("/dashboard/billing");
  });

  it("blocks absolute URL (external redirect)", () => {
    expect(getSafeRedirect("https://evil.com")).toBe("/dashboard");
  });

  it("blocks protocol-relative URL", () => {
    expect(getSafeRedirect("//evil.com")).toBe("/dashboard");
  });

  it("blocks backslash-prefixed path", () => {
    expect(getSafeRedirect("/\\evil.com")).toBe("/dashboard");
  });

  it("blocks backslash in path", () => {
    expect(getSafeRedirect("/foo\\bar")).toBe("/dashboard");
  });
});
