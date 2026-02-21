import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { rateLimit, _resetRateLimitStore } from "./rate-limit";

describe("rateLimit()", () => {
  beforeEach(() => {
    _resetRateLimitStore();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows requests within limit", () => {
    const result = rateLimit("test", { windowMs: 60_000, maxRequests: 3 });
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(2);
  });

  it("blocks requests exceeding limit", () => {
    const opts = { windowMs: 60_000, maxRequests: 2 };
    rateLimit("test", opts);
    rateLimit("test", opts);
    const result = rateLimit("test", opts);
    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("resets after window expires", () => {
    const opts = { windowMs: 60_000, maxRequests: 1 };
    rateLimit("test", opts);
    expect(rateLimit("test", opts).success).toBe(false);

    vi.advanceTimersByTime(60_001);
    expect(rateLimit("test", opts).success).toBe(true);
  });

  it("tracks keys independently", () => {
    const opts = { windowMs: 60_000, maxRequests: 1 };
    rateLimit("key1", opts);
    expect(rateLimit("key1", opts).success).toBe(false);
    expect(rateLimit("key2", opts).success).toBe(true);
  });

  it("uses sliding window (not fixed)", () => {
    const opts = { windowMs: 60_000, maxRequests: 2 };
    rateLimit("test", opts); // t=0
    vi.advanceTimersByTime(30_000);
    rateLimit("test", opts); // t=30s
    vi.advanceTimersByTime(31_000);
    // t=61s: first request expired, second still valid
    expect(rateLimit("test", opts).success).toBe(true);
  });

  it("returns correct remaining count", () => {
    const opts = { windowMs: 60_000, maxRequests: 5 };
    expect(rateLimit("test", opts).remaining).toBe(4);
    expect(rateLimit("test", opts).remaining).toBe(3);
    expect(rateLimit("test", opts).remaining).toBe(2);
  });
});
