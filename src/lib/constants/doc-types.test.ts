import { describe, it, expect } from "vitest";
import { DOC_TYPE_VALUES, DOC_TYPE_OPTIONS, DOC_TYPE_LABELS } from "./doc-types";

describe("doc-types constants", () => {
  it("VALUES and OPTIONS have same length", () => {
    expect(DOC_TYPE_VALUES.length).toBe(DOC_TYPE_OPTIONS.length);
  });

  it("every VALUE has a matching OPTION", () => {
    for (const value of DOC_TYPE_VALUES) {
      expect(DOC_TYPE_OPTIONS.find((o) => o.value === value)).toBeDefined();
    }
  });

  it("every VALUE has a LABEL", () => {
    for (const value of DOC_TYPE_VALUES) {
      expect(DOC_TYPE_LABELS[value]).toBeDefined();
      expect(DOC_TYPE_LABELS[value]!.length).toBeGreaterThan(0);
    }
  });

  it("includes expected types", () => {
    expect(DOC_TYPE_VALUES).toContain("cni");
    expect(DOC_TYPE_VALUES).toContain("passeport");
    expect(DOC_TYPE_VALUES).toContain("autre");
  });
});
