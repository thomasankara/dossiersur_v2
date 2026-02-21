import { describe, it, expect } from "vitest";
import { computeSha256 } from "./hash";

describe("computeSha256()", () => {
  it("returns a valid hex string", async () => {
    const buffer = new TextEncoder().encode("hello").buffer;
    const hash = await computeSha256(buffer);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("is deterministic", async () => {
    const buffer = new TextEncoder().encode("test").buffer;
    const hash1 = await computeSha256(buffer);
    const hash2 = await computeSha256(buffer);
    expect(hash1).toBe(hash2);
  });

  it("handles empty buffer", async () => {
    const buffer = new ArrayBuffer(0);
    const hash = await computeSha256(buffer);
    // SHA-256 of empty input is well-known
    expect(hash).toBe("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
  });
});
