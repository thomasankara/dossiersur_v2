export type ConsentDecision = "granted" | "denied";

const STORAGE_KEY = "ds_analytics_consent";

export function getConsent(): ConsentDecision | null {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(STORAGE_KEY);
  return value === "granted" || value === "denied" ? value : null;
}

export function setConsent(decision: ConsentDecision): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, decision);
}
