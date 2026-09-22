import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getConsent, setConsent } from "@/lib/posthog/consent";

describe("consent", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns null when no decision was stored", () => {
    expect(getConsent()).toBeNull();
  });

  it("returns null for an unrecognised stored value", () => {
    window.localStorage.setItem("ds_analytics_consent", "maybe");
    expect(getConsent()).toBeNull();
  });

  it("persists and reads a granted decision", () => {
    setConsent("granted");
    expect(getConsent()).toBe("granted");
  });

  it("persists and reads a denied decision", () => {
    setConsent("denied");
    expect(getConsent()).toBe("denied");
  });

  it("returns null and does not throw on the server", () => {
    vi.stubGlobal("window", undefined);
    expect(getConsent()).toBeNull();
    expect(() => setConsent("granted")).not.toThrow();
  });
});
