import { describe, it, expect, vi, afterEach } from "vitest";
import {
  formatDate,
  formatRelativeDate,
  getScoreColor,
  getScoreBgColor,
  getStatusLabel,
  getRoleLabel,
  getDocTypeLabel,
} from "./format";

describe("formatDate()", () => {
  it("formats a date in fr-FR locale", () => {
    const result = formatDate("2026-01-15T10:00:00Z");
    expect(result).toContain("janv");
    expect(result).toContain("2026");
  });

  it("formats another date correctly", () => {
    const result = formatDate("2025-12-25T00:00:00Z");
    expect(result).toContain("déc");
    expect(result).toContain("2025");
  });
});

describe("formatRelativeDate()", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "À l\'instant" for recent dates', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-20T12:00:30Z"));
    expect(formatRelativeDate("2026-02-20T12:00:00Z")).toBe("À l'instant");
  });

  it('returns "Il y a X min" for minutes ago', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-20T12:05:00Z"));
    expect(formatRelativeDate("2026-02-20T12:00:00Z")).toBe("Il y a 5 min");
  });

  it('returns "Il y a Xh" for hours ago', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-20T15:00:00Z"));
    expect(formatRelativeDate("2026-02-20T12:00:00Z")).toBe("Il y a 3h");
  });

  it('returns "Il y a Xj" for days ago', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-23T12:00:00Z"));
    expect(formatRelativeDate("2026-02-20T12:00:00Z")).toBe("Il y a 3j");
  });

  it("falls back to formatted date after 7 days", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-01T12:00:00Z"));
    const result = formatRelativeDate("2026-02-20T12:00:00Z");
    expect(result).toContain("févr");
  });
});

describe("getScoreColor()", () => {
  it("returns muted for null", () => {
    expect(getScoreColor(null)).toBe("text-muted-foreground");
  });

  it("returns valid for score >= 80", () => {
    expect(getScoreColor(85)).toBe("text-valid");
    expect(getScoreColor(80)).toBe("text-valid");
  });

  it("returns warning for score >= 50", () => {
    expect(getScoreColor(50)).toBe("text-warning");
    expect(getScoreColor(65)).toBe("text-warning");
  });

  it("returns destructive for score < 50", () => {
    expect(getScoreColor(30)).toBe("text-destructive");
  });
});

describe("getScoreBgColor()", () => {
  it("returns bg-muted for null", () => {
    expect(getScoreBgColor(null)).toBe("bg-muted");
  });

  it("returns valid bg for high scores", () => {
    expect(getScoreBgColor(90)).toBe("bg-valid/10");
  });

  it("returns warning bg for mid scores", () => {
    expect(getScoreBgColor(60)).toBe("bg-warning/10");
  });

  it("returns destructive bg for low scores", () => {
    expect(getScoreBgColor(20)).toBe("bg-destructive/10");
  });
});

describe("getStatusLabel()", () => {
  it("maps known statuses", () => {
    expect(getStatusLabel("en_cours")).toBe("En cours");
    expect(getStatusLabel("complet")).toBe("Complet");
    expect(getStatusLabel("alerte")).toBe("Alerte");
    expect(getStatusLabel("ok")).toBe("Validé");
    expect(getStatusLabel("warning")).toBe("Attention");
    expect(getStatusLabel("error")).toBe("Erreur");
  });

  it("returns raw value for unknown status", () => {
    expect(getStatusLabel("unknown_status")).toBe("unknown_status");
  });
});

describe("getRoleLabel()", () => {
  it("maps known roles", () => {
    expect(getRoleLabel("locataire")).toBe("Locataire");
    expect(getRoleLabel("garant")).toBe("Garant");
  });

  it("returns raw value for unknown role", () => {
    expect(getRoleLabel("other")).toBe("other");
  });
});

describe("getDocTypeLabel()", () => {
  it("maps known doc types", () => {
    expect(getDocTypeLabel("cni")).toBe("Carte d'identité");
    expect(getDocTypeLabel("rib")).toBe("RIB");
  });

  it("returns raw value for unknown doc type", () => {
    expect(getDocTypeLabel("inconnu")).toBe("inconnu");
  });
});
