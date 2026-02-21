const DEFAULT_REDIRECT = "/dashboard";

/**
 * Returns a safe internal redirect path.
 * Blocks external URLs, protocol-relative URLs, and anything suspicious.
 */
export function getSafeRedirect(value: string | null): string {
  if (!value) return DEFAULT_REDIRECT;
  if (!value.startsWith("/")) return DEFAULT_REDIRECT;
  if (value.startsWith("//")) return DEFAULT_REDIRECT;
  return value;
}
