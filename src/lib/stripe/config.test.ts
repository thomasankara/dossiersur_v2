import { describe, it, expect } from "vitest";
import { PLANS, PLAN_KEYS } from "./config";

describe("PLANS config", () => {
  it("has exactly 3 plans", () => {
    expect(PLAN_KEYS).toHaveLength(3);
    expect(PLAN_KEYS).toEqual(["starter", "pro", "business"]);
  });

  it("all plans have positive credits", () => {
    for (const key of PLAN_KEYS) {
      expect(PLANS[key].credits).toBeGreaterThan(0);
    }
  });

  it("prices are ordered ascending", () => {
    expect(PLANS.starter.price).toBeLessThan(PLANS.pro.price);
    expect(PLANS.pro.price).toBeLessThan(PLANS.business.price);
  });

  it("all plans have non-empty features", () => {
    for (const key of PLAN_KEYS) {
      expect(PLANS[key].features.length).toBeGreaterThan(0);
    }
  });

  it("pro plan is marked popular", () => {
    expect(PLANS.pro.popular).toBe(true);
  });
});
